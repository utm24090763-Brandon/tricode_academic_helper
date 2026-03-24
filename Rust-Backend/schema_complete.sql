-- ============================================================
-- TRICODE ACADEMIC HELPER - COMPLETE DATABASE SCHEMA
-- Sistema de Mentorías con Control de Múltiples Roles
-- ============================================================

-- ============================================================
-- 1. TABLA DE ROLES
-- ============================================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description) VALUES 
  ('student', 'Estudiante que requiere mentoría'),
  ('mentor', 'Mentor que ofrece ayuda'),
  ('teacher', 'Docente que supervisa');

-- ============================================================
-- 2. TABLA DE USUARIOS CON MÚLTIPLES ROLES
-- ============================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  matricula VARCHAR(50),
  
  -- Información adicional por perfil
  mentor_specialty VARCHAR(255), -- Solo para mentores
  teacher_department VARCHAR(255), -- Solo para teachers
  phone VARCHAR(20),
  photo_url TEXT,
  profile_picture_url TEXT,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Auditoría y sesión
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Índices en users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================
-- 3. TABLA DE UNIÓN: Usuario ↔ Roles (Muchos a Muchos)
-- ============================================================
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE(user_id, role_id)
);

-- Índices en user_roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ============================================================
-- 4. TABLA DE SESIONES (Control de Login)
-- ============================================================
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false
);

-- Índices en sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- 5. TABLA DE ASIGNATURAS/MATERIAS
-- ============================================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en subjects
CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_subjects_code ON subjects(code);

-- ============================================================
-- 6. TABLA DE TAREAS/ASIGNACIONES
-- ============================================================
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL,
  
  -- Fechas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'draft',
  
  CONSTRAINT valid_type CHECK (task_type IN ('exam', 'project', 'homework', 'assignment', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'in_progress', 'closed'))
);

-- Índices en tasks
CREATE INDEX idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX idx_tasks_teacher_id ON tasks(teacher_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================
-- 7. TABLA DE SOLICITUDES DE MENTORÍA
-- ============================================================
CREATE TABLE mentoring_requests (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  request_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Estado del flujo
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'normal',
  
  -- Fechas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_request_type CHECK (request_type IN ('exam', 'project', 'personal_doubt', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high'))
);

-- Índices en mentoring_requests
CREATE INDEX idx_mentoring_requests_student_id ON mentoring_requests(student_id);
CREATE INDEX idx_mentoring_requests_mentor_id ON mentoring_requests(mentor_id);
CREATE INDEX idx_mentoring_requests_task_id ON mentoring_requests(task_id);
CREATE INDEX idx_mentoring_requests_status ON mentoring_requests(status);
CREATE INDEX idx_mentoring_requests_created_at ON mentoring_requests(created_at);

-- ============================================================
-- 8. TABLA DE MENSAJES
-- ============================================================
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  mentoring_request_id INTEGER NOT NULL REFERENCES mentoring_requests(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  message_text TEXT NOT NULL,
  
  -- Estado de lectura
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en messages
CREATE INDEX idx_messages_mentoring_request_id ON messages(mentoring_request_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================================
-- 9. TABLA DE NOTIFICACIONES
-- ============================================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_entity_type VARCHAR(100),
  related_entity_id INTEGER,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- 10. TABLA DE AUDITORÍA
-- ============================================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- 11. TABLA DE COMENTARIOS EN TAREAS
-- ============================================================
CREATE TABLE task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES task_comments(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices en task_comments
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- ============================================================
-- VISTAS ÚTILES PARA LA APLICACIÓN
-- ============================================================

-- Vista: Usuarios con sus roles concatenados
CREATE VIEW user_roles_view AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.matricula,
  STRING_AGG(r.name, ', ' ORDER BY r.name) AS roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.full_name, u.matricula;

-- Vista: Mentoría del Estudiante
CREATE VIEW student_mentoring_view AS
SELECT 
  mr.id,
  mr.title,
  mr.description,
  mr.status,
  mr.created_at,
  u.full_name AS mentor_name,
  u.email AS mentor_email,
  t.title AS task_title,
  t.due_date,
  t.status AS task_status
FROM mentoring_requests mr
LEFT JOIN users u ON mr.mentor_id = u.id
JOIN tasks t ON mr.task_id = t.id;

-- Vista: Mentoría del Mentor
CREATE VIEW mentor_view AS
SELECT 
  mr.id,
  mr.title,
  mr.status,
  mr.priority,
  mr.created_at,
  mr.assigned_at,
  u.full_name AS student_name,
  u.email AS student_email,
  u.matricula,
  COUNT(m.id) AS total_messages,
  COUNT(CASE WHEN m.is_read = false THEN 1 END) AS unread_messages
FROM mentoring_requests mr
JOIN users u ON mr.student_id = u.id
LEFT JOIN messages m ON mr.id = m.mentoring_request_id
WHERE mr.mentor_id IS NOT NULL
GROUP BY mr.id, u.id, u.full_name, u.email, u.matricula;

-- Vista: Panel del Teacher
CREATE VIEW teacher_dashboard_view AS
SELECT 
  s.id,
  s.name,
  COUNT(DISTINCT t.id) AS total_tasks,
  COUNT(DISTINCT mr.id) AS total_mentoring_requests,
  COUNT(DISTINCT CASE WHEN mr.status = 'open' THEN mr.id END) AS open_requests,
  COUNT(DISTINCT CASE WHEN mr.status = 'in_progress' THEN mr.id END) AS in_progress_requests
FROM subjects s
LEFT JOIN tasks t ON s.id = t.subject_id
LEFT JOIN mentoring_requests mr ON t.id = mr.task_id
GROUP BY s.id, s.name;

-- ============================================================
-- FUNCIONES PL/pgSQL ÚTILES
-- ============================================================

-- Función para obtener roles de un usuario
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT STRING_AGG(r.name, ', ' ORDER BY r.name) 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si usuario tiene rolle específico
CREATE OR REPLACE FUNCTION user_has_role(p_user_id INTEGER, p_role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id AND r.name = p_role_name
  );
END;
$$ LANGUAGE plpgsql;

-- Función para contar mensajes no leídos
CREATE OR REPLACE FUNCTION count_unread_messages(p_mentoring_request_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM messages 
          WHERE mentoring_request_id = p_mentoring_request_id 
          AND is_read = false);
END;
$$ LANGUAGE plpgsql;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_mentoring_request_id INTEGER, p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE messages 
  SET is_read = true, read_at = CURRENT_TIMESTAMP
  WHERE mentoring_request_id = p_mentoring_request_id 
  AND sender_id != p_user_id
  AND is_read = false;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS PARA AUDITORÍA
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
  VALUES (
    COALESCE(current_setting('app.current_user_id')::INTEGER, NULL),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para cambios en mentoring_requests
CREATE TRIGGER mentoring_requests_audit_trigger
AFTER INSERT OR UPDATE ON mentoring_requests
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para cambios en messages
CREATE TRIGGER messages_audit_trigger
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para cambios en tasks
CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- Usuarios de prueba con múltiples roles
INSERT INTO users (email, password_hash, full_name, matricula, phone, is_active, is_verified) VALUES
  ('estudiante@tricode.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLe', 'Juan Pérez', '2024001', '+34-555-0001', true, true),
  ('mentor@tricode.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLe', 'Brandon Uriel', '2024002', '+34-555-0002', true, true),
  ('teacher@tricode.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLe', 'Dr. García', NULL, '+34-555-0003', true, true);

-- Asignar roles a usuarios (incluida la posibilidad de múltiples roles)
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1),  -- Juan Pérez = Student
  (1, 2),  -- Juan Pérez = Mentor (múltiples roles)
  (2, 2),  -- Brandon Uriel = Mentor
  (3, 3);  -- Dr. García = Teacher

-- Materias
INSERT INTO subjects (name, code, description, teacher_id) VALUES
  ('Análisis de Sistemas', 'ANSI-101', 'Curso de análisis de sistemas de información', 3),
  ('Programación Avanzada', 'PROG-201', 'Conceptos avanzados de programación', 3);

-- Tareas
INSERT INTO tasks (subject_id, teacher_id, title, description, task_type, due_date, status, published_at) VALUES
  (1, 3, 'Modelado de Base de Datos', 'Crear modelo ER para sistema de ventas', 'project', '2024-12-20', 'published', NOW()),
  (2, 3, 'Desarrollo Backend en Rust', 'Implementar API REST con Actix-web', 'project', '2024-12-25', 'published', NOW());

-- ============================================================
-- COMENTARIOS Y DATOS ADICIONALES
-- ============================================================

/*
NOTAS IMPORTANTES:

1. MÚLTIPLES ROLES:
   - Un usuario puede tener varios roles a la vez
   - Juan Pérez es Student Y Mentor
   - Verificar rol con: SELECT * FROM user_roles_view;

2. FUNCIONES ÚTILES:
   - SELECT get_user_roles(1);  -- Obtener roles del usuario 1
   - SELECT user_has_role(1, 'mentor');  -- Verificar si es mentor
   - SELECT count_unread_messages(1);  -- Contar mensajes no leídos

3. AUDITORÍA:
   - Todos los cambios en mentoring_requests, messages y tasks se registran
   - Ver registro: SELECT * FROM audit_logs;

4. CONTRASEÑA DE PRUEBA:
   - Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/LLe
   - Contraseña original: password123

5. VISTAS DISPONIBLES:
   - user_roles_view: Ver usuarios con sus roles
   - student_mentoring_view: Panel del estudiante
   - mentor_view: Panel del mentor
   - teacher_dashboard_view: Panel del profesor
*/
