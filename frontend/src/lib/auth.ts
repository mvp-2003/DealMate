const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export const authApi = {
  async getUser(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  },

  async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
    // Only run on client-side
    if (typeof window === 'undefined') {
      throw new Error('Client-side only function');
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No auth token found');
    }

    return fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  async loginWithPassword(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Only run on client-side
      if (typeof window === 'undefined') {
        return { success: false, error: 'Client-side only function' };
      }
      
      const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
      const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
      
      if (!auth0Domain || !clientId) {
        return { success: false, error: 'Auth0 configuration missing' };
      }

      const response = await fetch(`https://${auth0Domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          username,
          password,
          client_id: clientId,
          audience,
          scope: 'openid profile email'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.access_token);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error_description || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  },

  async signUpWithPassword(email: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Only run on client-side
      if (typeof window === 'undefined') {
        return { success: false, error: 'Client-side only function' };
      }
      
      const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
      const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
      
      if (!auth0Domain || !clientId) {
        return { success: false, error: 'Auth0 configuration missing' };
      }

      const response = await fetch(`https://${auth0Domain}/dbconnections/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          connection: 'Username-Password-Authentication',
          email,
          username,
          password,
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.description || 'Sign up failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  },

  getLoginUrl(): string {
    return `${BACKEND_URL}/auth/login`;
  },

  getSignupUrl(): string {
    return `${BACKEND_URL}/auth/signup`;
  },

  getLogoutUrl(): string {
    return `${BACKEND_URL}/auth/logout`;
  },

  isAuthenticated(): boolean {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem('auth_token');
  },

  logout(): void {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem('auth_token');
    window.location.href = this.getLogoutUrl();
  }
};