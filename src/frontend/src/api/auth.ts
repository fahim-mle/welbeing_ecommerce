import { API_BASE_URL } from '../config';

export interface User {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface ProfileResponse {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  isActive?: boolean;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }
    return res.json();
  },

  async fetchProfile(): Promise<ProfileResponse> {
    const res = await fetch(`${API_BASE_URL}/me`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to fetch profile');
    }
    const result = await res.json();
    return result.data;
  },

  async updateProfile(
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<ProfileResponse> {
    const res = await fetch(`${API_BASE_URL}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to update profile');
    }
    const result = await res.json();
    return result.data;
  },

  async changePassword(currentPassword: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/me/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to change password');
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Email verification failed');
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to send reset email');
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to reset password');
    }
  },

  async refreshToken(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to refresh token');
    }
    return res.json();
  },

  async fetchMe(): Promise<{ user: User } | null> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    if (res.status === 401 || res.status === 403) {
      return null;
    }
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Failed to fetch current session');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.message || 'Logout failed');
    }
  },
};
