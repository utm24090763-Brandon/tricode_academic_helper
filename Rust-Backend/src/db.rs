use sqlx::postgres::PgPoolOptions;
use sqlx::{PgPool, Row};
use crate::config::Config;
use std::time::Duration;

pub type DbPool = PgPool;

pub async fn init_db(config: &Config) -> Result<DbPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        // Configuración optimizada para Supabase
        .max_connections(5)  // Supabase tiene límite de conexiones
        .min_connections(1)
        // Timeouts para conexión remota (Supabase)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        // Conectar a la BD
        .connect(&config.database_url)
        .await?;

    log::info!("✓ Conectado a Supabase PostgreSQL");

    // Ejecutar migraciones si es necesario
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;

    log::info!("Base de datos inicializada correctamente");
    Ok(pool)
}

// Funciones auxiliares para consultas comunes

/// Obtener todos los roles de un usuario
pub async fn get_user_roles(pool: &DbPool, user_id: i32) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 ORDER BY r.name"
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.iter().map(|row| row.get::<String, _>("name")).collect())
}

/// Verificar si un usuario tiene un rol específico
pub async fn user_has_role(pool: &DbPool, user_id: i32, role_name: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = $1 AND r.name = $2)"
    )
    .bind(user_id)
    .bind(role_name)
    .fetch_one(pool)
    .await?;

    Ok(row.get::<bool, _>(0))
}

/// Asignar un rol a un usuario
pub async fn assign_role_to_user(pool: &DbPool, user_id: i32, role_name: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2 ON CONFLICT DO NOTHING"
    )
    .bind(user_id)
    .bind(role_name)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn count_unread_messages(
    pool: &DbPool,
    mentoring_request_id: i32,
) -> Result<i32, sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) as count FROM messages WHERE mentoring_request_id = $1 AND is_read = false"
    )
    .bind(mentoring_request_id)
    .fetch_one(pool)
    .await?;

    Ok(row.get::<i64, _>("count") as i32)
}
