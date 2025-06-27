'use client';

import { useState, useEffect } from 'react';
import { authApi, User } from '@/lib/auth';

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await authApi.getUser(token);
        if (userData) {
          setUser(userData);
        } else {
          // Fallback to JWT decode if API fails
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
              sub: payload.sub,
              name: payload.name || payload.email || 'User',
              picture: payload.picture,
              email: payload.email
            });
          } catch (e) {
            console.error('Invalid token');
          }
        }
      }
      setIsLoading(false);
    };
    
    loadUser();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  const handleLogout = () => {
    authApi.logout();
  };

  return (
    <div className="flex items-center gap-3">
      {user.picture && (
        <img 
          src={user.picture} 
          alt={user.name || 'User'} 
          className="w-8 h-8 rounded-full"
        />
      )}
      <span className="text-white">{user.name}</span>
      <button 
        onClick={handleLogout}
        className="text-red-400 hover:text-red-300 text-sm"
      >
        Logout
      </button>
    </div>
  );
}