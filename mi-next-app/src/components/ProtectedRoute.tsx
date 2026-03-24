// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requireAuth?: boolean;
}

export const ProtectedRoute = ({
  children,
  requiredRoles = [],
  requireAuth = true
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasAnyRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Aún cargando

    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, requiredRoles, hasAnyRole, loading, router, requireAuth]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si no está autenticado y se requiere auth, no renderizar
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Si no tiene los roles requeridos, no renderizar
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return null;
  }

  return <>{children}</>;
};