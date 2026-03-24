use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, http::Method,
};
use futures::future::LocalBoxFuture;
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::rc::Rc;

use crate::models::JwtClaims;
use crate::config::Config;

pub struct JwtMiddleware;

impl<S, B> Transform<S, ServiceRequest> for JwtMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = JwtMiddlewareService<S>;
    type Future = std::future::Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        std::future::ready(Ok(JwtMiddlewareService {
            service: Rc::new(service),
        }))
    }
}

pub struct JwtMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for JwtMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();

        Box::pin(async move {
            // Dejar pasar OPTIONS (CORS preflight) antes del chequeo JWT
            if req.method() == Method::OPTIONS {
                return service.call(req).await;
            }

            // Rutas públicas que no necesitan autenticación
            let public_routes = vec![
                "/api/auth/login",
                "/api/auth/register",
                "/health",
            ];

            if public_routes.iter().any(|route| req.path().starts_with(route)) {
                return service.call(req).await;
            }

            // Obtener token del header
            if let Some(auth_header) = req.headers().get("Authorization") {
                if let Ok(header_value) = auth_header.to_str() {
                    if let Some(token) = header_value.strip_prefix("Bearer ") {
                        let config = Config::from_env();
                        let decoding_key =
                            DecodingKey::from_secret(config.jwt_secret.as_bytes());

                        if let Ok(token_data) = decode::<JwtClaims>(
                            token,
                            &decoding_key,
                            &Validation::default(),
                        ) {
                            req.extensions_mut().insert(token_data.claims);
                            return service.call(req).await;
                        }
                    }
                }
            }

            // Si llegamos aquí, el token es inválido
            Err(actix_web::error::ErrorUnauthorized("Invalid or missing token"))
        })
    }
}

pub mod auth_utils {
    use jsonwebtoken::{encode, EncodingKey, Header};
    use chrono::Utc;
    use crate::models::JwtClaims;
    use crate::config::Config;

    pub fn create_jwt(user_id: i32, email: String, roles: Vec<String>) -> Result<String, String> {
        let config = Config::from_env();
        let now = Utc::now();
        let expiration = now.timestamp() as usize + config.jwt_expiration as usize;

        let claims = JwtClaims {
            sub: user_id,
            email,
            roles,
            exp: expiration,
        };

        let encoding_key = EncodingKey::from_secret(config.jwt_secret.as_bytes());

        encode(&Header::default(), &claims, &encoding_key)
            .map_err(|_| "Failed to create token".to_string())
    }

    pub fn has_role(roles: &[String], required_role: &str) -> bool {
        roles.iter().any(|r| r == required_role)
    }

    pub fn has_any_role(roles: &[String], required_roles: &[&str]) -> bool {
        roles.iter().any(|r| required_roles.contains(&r.as_str()))
    }

    pub fn hash_password(password: &str) -> Result<String, String> {
        bcrypt::hash(password, 12).map_err(|_| "Failed to hash password".to_string())
    }

    pub fn verify_password(password: &str, hash: &str) -> bool {
        bcrypt::verify(password, hash).unwrap_or(false)
    }
}
