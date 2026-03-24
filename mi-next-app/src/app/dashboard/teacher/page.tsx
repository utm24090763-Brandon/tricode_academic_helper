'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { TeacherService } from '../../../lib/services/teacher';
import { Task, MentoringAnalytics } from '../../../lib/types';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<MentoringAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'beginner',
    estimated_hours: 1,
    deadline: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, analyticsData] = await Promise.all([
        TeacherService.getMyTasks(),
        TeacherService.getMentoringAnalytics()
      ]);

      setTasks(tasksData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await TeacherService.createTask(taskForm);
      setShowCreateTask(false);
      setTaskForm({
        title: '',
        description: '',
        subject: '',
        difficulty_level: 'beginner',
        estimated_hours: 1,
        deadline: ''
      });
      await loadData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handlePublishTask = async (taskId: number) => {
    try {
      await TeacherService.publishTask(taskId);
      await loadData();
    } catch (error) {
      console.error('Error publishing task:', error);
    }
  };

  const handleCloseTask = async (taskId: number) => {
    try {
      await TeacherService.closeTask(taskId);
      await loadData();
    } catch (error) {
      console.error('Error closing task:', error);
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
    <ProtectedRoute requiredRoles={['teacher']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dashboard Profesor
                </h1>
                <p className="text-gray-600">Bienvenido, {user?.full_name}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Crear Tarea
                </button>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">

            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Estudiantes
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {analytics.total_students}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Mentores
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {analytics.total_mentors}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Solicitudes Totales
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {analytics.total_requests}
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
                            {analytics.completed_requests}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Tareas */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Mis Tareas
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Gestiona las tareas que has creado
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
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Materia: {task.subject}</span>
                            <span>Dificultad: {task.difficulty_level}</span>
                            <span>Horas: {task.estimated_hours}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              task.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {task.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex space-x-2">
                          {!task.is_active ? (
                            <button
                              onClick={() => handlePublishTask(task.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Publicar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCloseTask(task.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Cerrar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal para crear tarea */}
            {showCreateTask && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Crear Nueva Tarea
                    </h3>
                    <form onSubmit={handleCreateTask}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título
                        </label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción
                        </label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Materia
                        </label>
                        <input
                          type="text"
                          value={taskForm.subject}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="ej: Matemáticas, Programación, Física"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nivel de Dificultad
                        </label>
                        <select
                          value={taskForm.difficulty_level}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="beginner">Principiante</option>
                          <option value="intermediate">Intermedio</option>
                          <option value="advanced">Avanzado</option>
                          <option value="expert">Experto</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas Estimadas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={taskForm.estimated_hours}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha Límite (opcional)
                        </label>
                        <input
                          type="date"
                          value={taskForm.deadline}
                          onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateTask(false);
                            setTaskForm({
                              title: '',
                              description: '',
                              subject: '',
                              difficulty_level: 'beginner',
                              estimated_hours: 1,
                              deadline: ''
                            });
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Crear Tarea
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