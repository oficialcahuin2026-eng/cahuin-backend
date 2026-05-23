import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

// Pantallas Públicas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Pantallas Privadas
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import PanoramasScreen from '../screens/PanoramasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import RecetasScreen from '../screens/RecetasScreen';

// Pantallas sueltas 
import PremiumScreen from '../screens/PremiumScreen';
import CuecaScreen from '../screens/CuecaScreen';
import SalaChatScreen from '../screens/SalaChatScreen'; 

// 👇 IMPORTAMOS LA PANTALLA NUEVA
import OnboardingScreen from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// 👇 EL NUEVO LABERINTO PARA LOS QUE ENTRAN CON GOOGLE
function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.tarjeta, borderTopWidth: 0, elevation: 10, height: 65, paddingBottom: 10, paddingTop: 10 },
        tabBarActiveTintColor: COLORS.primario,
        tabBarInactiveTintColor: COLORS.gris,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'Matches') iconName = focused ? 'flame' : 'flame-outline';
          else if (route.name === 'Panoramas') iconName = focused ? 'map-marker-star' : 'map-marker-outline';
          else if (route.name === 'Recetas') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          
          return (route.name === 'Panoramas') 
            ? <MaterialCommunityIcons name={iconName} size={30} color={color} />
            : <Ionicons name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Matches" component={HomeScreen} />
      <Tab.Screen name="Panoramas" component={PanoramasScreen} />
      <Tab.Screen name="Recetas" component={RecetasScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Cueca" component={CuecaScreen} />
      <Stack.Screen name="SalaChat" component={SalaChatScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.fondo }}>
        <ActivityIndicator size="large" color={COLORS.primario} />
      </View>
    );
  }

  // 🌟 AQUÍ OCURRE LA MAGIA DEL REDIRECCIONAMIENTO AUTOMÁTICO
  return (
    <NavigationContainer>
      {!usuario ? (
        <AuthNavigator />
      ) : usuario.region === 'Por definir' ? (
        <OnboardingNavigator /> // 👈 Si le falta la región, lo mandamos a la habitación de secuestro
      ) : (
        <MainNavigator /> // 👈 Si tiene todo listo, entra a la app normal
      )}
    </NavigationContainer>
  );
}