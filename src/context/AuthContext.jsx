import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const sincronizarConBackend = async () => {
    try {
      if (isSignedIn && clerkUser) {
        
        const response = await api.post('/auth/sync-clerk', {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          nombre: clerkUser.fullName || clerkUser.firstName || 'Cahuinero',
          fotoUrl: clerkUser.imageUrl
        });

        const userData = response.data.usuario;
        const localToken = response.data.token; // 🌟 Capturamos el token del servidor

        setUsuario(userData);
        setToken(localToken);
        
        // 🌟 Lo guardamos con el nombre EXACTO que busca api.js (@cahuin_token)
        await AsyncStorage.setItem('@cahuin_token', localToken);
        await AsyncStorage.setItem('usuario', JSON.stringify(userData));
        
      } else {
        setUsuario(null);
        setToken(null);
        await AsyncStorage.removeItem('@cahuin_token');
        await AsyncStorage.removeItem('usuario');
      }
    } catch (error) {
      console.error("Error sincronizando con el backend:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      sincronizarConBackend();
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  const login = async (datos) => {
    return await sincronizarConBackend();
  };

  const register = async (datos) => {
    return await sincronizarConBackend();
  };

  const logout = async () => {
    try {
      setCargando(true);
      await clerkSignOut();
      setUsuario(null);
      setToken(null);
      await AsyncStorage.removeItem('@cahuin_token');
      await AsyncStorage.removeItem('usuario');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarUsuario = async (nuevosDatos) => {
    const actualizado = { ...usuario, ...nuevosDatos };
    setUsuario(actualizado);
    await AsyncStorage.setItem('usuario', JSON.stringify(actualizado));
  };

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, register, logout, actualizarUsuario, setCargando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);