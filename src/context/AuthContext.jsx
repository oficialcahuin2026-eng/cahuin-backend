import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario,  setUsuario]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('@cahuin_token');
        if (token) {
          const data = await userService.getMiPerfil();
          if (data.usuario) setUsuario(data.usuario);
        }
      } catch {
        await AsyncStorage.removeItem('@cahuin_token');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    await AsyncStorage.setItem('@cahuin_token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  const loginGoogle = async (idToken) => {
    const data = await authService.loginGoogle(idToken);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    setUsuario(data.usuario);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@cahuin_token');
    setUsuario(null);
  };

  const actualizarUsuario = (updates) =>
    setUsuario(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, loginGoogle, register, logout, actualizarUsuario,
      esPremium: usuario?.esPremium || false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};