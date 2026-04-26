"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAccessToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check session on mount by trying to refresh the token using the HttpOnly cookie
    const checkSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data.data;
        setAccessToken(accessToken);
        
        // We don't get user info back from /refresh currently, but we know they are authenticated.
        // Ideally the backend would return user info on refresh, or we have a /auth/me endpoint.
        // As a workaround, we decode the JWT or just set user to a placeholder since the dashboard
        // will fetch expenses anyway. Better yet, we could parse the JWT for the ID.
        // For this assignment, we'll store user info in localStorage during login/register
        // and retrieve it here, or decode JWT. Let's retrieve from localStorage as a simple solution.
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no stored user, we at least mark them as authenticated
          setUser({ id: 'unknown', email: '', name: 'User' });
        }
      } catch {
        // Refresh failed (no cookie, or expired) -> unauthenticated
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for the custom unauthorized event from api.ts
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('user');
      router.push('/login?expired=true');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [router]);

  const login = async (credentials: Record<string, unknown>) => {
    const res = await api.post('/auth/login', credentials);
    const { accessToken, user: userData } = res.data.data;
    setAccessToken(accessToken);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    router.push('/');
  };

  const register = async (data: Record<string, unknown>) => {
    await api.post('/auth/register', data);
    // Redirect to login after successful registration
    router.push('/login');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout request failed', e);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
