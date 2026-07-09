import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { api, userService } from '../services/api';
import { usePushNotifications } from '../hooks/usePushNotifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  const { isSignedIn, isLoaded, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { expoPushToken } = usePushNotifications();

  // Cargar caché inicial ultra rápido (Offline-first)
  useEffect(() => {
    const loadCache = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('usuario');
        const cachedToken = await AsyncStorage.getItem('@cahuin_token');
        if (cachedUser && cachedToken) {
          setUsuario(JSON.parse(cachedUser));
          setToken(cachedToken);
          setCargando(false); // Quitar pantalla de carga inmediatamente si hay datos locales
        }
      } catch (e) {
        console.log('Error leyendo cache auth', e);
      }
    };
    loadCache();
  }, []);

  const sincronizarConBackend = async () => {
    try {
      if (isSignedIn && clerkUser) {
        
        const response = await api.post('/auth/sync-clerk', {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          nombre: clerkUser.fullName || clerkUser.firstName || 'Cahuinero',
          fotoUrl: clerkUser.imageUrl
        });

        const userData = response.usuario;
        const localToken = response.token; 

        if (!userData || !localToken) {
          throw new Error('El backend no devolvio usuario/token al sincronizar Clerk.');
        }

        setUsuario(userData);
        setToken(localToken);
        
        await AsyncStorage.setItem('@cahuin_token', localToken);
        await AsyncStorage.setItem('usuario', JSON.stringify(userData));

        if (expoPushToken) {
          try {
            await api.put('/users/me', { pushToken: expoPushToken }, { headers: { Authorization: `Bearer ${localToken}` } });
          } catch (e) {
            console.warn('Error enviando push token al backend:', e);
          }
        }
        
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
      // Sincronizar en el fondo, los datos cacheados ya se mostraron
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
