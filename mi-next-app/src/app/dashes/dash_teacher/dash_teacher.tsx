'use client';

import { useEffect, useMemo, useState } from 'react';
import './dash_teacher.css';

interface TeacherAssignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  state: 'draft' | 'published' | 'closed';
}

interface Comment {
  id: number;
  taskId: number;
  author: 'student' | 'teacher';
  text: string;
  createdAt: string;
  parentId?: number;
}

interface TeacherNotification {
  id: number;
  taskId: number;
  taskTitle: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'triCode_teacher_tasks';
const COMMENTS_KEY = 'triCode_student_comments';
const TEACHER_NOTIFICATIONS_KEY = 'triCode_teacher_notifications';

const defaultTasks: TeacherAssignment[] = [
  {
    id: 1,
    title: 'Tarea 1: Fundamentos de Rust',
    description: 'Explica ownership y lifetimes con ejemplos. Adjunta archivo con soluciones.',
    dueDate: '2026-04-07',
    state: 'published',
  },
  {
    id: 2,
    title: 'Proyecto: API REST con Axum',
    description: 'Crea un CRUD para estudiantes y envía un README con endpoints.',
    dueDate: '2026-04-14',
    state: 'draft',
  },
];

export default function DashTeacher() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(() => {
    if (typeof window === 'undefined') return defaultTasks;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultTasks;
      const parsed = JSON.parse(raw) as TeacherAssignment[];
      if (!Array.isArray(parsed)) return defaultTasks;
      return parsed;
    } catch {
      return defaultTasks;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // localStorage may be bloqueada en el navegador
    }
  }, [assignments]);

  // Load comments and notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadComments = () => {
      try {
        const raw = window.localStorage.getItem(COMMENTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Comment[];
          setComments(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        setComments([]);
      }
    };

    const loadNotifications = () => {
      try {
        const raw = window.localStorage.getItem(TEACHER_NOTIFICATIONS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as TeacherNotification[];
          setNotifications(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        setNotifications([]);
      }
    };

    loadComments();
    loadNotifications();

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === COMMENTS_KEY) {
        loadComments();
      } else if (event.key === TEACHER_NOTIFICATIONS_KEY) {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    state: 'published' as TeacherAssignment['state'],
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<TeacherNotification[]>([]);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  const publishedCount = useMemo(() => assignments.filter((a) => a.state === 'published').length, [assignments]);

  const resetForm = () => {
    setFormData({ title: '', description: '', dueDate: '', state: 'published' });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.dueDate) return;

    if (editingId) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === editingId ? { ...a, ...formData, state: formData.state } : a
        )
      );
    } else {
      setAssignments((prev) => [
        { id: Date.now(), ...formData },
        ...prev,
      ]);
    }

    resetForm();
  };

  const handleEdit = (id: number) => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) return;
    setEditingId(id);
    setFormData({ ...assignment });
  };

  const handleDelete = (id: number) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  const handleViewComments = (taskId: number) => {
    setSelectedTaskForComments(selectedTaskForComments === taskId ? null : taskId);
  };

  const handleReplyToComment = (taskId: number, parentCommentId: number) => {
    const reply = replyText[parentCommentId]?.trim();
    if (!reply) return;

    const newReply: Comment = {
      id: Date.now(),
      taskId,
      author: 'teacher',
      text: reply,
      createdAt: new Date().toISOString().split('T')[0],
      parentId: parentCommentId,
    };

    const updatedComments = [...comments, newReply];
    setComments(updatedComments);
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));
    setReplyText((prev) => ({ ...prev, [parentCommentId]: '' }));
  };

  const handleMarkNotificationRead = (notificationId: number) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    window.localStorage.setItem(TEACHER_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <article className="dash-teacher">
      <div className="dash-teacher-header">
        <h2>Teacher Classroom</h2>
        <div className="header-stats">
          <span>{publishedCount} Tareas publicadas</span>
          {unreadNotificationsCount > 0 && (
            <span className="notifications-badge">
              🔔 {unreadNotificationsCount} notificaciones
            </span>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      {notifications.length > 0 && (
        <section className="notifications-section">
          <h3>Notificaciones ({unreadNotificationsCount} sin leer)</h3>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => handleMarkNotificationRead(notification.id)}
              >
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-date">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {!notification.read && <span className="unread-dot">●</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dash-teacher-grid">
        <div className="dash-teacher-panel">
          <h3>{editingId ? 'Editar tarea' : 'Agregar tarea'}</h3>
          <form onSubmit={handleSubmit} className="dash-classroom-form">
            <input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Título"
              required
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción"
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              required
            />
            <select
              value={formData.state}
              onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value as TeacherAssignment['state'] }))}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
            </select>
            <div className="dash-classroom-buttons">
              <button type="submit" className="primary">{editingId ? 'Guardar' : 'Publicar'}</button>
              <button type="button" className="secondary" onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        </div>

        <div className="dash-teacher-panel">
          <h3>Listado de tareas</h3>
          <ul className="assignment-list">
            {assignments.map((assignment) => {
              const taskComments = comments.filter((c) => c.taskId === assignment.id);
              const hasUnreadComments = taskComments.some((c) => c.author === 'student');

              return (
                <li key={assignment.id} className={`assignment ${assignment.state}`}>
                  <div>
                    <h4>{assignment.title}</h4>
                    <p>{assignment.description}</p>
                    <p>
                      <strong>Due:</strong> {assignment.dueDate} • <strong>Estado:</strong> {assignment.state}
                    </p>
                    {taskComments.length > 0 && (
                      <p className="comments-count">
                        💬 {taskComments.length} comentario{taskComments.length !== 1 ? 's' : ''}
                        {hasUnreadComments && <span className="unread-indicator">●</span>}
                      </p>
                    )}
                  </div>
                  <div className="assignment-actions">
                    <button onClick={() => handleEdit(assignment.id)}>Editar</button>
                    <button
                      className="comments-btn"
                      onClick={() => handleViewComments(assignment.id)}
                    >
                      💬 Ver Comentarios
                    </button>
                    <button className="danger" onClick={() => handleDelete(assignment.id)}>Eliminar</button>
                  </div>

                  {/* COMMENTS SECTION */}
                  {selectedTaskForComments === assignment.id && (
                    <div className="comments-section">
                      <h5>Comentarios de la tarea</h5>
                      {taskComments.length === 0 ? (
                        <p className="no-comments">No hay comentarios aún.</p>
                      ) : (
                        <div className="comments-list">
                          {taskComments.map((comment) => (
                            <div key={comment.id} className={`comment-item ${comment.author}`}>
                              <div className="comment-header">
                                <span className="comment-author">
                                  {comment.author === 'student' ? 'Estudiante' : 'Profesor'}
                                </span>
                                <span className="comment-date">{comment.createdAt}</span>
                              </div>
                              <p className="comment-text">{comment.text}</p>

                              {/* Reply form for student comments */}
                              {comment.author === 'student' && (
                                <div className="reply-form">
                                  <textarea
                                    placeholder="Responder al comentario..."
                                    value={replyText[comment.id] || ''}
                                    onChange={(e) =>
                                      setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                    }
                                    rows={2}
                                  />
                                  <button
                                    className="reply-btn"
                                    onClick={() => handleReplyToComment(assignment.id, comment.id)}
                                  >
                                    Responder
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {assignments.length === 0 && <li className="empty">No hay tareas. Crea la primera.</li>}
          </ul>
        </div>
      </section>
    </article>
  );
}
