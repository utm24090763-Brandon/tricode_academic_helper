"use client";

// src/hooks/useAuth.ts
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (userData: RegisterRequest) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la app
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        // Error al cargar, limpiar
        localStorage.removeItem('user_data');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<User> => {
    setLoading(true);
    try {
      // Simular login - en un entorno real, esto sería una llamada a la API
      if (!credentials.email || !credentials.password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Verificar si hay un usuario registrado con ese email
      const storedUserStr = localStorage.getItem('user_data');
      if (storedUserStr) {
        const storedUser: User = JSON.parse(storedUserStr);
        if (storedUser.email === credentials.email) {
          // Usuario encontrado, simular login exitoso
          setUser(storedUser);
          return storedUser;
        }
      }

      // Si no hay usuario registrado o email no coincide, crear uno demo
      const mockUser: User = {
        id: 1,
        email: credentials.email,
        full_name: 'Usuario Demo',
        roles: ['student'], // Por defecto estudiante
      };

      // Guardar en localStorage
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<User> => {
    setLoading(true);
    try {
      // Simular registro - en un entorno real, esto sería una llamada a la API
      if (!userData.email || !userData.password || !userData.full_name) {
        throw new Error('Campos obligatorios faltantes');
      }

      // Simular creación de usuario
      const mockUser: User = {
        id: Date.now(), // ID único simple
        email: userData.email,
        full_name: userData.full_name,
        matricula: userData.matricula,
        mentor_specialty: userData.mentor_specialty,
        teacher_department: userData.teacher_department,
        phone: userData.phone,
        photo_url: userData.photo_url,
        profile_picture_url: userData.profile_picture_url,
        roles: userData.roles,
      };

      // Guardar en localStorage
      localStorage.setItem('user_data', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const hasRole = (role: string) => user?.roles.includes(role) || false;
  const hasAnyRole = (roles: string[]) => roles.some(role => user?.roles.includes(role)) || false;

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};