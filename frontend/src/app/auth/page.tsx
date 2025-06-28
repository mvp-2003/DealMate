import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer />
    </Suspense>
  );
}
