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
    return !!localStorage.getItem('auth_token');
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    window.location.href = this.getLogoutUrl();
  }
};