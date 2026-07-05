import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    if (data.requires_2fa) {
      return { requires2fa: true };
    }
    setUser(data);
    return { requires2fa: false };
  };

  const verifyTwoFactor = async (code) => {
    const data = await api.post('/auth/verify-2fa', { code });
    setUser(data);
  };

  const logout = async () => {
    await api.post('/auth/logout', {});
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.get('/auth/me');
    setUser(data);
  };

  const hasPermission = (permission) =>
    !!user && (user.is_super_admin || user.permissions?.includes(permission));

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyTwoFactor, logout, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
