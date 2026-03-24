% Actualización: Sistema de Múltiples Roles

# Cambios Realizados para Soportar Múltiples Roles por Usuario

## Resumen
Un usuario ahora puede tener **múltiples roles simultáneamente**. Por ejemplo, una persona puede ser `student` Y `mentor` a la vez. Esto requiere cambios significativos en la estructura de Base de Datos y el backend.

## 1. Cambios en Base de Datos

### Eliminación de `role_id` de tabla `users`
**Antes:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  role_id INTEGER REFERENCES roles(id),  -- ❌ REMOVIDO
  ...
);
```

**Ahora:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  -- role_id eliminado
  ...
);
```

### Nueva tabla de unión: `user_roles`
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)  -- Evitar duplicados
);
```

Esta tabla permite la relación **muchos-a-muchos** entre usuarios y roles.

### SQL Script Completo
Ver archivo `schema_multiple_roles.sql` para el script completo con vistas útiles.

## 2. Cambios en Modelos (Rust)

### User Struct
```rust
// ANTES
pub struct User {
    pub id: i32,
    pub email: String,
    pub role_id: i32,  // ❌ REMOVIDO
    ...
}

// AHORA
pub struct User {
    pub id: i32,
    pub email: String,
    // role_id eliminado
    ...
}
```

### UserResponse Struct
```rust
// ANTES
pub struct UserResponse {
    pub role: String,  // Single role
}

// AHORA
pub struct UserResponse {
    pub roles: Vec<String>,  // Multiple roles
}
```

### JwtClaims Struct
```rust
// ANTES
pub struct JwtClaims {
    pub role: String,  // Single role
    pub exp: usize,
}

// AHORA
pub struct JwtClaims {
    pub roles: Vec<String>,  // Multiple roles
    pub exp: usize,
}
```

### RegisterRequest Struct
```rust
// ANTES
pub struct RegisterRequest {
    pub role: String,  // Single role
}

// AHORA
pub struct RegisterRequest {
    pub roles: Vec<String>,  // Multiple roles (puede ser ["student", "mentor"])
}
```

## 3. Cambios en Funciones de Base de Datos

### db.rs
```rust
// ELIMINADO (antigua función)
pub async fn get_user_role(pool: &DbPool, user_id: i32) -> Result<String>

// NUEVAS FUNCIONES

/// Obtener todos los roles de un usuario
pub async fn get_user_roles(pool: &DbPool, user_id: i32) -> Result<Vec<String>>

/// Verificar si un usuario tiene un rol específico
pub async fn user_has_role(pool: &DbPool, user_id: i32, role_name: &str) -> Result<bool>

/// Asignar un rol a un usuario
pub async fn assign_role_to_user(pool: &DbPool, user_id: i32, role_name: &str) -> Result<()>
```

## 4. Cambios en Autenticación (middleware.rs)

### Función create_jwt
```rust
// ANTES
pub fn create_jwt(user_id: i32, email: String, role: String) -> Result<String>

// AHORA
pub fn create_jwt(user_id: i32, email: String, roles: Vec<String>) -> Result<String>
```

### Nuevas funciones de verificación de rol
```rust
/// Verificar si un usuario tiene un rol específico
pub fn has_role(roles: &[String], required_role: &str) -> bool {
    roles.iter().any(|r| r == required_role)
}

/// Verificar si un usuario tiene CUALQUIERA de los roles especificados
pub fn has_any_role(roles: &[String], required_roles: &[&str]) -> bool {
    roles.iter().any(|r| required_roles.contains(&r.as_str()))
}
```

## 5. Cambios en Handlers

### Verificación de Rol en cada Endpoint

**Ejemplo: student.rs**
```rust
pub async fn get_tasks(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
) -> ActixResult<HttpResponse> {
    // ✅ NUEVO: Verificar que el usuario tiene rol de estudiante
    if !auth_utils::has_role(&claims.roles, "student") {
        return Err(actix_web::error::ErrorForbidden("Must be a student"));
    }
    
    // ... resto del código
}
```

**Ejemplo: mentor.rs**
```rust
pub async fn assign_mentoring_request(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    request_id: web::Path<i32>,
) -> ActixResult<HttpResponse> {
    // ✅ NUEVO: Verificar que el usuario tiene rol de mentor
    if !auth_utils::has_role(&claims.roles, "mentor") {
        return Err(actix_web::error::ErrorForbidden("Must be a mentor"));
    }
    
    // ... resto del código
}
```

**Ejemplo: teacher.rs**
```rust
pub async fn create_task(
    pool: web::Data<DbPool>,
    claims: web::Data<JwtClaims>,
    task_req: web::Json<CreateTaskRequest>,
) -> ActixResult<HttpResponse> {
    // ✅ NUEVO: Verificar que el usuario tiene rol de profesor
    if !auth_utils::has_role(&claims.roles, "teacher") {
        return Err(actix_web::error::ErrorForbidden("Must be a teacher"));
    }
    
    // ... resto del código
}
```

## 6. Cambios en Auth Handlers (handlers/auth.rs)

### Login
```rust
pub async fn login(
    pool: web::Data<DbPool>,
    req: web::Json<LoginRequest>,
) -> ActixResult<HttpResponse> {
    // ... buscar usuario
    
    // ✅ Obtener TODOS los roles del usuario
    let roles = get_user_roles(pool.get_ref(), user.id).await?;
    
    if roles.is_empty() {
        return Err(ErrorUnauthorized("User has no assigned roles"));
    }
    
    // ✅ Crear JWT con múltiples roles
    let token = auth_utils::create_jwt(user.id, user.email.clone(), roles.clone())?;
    
    let response = LoginResponse {
        token,
        user: UserResponse {
            roles,  // ✅ Enviar múltiples roles
            ...
        },
    };

    Ok(HttpResponse::Ok().json(response))
}
```

### Register
```rust
pub async fn register(
    pool: web::Data<DbPool>,
    req: web::Json<RegisterRequest>,
) -> ActixResult<HttpResponse> {
    // ... crear usuario
    
    // ✅ NUEVO: La solicitud puede incluir múltiples roles
    // Ejemplo: { "roles": ["student", "mentor"] }
    
    for role_name in &req.roles {
        // Validar cada rol
        // Asignar cada rol
        assign_role_to_user(pool.get_ref(), user.id, role_name).await?;
    }
    
    let token = auth_utils::create_jwt(user.id, user.email.clone(), req.roles.clone())?;
    
    Ok(HttpResponse::Created().json(response))
}
```

## 7. Ejemplos de Uso del API

### Registro de Usuario con Múltiples Roles
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "pass123",
    "full_name": "Juan Pérez",
    "roles": ["student", "mentor"]
  }'
```

**Respuesta:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "juan@example.com",
    "full_name": "Juan Pérez",
    "roles": ["mentor", "student"]
  }
}
```

### Acceso a Endpoints Protegidos
Con un usuario que tiene ambos roles `["student", "mentor"]`:

```bash
# ✅ Acceso permitido - usuario es student
curl -X GET http://localhost:8080/api/student/tasks \
  -H "Authorization: Bearer <TOKEN>"

# ✅ Acceso permitido - usuario es mentor
curl -X GET http://localhost:8080/api/mentor/assigned-requests \
  -H "Authorization: Bearer <TOKEN>"

# ❌ Acceso denegado - usuario no es teacher
curl -X GET http://localhost:8080/api/teacher/tasks \
  -H "Authorization: Bearer <TOKEN>"
# Retorna: 403 Forbidden "Must be a teacher"
```

## 8. Casos de Uso Comunes

### Caso 1: Estudiante que se convierte en Mentor
```sql
-- Asignar rol mentor a un estudiante existente
INSERT INTO user_roles (user_id, role_id)
SELECT 5, id FROM roles WHERE name = 'mentor'
ON CONFLICT DO NOTHING;

-- Verificar roles del usuario
SELECT u.email, STRING_AGG(r.name, ', ') as roles
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.id = 5
GROUP BY u.email;

-- Resultado: juan@example.com | mentor,student
```

### Caso 2: Remover Rol de un Usuario
```sql
-- Remover rol de mentor
DELETE FROM user_roles
WHERE user_id = 5 
  AND role_id = (SELECT id FROM roles WHERE name = 'mentor');
```

### Caso 3: Usuarios con Múltiples Roles
```sql
-- Encontrar estudiantes que también son mentores
SELECT u.email, COUNT(ur.role_id) as role_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email
HAVING COUNT(ur.role_id) > 1;
```

## 9. Vistas SQL Útiles

### Vista: user_roles_view
```sql
SELECT u.email, STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id;
```

### Vista: user_has_role
```sql
-- Útil para verificar si un usuario específico tiene un rol
SELECT * FROM user_has_role
WHERE user_id = 1 AND role_name = 'mentor';
```

## 10. Migración desde Sistema Anterior

Si tienes data anterior con `role_id` en tabla `users`:

```sql
-- 1. Crear tabla user_roles si no existe
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

-- 2. Migrar datos desde role_id a user_roles
INSERT INTO user_roles (user_id, role_id)
SELECT id, role_id FROM users
WHERE role_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Remover columna role_id (opcional, después de verificar)
-- ALTER TABLE users DROP COLUMN role_id;
```

## 11. Archivos Modificados Resumen

| Archivo | Cambios |
|---------|---------|
| `schema_multiple_roles.sql` | ✅ Nuevo - schema completo con user_roles |
| `src/models.rs` | Removido `role_id` de User, cambió `role` a `roles` |
| `src/db.rs` | Cambió `get_user_role()` → `get_user_roles()`, agregó `user_has_role()`, `assign_role_to_user()` |
| `src/middleware.rs` | Cambió firma de `create_jwt()`, agregó `has_role()`, `has_any_role()` |
| `src/handlers/auth.rs` | Login y Register ahora manejan múltiples roles |
| `src/handlers/student.rs` | Agregó verificación de rol en todos los endpoints |
| `src/handlers/mentor.rs` | Agregó verificación de rol en todos los endpoints |
| `src/handlers/teacher.rs` | Agregó verificación de rol en todos los endpoints |

## 12. Próximos Pasos

1. **Ejecutar migraciones** en Supabase con `schema_multiple_roles.sql`
2. **Compilar el backend** con `cargo build --release`
3. **Probar endpoints** con usuarios que tienen múltiples roles
4. **Actualizar frontend** para enviar `roles: Vec<String>` en lugar de `role: String`
5. **Implementar UI** para gestionar múltiples roles por usuario (admin panel)

## Notas Importantes

- ✅ Un usuario SIEMPRE debe tener mínimo 1 rol
- ✅ Los roles están ordenados alfabéticamente en JWT
- ✅ Middleware verifica que el usuario tiene el rol requerido
- ✅ ON CONFLICT en INSERT previene asignar el mismo rol dos veces
- ✅ ON DELETE CASCADE garantiza limpieza automática cuando se elimina usuario

---

**Documento generado para Hacktón TriCode**
**Última actualización: 2024**
