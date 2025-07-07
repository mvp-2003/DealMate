'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/auth';

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (token) {
      localStorage.setItem('auth_token', token);
      router.push('/dashboard');
    } else if (error) {
      switch (error) {
        case 'authentication_failed':
          alert('Authentication failed. Please try again.');
          break;
        case 'missing_code':
          alert('Authentication error. Please try again.');
          break;
        default:
          alert('An error occurred during authentication.');
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [router]);

  const handleLoginWithConnection = (connection: string) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/auth/login`;
    const params = new URLSearchParams({ connection });
    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  const handleForgotPassword = () => {
    const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const returnTo = encodeURIComponent(window.location.origin + '/auth');
    
    if (auth0Domain && clientId) {
      // Redirect to Auth0 password reset page
      window.location.href = `https://${auth0Domain}/dbconnections/change_password?client_id=${clientId}&email=&connection=Username-Password-Authentication&response_type=code&redirect_uri=${returnTo}`;
    } else {
      console.error('Auth0 configuration is missing for password reset.');
      alert('Password reset is not configured. Please contact support.');
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.loginWithPassword(username, password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        alert(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleStandardLogin}>
      <p id="heading">Login</p>
      
      <div className="field">
        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"></path>
        </svg>
        <input 
          autoComplete="off" 
          placeholder="Username" 
          className="input-field" 
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>
      
      <div className="social-login">
        <button type="button" className="social-button google" onClick={() => handleLoginWithConnection('google-oauth2')}>
          <img src="/google-logo.svg" alt="Google" /> Login with Google
        </button>
        <button type="button" className="social-button microsoft" onClick={() => handleLoginWithConnection('windowslive')}>
          <img src="/microsoft-logo.svg" alt="Microsoft" /> Login with Microsoft
        </button>
      </div>
      <div className="auth-form-footer">
        <span>Don't have an <br /> account? <Link href="/auth?form=signup">Sign Up</Link></span>
        <button type="button" className="link-button" onClick={handleForgotPassword}>
          Forgot Password
        </button>
      </div>
    </form>
  );
}
