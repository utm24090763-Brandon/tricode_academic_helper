// src/lib/services/auth.ts
import { apiClient } from '../api';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types';
import Cookies from 'js-cookie';

export class AuthService {
  // Login
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);

      // Guardar token y datos del usuario
      if (response.data.token) {
        Cookies.set('auth_token', response.data.token, { expires: 7 }); // 7 días
        Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      }

      return response.data;
    } catch (error: any) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error en el login';
      throw new Error(serverMessage);
    }
  }

  // Registro
  static async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/register', userData);

      // Guardar token y datos del usuario
      if (response.data.token) {
        Cookies.set('auth_token', response.data.token, { expires: 7 });
        Cookies.set('user_data', JSON.stringify(response.data.user), { expires: 7 });
      }

      return response.data;
    } catch (error: any) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error en el registro';
      throw new Error(serverMessage);
    }
  }

  // Verificar token
  static async verifyToken(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/api/auth/verify');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Token inválido');
    }
  }

  // Logout
  static logout(): void {
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
    // Redirigir al login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Obtener usuario actual
  static getCurrentUser(): User | null {
    try {
      const userData = Cookies.get('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Obtener token actual
  static getToken(): string | null {
    return Cookies.get('auth_token') || null;
  }

  // Verificar si está autenticado
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar si tiene un rol específico
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes(role) : false;
  }

  // Verificar si tiene alguno de los roles
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.some(role => user.roles.includes(role)) : false;
  }
}