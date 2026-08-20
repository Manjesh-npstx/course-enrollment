import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, setAuthToken, getAuthToken, setOnAuthError } from '../services/api';

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setAuthToken(null);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setOnAuthError(() => {
      localStorage.removeItem('auth_user');
      setUser(null);
    });
    return () => setOnAuthError(null);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setAuthToken(res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    setAuthToken(res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
