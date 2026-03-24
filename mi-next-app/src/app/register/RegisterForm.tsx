'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import './css/form_register.css';

interface RegisterFormProps {
  logoSrc?: string;
  onBackToLogin?: () => void;
  onBackToHome?: () => void;
}

export default function RegisterForm({ 
  logoSrc = './img/logo.webp',
  onBackToLogin,
  onBackToHome
}: RegisterFormProps) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      // Tu lógica de registro aquí
      console.log({ correo, password });
      // Ejemplo: enviar a tu API
      // const res = await fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ correo, password })
      // });
      setMensaje('Registro exitoso');
    } catch (error) {
      console.error('Error al registrar:', error);
      setMensaje('Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        {/* HEADER */}
        <div className="header">
          <div className="textos">
            <h1 className="titulo">Registro TriCode Academic Help</h1>
            <span className="subtitulo">Crea tu cuenta</span>
          </div>
        </div>

        <div className="content">
          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="correo"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              name="confirm_password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {/* MENSAJE */}
            <div className="mensaje">
              {mensaje}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          {/* LINK */}
          <p className="link">
            ¿Ya tienes cuenta? 
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#00c6ff',
                cursor: 'pointer',
                marginLeft: '5px',
                textDecoration: 'none',
                fontWeight: 'bold',
                padding: 0,
              }}
            >
              Inicia sesión
            </button>
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
              color: '#00c6ff',
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
        </div>

        {/* FOOTER */}
        <div className="footer">© 2026 UTMA • Registro seguro</div>
      </div>
    </div>
  );
}
