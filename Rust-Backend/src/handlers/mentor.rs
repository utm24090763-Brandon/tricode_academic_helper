use actix_web::{web, HttpResponse, Result as ActixResult};
use sqlx::Row;

use crate::db::DbPool;
use crate::models::*;
use crate::middleware::auth_utils;

// ============================================================
// ENDPOINTS PARA MENTORES
// ============================================================

/// Obtener todas las solicitudes de mentoría asignadas
pub async fn get_assigned_requests(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    // Verificar que el usuario tiene rol de mentor
    if !auth_utils::has_role(&claims.roles, "mentor") {
        return Err(actix_web::error::ErrorForbidden("Must be a mentor"));
    }

    let requests = sqlx::query_as::<_, MentoringRequest>(
        r#"
        SELECT * FROM mentoring_requests 
        WHERE mentor_id = $1
        ORDER BY created_at DESC
        "#
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: requests,
    }))
}

/// Obtener solicitudes de mentoría abiertas (sin asignar)
pub async fn get_open_requests(
    pool: web::Data<DbPool>,
    _claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let requests = sqlx::query_as::<_, MentoringRequest>(
        r#"
        SELECT * FROM mentoring_requests 
        WHERE status = 'open' AND mentor_id IS NULL
        ORDER BY priority DESC, created_at ASC
        "#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: requests,
    }))
}

/// Aceptar/Asignar una solicitud de mentoría
pub async fn assign_mentoring_request(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    request_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let request_id = request_id.into_inner();

    let mentoring_req = sqlx::query_as::<_, MentoringRequest>(
        r#"
        UPDATE mentoring_requests 
        SET mentor_id = $1, status = 'in_progress', assigned_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND mentor_id IS NULL
        RETURNING *
        "#
    )
    .bind(claims.sub)
    .bind(request_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
    .ok_or_else(|| actix_web::error::ErrorBadRequest("Request not available or already assigned"))?;

    // Crear notificación para el estudiante
    let _ = sqlx::query(
        r#"
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        VALUES ($1, 'mentoring_assigned', 'Mentoría Asignada', 'Tu solicitud de mentoría ha sido asignada', 'mentoring_request', $2)
        "#
    )
    .bind(mentoring_req.student_id)
    .bind(request_id)
    .execute(pool.get_ref())
    .await;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: mentoring_req,
    }))
}

/// Obtener detalles de una solicitud de mentoría
pub async fn get_request_detail(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    request_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let request_id = request_id.into_inner();

    let mentoring_req = sqlx::query_as::<_, MentoringRequest>(
        "SELECT * FROM mentoring_requests WHERE id = $1 AND mentor_id = $2"
    )
    .bind(request_id)
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Request not found"))?;

    // Obtener mensajes
    let messages = sqlx::query_as::<_, Message>(
        "SELECT * FROM messages WHERE mentoring_request_id = $1 ORDER BY created_at ASC"
    )
    .bind(request_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    // Marcar mensajes del estudiante como leídos
    sqlx::query(
        r#"
        UPDATE messages 
        SET is_read = true, read_at = CURRENT_TIMESTAMP
        WHERE mentoring_request_id = $1 
        AND sender_id != $2
        AND is_read = false
        "#
    )
    .bind(request_id)
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    .ok();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "request": mentoring_req,
            "messages": messages
        }
    })))
}

/// Enviar mensaje al estudiante
pub async fn send_message_to_student(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    mentoring_id: web::Path<i32>,
    msg_req: web::Json<CreateMessageRequest>,
) -> ActixResult<HttpResponse> {
    let mentoring_id = mentoring_id.into_inner();

    // Verificar que el mentor está asignado
    let mentoring_req = sqlx::query("SELECT student_id FROM mentoring_requests WHERE id = $1 AND mentor_id = $2")
        .bind(mentoring_id)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
        .ok_or_else(|| actix_web::error::ErrorNotFound("Request not found"))?;

    let student_id: i32 = mentoring_req.get("student_id");

    let message = sqlx::query_as::<_, Message>(
        r#"
        INSERT INTO messages (mentoring_request_id, sender_id, message_text, is_read)
        VALUES ($1, $2, $3, false)
        RETURNING *
        "#
    )
    .bind(mentoring_id)
    .bind(claims.sub)
    .bind(&msg_req.message_text)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to send message"))?;

    // Crear notificación para el estudiante
    let _ = sqlx::query(
        r#"
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        VALUES ($1, 'new_message', 'Nuevo Mensaje', 'El mentor ha respondido tu solicitud', 'mentoring_request', $2)
        "#
    )
    .bind(student_id)
    .bind(mentoring_id)
    .execute(pool.get_ref())
    .await;

    Ok(HttpResponse::Created().json(SuccessResponse {
        success: true,
        data: message,
    }))
}

/// Actualizar estado de una solicitud de mentoría
pub async fn update_request_status(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    request_id: web::Path<i32>,
    status_req: web::Json<UpdateMentoringStatus>,
) -> ActixResult<HttpResponse> {
    let request_id = request_id.into_inner();

    let mentoring_req = sqlx::query_as::<_, MentoringRequest>(
        r#"
        UPDATE mentoring_requests 
        SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE NULL END
        WHERE id = $2 AND mentor_id = $3
        RETURNING *
        "#
    )
    .bind(&status_req.status)
    .bind(request_id)
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Request not found"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: mentoring_req,
    }))
}

/// Obtener estadísticas del mentor
pub async fn get_mentor_stats(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let stats_row = sqlx::query(
        r#"
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
        FROM mentoring_requests 
        WHERE mentor_id = $1
        "#
    )
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "total": stats_row.get::<i64, _>("total"),
            "open": stats_row.get::<i64, _>("open_count"),
            "in_progress": stats_row.get::<i64, _>("in_progress_count"),
            "resolved": stats_row.get::<i64, _>("resolved_count"),
        }
    })))
}
