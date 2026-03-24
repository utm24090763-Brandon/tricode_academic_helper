use actix_web::{web, HttpResponse, Result as ActixResult};
use sqlx::Row;

use crate::db::DbPool;
use crate::models::*;
use crate::middleware::auth_utils;

// ============================================================
// ENDPOINTS PARA ESTUDIANTES
// ============================================================

/// Obtener todas las tareas del estudiante
pub async fn get_tasks(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    // Verificar que el usuario tiene rol de estudiante
    if !auth_utils::has_role(&claims.roles, "student") {
        return Err(actix_web::error::ErrorForbidden("Must be a student"));
    }

    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE status = 'published' ORDER BY due_date ASC"
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: tasks,
    }))
}

/// Crear solicitud de mentoría
pub async fn create_mentoring_request(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    req: web::Json<CreateMentoringRequest>,
) -> ActixResult<HttpResponse> {
    // Verificar que el usuario tiene rol de estudiante
    if !auth_utils::has_role(&claims.roles, "student") {
        return Err(actix_web::error::ErrorForbidden("Must be a student"));
    }

    let mentoring_req = sqlx::query_as::<_, MentoringRequest>(
        r#"
        INSERT INTO mentoring_requests 
        (task_id, student_id, request_type, title, description, status)
        VALUES ($1, $2, $3, $4, $5, 'open')
        RETURNING *
        "#
    )
    .bind(req.task_id)
    .bind(claims.sub)
    .bind(&req.request_type)
    .bind(&req.title)
    .bind(&req.description)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create request"))?;

    Ok(HttpResponse::Created().json(SuccessResponse {
        success: true,
        data: mentoring_req,
    }))
}

/// Obtener mis solicitudes de mentoría
pub async fn get_my_mentoring_requests(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let requests = sqlx::query_as::<_, MentoringRequest>(
        r#"
        SELECT * FROM mentoring_requests 
        WHERE student_id = $1 
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

/// Obtener detalles de una solicitud de mentoría
pub async fn get_mentoring_request_detail(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    request_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let request_id = request_id.into_inner();

    let mentoring_req = sqlx::query_as::<_, MentoringRequest>(
        "SELECT * FROM mentoring_requests WHERE id = $1 AND student_id = $2"
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

    // Marcar mensajes del mentor como leídos
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

/// Enviar mensaje a mentor
pub async fn send_message_to_mentor(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    mentoring_id: web::Path<i32>,
    msg_req: web::Json<CreateMessageRequest>,
) -> ActixResult<HttpResponse> {
    let mentoring_id = mentoring_id.into_inner();

    // Verificar que la solicitud pertenece al estudiante
    let _req = sqlx::query("SELECT id FROM mentoring_requests WHERE id = $1 AND student_id = $2")
        .bind(mentoring_id)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
        .ok_or_else(|| actix_web::error::ErrorNotFound("Request not found"))?;

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

    Ok(HttpResponse::Created().json(SuccessResponse {
        success: true,
        data: message,
    }))
}

/// Obtener notificaciones del estudiante
pub async fn get_notifications(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let notifications = sqlx::query_as::<_, Notification>(
        r#"
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20
        "#
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: notifications,
    }))
}

/// Marcar notificación como leída
pub async fn mark_notification_as_read(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    notification_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let notification_id = notification_id.into_inner();

    sqlx::query(
        "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2"
    )
    .bind(notification_id)
    .bind(claims.sub)
    .execute(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Notification marked as read"
    })))
}
