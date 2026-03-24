"use client";

import { useState, useEffect } from "react";
import "./css/mentor.css";

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

export default function DachMentor() {
  const [tickets, setTickets] = useState<MentoriaTicket[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<MentoriaTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [messageText, setMessageText] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [showMentorForm, setShowMentorForm] = useState(!mentorName);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cargar información del mentor
    const savedMentorName = localStorage.getItem('triCode_mentor_name');
    const savedMentorEmail = localStorage.getItem('triCode_mentor_email');
    if (savedMentorName) setMentorName(savedMentorName);
    if (savedMentorEmail) setMentorEmail(savedMentorEmail);
    if (savedMentorName && savedMentorEmail) setShowMentorForm(false);

    const loadTickets = () => {
      try {
        const raw = window.localStorage.getItem('triCode_mentor_tickets');
        if (raw) {
          const parsed = JSON.parse(raw) as MentoriaTicket[];
          setTickets(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        setTickets([]);
      }
    };

    loadTickets();

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'triCode_mentor_tickets') {
        loadTickets();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const handleStatusChange = (ticketId: number, newStatus: MentoriaTicket['status']) => {
    const updatedTickets = tickets.map((t) =>
      t.id === ticketId ? { ...t, status: newStatus } : t
    );
    setTickets(updatedTickets);
    window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updatedTickets));

    if (expandedTicket?.id === ticketId) {
      setExpandedTicket({ ...expandedTicket, status: newStatus });
    }
  };

  const handleAssignMentoria = (ticketId: number) => {
    if (!mentorName || !mentorEmail) {
      setShowMentorForm(true);
      return;
    }

    const updatedTickets = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            mentorAssigned: mentorName,
            mentorEmail: mentorEmail,
            status: 'in_progress' as const,
          }
        : t
    );
    setTickets(updatedTickets);
    window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updatedTickets));

    if (expandedTicket?.id === ticketId) {
      setExpandedTicket({
        ...expandedTicket,
        mentorAssigned: mentorName,
        mentorEmail: mentorEmail,
        status: 'in_progress',
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !expandedTicket) return;

    const newMessage: Message = {
      id: Date.now(),
      author: 'mentor',
      text: messageText,
      createdAt: new Date().toISOString().split('T')[0],
      read: false, // No leído para el estudiante
    };

    const updatedTickets = tickets.map((t) =>
      t.id === expandedTicket.id
        ? { ...t, messages: [...(t.messages || []), newMessage] }
        : t
    );

    setTickets(updatedTickets);
    setExpandedTicket({
      ...expandedTicket,
      messages: [...(expandedTicket.messages || []), newMessage],
    });

    window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updatedTickets));
    setMessageText('');
  };

  // Marcar mensajes como leídos cuando se abre una mentoría
  const handleOpenMentoria = (ticket: MentoriaTicket) => {
    const updatedTickets = tickets.map((t) =>
      t.id === ticket.id
        ? {
            ...t,
            messages: (t.messages || []).map((m) =>
              m.author === 'student' ? { ...m, read: true } : m
            ),
          }
        : t
    );
    setTickets(updatedTickets);
    window.localStorage.setItem('triCode_mentor_tickets', JSON.stringify(updatedTickets));
    setExpandedTicket(updatedTickets.find((t) => t.id === ticket.id) || ticket);
  };

  const countUnreadMessages = (ticket: MentoriaTicket) => {
    return (ticket.messages || []).filter((m) => m.author === 'student' && !m.read).length;
  };

  const filteredTickets = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  };

  const getTypeLabel = (type: MentoriaTicket['type']) => {
    switch (type) {
      case 'exam':
        return 'Examen';
      case 'project':
        return 'Proyecto';
      case 'personal_doubt':
        return 'Duda Personal';
      default:
        return 'Otro';
    }
  };

  return (
    <div className="mentor-dashboard">
      {/* HEADER */}
      <div className="mentor-header">
        <h1>Dashboard de Mentoría</h1>
        <p className="mentor-subtitle">Solicitudes de estudiantes para mentoría</p>
      </div>

      {/* STATS */}
      <div className="mentor-stats">
        <div className="stat-card total">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card open">
          <span className="stat-number">{stats.open}</span>
          <span className="stat-label">Abiertos</span>
        </div>
        <div className="stat-card in-progress">
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">En Progreso</span>
        </div>
        <div className="stat-card resolved">
          <span className="stat-number">{stats.resolved}</span>
          <span className="stat-label">Resueltos</span>
        </div>
        <div className="stat-card closed">
          <span className="stat-number">{stats.closed}</span>
          <span className="stat-label">Cerrados</span>
        </div>
      </div>

      {/* FILTER */}
      <div className="mentor-filter">
        <label>Filtrar por estado:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">Todos</option>
          <option value="open">Abiertos</option>
          <option value="in_progress">En Progreso</option>
          <option value="resolved">Resueltos</option>
          <option value="closed">Cerrados</option>
        </select>
      </div>

      {/* TICKETS LIST */}
      <div className="mentor-tickets">
        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <p>
              {tickets.length === 0
                ? 'No hay solicitudes de mentoría aún. Los estudiantes pueden solicitar mentoría desde el dashboard.'
                : 'No hay solicitudes con el estado seleccionado.'}
            </p>
          </div>
        ) : (
          <div className="tickets-grid">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`ticket-card ${ticket.status} ${countUnreadMessages(ticket) > 0 ? 'has-unread' : ''}`}
                onClick={() => handleOpenMentoria(ticket)}
              >
                <div className="ticket-header">
                  <h3>{ticket.taskTitle}</h3>
                  <span className={`status-badge ${ticket.status}`}>{ticket.status}</span>
                </div>
                <p className="ticket-student">{ticket.fullName}</p>
                <p className="ticket-type">{getTypeLabel(ticket.type)}</p>
                <div className="ticket-footer">
                  <span className="ticket-date">{ticket.createdDate}</span>
                </div>
                {countUnreadMessages(ticket) > 0 && (
                  <div className="notification-badge">{countUnreadMessages(ticket)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPANDED TICKET MODAL */}
      {expandedTicket && (
        <div className="ticket-overlay" onClick={() => setExpandedTicket(null)}>
          <div className="ticket-modal large" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <h2>{expandedTicket.taskTitle}</h2>
              <button className="close-btn" onClick={() => setExpandedTicket(null)}>
                ✕
              </button>
            </div>

            <div className="ticket-modal-content">
              <div className="modal-grid">
                {/* LEFT SIDE - INFO */}
                <div className="modal-left">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Estudiante</label>
                      <p>{expandedTicket.fullName}</p>
                    </div>
                    <div className="info-item">
                      <label>Matrícula</label>
                      <p>{expandedTicket.matricula}</p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{expandedTicket.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Tipo</label>
                      <p>{getTypeLabel(expandedTicket.type)}</p>
                    </div>
                    <div className="info-item">
                      <label>Tarea</label>
                      <p>{expandedTicket.taskTitle}</p>
                    </div>
                    <div className="info-item">
                      <label>Fecha de Solicitud</label>
                      <p>{expandedTicket.createdDate}</p>
                    </div>
                    <div className="info-item full-width">
                      <label>Descripción de la Consulta</label>
                      <p className="description">{expandedTicket.description}</p>
                    </div>
                    <div className="info-item full-width">
                      <label>Información de la Tarea Vinculada</label>
                      <div className="task-info-popup">
                        <p><strong>Descripción:</strong> {expandedTicket.taskDescription}</p>
                        <p><strong>Fecha de Entrega:</strong> {expandedTicket.taskDueDate}</p>
                        <p><strong>Estado:</strong> {expandedTicket.taskState}</p>
                      </div>
                    </div>

                    {/* ASSIGNMENT SECTION */}
                    <div className="info-item full-width">
                      <label>Asignar Mentoría</label>
                      {expandedTicket.mentorAssigned ? (
                        <div className="mentor-assigned-info">
                          <p className="assigned-text">✓ Asignado a: <strong>{expandedTicket.mentorAssigned}</strong></p>
                          <p className="assigned-email">{expandedTicket.mentorEmail}</p>
                        </div>
                      ) : (
                        <button
                          className="assign-mentoria-btn"
                          onClick={() => handleAssignMentoria(expandedTicket.id)}
                        >
                          📌 Asignarme esta Mentoría
                        </button>
                      )}
                    </div>

                    {/* STATUS */}
                    <div className="info-item full-width">
                      <label>Estado</label>
                      <select
                        value={expandedTicket.status}
                        onChange={(e) => handleStatusChange(expandedTicket.id, e.target.value as MentoriaTicket['status'])}
                        className="status-select"
                      >
                        <option value="open">Abierto</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE - MESSAGES */}
                <div className="modal-right">
                  <div className="messages-section">
                    <h3>Conversación</h3>
                    <div className="messages-container">
                      {!expandedTicket.messages || expandedTicket.messages.length === 0 ? (
                        <p className="no-messages">Sin mensajes aún. Comienza a comunicarte con el estudiante.</p>
                      ) : (
                        expandedTicket.messages.map((msg) => (
                          <div key={msg.id} className={`message-item ${msg.author}`}>
                            <div className="message-header">
                              <span className="message-author">
                                {msg.author === 'student' ? '👤 Estudiante' : '🎓 Tú'}
                              </span>
                              <span className="message-date">{msg.createdAt}</span>
                            </div>
                            <p className="message-text">{msg.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {expandedTicket.status !== 'closed' && (
                      <div className="message-input-form">
                        <textarea
                          placeholder="Escribe un mensaje al estudiante..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={3}
                        />
                        <button onClick={handleSendMessage} className="send-message-btn">
                          Enviar Mensaje
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENTOR INFO FORM */}
      {showMentorForm && (
        <div className="ticket-overlay" onClick={() => setShowMentorForm(false)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <h2>Completa tu Información</h2>
              <button className="close-btn" onClick={() => setShowMentorForm(false)}>
                ✕
              </button>
            </div>
            <div className="ticket-modal-content">
              <p style={{ marginBottom: '1rem', color: '#637895' }}>
                Esta información se mostrará a los estudiantes cuando asignes una mentoría.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      border: '1px solid #d0d8e4',
                      borderRadius: '0.4rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      border: '1px solid #d0d8e4',
                      borderRadius: '0.4rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (mentorName && mentorEmail) {
                      localStorage.setItem('triCode_mentor_name', mentorName);
                      localStorage.setItem('triCode_mentor_email', mentorEmail);
                      setShowMentorForm(false);
                    }
                  }}
                  style={{
                    padding: '0.8rem 1.5rem',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.4rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Guardar Información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
