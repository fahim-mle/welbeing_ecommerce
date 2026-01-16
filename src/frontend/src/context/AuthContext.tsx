import { useCallback, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthResponse, type User } from '../api/auth';
import { getErrorMessage } from '../utils/error';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token && refreshToken) {
      authApi
        .refreshToken(refreshToken)
        .then((data) => {
          setToken(data.token);
          setRefreshToken(data.refreshToken);
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          setRefreshToken(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        });
      return;
    }

    if (!token) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [token, refreshToken]);

  const setAuthData = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.refreshToken) {
      setRefreshToken(data.refreshToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setAuthData(data);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.register(email, password);
      setAuthData(data);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  };

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, login, register, logout, updateUser, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

