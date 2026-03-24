// src/lib/services/mentor.ts
import { apiClient } from '../api';
import { MentoringRequest, Message, MentorStats } from '../types';

export class MentorService {
  // Obtener solicitudes asignadas
  static async getAssignedRequests(): Promise<MentoringRequest[]> {
    try {
      const response = await apiClient.get<MentoringRequest[]>('/api/mentor/assigned-requests');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes asignadas');
    }
  }

  // Obtener solicitudes abiertas disponibles
  static async getOpenRequests(): Promise<MentoringRequest[]> {
    try {
      const response = await apiClient.get<MentoringRequest[]>('/api/mentor/open-requests');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener solicitudes abiertas');
    }
  }

  // Asignar solicitud de mentoría
  static async assignMentoringRequest(requestId: number): Promise<MentoringRequest> {
    try {
      const response = await apiClient.post<MentoringRequest>(`/api/mentor/requests/${requestId}/assign`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al asignar solicitud');
    }
  }

  // Obtener detalle de una solicitud
  static async getRequestDetail(requestId: number): Promise<MentoringRequest> {
    try {
      const response = await apiClient.get<MentoringRequest>(`/api/mentor/requests/${requestId}/detail`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener detalle');
    }
  }

  // Enviar mensaje a estudiante
  static async sendMessageToStudent(requestId: number, content: string): Promise<Message> {
    try {
      const response = await apiClient.post<Message>(`/api/mentor/requests/${requestId}/messages`, {
        content,
        message_type: 'text'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al enviar mensaje');
    }
  }

  // Actualizar estado de solicitud
  static async updateRequestStatus(requestId: number, status: string): Promise<MentoringRequest> {
    try {
      const response = await apiClient.put<MentoringRequest>(`/api/mentor/requests/${requestId}/status`, {
        status
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar estado');
    }
  }

  // Obtener estadísticas del mentor
  static async getMentorStats(): Promise<MentorStats> {
    try {
      const response = await apiClient.get<MentorStats>('/api/mentor/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }
}