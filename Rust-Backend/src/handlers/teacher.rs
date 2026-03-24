use actix_web::{web, HttpResponse, Result as ActixResult};
use sqlx::Row;

use crate::db::DbPool;
use crate::models::*;
use crate::middleware::auth_utils;

// ============================================================
// ENDPOINTS PARA DOCENTES (TEACHER)
// ============================================================

/// Crear nueva tarea
pub async fn create_task(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    task_req: web::Json<CreateTaskRequest>,
) -> ActixResult<HttpResponse> {
    // Verificar que el usuario tiene rol de profesor
    if !auth_utils::has_role(&claims.roles, "teacher") {
        return Err(actix_web::error::ErrorForbidden("Must be a teacher"));
    }

    let task = sqlx::query_as::<_, Task>(
        r#"
        INSERT INTO tasks (subject_id, teacher_id, title, description, task_type, due_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'draft')
        RETURNING *
        "#
    )
    .bind(task_req.subject_id)
    .bind(claims.sub)
    .bind(&task_req.title)
    .bind(&task_req.description)
    .bind(&task_req.task_type)
    .bind(task_req.due_date)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create task"))?;

    Ok(HttpResponse::Created().json(SuccessResponse {
        success: true,
        data: task,
    }))
}

/// Obtener mis tareas
pub async fn get_my_tasks(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let tasks = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE teacher_id = $1 ORDER BY created_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: tasks,
    }))
}

/// Publicar una tarea
pub async fn publish_task(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    task_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let task_id = task_id.into_inner();

    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks 
        SET status = 'published', published_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND teacher_id = $2
        RETURNING *
        "#
    )
    .bind(task_id)
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Task not found"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: task,
    }))
}

/// Cerrar una tarea
pub async fn close_task(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    task_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let task_id = task_id.into_inner();

    let task = sqlx::query_as::<_, Task>(
        r#"
        UPDATE tasks 
        SET status = 'closed'
        WHERE id = $1 AND teacher_id = $2
        RETURNING *
        "#
    )
    .bind(task_id)
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
    .ok_or_else(|| actix_web::error::ErrorNotFound("Task not found"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: task,
    }))
}

/// Obtener todas las solicitudes de mentoría de mis tareas
pub async fn get_mentoring_analytics(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let analytics = sqlx::query(
        r#"
        SELECT 
            COUNT(*) as total_requests,
            COUNT(CASE WHEN mr.status = 'open' THEN 1 END) as open_requests,
            COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_requests,
            COUNT(CASE WHEN mr.status = 'resolved' THEN 1 END) as resolved_requests,
            COUNT(DISTINCT mr.mentor_id) as active_mentors
        FROM mentoring_requests mr
        JOIN tasks t ON mr.task_id = t.id
        WHERE t.teacher_id = $1
        "#
    )
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "total_requests": analytics.get::<i64, _>("total_requests"),
            "open_requests": analytics.get::<i64, _>("open_requests"),
            "in_progress_requests": analytics.get::<i64, _>("in_progress_requests"),
            "resolved_requests": analytics.get::<i64, _>("resolved_requests"),
            "active_mentors": analytics.get::<i64, _>("active_mentors"),
        }
    })))
}

/// Obtener solicitudes de mentoría por tarea
pub async fn get_requests_by_task(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    task_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    let task_id = task_id.into_inner();

    // Verificar que la tarea pertenece al profesor
    let _ = sqlx::query("SELECT id FROM tasks WHERE id = $1 AND teacher_id = $2")
        .bind(task_id)
        .bind(claims.sub)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?
        .ok_or_else(|| actix_web::error::ErrorNotFound("Task not found"))?;

    let requests = sqlx::query_as::<_, MentoringRequest>(
        "SELECT * FROM mentoring_requests WHERE task_id = $1 ORDER BY created_at DESC"
    )
    .bind(task_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(SuccessResponse {
        success: true,
        data: requests,
    }))
}

/// Dashboard del profesor
pub async fn teacher_dashboard(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let stats_row = sqlx::query(
        r#"
        SELECT 
            COUNT(DISTINCT t.id) as total_tasks,
            COUNT(DISTINCT CASE WHEN t.status = 'published' THEN t.id END) as published_tasks,
            COUNT(DISTINCT mr.id) as total_mentoring_requests,
            COUNT(DISTINCT CASE WHEN mr.status = 'open' THEN mr.id END) as open_mentoring_requests
        FROM tasks t
        LEFT JOIN mentoring_requests mr ON t.id = mr.task_id
        WHERE t.teacher_id = $1
        "#
    )
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": {
            "total_tasks": stats_row.get::<i64, _>("total_tasks"),
            "published_tasks": stats_row.get::<i64, _>("published_tasks"),
            "total_mentoring_requests": stats_row.get::<i64, _>("total_mentoring_requests"),
            "open_mentoring_requests": stats_row.get::<i64, _>("open_mentoring_requests"),
        }
    })))
}

/// Obtener estudiantes que solicitaron mentoría
pub async fn get_students_requesting_mentoring(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    let students = sqlx::query(
        r#"
        SELECT DISTINCT
            u.id,
            u.email,
            u.full_name,
            u.matricula,
            COUNT(mr.id) as total_requests,
            COUNT(CASE WHEN mr.status = 'open' THEN 1 END) as open_requests
        FROM users u
        JOIN mentoring_requests mr ON u.id = mr.student_id
        JOIN tasks t ON mr.task_id = t.id
        WHERE t.teacher_id = $1
        GROUP BY u.id
        ORDER BY total_requests DESC
        "#
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": students.iter().map(|row| serde_json::json!({
            "id": row.get::<i32, _>("id"),
            "email": row.get::<String, _>("email"),
            "full_name": row.get::<String, _>("full_name"),
            "matricula": row.get::<Option<String>, _>("matricula"),
            "total_requests": row.get::<i64, _>("total_requests"),
            "open_requests": row.get::<i64, _>("open_requests"),
        })).collect::<Vec<_>>()
    })))
}
