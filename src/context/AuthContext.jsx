import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, userService } from '../services/api';
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

function AuthProviderInner({ children }) {
  const { setRegion } = useTheme();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const setUsuarioConRegion = (u) => {
    setUsuario(u);
    if (u?.region) setRegion(u.region);
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('@cahuin_token');
        if (token) {
          const data = await userService.getMiPerfil();
          if (data.usuario) {
            setUsuarioConRegion(data.usuario);
          } else {
            await AsyncStorage.removeItem('@cahuin_token');
          }
        }
      } catch {
        await AsyncStorage.removeItem('@cahuin_token');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const login = async (emailOrCredenciales, password) => {
    const credenciales = typeof emailOrCredenciales === 'object'
      ? emailOrCredenciales
      : { email: emailOrCredenciales, password };
    const data = await authService.login(credenciales);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    const perfilCompleto = await userService.getMiPerfil();
    setUsuarioConRegion(perfilCompleto.usuario);
    return data;
  };

  const loginGoogle = async (idToken) => {
    const data = await authService.loginGoogle(idToken);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    const perfilCompleto = await userService.getMiPerfil();
    setUsuarioConRegion(perfilCompleto.usuario);
    return data;
  };

  const loginFacebook = async (accessToken) => {
    const data = await authService.loginFacebook(accessToken);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    const perfilCompleto = await userService.getMiPerfil();
    setUsuarioConRegion(perfilCompleto.usuario);
    return data;
  };

  const loginTelefono = async (telefono) => {
    const data = await authService.loginTelefono(telefono);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    const perfilCompleto = await userService.getMiPerfil();
    setUsuarioConRegion(perfilCompleto.usuario);
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    await AsyncStorage.setItem('@cahuin_token', data.token);
    const perfilCompleto = await userService.getMiPerfil();
    setUsuarioConRegion(perfilCompleto.usuario);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@cahuin_token');
    setUsuario(null);
    setRegion('default');
  };

  const actualizarUsuario = (updates) => {
    const nuevo = updates._id ? updates : { ...usuario, ...updates };
    setUsuarioConRegion(nuevo);
  };

  return (
    <AuthContext.Provider value={{
      usuario, cargando, login, loginGoogle, loginFacebook, loginTelefono, register, logout, actualizarUsuario,
      esPremium: usuario?.isPremium || (usuario?.premiumHasta && new Date(usuario.premiumHasta) > new Date()),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
