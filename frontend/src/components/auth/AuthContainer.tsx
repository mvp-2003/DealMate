'use client';

import { useSearchParams } from 'next/navigation';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import './auth-styles.css';

export default function AuthContainer() {
  const searchParams = useSearchParams();
  const isLogin = searchParams.get('form') !== 'signup';

  return (
    <div className="auth-container">
      {isLogin ? <LoginForm /> : <SignUpForm />}
    </div>
  );
}
