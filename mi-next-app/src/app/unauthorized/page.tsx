'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso Denegado
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>

        <div className="space-y-4">
          {user && (
            <div className="bg-white py-4 px-6 shadow rounded-lg">
              <p className="text-sm text-gray-600">
                Usuario: <span className="font-medium">{user.full_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Roles: <span className="font-medium">{user.roles.join(', ')}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Ir al Inicio
            </Link>

            {user ? (
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cerrar Sesión
              </button>
            ) : (
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}