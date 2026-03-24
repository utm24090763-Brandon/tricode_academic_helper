'use client';

import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg transition-all duration-700 ease-out transform hover:-translate-y-1">
        <LoginForm
          onBackToHome={() => router.push('/')}
          onRegisterClick={() => router.push('/register')}
        />
      </div>
    </div>
  );
}