import { useCallback, useState, useEffect, useRef, type ReactNode } from 'react';
import { authApi, type AuthResponse, type User } from '../api/auth';
import { getErrorMessage } from '../utils/error';
import { AuthContext } from './AuthContextDefinition';

const loadStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authVersionRef = useRef(0);

  // On mount, verify the cookie session is still valid
  useEffect(() => {
    let cancelled = false;
    const requestVersion = authVersionRef.current;

    authApi.fetchMe()
      .then((result) => {
        if (cancelled || requestVersion !== authVersionRef.current) return;
        if (result?.user) {
          setUser(result.user);
          localStorage.setItem('user', JSON.stringify(result.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled || requestVersion !== authVersionRef.current) return;
        // On network/server error, keep the stored user (optimistic)
        // but mark loading as done so the UI isn't stuck
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const setAuthUser = (data: AuthResponse) => {
    authVersionRef.current += 1;
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(email, password);
      setAuthUser(data);
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
      setAuthUser(data);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    authVersionRef.current += 1;
    try {
      await authApi.logout();
    } catch {
      // Clear local state even if the server call fails
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout, updateUser, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

