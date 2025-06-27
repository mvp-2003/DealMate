'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import './auth-styles.css';

export default function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);

  const handleToggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      {isLogin ? (
        <LoginForm 
          onSignUpClick={handleToggleForm}
        />
      ) : (
        <SignUpForm 
          onLoginClick={handleToggleForm}
        />
      )}
    </div>
  );
}