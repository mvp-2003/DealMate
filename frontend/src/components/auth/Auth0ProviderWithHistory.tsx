'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export default function Auth0ProviderWithHistory({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;

  const onRedirectCallback = (appState: any) => {
    router.push(appState?.returnTo || window.location.pathname);
  };

  if (!domain || !clientId) {
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : '',
        audience: audience,
      }}
      onRedirectCallback={onRedirectCallback}
      skipRedirectCallback={true}
    >
      {children}
    </Auth0Provider>
  );
}
