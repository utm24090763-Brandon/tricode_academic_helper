% Guía de Integración - Backend Rust con Frontend Next.js

# Arquitectura y Flujo Completo del Sistema

## 1. Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js)                     │
│                                                               │
│  1. Usuario ingresa credenciales                             │
│  2. POST /api/auth/login { email, password }                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Rust/Actix)                     │
│                                                               │
│  1. Validar credenciales en BD                              │
│  2. Verificar contraseña con bcrypt                         │
│  3. Generar JWT token                                       │
│  4. Retornar { token, user_id, role }                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js)                     │
│                                                               │
│  1. Guardar token en localStorage                           │
│  2. Guardar rol del usuario                                 │
│  3. Redirigir al dashboard según rol                        │
│  4. Usar token en toda solicitud: Authorization: Bearer X   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Flujo de Solicitud de Mentoría (Estudiante)

```
PASO 1: OBTENER TAREAS
┌─────────────────┐
│ GET /student/   │
│  tasks          │
└─────────────────┘
         ↓
    ✅ JWT válido
    ✅ Role = Student
         ↓
    SELECT * FROM tasks
    WHERE status = 'published'
         ↓
    Retornar lista de tareas

PASO 2: CREAR SOLICITUD
┌─────────────────────────┐
│ POST /student/mentoring-│
│    requests             │
│ Body: {                 │
│   task_id,              │
│   description           │
│ }                       │
└─────────────────────────┘
         ↓
    ✅ JWT válido
    ✅ Role = Student
         ↓
    INSERT INTO mentoring_requests (
      task_id, student_id, status='open'
    )
         ↓
    INSERT INTO notifications (
      FOR mentors + teacher
    )
         ↓
    ✅ Crear notificación

PASO 3: ENVIAR MENSAJES
┌──────────────────────────┐
│ POST /student/mentoring- │
│    requests/{id}/messages│
│ Body: { message }        │
└──────────────────────────┘
         ↓
    ✅ JWT válido
    ✅ Verificar ownership
         ↓
    INSERT INTO messages (
      sender_id = student_id,
      is_read = false
    )
         ↓
    INSERT INTO notifications (
      FOR mentor
    )
         ↓
    ✅ Mentor recibe notificación
```

## 3. Flujo de Mentoría (Mentor)

```
PASO 1: VER SOLICITUDES DISPONIBLES
┌────────────────────────┐
│ GET /mentor/open-      │
│    requests            │
└────────────────────────┘
         ↓
    ORDER BY priority DESC
         ↓
    Retornar solicitudes abiertas

PASO 2: ACEPTAR SOLICITUD
┌────────────────────────┐
│ POST /mentor/requests/ │
│    {id}/assign         │
└────────────────────────┘
         ↓
    UPDATE status = 'in_progress'
    UPDATE mentor_id = current_user
         ↓
    INSERT notification (FOR student)
    INSERT notification (FOR teacher)
         ↓
    ✅ Estudiante notificado

PASO 3: VER CONVERSACIÓN
┌────────────────────────┐
│ GET /mentor/requests/  │
│    {id}/detail         │
└────────────────────────┘
         ↓
    SELECT * FROM messages
    UPDATE is_read = true
    (para mensajes del estudiante)
         ↓
    Retornar conversación

PASO 4: RESPONDER MENSAJES
┌────────────────────────┐
│ POST /mentor/requests/ │
│    {id}/messages       │
│ Body: { message }      │
└────────────────────────┘
         ↓
    INSERT message
    INSERT notification (FOR student)
         ↓
    ✅ Estudiante notificado en tiempo real

PASO 5: CERRAR MENTORÍA
┌────────────────────────┐
│ PUT /mentor/requests/  │
│    {id}/status         │
│ Body: { status: 'resolved' }
└────────────────────────┘
         ↓
    UPDATE status = 'resolved'
    UPDATE resolved_at = NOW()
         ↓
    INSERT notification (FOR student, teacher)
```

## 4. Roles y Permisos

### ESTUDIANTE (role_id = 1)
- ✅ Ver tareas publicadas
- ✅ Crear solicitudes de mentoría
- ✅ Enviar mensajes a mentores
- ✅ Ver notificaciones personales
- ❌ Ver solicitudes de otros estudiantes
- ❌ Publicar tareas
- ❌ Ser asignado como mentor

### MENTOR (role_id = 2)
- ✅ Ver solicitudes abiertas
- ✅ Aceptar mentoría
- ✅ Enviar mensajes a estudiantes
- ✅ Actualizar estado de mentoría
- ✅ Ver sus estadísticas
- ❌ Crear tareas
- ❌ Ver solicitudes de otros mentores

### PROFESOR (role_id = 3)
- ✅ Crear tareas
- ✅ Publicar tareas
- ✅ Ver analíticas de mentoría
- ✅ Ver estudiantes solicitantes
- ✅ Ver mentorias en sus tareas
- ❌ Ser asignado como mentor
- ❌ Enviar mensajes directos

## 5. Estructura de Base de Datos

```sql
-- Usuarios
users (id, email, password_hash, full_name, role_id, is_active, ...)

-- Roles
user_roles (id, role_name)  -- 1=Student, 2=Mentor, 3=Teacher

-- Tareas
tasks (id, subject_id, teacher_id, title, status, ...)

-- Solicitudes de Mentoría
mentoring_requests (
  id, 
  task_id,
  student_id,
  mentor_id,  -- NULL hasta que se asigne
  status,  -- 'open', 'in_progress', 'resolved'
  ...
)

-- Mensajes
messages (
  id,
  mentoring_request_id,
  sender_id,
  message_text,
  is_read,  -- Clave: marca leído cuando se ve detalle
  ...
)

-- Notificaciones
notifications (
  id,
  user_id,
  title,
  message,
  is_read,
  ...
)
```

## 6. Integración Frontend-Backend

### Configurar Cliente HTTP (Frontend)

```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
export async function login(email: string, password: string) {
  const response = await apiClient.post('/auth/login', { email, password });
  localStorage.setItem('authToken', response.data.data.token);
  localStorage.setItem('userRole', response.data.data.role);
  return response.data.data;
}

// Student: Crear solicitud
export async function createMentoringRequest(taskId: number, description: string) {
  return apiClient.post(`/student/mentoring-requests`, {
    task_id: taskId,
    description,
  });
}

// Mentor: Ver solicitudes
export async function getOpenRequests() {
  return apiClient.get(`/mentor/open-requests`);
}
```

## 7. Manejo de Notificaciones en Frontend

```typescript
// hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Polling cada 5 segundos
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get('/student/notifications');
        const unread = response.data.data.filter((n: any) => !n.is_read);
        setNotifications(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return notifications;
}
```

## 8. Error Handling

### Códigos HTTP

| Código | Significado | Acción |
|--------|-------------|--------|
| 200 | OK | Success |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Validar entrada |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Rol insuficiente |
| 404 | Not Found | Recurso no existe |
| 500 | Server Error | Contactar soporte |

### Manejo en Frontend

```typescript
try {
  const response = await apiClient.post('/mentor/requests/1/assign', {});
} catch (error: any) {
  if (error.response?.status === 401) {
    // Token expirado - redirigir a login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Permiso denegado
    alert('No tienes permisos para esta acción');
  } else if (error.response?.status === 404) {
    // No encontrado
    alert('La solicitud no existe');
  }
}
```

## 9. WebSocket para Mensajes en Tiempo Real (Futuro)

```typescript
// Para implementar en el futuro
useEffect(() => {
  const ws = new WebSocket(
    `ws://localhost:8080/ws/mentoring/${mentoringRequestId}`
  );

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    setMessages(prev => [...prev, message]);
  };

  return () => ws.close();
}, [mentoringRequestId]);
```

## 10. Testing de Endpoints

### Con Thunder Client / Postman

#### Login
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user_id": 1,
    "email": "student@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

#### Get Tasks (Estudiante)
```
GET http://localhost:8080/api/student/tasks
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subject_id": 1,
      "teacher_id": 5,
      "title": "Estructura de Datos",
      "description": "Implementar árbol binario",
      "status": "published",
      "due_date": "2024-12-31"
    }
  ]
}
```

#### Create Mentoring Request
```
POST http://localhost:8080/api/student/mentoring-requests
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "task_id": 1,
  "description": "Necesito ayuda con los algoritmos de búsqueda"
}

Response:
{
  "success": true,
  "data": {
    "id": 15,
    "student_id": 1,
    "task_id": 1,
    "status": "open",
    "created_at": "2024-12-15T10:30:00Z"
  }
}
```

## 11. Deployment

### Opciones de Deployment

1. **Local Development**
   ```bash
   cargo run
   # http://localhost:8080
   ```

2. **Docker**
   ```dockerfile
   FROM rust:latest
   WORKDIR /app
   COPY . .
   RUN cargo build --release
   EXPOSE 8080
   CMD ["./target/release/tricode-mentoring-api"]
   ```

3. **Railway/Heroku**
   ```bash
   railway link
   railway up
   ```

4. **VPS (DigitalOcean, AWS)**
   ```bash
   scp target/release/tricode-mentoring-api user@host:/app/
   ssh user@host "/app/tricode-mentoring-api"
   ```

## 12. Monitoreo y Logs

```bash
# Con logging activado
RUST_LOG=info cargo run

# Logs del servidor
tail -f /var/log/tricode-mentoring-api.log

# Métricas con prometheus (futuro)
GET http://localhost:8080/metrics
```

## 13. Seguridad

- ✅ HTTPS recomendado en producción
- ✅ JWT con 1 día de expiración
- ✅ Bcrypt para contraseñas (cost 12)
- ✅ CORS configurado
- ✅ SQL Injection prevenido (SQLx)
- ✅ Rate limiting (implementar)
- ✅ OWASP Top 10 considerado

## 14. Próximas Mejoras

1. **WebSocket**: Mensajes en tiempo real
2. **Caché Redis**: Mejorar performance
3. **GraphQL**: Alternativa a REST
4. **Rate Limiting**: Anti-spam
5. **Logging Central**: ELK stack
6. **Autorización Granular**: ABAC
7. **Auditoría**: Track de cambios
8. **Testing Automatizado**: CI/CD

---

**Documento generado para Hacktón TriCode**
**Última actualización: 2024**
