import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api, tokenStore } from '../api/client';
import { AuthResponse, User } from '../types';

interface RegisterInput {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

interface UpdateProfileInput {
  fullName: string;
  mobile: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<string>;
  updateProfile: (input: UpdateProfileInput) => Promise<User>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('fh_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (tokenStore.access ? readStoredUser() : null));
  const [loading, setLoading] = useState<boolean>(Boolean(tokenStore.access));

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem('fh_user');
    setUser(null);
    window.location.assign('/login');
  }, []);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener('fh:logout', onLogout);
    return () => window.removeEventListener('fh:logout', onLogout);
  }, [logout]);

  useEffect(() => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get<User>('/auth/me')
      .then((res) => {
        if (!cancelled) {
          setUser(res.data);
          localStorage.setItem('fh_user', JSON.stringify(res.data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          tokenStore.clear();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    tokenStore.set(res.data.accessToken, res.data.refreshToken);
    localStorage.setItem('fh_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<{ message: string }>('/auth/register', input);
    return res.data.message;
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const res = await api.put<User>('/auth/profile', input);
    setUser(res.data);
    localStorage.setItem('fh_user', JSON.stringify(res.data));
    return res.data;
  }, []);

  const hasRole = useCallback(
    (role: string) => Boolean(user?.roles?.includes(role)),
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, updateProfile, logout, hasRole }),
    [user, loading, login, register, updateProfile, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
