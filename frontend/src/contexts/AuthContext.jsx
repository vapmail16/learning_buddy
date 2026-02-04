import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  const setToken = useCallback((t) => {
    if (t) {
      localStorage.setItem('token', t);
      setTokenState(t);
    } else {
      localStorage.removeItem('token');
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, [setToken]);

  const register = useCallback(async (email, password) => {
    await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = { token, user, login, register, logout, setToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
