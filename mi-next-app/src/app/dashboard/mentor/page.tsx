'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { MentorService } from '../../../lib/services/mentor';
import { MentoringRequest, MentorStats } from '../../../lib/types';

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState<MentoringRequest[]>([]);
  const [openRequests, setOpenRequests] = useState<MentoringRequest[]>([]);
  const [stats, setStats] = useState<MentorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MentoringRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignedData, openData, statsData] = await Promise.all([
        MentorService.getAssignedRequests(),
        MentorService.getOpenRequests(),
        MentorService.getMentorStats()
      ]);

      setAssignedRequests(assignedData);
      setOpenRequests(openData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRequest = async (requestId: number) => {
    try {
      await MentorService.assignMentoringRequest(requestId);
      // Recargar datos
      await loadData();
    } catch (error) {
      console.error('Error assigning request:', error);
    }
  };

  const handleUpdateStatus = async (requestId: number, status: string) => {
    try {
      await MentorService.updateRequestStatus(requestId, status);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendMessage = async (requestId: number) => {
    if (!newMessage.trim()) return;

    try {
      await MentorService.sendMessageToStudent(requestId, newMessage);
      setNewMessage('');
      // Recargar datos para mostrar el nuevo mensaje
      await loadData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['mentor']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Mentor
                </h1>
                <p className="text-gray-600">Bienvenido, {user?.full_name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">

            {/* Estadísticas */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Solicitudes Asignadas
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.total_assigned_requests}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Tiempo Respuesta Promedio
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.average_response_time}min
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Completadas
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.completed_requests}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Activas
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.active_requests}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Solicitudes Asignadas */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Mis Solicitudes Asignadas
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Solicitudes que te han sido asignadas para mentoría
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {assignedRequests.map((request) => (
                    <li key={request.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                            <p className="text-sm text-gray-500">{request.description}</p>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Ver Detalles
                            </button>
                            {request.status !== 'completed' && (
                              <select
                                onChange={(e) => handleUpdateStatus(request.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                defaultValue={request.status}
                              >
                                <option value="assigned">Asignada</option>
                                <option value="in_progress">En Progreso</option>
                                <option value="completed">Completada</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solicitudes Disponibles */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Solicitudes Disponibles
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Solicitudes abiertas que puedes asignarte
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {openRequests.map((request) => (
                    <li key={request.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                            <p className="text-sm text-gray-500">{request.description}</p>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              <span className="text-sm text-gray-500">
                                Tipo: {request.request_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleAssignRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Asignarme
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal de detalles */}
            {showDetailModal && selectedRequest && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Detalles de la Solicitud
                      </h3>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setSelectedRequest(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">{selectedRequest.title}</h4>
                      <p className="text-gray-600 mt-2">{selectedRequest.description}</p>
                      <div className="mt-3 flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                          {selectedRequest.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          Tipo: {selectedRequest.request_type}
                        </span>
                      </div>
                    </div>

                    {/* Sección de mensajes */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Mensajes</h4>

                      {/* Aquí irían los mensajes - por simplicidad no los implemento en este ejemplo */}

                      <div className="mt-4">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe tu mensaje..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                        <button
                          onClick={() => handleSendMessage(selectedRequest.id)}
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                          Enviar Mensaje
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}