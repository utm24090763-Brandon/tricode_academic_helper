'use client';

import { useEffect, useState, useRef } from 'react';
import './dash_student.css';

interface StudentAssignment {
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
  parentId?: number; // For threading replies
}

interface TeacherNotification {
  id: number;
  taskId: number;
  taskTitle: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface Submission {
  id: number;
  taskId: number;
  submittedAt: string;
}

interface Message {
  id: number;
  author: 'student' | 'mentor';
  text: string;
  createdAt: string;
  read: boolean;
}

interface MentoriaTicket {
  id: number;
  taskId: number;
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  taskState: string;
  matricula: string;
  fullName: string;
  email: string;
  subject: string;
  description: string;
  type: 'exam' | 'project' | 'personal_doubt' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdDate: string;
  mentorAssigned?: string | null;
  mentorEmail?: string | null;
  messages: Message[];
}

const STORAGE_KEY = 'triCode_teacher_tasks';
const COMMENTS_KEY = 'triCode_student_comments';
const SUBMISSIONS_KEY = 'triCode_student_submissions';
const MENTORIA_TICKETS_KEY = 'triCode_mentoria_tickets';
const TEACHER_NOTIFICATIONS_KEY = 'triCode_teacher_notifications';

export default function DashStudent() {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mentoriaTickets, setMentoriaTickets] = useState<MentoriaTicket[]>([]);
  const [expandedComments, setExpandedComments] = useState<{ [key: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [key: number]: string }>({});
  const [mentoriaTaskId, setMentoriaTaskId] = useState<number | null>(null);
  const [expandedMentoria, setExpandedMentoria] = useState<MentoriaTicket | null>(null);
  const [mentoriaMessageText, setMentoriaMessageText] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'mentorships'>('assignments');
  const [mentoriaFormData, setMentoriaFormData] = useState({
    matricula: '',
    fullName: '',
    email: '',
    description: '',
    type: 'exam' as 'exam' | 'project' | 'personal_doubt' | 'other',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadFromStorage = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setAssignments([]);
          return;
        }
        const parsed = JSON.parse(raw) as StudentAssignment[];
        if (Array.isArray(parsed)) {
          setAssignments(parsed);
        } else {
          setAssignments([]);
        }
      } catch {
        setAssignments([]);
      }
    };

    const loadComments = () => {
      try {
        const raw = window.localStorage.getItem(COMMENTS_KEY);
        setComments(raw ? JSON.parse(raw) : []);
      } catch {
        setComments([]);
      }
    };

    const loadSubmissions = () => {
      try {
        const raw = window.localStorage.getItem(SUBMISSIONS_KEY);
        setSubmissions(raw ? JSON.parse(raw) : []);
      } catch {
        setSubmissions([]);
      }
    };

    const loadMentoriaTickets = () => {
      try {
        const raw = window.localStorage.getItem('triCode_mentor_tickets');
        if (raw) {
          const allTickets = JSON.parse(raw) as MentoriaTicket[];
          setMentoriaTickets(Array.isArray(allTickets) ? allTickets : []);
        }
      } catch {
        setMentoriaTickets([]);
      }
    };

    loadFromStorage();
    loadComments();
    loadSubmissions();
    loadMentoriaTickets();

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        loadFromStorage();
      } else if (event.key === COMMENTS_KEY) {
        loadComments();
      } else if (event.key === SUBMISSIONS_KEY) {
        loadSubmissions();
      } else if (event.key === 'triCode_mentor_tickets') {
        loadMentoriaTickets();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const handleAddComment = (taskId: number) => {
    if (!commentText[taskId]?.trim()) return;

    const task = assignments.find(a => a.id === taskId);
    const newComment: Comment = {
      id: Date.now(),
      taskId,
      author: 'student',
      text: commentText[taskId],
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));

    // Create notification for teacher
    const notification: TeacherNotification = {
      id: Date.now(),
      taskId,
      taskTitle: task?.title || 'Tarea',
      message: `Nuevo comentario en "${task?.title || 'tarea'}"`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      const existingNotifications = JSON.parse(window.localStorage.getItem(TEACHER_NOTIFICATIONS_KEY) || '[]');
      const updatedNotifications = [...existingNotifications, notification];
      window.localStorage.setItem(TEACHER_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    } catch {
      window.localStorage.setItem(TEACHER_NOTIFICATIONS_KEY, JSON.stringify([notification]));
    }

    setCommentText((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleSubmit = (taskId: number) => {
    const newSubmission: Submission = {
      id: Date.now(),
      taskId,
      submittedAt: new Date().toISOString().split('T')[0],
    };

    const updatedSubmissions = [...submissions, newSubmission];
    setSubmissions(updatedSubmissions);
    window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubmissions));
  };

  const getTaskComments = (taskId: number) => comments.filter((c) => c.taskId === taskId);
  const getTaskSubmission = (taskId: number) => submissions.find((s) => s.taskId === taskId);

  const handleSendMentoriaMessage = () => {
    if (!mentoriaMessageText.trim() || !expandedMentoria) return;

    const newMessage: Message = {
      id: Date.now(),
      author: 'student',
      text: mentoriaMessageText,
      createdAt: new Date().toISOString().split('T')[0],
      read: false, // No leído para el mentor
    };

    const updatedTickets = mentoriaTickets.map((t) =>
      t.id === expandedMentoria.id
        ? { ...t, messages: [...(t.messages || []), newMessage] }
        : t
    );

    setMentoriaTickets(updatedTickets);
    setExpandedMentoria({
      ...expandedMentoria,
      messages: [...(expandedMentoria.messages || []), newMessage],
    });

    // Actualizar en localStorage
    try {
      const raw = window.localStorage.getItem('triCode_mentor_tickets') || '[]';
      const allTickets = JSON.parse(raw) as MentoriaTicket[];
      const updated = allTickets.map((t) =>
        t.id === expandedMentoria.id
          ? { ...t, messages: [...(t.messages || []), newMessage] }
          : t
      );
      window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updated));
    } catch {
      // fail silently
    }

    setMentoriaMessageText('');
  };

  // Marcar mensajes como leídos cuando se abre una mentoría
  const handleOpenMentoriaDetail = (mentoria: MentoriaTicket) => {
    const updatedTickets = mentoriaTickets.map((t) =>
      t.id === mentoria.id
        ? {
            ...t,
            messages: (t.messages || []).map((m) =>
              m.author === 'mentor' ? { ...m, read: true } : m
            ),
          }
        : t
    );
    setMentoriaTickets(updatedTickets);

    // Actualizar en localStorage
    try {
      const raw = window.localStorage.getItem('triCode_mentor_tickets') || '[]';
      const allTickets = JSON.parse(raw) as MentoriaTicket[];
      const updated = allTickets.map((t) =>
        t.id === mentoria.id
          ? {
              ...t,
              messages: (t.messages || []).map((m) =>
                m.author === 'mentor' ? { ...m, read: true } : m
              ),
            }
          : t
      );
      window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updated));
    } catch {
      // fail silently
    }

    setExpandedMentoria(updatedTickets.find((t) => t.id === mentoria.id) || mentoria);
  };

  const countUnreadMentorMessages = (mentoria: MentoriaTicket) => {
    return (mentoria.messages || []).filter((m) => m.author === 'mentor' && !m.read).length;
  };

  const handleMentoriaSubmit = (taskId: number) => {
    const task = assignments.find((a) => a.id === taskId);
    if (!task || !mentoriaFormData.matricula || !mentoriaFormData.fullName || !mentoriaFormData.email || !mentoriaFormData.description) return;

    const newTicket: MentoriaTicket = {
      id: Date.now(),
      taskId,
      taskTitle: task.title,
      taskDescription: task.description,
      taskDueDate: task.dueDate,
      taskState: task.state,
      matricula: mentoriaFormData.matricula,
      fullName: mentoriaFormData.fullName,
      email: mentoriaFormData.email,
      subject: task.title,
      description: mentoriaFormData.description,
      type: mentoriaFormData.type,
      status: 'open',
      createdDate: new Date().toISOString().split('T')[0],
      mentorAssigned: null,
      mentorEmail: null,
      messages: [],
    };

    try {
      const raw = window.localStorage.getItem('triCode_mentor_tickets') || '[]';
      const existing = JSON.parse(raw) as MentoriaTicket[];
      const updated = [...existing, newTicket];
      window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updated));
    } catch {
      // fail silently
    }

    setMentoriaTaskId(null);
    setMentoriaFormData({
      matricula: '',
      fullName: '',
      email: '',
      description: '',
      type: 'exam',
    });
  };

  return (
    <article className="dash-student">
      <div className="dash-student-header">
        <h2>Student Classroom</h2>
        <span>{assignments.length} tareas disponibles</span>
      </div>

      {/* TABS */}
      <div className="student-tabs">
        <button
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📝 Tareas ({assignments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'mentorships' ? 'active' : ''}`}
          onClick={() => setActiveTab('mentorships')}
        >
          🎓 Mis Mentorías ({mentoriaTickets.length})
        </button>
      </div>

      <section className="dash-student-body">
        {/* TAB: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <>
            {assignments.length === 0 ? (
              <p className="empty">No hay tareas publicadas por el profesor todavía.</p>
            ) : (
              <ul className="student-list">
                {assignments.map((task) => {
                  const taskComments = getTaskComments(task.id);
                  const taskSubmission = getTaskSubmission(task.id);
                  const isExpanded = expandedComments[task.id] || false;

                  return (
                    <li key={task.id} className={`task ${task.state}`}>
                      <div className="task-header">
                        <div className="task-title-section">
                          <h3>{task.title}</h3>
                          <p className="task-desc">{task.description}</p>
                          <p className="task-meta">
                            <strong>Entrega:</strong> {task.dueDate} • <strong>Estado:</strong> {task.state}
                          </p>
                        </div>

                        <button
                          className="mentoria-btn"
                          onClick={() => setMentoriaTaskId(task.id)}
                          title="Solicitar mentoría"
                        >
                          🎓
                        </button>
                      </div>

                      <div className="task-actions">
                        <button
                          className="action-btn submit-btn"
                          onClick={() => handleSubmit(task.id)}
                          disabled={!!taskSubmission}
                        >
                          {taskSubmission ? '✓ Entregado' : 'Entregar'}
                        </button>
                        <button
                          className="action-btn comment-btn"
                          onClick={() =>
                            setExpandedComments((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                          }
                        >
                          💬 Comentario ({taskComments.length})
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="comments-section">
                          <div className="existing-comments">
                            {taskComments.length === 0 ? (
                              <p className="no-comments">Sin comentarios aún</p>
                            ) : (
                              taskComments.map((comment) => (
                                <div key={comment.id} className={`comment-item ${comment.author}`}>
                                  <div className="comment-header">
                                    <span className="comment-author">
                                      {comment.author === 'student' ? 'Tú' : 'Profesor'}
                                    </span>
                                    <span className="comment-date">{comment.createdAt}</span>
                                  </div>
                                  <p className="comment-text">{comment.text}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="add-comment-form">
                            <textarea
                              placeholder="Escribe tu comentario..."
                              value={commentText[task.id] || ''}
                              onChange={(e) =>
                                setCommentText((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              rows={3}
                            />
                            <button
                              className="add-comment-btn"
                              onClick={() => handleAddComment(task.id)}
                            >
                              Agregar Comentario
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* TAB: MENTORSHIPS */}
        {activeTab === 'mentorships' && (
          <>
            {mentoriaTickets.length === 0 ? (
              <p className="empty">
                No has solicitado mentorías aún. Selecciona una tarea y haz clic en 🎓 para solicitar mentoría.
              </p>
            ) : (
              <div className="mentorships-grid">
                {mentoriaTickets.map((mentoria) => (
                  <div
                    key={mentoria.id}
                    className={`mentorship-card ${mentoria.status} ${countUnreadMentorMessages(mentoria) > 0 ? 'has-unread' : ''}`}
                    onClick={() => handleOpenMentoriaDetail(mentoria)}
                  >
                    <div className="mentorship-header">
                      <h3>{mentoria.taskTitle}</h3>
                      <span className={`status-badge ${mentoria.status}`}>{mentoria.status}</span>
                    </div>
                    <p className="mentorship-type">
                      <strong>Tipo:</strong>{' '}
                      {mentoria.type === 'exam'
                        ? 'Examen'
                        : mentoria.type === 'project'
                        ? 'Proyecto'
                        : mentoria.type === 'personal_doubt'
                        ? 'Duda Personal'
                        : 'Otro'}
                    </p>
                    {mentoria.mentorAssigned ? (
                      <p className="mentorship-mentor">
                        <strong>Mentor:</strong> {mentoria.mentorAssigned}
                      </p>
                    ) : (
                      <p className="mentorship-pending">⏳ Esperando asignación del mentor</p>
                    )}
                    <p className="mentorship-date">
                      <small>Desde: {mentoria.createdDate}</small>
                    </p>
                    {countUnreadMentorMessages(mentoria) > 0 && (
                      <div className="notification-badge">{countUnreadMentorMessages(mentoria)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* MENTORSHIP DETAILED VIEW */}
      {expandedMentoria && (
        <div className="mentoria-overlay" onClick={() => setExpandedMentoria(null)}>
          <div className="mentoria-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mentoria-detail-header">
              <div>
                <h2>{expandedMentoria.taskTitle}</h2>
                <span className={`status-badge ${expandedMentoria.status}`}>{expandedMentoria.status}</span>
              </div>
              <button className="close-btn" onClick={() => setExpandedMentoria(null)}>
                ✕
              </button>
            </div>

            <div className="mentoria-detail-content">
              <div className="mentoria-info">
                <div className="info-section">
                  <h4>Información de la Mentoría</h4>
                  <p><strong>Descripción:</strong> {expandedMentoria.description}</p>
                  <p><strong>Tipo:</strong> {expandedMentoria.type === 'exam' ? 'Examen' : expandedMentoria.type === 'project' ? 'Proyecto' : expandedMentoria.type === 'personal_doubt' ? 'Duda Personal' : 'Otro'}</p>
                  <p><strong>Fecha de solicitud:</strong> {expandedMentoria.createdDate}</p>
                </div>

                <div className="info-section">
                  <h4>Información de la Tarea</h4>
                  <p><strong>Descripción:</strong> {expandedMentoria.taskDescription}</p>
                  <p><strong>Fecha de entrega:</strong> {expandedMentoria.taskDueDate}</p>
                  <p><strong>Estado:</strong> {expandedMentoria.taskState}</p>
                </div>

                {expandedMentoria.mentorAssigned && (
                  <div className="info-section">
                    <h4>Mentor Asignado</h4>
                    <p><strong>Nombre:</strong> {expandedMentoria.mentorAssigned}</p>
                    <p><strong>Email:</strong> {expandedMentoria.mentorEmail}</p>
                  </div>
                )}
              </div>

              <div className="mentoria-messages">
                <h4>Conversación</h4>
                <div className="messages-container">
                  {!expandedMentoria.messages || expandedMentoria.messages.length === 0 ? (
                    <p className="no-messages">Sin mensajes aún. El mentor responderá pronto.</p>
                  ) : (
                    expandedMentoria.messages.map((msg) => (
                      <div key={msg.id} className={`message-item ${msg.author}`}>
                        <div className="message-author">
                          {msg.author === 'student' ? '👤 Tú' : '🎓 Mentor'}
                        </div>
                        <p className="message-text">{msg.text}</p>
                        <span className="message-date">{msg.createdAt}</span>
                      </div>
                    ))
                  )}
                </div>

                {expandedMentoria.status !== 'closed' && (
                  <div className="message-input-form">
                    <textarea
                      placeholder="Escribe un mensaje al mentor..."
                      value={mentoriaMessageText}
                      onChange={(e) => setMentoriaMessageText(e.target.value)}
                      rows={3}
                    />
                    <button onClick={handleSendMentoriaMessage} className="send-message-btn">
                      Enviar Mensaje
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENTORSHIP REQUEST FORM */}
      {mentoriaTaskId && (
        <div className="mentoria-overlay" onClick={() => setMentoriaTaskId(null)}>
          <div className="mentoria-form" onClick={(e) => e.stopPropagation()}>
            <div className="mentoria-header">
              <h3>Solicitar Mentoría</h3>
              <button
                className="mentoria-close"
                onClick={() => setMentoriaTaskId(null)}
              >
                ✕
              </button>
            </div>

            <div className="mentoria-content">
              <div className="form-group">
                <label>Matrícula</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={mentoriaFormData.matricula}
                  onChange={(e) =>
                    setMentoriaFormData((prev) => ({ ...prev, matricula: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={mentoriaFormData.fullName}
                  onChange={(e) =>
                    setMentoriaFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="juan@example.com"
                  value={mentoriaFormData.email}
                  onChange={(e) =>
                    setMentoriaFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Tipo de Consulta</label>
                <select
                  value={mentoriaFormData.type}
                  onChange={(e) =>
                    setMentoriaFormData((prev) => ({
                      ...prev,
                      type: e.target.value as 'exam' | 'project' | 'personal_doubt' | 'other',
                    }))
                  }
                >
                  <option value="exam">Examen</option>
                  <option value="project">Proyecto</option>
                  <option value="personal_doubt">Duda Personal</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  placeholder="Describe tu consulta o problema..."
                  value={mentoriaFormData.description}
                  onChange={(e) =>
                    setMentoriaFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <button
                className="submit-mentoria-btn"
                onClick={() => handleMentoriaSubmit(mentoriaTaskId)}
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
