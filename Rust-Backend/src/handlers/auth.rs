use actix_web::{web, HttpResponse, Result as ActixResult};

use crate::db::{DbPool, get_user_roles, assign_role_to_user};
use crate::models::*;
use crate::middleware::auth_utils;

// ============================================================
// ENDPOINTS DE AUTENTICACIÓN
// ============================================================

pub async fn login(
    pool: web::Data<DbPool>,
    req: web::Json<LoginRequest>,
) -> ActixResult<HttpResponse> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&req.email)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    let user = match user {
        Some(u) => u,
        None => {
            return Ok(HttpResponse::Unauthorized().json(crate::models::ErrorResponse {
                error: "Correo o contraseña inválidos".to_string(),
                details: None,
            }));
        }
    };

    if !user.is_active {
        return Ok(HttpResponse::Forbidden().json(crate::models::ErrorResponse {
            error: "Cuenta desactivada. Contacta al administrador.".to_string(),
            details: None,
        }));
    }

    // Verificar contraseña
    if !auth_utils::verify_password(&req.password, &user.password_hash) {
        return Ok(HttpResponse::Unauthorized().json(crate::models::ErrorResponse {
            error: "Credenciales inválidas".to_string(),
            details: None,
        }));
    }

    // Obtener roles del usuario
    let roles = get_user_roles(pool.get_ref(), user.id)
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    if roles.is_empty() {
        return Ok(HttpResponse::Unauthorized().json(crate::models::ErrorResponse {
            error: "Usuario sin roles asignados".to_string(),
            details: None,
        }));
    }

    // Crear JWT
    let token = auth_utils::create_jwt(user.id, user.email.clone(), roles.clone())
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create token"))?;

    let response = LoginResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            matricula: user.matricula,
            mentor_specialty: user.mentor_specialty.clone(),
            teacher_department: user.teacher_department.clone(),
            phone: user.phone.clone(),
            photo_url: user.photo_url.clone(),
            profile_picture_url: user.profile_picture_url.clone(),
            roles,
        },
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn register(
    pool: web::Data<DbPool>,
    req: web::Json<RegisterRequest>,
) -> ActixResult<HttpResponse> {
    // Validar que el usuario no exista
    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&req.email)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

    if existing.is_some() {
        return Ok(HttpResponse::BadRequest().json(crate::models::ErrorResponse {
            error: "Email ya registrado".to_string(),
            details: None,
        }));
    }

    // Hash de la contraseña
    let password_hash = auth_utils::hash_password(&req.password)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to hash password"))?;

    // Validar que los roles existan
    for role_name in &req.roles {
        let role_exists = sqlx::query("SELECT id FROM roles WHERE name = $1")
            .bind(role_name)
            .fetch_optional(pool.get_ref())
            .await
            .map_err(|_| actix_web::error::ErrorInternalServerError("Database error"))?;

        if role_exists.is_none() {
            return Err(actix_web::error::ErrorBadRequest(format!("Invalid role: {}", role_name)).into());
        }
    }

    // Crear usuario
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (
            email, password_hash, full_name, matricula,
            mentor_specialty, teacher_department, phone,
            photo_url, profile_picture_url, is_verified
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING *
        "#
    )
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.full_name)
    .bind(&req.matricula)
    .bind(&req.mentor_specialty)
    .bind(&req.teacher_department)
    .bind(&req.phone)
    .bind(&req.photo_url)
    .bind(&req.profile_picture_url)
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        log::error!("Failed to create user: {:?}", e);
        actix_web::error::ErrorInternalServerError("Failed to create user")
    })?;

    // Asignar roles al usuario
    for role_name in &req.roles {
        assign_role_to_user(pool.get_ref(), user.id, role_name)
            .await
            .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to assign roles"))?;
    }

    // Crear JWT
    let token = auth_utils::create_jwt(user.id, user.email.clone(), req.roles.clone())
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create token"))?;

    let response = LoginResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            matricula: user.matricula,
            mentor_specialty: user.mentor_specialty.clone(),
            teacher_department: user.teacher_department.clone(),
            phone: user.phone.clone(),
            photo_url: user.photo_url.clone(),
            profile_picture_url: user.profile_picture_url.clone(),
            roles: req.roles.clone(),
        },
    };

    Ok(HttpResponse::Created().json(response))
}

pub async fn verify_token(
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "valid": true,
        "user_id": claims.sub,
        "roles": claims.roles
    })))
}

// ============================================================
// ENDPOINT DE SALUD
// ============================================================

pub async fn health_check() -> ActixResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now()
    })))
}
