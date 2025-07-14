'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isFeatureEnabled } from '@/lib/feature-toggles-client';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const loginEnabled = await isFeatureEnabled('Login');
        console.log('Login enabled:', loginEnabled);
        
        if (!loginEnabled) {
          console.log('Login disabled, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        
        const token = localStorage.getItem('auth_token');
        if (token) {
          router.push('/dashboard');
        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Error checking feature toggles:', error);
        router.push('/auth');
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">DealPal</h1>
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
}