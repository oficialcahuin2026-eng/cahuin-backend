import 'react-native-gesture-handler';
import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext'; 
import AppNavigator from './src/navigation/AppNavigator';
import WebShell from './src/web/WebShell';

// 1. Importar Clerk y el Almacenamiento Seguro de Expo
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// 2. Crear el "Caché de Tokens" para que la sesión se quede guardada en el celular
const tokenCache = {
  async getToken(key) {
    try {
      if (Platform.OS === 'web') {
        return AsyncStorage.getItem(key);
      }
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      if (Platform.OS === 'web') {
        return AsyncStorage.setItem(key, value);
      }
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// 3. Traer tu llave pública desde el archivo .env
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Falta la llave EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en el archivo .env');
}

export default function App() {
  return (
    // 4. Envolver toda la aplicación con ClerkProvider
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              {Platform.OS === 'web' ? <WebShell /> : <AppNavigator />}
              <StatusBar style="auto" />
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
