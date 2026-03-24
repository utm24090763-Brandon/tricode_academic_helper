// src/lib/services/student.ts
import { apiClient } from '../api';
import { Task, MentoringRequest, Message, Notification } from '../types';

export class StudentService {
  // Obtener tareas disponibles
  static async getTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get<Task[]>('/api/student/tasks');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener tareas');
    }
  }

  // Crear solicitud de mentoría
  static async createMentoringRequest(data: {
    task_id: number;
    request_type: string;
    title: string;
    description: string;
    priority: string;
  }): Promise<MentoringRequest> {
    try {
      const response = await apiClient.post<MentoringRequest>('/api/student/mentoring-requests', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear solicitud');
    }
  }

  // Obtener mis solicitudes de mentoría
  static async getMyMentoringRequests(): Promise<MentoringRequest[]> {
    try {
      const response = await apiClient.get<MentoringRequest[]>('/api/student/mentoring-requests');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes');
    }
  }

  // Obtener detalle de una solicitud específica
  static async getMentoringRequestDetail(id: number): Promise<MentoringRequest> {
    try {
      const response = await apiClient.get<MentoringRequest>(`/api/student/mentoring-requests/${id}/detail`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener detalle');
    }
  }

  // Enviar mensaje a mentor
  static async sendMessageToMentor(requestId: number, content: string): Promise<Message> {
    try {
      const response = await apiClient.post<Message>(`/api/student/mentoring-requests/${requestId}/messages`, {
        content,
        message_type: 'text'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al enviar mensaje');
    }
  }

  // Obtener notificaciones
  static async getNotifications(): Promise<Notification[]> {
    try {
      const response = await apiClient.get<Notification[]>('/api/student/notifications');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener notificaciones');
    }
  }

  // Marcar notificación como leída
  static async markNotificationAsRead(id: number): Promise<void> {
    try {
      await apiClient.put(`/api/student/notifications/${id}/read`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al marcar notificación');
    }
  }
}