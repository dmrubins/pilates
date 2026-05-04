import { useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth.js';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('tt_token'));

  const login = useCallback(async (password) => {
    await apiLogin(password);
    setToken(localStorage.getItem('tt_token'));
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setToken(null);
  }, []);

  return { isAuthenticated: !!token, login, logout };
}
