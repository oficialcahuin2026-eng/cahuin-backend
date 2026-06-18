import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, panoramaService, socialService, userService } from '../services/api';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TerminosScreen from '../screens/TerminosScreen';
import HistoriasExitoScreen from '../screens/HistoriasExitoScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import HomeScreen from '../screens/HomeScreen';
import ExplorarScreen from '../screens/ExplorarScreen';
import CategoriaExplorarScreen from '../screens/CategoriaExplorarScreen';
import ChatScreen from '../screens/ChatScreen';
import PanoramasScreen from '../screens/PanoramasScreen';
import CrearPanoramaScreen from '../screens/CrearPanoramaScreen';
import PerfilScreen from '../screens/PerfilScreen';
import CartasAnonimasScreen from '../screens/CartasAnonimasScreen';

import PremiumScreen from '../screens/PremiumScreen';
import LikesCahuinScreen from '../screens/LikesCahuinScreen';
import SalaChatScreen from '../screens/SalaChatScreen';
import OtroPerfilScreen from '../screens/OtroPerfilScreen';
import RompehieloScreen from '../screens/RompehieloScreen';
import TestCahuineroScreen from '../screens/TestCahuineroScreen';
import TrendingScreen from '../screens/TrendingScreen';
import TestApegoScreen from '../screens/TestApegoScreen';
import MapaValoresScreen from '../screens/MapaValoresScreen';
import MapaConexionesScreen from '../screens/MapaConexionesScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import AjustesScreen from '../screens/AjustesScreen';
import HistoriasCulturalesScreen from '../screens/HistoriasCulturalesScreen';
import CahuinDelDiaScreen from '../screens/CahuinDelDiaScreen';
import SwipePanoramasScreen from '../screens/SwipePanoramasScreen';
import MapaCalorScreen from '../screens/MapaCalorScreen';
import BotellasScreen from '../screens/BotellasScreen';
import ModoPatrioScreen from '../screens/ModoPatrioScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const navigationRef = createNavigationContainerRef();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Terminos" component={TerminosScreen} />
      <Stack.Screen name="HistoriasExito" component={HistoriasExitoScreen} />
      <Stack.Screen name="MapaConexiones" component={MapaConexionesScreen} />
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { COLORS, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 980;
  const { usuario } = useAuth();
  const [badges, setBadges] = useState({});

  const checkBadges = async () => {
    try {
      const [matchesRes, panoramasRes, cahuinRes] = await Promise.allSettled([
        matchService.getMisMatches(),
        panoramaService.listar({ region: usuario?.region }),
        socialService.getCahuinDia(),
      ]);
      const newBadges = { Chat: 0, Panoramas: 0, Explorar: 0 };
      if (matchesRes.status === 'fulfilled') newBadges.Chat = matchesRes.value.matches?.filter((m) => m.mensajesSinLeer > 0).length || 0;
      if (panoramasRes.status === 'fulfilled') newBadges.Panoramas = panoramasRes.value.panoramas?.length || 0;
      if (cahuinRes.status === 'fulfilled' && cahuinRes.value) newBadges.Explorar = 1;
      setBadges(newBadges);
    } catch (e) {
      console.log('Error badges:', e);
    }
  };

  useEffect(() => {
    checkBadges();
    const iv = setInterval(checkBadges, 60000);
    return () => clearInterval(iv);
  }, []);

  const TAB_ICONS = {
    Radar:     { active: 'flame',       inactive: 'flame-outline' },
    Explorar:  { active: 'compass',     inactive: 'compass-outline' },
    Panoramas: { active: 'planet',      inactive: 'planet-outline' },
    Chat:      { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
    Perfil:    { active: 'person',      inactive: 'person-outline' },
  };

  const TAB_LABELS = {
    Radar: 'Radar',
    Explorar: 'Explorar',
    Panoramas: 'Panoramas',
    Chat: 'Chat',
    Perfil: 'Perfil',
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: isDesktop ? { display: 'none' } : {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 14,
          height: 72,
          borderRadius: 28,
          backgroundColor: COLORS.tarjeta,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingTop: 0,
          paddingBottom: 0,
          shadowColor: '#101828',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 14,
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
          const label = TAB_LABELS[route.name] || route.name;
          const badgeCount = badges[route.name] || 0;

          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: focused ? 68 : 36,
              paddingHorizontal: focused ? 14 : 0,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: focused ? COLORS.primario : 'transparent',
            }}>
              <Ionicons
                name={focused ? icons.active : icons.inactive}
                size={focused ? 22 : 24}
                color={focused ? '#FFF' : COLORS.gris}
              />
              {focused && (
                <Text style={{
                  color: '#FFF',
                  fontSize: 10,
                  fontWeight: '800',
                  marginTop: 2,
                  letterSpacing: 0.3,
                }}>
                  {label}
                </Text>
              )}
              {badgeCount > 0 && <TabBadge count={badgeCount} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Radar" component={HomeScreen} />
      <Tab.Screen name="Explorar" component={ExplorarScreen} />
      <Tab.Screen name="Panoramas" component={PanoramasScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

function TabBadge({ count }) {
  const mostrarNumero = count > 1;
  return (
    <View style={[tabStyles.badge, mostrarNumero && tabStyles.badgeNumber]}>
      {mostrarNumero ? <Text style={tabStyles.badgeText}>{count > 9 ? '9+' : count}</Text> : null}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -3,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0444F',
    borderWidth: 1.5,
    borderColor: '#0B1020',
  },
  badgeNumber: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', lineHeight: 12 },
});

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Cartas" component={CartasAnonimasScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="LikesCahuin" component={LikesCahuinScreen} />
      <Stack.Screen name="SalaChat" component={SalaChatScreen} />
      <Stack.Screen name="OtroPerfil" component={OtroPerfilScreen} />
      <Stack.Screen name="Rompehielo" component={RompehieloScreen} />
      <Stack.Screen name="TestCahuinero" component={TestCahuineroScreen} />
      <Stack.Screen name="Trending" component={TrendingScreen} />
      <Stack.Screen name="CategoriaExplorar" component={CategoriaExplorarScreen} />
      <Stack.Screen name="TestApego" component={TestApegoScreen} />
      <Stack.Screen name="MapaValores" component={MapaValoresScreen} />
      <Stack.Screen name="HistoriasExito" component={HistoriasExitoScreen} />
      <Stack.Screen name="MapaConexiones" component={MapaConexionesScreen} />
      <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
      <Stack.Screen name="Ajustes" component={AjustesScreen} />
      <Stack.Screen name="HistoriasCulturales" component={HistoriasCulturalesScreen} />
      <Stack.Screen name="CahuinDelDia" component={CahuinDelDiaScreen} />
      <Stack.Screen name="SwipePanoramas" component={SwipePanoramasScreen} />
      <Stack.Screen name="MapaCalor" component={MapaCalorScreen} />
      <Stack.Screen name="Botellas" component={BotellasScreen} />
      <Stack.Screen name="ModoPatrio" component={ModoPatrioScreen} />
      <Stack.Screen name="CrearPanorama" component={CrearPanoramaScreen} />
    </Stack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  const noAutenticado = !usuario;
  const necesitaOnboarding = usuario && !usuario.fechaNacimiento;

  return (
    <NavigationContainer ref={navigationRef}>
      {noAutenticado ? (
        <AuthNavigator />
      ) : necesitaOnboarding ? (
        <OnboardingNavigator />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
}
