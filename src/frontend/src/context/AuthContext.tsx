import { createContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User, type AuthResponse } from '../api/auth';
import { getErrorMessage } from '../utils/error';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
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
    // Check integrity or sync if token is missing
    if (!token) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
  }, [token]);

  const setAuthData = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export hook directly here is usually fine if it's named use..., but if lint complains 
// we might need to separate or check config. 
// However, the standard pattern IS to have the hook in the context file.
// The error suggests that exporting a hook alongside a component (Provider) triggers the "Fast Refresh" warning
// because fast refresh can't handle non-component exports well if they change.
// Best practice: Move the Hook to a separate file OR keep it here but accept the warning (not ideal) OR move Provider to separate file?
// Actually, moving the hook to a separate file is cleaner.

