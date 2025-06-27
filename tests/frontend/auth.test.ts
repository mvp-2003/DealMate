import { authApi } from '../../frontend/src/lib/auth';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = jest.fn();

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      expect(authApi.isAuthenticated()).toBe(true);
    });

    it('returns false when no token', () => {
      localStorageMock.getItem.mockReturnValue(null);
      expect(authApi.isAuthenticated()).toBe(false);
    });
  });

  describe('getUser', () => {
    it('makes authenticated request to backend', async () => {
      const mockUser = { sub: '123', name: 'Test User', email: 'test@example.com' };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await authApi.getUser('mock-token');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('returns null on error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await authApi.getUser('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('makeAuthenticatedRequest', () => {
    it('includes auth token in headers', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      (fetch as jest.Mock).mockResolvedValue({ ok: true });

      await authApi.makeAuthenticatedRequest('/api/test');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/test', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('throws error when no token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(authApi.makeAuthenticatedRequest('/api/test'))
        .rejects.toThrow('No auth token found');
    });
  });

  describe('logout', () => {
    it('clears token and redirects', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      authApi.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocation.href).toBe('http://localhost:8000/auth/logout');
    });
  });

  describe('URL getters', () => {
    it('returns correct login URL', () => {
      expect(authApi.getLoginUrl()).toBe('http://localhost:8000/auth/login');
    });

    it('returns correct signup URL', () => {
      expect(authApi.getSignupUrl()).toBe('http://localhost:8000/auth/signup');
    });

    it('returns correct logout URL', () => {
      expect(authApi.getLogoutUrl()).toBe('http://localhost:8000/auth/logout');
    });
  });
});