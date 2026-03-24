use actix_web::web;
use crate::handlers::*;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // ============================================================
        // AUTHENTICATION ROUTES - No require JWT
        // ============================================================
        .route("/health", web::get().to(health_check))
        .route("/api/auth/login", web::post().to(login))
        .route("/api/auth/register", web::post().to(register))
        .route("/api/auth/verify", web::get().to(verify_token))

        // ============================================================
        // STUDENT ROUTES - Require JWT + Student Role
        // ============================================================
        // Tasks
        .route("/api/student/tasks", web::get().to(get_tasks))
        
        // Mentoring Requests
        .route("/api/student/mentoring-requests", web::post().to(create_mentoring_request))
        .route("/api/student/mentoring-requests", web::get().to(get_my_mentoring_requests))
        .route("/api/student/mentoring-requests/{id}/detail", web::get().to(get_mentoring_request_detail))
        
        // Messages
        .route("/api/student/mentoring-requests/{id}/messages", web::post().to(send_message_to_mentor))
        
        // Notifications
        .route("/api/student/notifications", web::get().to(get_notifications))
        .route("/api/student/notifications/{id}/read", web::put().to(mark_notification_as_read))

        // ============================================================
        // MENTOR ROUTES - Require JWT + Mentor Role
        // ============================================================
        // Mentoring Requests
        .route("/api/mentor/assigned-requests", web::get().to(get_assigned_requests))
        .route("/api/mentor/open-requests", web::get().to(get_open_requests))
        .route("/api/mentor/requests/{id}/assign", web::post().to(assign_mentoring_request))
        .route("/api/mentor/requests/{id}/detail", web::get().to(get_request_detail))
        
        // Messages
        .route("/api/mentor/requests/{id}/messages", web::post().to(send_message_to_student))
        
        // Status Updates
        .route("/api/mentor/requests/{id}/status", web::put().to(update_request_status))
        
        // Statistics
        .route("/api/mentor/stats", web::get().to(get_mentor_stats))

        // ============================================================
        // TEACHER ROUTES - Require JWT + Teacher Role
        // ============================================================
        // Tasks Management
        .route("/api/teacher/tasks", web::post().to(create_task))
        .route("/api/teacher/tasks", web::get().to(get_my_tasks))
        .route("/api/teacher/tasks/{id}/publish", web::put().to(publish_task))
        .route("/api/teacher/tasks/{id}/close", web::put().to(close_task))
        
        // Analytics
        .route("/api/teacher/analytics", web::get().to(get_mentoring_analytics))
        .route("/api/teacher/tasks/{id}/requests", web::get().to(get_requests_by_task))
        
        // Dashboard
        .route("/api/teacher/dashboard", web::get().to(teacher_dashboard))
        .route("/api/teacher/students-requesting", web::get().to(get_students_requesting_mentoring));
}
