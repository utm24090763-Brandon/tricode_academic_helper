'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import './css/login.css';

interface LoginFormProps {
  logoSrc?: string;
  onRegisterClick?: () => void;
  onBackToHome?: () => void;
}

export default function LoginForm({ logoSrc = './img/logo.webp', onRegisterClick, onBackToHome }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const mensaje = searchParams?.get('msg') || null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !contrasena) {
      setError('Email y contraseña son obligatorios');
      setLoading(false);
      return;
    }

    try {
      const user = await login({ email, password: contrasena });

      if (user.roles.includes('teacher')) {
        router.push('/dashboard/teacher');
      } else if (user.roles.includes('mentor')) {
        router.push('/dashboard/mentor');
      } else if (user.roles.includes('student')) {
        router.push('/dashboard/student');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onRegisterClick) {
      onRegisterClick();
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* HEADER */}
        <div className="header">
          <img src={logoSrc} alt="TriCode logo" className="logo" style={{ width: 60, height: 60, marginBottom: 10 }} />
          <div className="textos">
            <h1 className="titulo">TriCode Academic Help</h1>
            <span className="subtitulo">Accede y comparte conocimiento</span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="formulario">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            name="contrasena"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          {error && <p className="mensaje error">{error}</p>}

          {/* MENSAJE */}
          {mensaje && <p className="mensaje">{mensaje}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* LINK */}
        <p className="link">
          ¿No tienes cuenta?{' '}
          <a href="/register" onClick={handleRegisterClick}>
            Regístrate aquí
          </a>
        </p>

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={onBackToHome}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            border: '1px solid rgba(0, 198, 255, 0.5)',
            background: 'transparent',
            color: 'var(--accent)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 198, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ← Volver al inicio
        </button>

        {/* FOOTER */}
        <div className="footer">© 2026 TriCode Academic Help • Acceso seguro</div>
      </div>
    </div>
  );
}
