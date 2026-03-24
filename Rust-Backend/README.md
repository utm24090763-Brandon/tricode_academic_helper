# TriCode Mentoring API Backend

Backend en Rust para el sistema de mentoría TriCode Academic Helper usando Actix-web y Supabase.

## Características

- ✅ **Autenticación JWT** con roles basados en acceso (RBAC)
- ✅ **Base de datos PostgreSQL** con Supabase
- ✅ **Endpoints para 3 roles**: Estudiante, Mentor, Profesor
- ✅ **Sistema de notificaciones** en tiempo real
- ✅ **Mensajería bidireccional** entre mentores y estudiantes
- ✅ **Manejo de errores** consistente
- ✅ **Middleware de seguridad** con rutas públicas

## Estructura del Proyecto

```
src/
├── main.rs                 # Punto de entrada de la aplicación
├── app.rs                  # Configuración de la aplicación
├── config.rs               # Variables de entorno y configuración
├── db.rs                   # Inicialización de conexión a PostgreSQL
├── models.rs               # Estructuras de datos (DTOs, modelos)
├── middleware.rs           # JWT authentication middleware
├── routes.rs               # Configuración de rutas API
├── handlers/
│   ├── auth.rs            # Login, registro, verificación
│   ├── student.rs         # Endpoints para estudiantes
│   ├── mentor.rs          # Endpoints para mentores
│   ├── teacher.rs         # Endpoints para profesores
│   └── mod.rs             # Exportación de módulos
└── Cargo.toml             # Dependencias del proyecto

target/                     # Binarios compilados (ignorar)
.env                        # Variables de entorno (no commitar)
```

## Requisitos

- **Rust 1.70+**: Descargar desde https://rustup.rs/
- **PostgreSQL 13+**: Supabase (recomendado)
- **VS Code** con extensión de Rust (rust-analyzer)

## Instalación

### 1. Clonar el repositorio

```bash
cd Rust-Backend
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Supabase Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require

# JWT Configuration
JWT_SECRET=tu-clave-secreta-super-segura-minimo-32-caracteres
JWT_EXPIRATION=86400  # 1 día en segundos

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8080

# Logging
RUST_LOG=info,actix_web=debug
```

### 3. Crear la base de datos

Ejecutar el script SQL `database_schema.sql` en Supabase:

```bash
# Desde la consola de Supabase o con psql
psql -h [host] -U [user] -d [database] -f database_schema.sql
```

### 4. Compilar el proyecto

```bash
cargo build --release
```

### 5. Ejecutar el servidor

```bash
cargo run
```

El servidor se iniciará en `http://127.0.0.1:8080`

## Endpoints API

### Autenticación (Público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar nuevo usuario |
| GET | `/api/auth/verify` | Verificar token JWT |
| GET | `/health` | Verificar estado del servidor |

### Estudiante (JWT Requerido)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/student/tasks` | Obtener tareas disponibles |
| POST | `/api/student/mentoring-requests` | Crear solicitud de mentoría |
| GET | `/api/student/mentoring-requests` | Listar mis solicitudes |
| GET | `/api/student/mentoring-requests/{id}/detail` | Ver detalle de solicitud |
| POST | `/api/student/mentoring-requests/{id}/messages` | Enviar mensaje |
| GET | `/api/student/notifications` | Obtener notificaciones |
| PUT | `/api/student/notifications/{id}/read` | Marcar notificación como leída |

### Mentor (JWT Requerido)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/mentor/assigned-requests` | Mis asignaciones de mentoría |
| GET | `/api/mentor/open-requests` | Solicitudes abiertas disponibles |
| POST | `/api/mentor/requests/{id}/assign` | Aceptar solicitud de mentoría |
| GET | `/api/mentor/requests/{id}/detail` | Ver detalle de solicitud |
| POST | `/api/mentor/requests/{id}/messages` | Enviar mensaje |
| PUT | `/api/mentor/requests/{id}/status` | Actualizar estado de solicitud |
| GET | `/api/mentor/stats` | Estadísticas del mentor |

### Profesor (JWT Requerido)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/teacher/tasks` | Crear nueva tarea |
| GET | `/api/teacher/tasks` | Listar mis tareas |
| PUT | `/api/teacher/tasks/{id}/publish` | Publicar tarea |
| PUT | `/api/teacher/tasks/{id}/close` | Cerrar tarea |
| GET | `/api/teacher/analytics` | Estadísticas generales |
| GET | `/api/teacher/tasks/{id}/requests` | Solicitudes por tarea |
| GET | `/api/teacher/dashboard` | Dashboard del profesor |
| GET | `/api/teacher/students-requesting` | Estudiantes solicitantes |

## Headers Requeridos

Para endpoints protegidos, incluir JWT en el header:

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## Formato de Respuestas

### Success Response (2xx)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE"
}
```

## Desarrollo

### Ejecutar tests

```bash
cargo test
```

### Compilar en modo debug

```bash
cargo build
```

### Verificar sintaxis sin compilar

```bash
cargo check
```

### Ver dependencias

```bash
cargo tree
```

## Seguridad

- **CORS**: Habilitado para cualquier origen (configurar según necesidad)
- **JWT**: Tokens de 1 día de expiración
- **Contraseñas**: Hasheadas con bcrypt (cost factor 12)
- **SQL Injection**: Prevención con consultas parametrizadas (SQLx)
- **Autenticación**: Middleware JWT en todos los endpoints protegidos

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Clave secreta para JWT | `super-secret-key-minimo-32-chars` |
| `JWT_EXPIRATION` | Expiración de tokens (segundos) | `86400` |
| `SERVER_HOST` | Host del servidor | `127.0.0.1` |
| `SERVER_PORT` | Puerto del servidor | `8080` |
| `RUST_LOG` | Nivel de logging | `info,actix_web=debug` |

## Troubleshooting

### Error: "Failed to initialize database"

Verificar:
1. `DATABASE_URL` está correcto en `.env`
2. Supabase está accesible desde la red
3. La base de datos está creada

### Error: "JWT_SECRET too short"

La clave JWT debe tener mínimo 32 caracteres.

### Error: "Connection refused"

Verificar que el servidor está ejecutándose en el puerto correcto.

## Próximos Pasos

- [ ] WebSocket para mensajes en tiempo real
- [ ] Rate limiting
- [ ] Caché Redis
- [ ] Logging centralizado (ELK stack)
- [ ] Pruebas automáticas completas
- [ ] Documentación OpenAPI/Swagger
- [ ] Docker containerization

## Licencia

Proyecto desarrollado para Hacktón TriCode
