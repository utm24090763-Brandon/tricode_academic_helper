use serde::{Deserialize, Serialize};
use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::FromRow;

// ============================================================
// MODELOS DE AUTENTICACIÓN
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UserRole {
    #[serde(rename = "student")]
    Student,
    #[serde(rename = "mentor")]
    Mentor,
    #[serde(rename = "teacher")]
    Teacher,
}

impl UserRole {
    pub fn as_str(&self) -> &str {
        match self {
            UserRole::Student => "student",
            UserRole::Mentor => "mentor",
            UserRole::Teacher => "teacher",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "student" => Some(UserRole::Student),
            "mentor" => Some(UserRole::Mentor),
            "teacher" => Some(UserRole::Teacher),
            _ => None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    pub matricula: Option<String>,
    pub mentor_specialty: Option<String>,
    pub teacher_department: Option<String>,
    pub phone: Option<String>,
    pub photo_url: Option<String>,
    pub profile_picture_url: Option<String>,
    pub is_active: bool,
    pub is_verified: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub last_login: Option<NaiveDateTime>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserResponse {
    pub id: i32,
    pub email: String,
    pub full_name: String,
    pub matricula: Option<String>,
    pub mentor_specialty: Option<String>,
    pub teacher_department: Option<String>,
    pub phone: Option<String>,
    pub photo_url: Option<String>,
    pub profile_picture_url: Option<String>,
    pub roles: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JwtClaims {
    pub sub: i32,
    pub email: String,
    pub roles: Vec<String>,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub matricula: Option<String>,    pub mentor_specialty: Option<String>,
    pub teacher_department: Option<String>,
    pub phone: Option<String>,
    pub photo_url: Option<String>,
    pub profile_picture_url: Option<String>,    pub roles: Vec<String>,
}

// ============================================================
// MODELOS DE MENTORÍA
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct MentoringRequest {
    pub id: i32,
    pub task_id: i32,
    pub student_id: i32,
    pub mentor_id: Option<i32>,
    pub request_type: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub created_at: DateTime<Utc>,
    pub assigned_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMentoringRequest {
    pub task_id: i32,
    pub request_type: String,
    pub title: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMentoringStatus {
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssignMentorRequest {
    pub mentor_id: i32,
}

// ============================================================
// MODELOS DE MENSAJES
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Message {
    pub id: i32,
    pub mentoring_request_id: i32,
    pub sender_id: i32,
    pub message_text: String,
    pub is_read: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMessageRequest {
    pub mentoring_request_id: i32,
    pub message_text: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageResponse {
    pub id: i32,
    pub sender_id: i32,
    pub sender_name: String,
    pub message_text: String,
    pub created_at: DateTime<Utc>,
    pub is_read: bool,
}

// ============================================================
// MODELOS DE TAREAS
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Task {
    pub id: i32,
    pub subject_id: i32,
    pub teacher_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub task_type: String,
    pub due_date: DateTime<Utc>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub subject_id: i32,
    pub title: String,
    pub description: Option<String>,
    pub task_type: String,
    pub due_date: DateTime<Utc>,
}

// ============================================================
// MODELOS DE NOTIFICACIONES
// ============================================================

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Notification {
    pub id: i32,
    pub user_id: i32,
    pub notification_type: String,
    pub title: String,
    pub message: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationResponse {
    pub id: i32,
    pub notification_type: String,
    pub title: String,
    pub message: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

// ============================================================
// MODELOS DE ERROR
// ============================================================

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub details: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SuccessResponse<T: Serialize> {
    pub success: bool,
    pub data: T,
}
