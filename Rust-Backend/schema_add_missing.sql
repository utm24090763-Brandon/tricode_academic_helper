-- ============================================================
-- AGREGAR AL SCHEMA: TODO LO QUE TE FALTABA
-- ============================================================

-- Ejecuta esto en Supabase DESPUÉS de schema_multiple_roles.sql

-- ============================================================
-- PASO 1: AGREGAR CAMPOS A TABLA USERS
-- ============================================================
ALTER TABLE users ADD COLUMN mentor_specialty VARCHAR(255);
ALTER TABLE users ADD COLUMN teacher_department VARCHAR(255);
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN profile_picture_url TEXT;

-- ============================================================
-- PASO 2: CREAR TABLA SESSIONS
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

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- PASO 3: CREAR TABLA SUBJECTS (Asignaturas/Materias)
-- ============================================================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_subjects_code ON subjects(code);

-- ============================================================
-- PASO 4: CREAR TABLA TASKS (Tareas/Asignaciones)
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

CREATE INDEX idx_tasks_subject_id ON tasks(subject_id);
CREATE INDEX idx_tasks_teacher_id ON tasks(teacher_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================
-- PASO 5: CREAR TABLA MENTORING_REQUESTS (SI NO EXISTE)
-- ============================================================
CREATE TABLE IF NOT EXISTS mentoring_requests (
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

CREATE INDEX IF NOT EXISTS idx_mentoring_requests_student_id ON mentoring_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_requests_mentor_id ON mentoring_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_requests_task_id ON mentoring_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_requests_status ON mentoring_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentoring_requests_created_at ON mentoring_requests(created_at);

-- ============================================================
-- PASO 6: CREAR TABLA MESSAGES (SI NO EXISTE)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
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

CREATE INDEX IF NOT EXISTS idx_messages_mentoring_request_id ON messages(mentoring_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ============================================================
-- PASO 7: CREAR TABLA NOTIFICATIONS (SI NO EXISTE)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================
-- PASO 8: CREAR TABLA AUDIT_LOGS
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

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- PASO 9: CREAR TABLA TASK_COMMENTS
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

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

-- ============================================================
-- PASO 10: AGREGAR VISTAS ADICIONALES
-- ============================================================

-- Vista: Mentoría del Estudiante
CREATE OR REPLACE VIEW student_mentoring_view AS
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
CREATE OR REPLACE VIEW mentor_view AS
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
CREATE OR REPLACE VIEW teacher_dashboard_view AS
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
-- PASO 11: AGREGAR FUNCIONES PL/pgSQL
-- ============================================================

-- Función para obtener roles de un usuario (MEJORADA)
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT STRING_AGG(r.name, ', ' ORDER BY r.name) 
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si usuario tiene un rol específico
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

-- Función para contar mensajes no leídos (SI NO EXISTE)
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
-- PASO 12: AGREGAR TRIGGERS
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

-- Trigger para mentoring_requests
DROP TRIGGER IF EXISTS mentoring_requests_audit_trigger ON mentoring_requests;
CREATE TRIGGER mentoring_requests_audit_trigger
AFTER INSERT OR UPDATE ON mentoring_requests
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para messages
DROP TRIGGER IF EXISTS messages_audit_trigger ON messages;
CREATE TRIGGER messages_audit_trigger
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger para tasks
DROP TRIGGER IF EXISTS tasks_audit_trigger ON tasks;
CREATE TRIGGER tasks_audit_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================
-- PASO 13: INSERTAR DATOS DE PRUEBA
-- ============================================================

-- Si ya tienes usuarios, agrega más datos de prueba

-- Materias
INSERT INTO subjects (name, code, description, teacher_id) VALUES
  ('Análisis de Sistemas', 'ANSI-101', 'Curso de análisis de sistemas de información', 
   (SELECT id FROM users WHERE email = 'teacher@tricode.com' LIMIT 1)),
  ('Programación Avanzada', 'PROG-201', 'Conceptos avanzados de programación',
   (SELECT id FROM users WHERE email = 'teacher@tricode.com' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Tareas
INSERT INTO tasks (subject_id, teacher_id, title, description, task_type, due_date, status, published_at) VALUES
  (
    (SELECT id FROM subjects WHERE code = 'ANSI-101' LIMIT 1),
    (SELECT id FROM users WHERE email = 'teacher@tricode.com' LIMIT 1),
    'Modelado de Base de Datos',
    'Crear modelo ER para sistema de ventas',
    'project',
    '2024-12-20',
    'published',
    NOW()
  ),
  (
    (SELECT id FROM subjects WHERE code = 'PROG-201' LIMIT 1),
    (SELECT id FROM users WHERE email = 'teacher@tricode.com' LIMIT 1),
    'Desarrollo Backend en Rust',
    'Implementar API REST con Actix-web',
    'project',
    '2024-12-25',
    'published',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICAR QUE TODO ESTÁ CREADO
-- ============================================================

-- Ejecuta estas consultas para verificar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM user_roles_view;
-- SELECT get_user_roles(1);
-- SELECT * FROM student_mentoring_view;
-- SELECT * FROM mentor_view;
-- SELECT * FROM teacher_dashboard_view;
