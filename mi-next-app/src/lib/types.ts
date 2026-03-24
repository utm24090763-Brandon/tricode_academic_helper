// src/lib/types.ts

// Tipos de roles
export type UserRole = 'student' | 'mentor' | 'teacher';

// Usuario
export interface User {
  id: number;
  email: string;
  full_name: string;
  matricula?: string;
  mentor_specialty?: string;
  teacher_department?: string;
  phone?: string;
  photo_url?: string;
  profile_picture_url?: string;
  roles: string[];
}

// Respuestas de autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  matricula?: string;
  mentor_specialty?: string;
  teacher_department?: string;
  phone?: string;
  photo_url?: string;
  profile_picture_url?: string;
  roles: string[];
}

// Solicitudes de mentoría
export interface MentoringRequest {
  id: number;
  task_id: number;
  student_id: number;
  mentor_id?: number;
  request_type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

// Tareas
export interface Task {
  id: number;
  title: string;
  description: string;
  subject: string;
  difficulty_level: string;
  estimated_hours: number;
  deadline?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}
// Estudiantes solicitando mentoría
export interface StudentRequestingMentor {
  id: number;
  student_id: number;
  student_name: string;
  request_id: number;
  request_title: string;
  request_status: string;
  created_at: string;
  updated_at: string;
}
// Mensajes
export interface Message {
  id: number;
  mentoring_request_id: number;
  sender_id: number;
  sender_role: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

// Notificaciones
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

// Estadísticas del mentor
export interface MentorStats {
  total_assigned_requests: number;
  active_requests: number;
  completed_requests: number;
  average_response_time: number;
}

// Analytics del profesor
export interface MentoringAnalytics {
  total_students: number;
  total_mentors: number;
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  average_completion_time: number;
}

// Estados de respuesta
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Estados de error
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}