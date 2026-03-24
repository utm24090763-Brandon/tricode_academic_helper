'use client';

import { useState } from 'react';
import LoginForm from '../login/LoginForm';
import RegisterForm from '../register/RegisterForm';

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <>
      {showLogin && (
        <LoginForm 
          logoSrc="./img/logo.webp"
          onRegisterClick={() => setShowLogin(false)}
        />
      )}
      
      {!showLogin && (
        <RegisterForm 
          logoSrc="./img/logo.webp"
          onBackToLogin={() => setShowLogin(true)}
        />
      )}
    </>
  );
}
