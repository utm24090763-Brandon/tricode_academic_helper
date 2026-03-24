// src/lib/services/teacher.ts
import { apiClient } from '../api';
import { Task, MentoringRequest, MentoringAnalytics, StudentRequestingMentor } from '../types';

export class TeacherService {
  // Crear tarea
  static async createTask(taskData: {
    title: string;
    description: string;
    subject: string;
    difficulty_level: string;
    estimated_hours: number;
    deadline?: string;
  }): Promise<Task> {
    try {
      const response = await apiClient.post<Task>('/api/teacher/tasks', taskData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear tarea');
    }
  }

  // Obtener mis tareas
  static async getMyTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/teacher/tasks');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener tareas');
    }
  }

  // Publicar tarea
  static async publishTask(taskId: number): Promise<Task> {
    try {
      const response = await apiClient.put<Task>(`/api/teacher/tasks/${taskId}/publish`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al publicar tarea');
    }
  }

  // Cerrar tarea
  static async closeTask(taskId: number): Promise<Task> {
    try {
      const response = await apiClient.put<Task>(`/api/teacher/tasks/${taskId}/close`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cerrar tarea');
    }
  }

  // Obtener analytics de mentoría
  static async getMentoringAnalytics(): Promise<MentoringAnalytics> {
    try {
      const response = await apiClient.get<MentoringAnalytics>('/api/teacher/analytics');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener analytics');
    }
  }

  // Obtener solicitudes por tarea
  static async getRequestsByTask(taskId: number): Promise<MentoringRequest[]> {
    try {
      const response = await apiClient.get<MentoringRequest[]>(`/api/teacher/tasks/${taskId}/requests`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes');
    }
  }

  // Dashboard del profesor
  static async getTeacherDashboard(): Promise<any> {
    try {
      const response = await apiClient.get('/api/teacher/dashboard');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener dashboard');
    }
  }

  // Obtener estudiantes solicitando mentoría
  static async getStudentsRequestingMentoring(): Promise<StudentRequestingMentor[]> {
    try {
      const response = await apiClient.get<StudentRequestingMentor[]>('/api/teacher/students-requesting');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estudiantes');
    }
  }
}