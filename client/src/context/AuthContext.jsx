import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('veriface_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('veriface_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('veriface_token'));
  const [loading, setLoading] = useState(true);

  // Validate stored session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('veriface_token');
      if (storedToken) {
        try {
          const res = await api.get('/api/auth/me');
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('veriface_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('veriface_token', res.token);
    localStorage.setItem('veriface_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (data) => {
    const res = await api.post('/api/auth/signup', data);
    localStorage.setItem('veriface_token', res.token);
    localStorage.setItem('veriface_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('veriface_token');
    localStorage.removeItem('veriface_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAdmin: user?.role === 'admin',
    isDean: user?.role === 'dean',
    isEmployee: user?.role === 'employee',
    isStudent: user?.role === 'student',
    isAuthenticated: Boolean(user && token),
    login,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
