'use client';

import { useAuth0 } from '@auth0/auth0-react';

export default function UserProfile() {
  const { user, logout, isLoading } = useAuth0();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
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
