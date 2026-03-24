'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { StudentService } from '../../../lib/services/student';
import { Task, MentoringRequest, Notification } from '../../../lib/types';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myRequests, setMyRequests] = useState<MentoringRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    request_type: 'mentoring',
    priority: 'medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, requestsData, notificationsData] = await Promise.all([
        StudentService.getTasks(),
        StudentService.getMyMentoringRequests(),
        StudentService.getNotifications()
      ]);

      setTasks(tasksData);
      setMyRequests(requestsData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await StudentService.createMentoringRequest({
        task_id: selectedTask.id,
        ...requestForm
      });

      setShowRequestForm(false);
      setSelectedTask(null);
      setRequestForm({
        title: '',
        description: '',
        request_type: 'mentoring',
        priority: 'medium'
      });

      // Recargar datos
      await loadData();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await StudentService.markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
    <ProtectedRoute requiredRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Estudiante
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Tareas Disponibles */}
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
                          Tareas Disponibles
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {tasks.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mis Solicitudes */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Mis Solicitudes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {myRequests.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notificaciones */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.618 4.618A9.955 9.955 0 0112 2c5.523 0 10 4.477 10 10 0 2.99-1.32 5.67-3.428 7.56-.531.526-1.025.974-1.025.974L4.618 4.618z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Notificaciones
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {notifications.filter(n => !n.is_read).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Tareas */}
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Tareas Disponibles
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Selecciona una tarea para solicitar mentoría
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-500">{task.description}</p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="mr-4">Materia: {task.subject}</span>
                              <span className="mr-4">Dificultad: {task.difficulty_level}</span>
                              <span>Horas: {task.estimated_hours}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowRequestForm(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                              Solicitar Ayuda
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal para crear solicitud */}
            {showRequestForm && selectedTask && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Solicitar mentoría: {selectedTask.title}
                    </h3>
                    <form onSubmit={handleCreateRequest}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título de la solicitud
                        </label>
                        <input
                          type="text"
                          value={requestForm.title}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción detallada
                        </label>
                        <textarea
                          value={requestForm.description}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de solicitud
                        </label>
                        <select
                          value={requestForm.request_type}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, request_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="mentoring">Mentoría general</option>
                          <option value="debugging">Ayuda con debugging</option>
                          <option value="explanation">Explicación de conceptos</option>
                          <option value="review">Revisión de código</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridad
                        </label>
                        <select
                          value={requestForm.priority}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="low">Baja</option>
                          <option value="medium">Media</option>
                          <option value="high">Alta</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRequestForm(false);
                            setSelectedTask(null);
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Enviar Solicitud
                        </button>
                      </div>
                    </form>
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