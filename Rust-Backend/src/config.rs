use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: u64,
    pub server_host: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        
        Config {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL debe estar configurado"),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET debe estar configurado"),
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .expect("JWT_EXPIRATION debe ser un número"),
            server_host: env::var("SERVER_HOST")
                .unwrap_or_else(|_| "127.0.0.1".to_string()),
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .expect("SERVER_PORT debe ser un número"),
        }
    }
}
