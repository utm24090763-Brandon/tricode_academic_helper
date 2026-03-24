'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import styles from "./page.module.css";
import Navbar from "./nabvar/nabvar";
import HeroSection from "./info_module/info_page";
import LoginForm from "./login/LoginForm";
import RegisterForm from "./register/RegisterForm";
import DashTeacher from "./dashes/dash_teacher/dash_teacher";
import DashStudent from "./dashes/dash_student/dash_student";
import DachMentor from "./dashes/dash_mentor/dash_mentor";

type ViewType = 'home' | 'login' | 'register' | 'teacher' | 'student' | 'mentor';

export default function Home() {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirigir automáticamente al dashboard correspondiente según el rol
      if (hasRole('teacher')) {
        router.push('/dashboard/teacher');
      } else if (hasRole('mentor')) {
        router.push('/dashboard/mentor');
      } else if (hasRole('student')) {
        router.push('/dashboard/student');
      }
    }
  }, [isAuthenticated, hasRole, loading, router]);

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <LoginForm onBackToHome={() => setCurrentView('home')} />;
      case 'register':
        return <RegisterForm onBackToHome={() => setCurrentView('home')} onBackToLogin={() => setCurrentView('login')} />;
      case 'teacher':
        return <DashTeacher />;
      case 'student':
        return <DashStudent />;
      case 'mentor':
        return <DachMentor />;
      default:
        return <HeroSection />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si está autenticado, mostrar loading mientras redirige
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirigiendo al dashboard...</div>
      </div>
    );
  }

  // Página de inicio para usuarios no autenticados
  return (
    <div className={styles.page}>
      <Navbar
        onDashboardClick={() => setCurrentView('teacher')}
        onStudentClick={() => setCurrentView('student')}
        onMentorClick={() => setCurrentView('mentor')}
        onLoginClick={() => setCurrentView('login')}
        onRegisterClick={() => setCurrentView('register')}
      />
      {renderContent()}
    </div>
  );
}
