'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthLoader } from '@/components/ui/animated-loader';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      // Exchange the authorization code for a token
      fetch(`/api/auth/callback?code=${code}&state=${state}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Failed to exchange code for token');
        })
        .then((data) => {
          localStorage.setItem('auth_token', data.access_token);
          router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Authentication error:', error);
          router.push('/auth?error=authentication_failed');
        });
    } else {
      // Handle cases where the code is not present
      router.push('/auth?error=missing_code');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <AuthLoader size="lg" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <AuthLoader size="lg" />
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}
