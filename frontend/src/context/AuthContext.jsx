import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('estetica_token');
    const storedUser = localStorage.getItem('estetica_user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Refrescar perfil desde backend
        api.getProfile()
          .then(res => {
            if (res.user) {
              const fullUser = {
                ...res.user,
                client_id: res.clientProfile ? res.clientProfile.id : null,
                clientProfile: res.clientProfile
              };
              setUser(fullUser);
              localStorage.setItem('estetica_user', JSON.stringify(fullUser));
            }
          })
          .catch(() => {
            // Token posiblemente expirado
          })
          .finally(() => setLoading(false));
      } catch (e) {
        localStorage.removeItem('estetica_token');
        localStorage.removeItem('estetica_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.mfaRequired) {
      return { mfaRequired: true, tempToken: res.tempToken };
    }
    if (res.success && res.token) {
      localStorage.setItem('estetica_token', res.token);
      localStorage.setItem('estetica_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || 'Credenciales incorrectas');
  };

  const confirmMFALogin = async (tempToken, code) => {
    const res = await api.verifyMFALogin({ tempToken, code });
    if (res.success && res.token) {
      localStorage.setItem('estetica_token', res.token);
      localStorage.setItem('estetica_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || 'Código de verificación incorrecto');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('estetica_token', res.token);
      localStorage.setItem('estetica_user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.error || 'Error en el registro');
  };

  const logout = () => {
    localStorage.removeItem('estetica_token');
    localStorage.removeItem('estetica_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getProfile();
      if (res.user) {
        const fullUser = {
          ...res.user,
          client_id: res.clientProfile ? res.clientProfile.id : null,
          clientProfile: res.clientProfile
        };
        setUser(fullUser);
        localStorage.setItem('estetica_user', JSON.stringify(fullUser));
      }
    } catch (e) {
      console.error('Error al refrescar usuario:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, confirmMFALogin, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
