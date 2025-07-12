'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth0 } from '@auth0/auth0-react';

export default function SignUpForm() {
  const { loginWithRedirect } = useAuth0();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
        login_hint: email,
      },
    });
  };

  return (
    <form className="auth-form" onSubmit={handleSignUp}>
      <p id="heading">Sign Up</p>
      
      <div className="field">
        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.585.442 1.37.442 1.956 0L14.924 5.325c.025-.012.05-.023.076-.032V4.5A1.5 1.5 0 0 0 13.5 3h-11zM15 6.954l-5.934 4.45c-1.06.795-2.442.795-3.502 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954z"/>
        </svg>
        <input 
          autoComplete="off" 
          placeholder="Email" 
          className="input-field" 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      
      <div className="field">
        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
        </svg>
        <input 
          placeholder="Password" 
          className="input-field" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <div className="btn">
        <button type="submit" className="button1" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </div>

      <div className="social-login">
        <button
          type="button"
          className="social-button google"
          onClick={() => loginWithRedirect({ authorizationParams: { connection: 'google-oauth2', screen_hint: 'signup' } })}
        >
          <img src="/google-logo.svg" alt="Google" /> Sign Up with Google
        </button>
        <button
          type="button"
          className="social-button microsoft"
          onClick={() => loginWithRedirect({ authorizationParams: { connection: 'windowslive', screen_hint: 'signup' } })}
        >
          <img src="/microsoft-logo.svg" alt="Microsoft" /> Sign Up with Microsoft
        </button>
      </div>
      <div className="auth-form-footer">
        <span>Already have an <br /> account? <Link href="/auth">Login</Link></span>
      </div>
    </form>
  );
}
