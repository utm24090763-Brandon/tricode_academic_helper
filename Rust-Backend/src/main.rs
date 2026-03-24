mod app;
mod config;
mod db;
mod handlers;
mod middleware;
mod models;
mod routes;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware as actix_middleware};
use config::Config;
use db::init_db;
use middleware::JwtMiddleware;
use routes::configure_routes;
use std::sync::Arc;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize environment variables from .env
    dotenv::dotenv().ok();
    
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Load configuration
    let config = Config::from_env();

    log::info!("Loading environment configuration");
    log::info!("Server address: {}:{}", config.server_host, config.server_port);

    // Initialize database connection pool
    log::info!("Initializing database connection pool");
    let pool = init_db(&config).await
        .expect("Failed to initialize database");

    log::info!("✓ Database connection established");

    let pool_data = web::Data::new(pool);
    let config_arc = Arc::new(config.clone());

    let server_host = config.server_host.clone();
    let server_port = config.server_port;

    log::info!("Starting HTTP server on {}:{}", server_host, server_port);

    HttpServer::new(move || {
        App::new()
            // Add CORS middleware first so OPTIONS preflight is handled before auth checks
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                    .allow_any_header()
                    .supports_credentials()
                    .max_age(3600)
            )

            // Add CORS middleware first so OPTIONS preflight is handled before auth checks
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allow_any_method()
                    .allow_any_header()
                    .supports_credentials()
                    .max_age(3600)
            )

            // Add middleware for logging HTTP requests
            .wrap(actix_middleware::Logger::default())

            // Add custom JWT authentication middleware
            .wrap(JwtMiddleware)

            // Attach application state
            .app_data(pool_data.clone())
            
            // Configure all routes using the routes module
            .configure(configure_routes)
    })
    .bind(format!("{}:{}", server_host, server_port))?
    .run()
    .await
}
