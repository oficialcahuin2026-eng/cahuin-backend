import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

// 🌟 Importaciones nuevas de Clerk (y Linking para el retorno)
import * as Linking from 'expo-linking';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';

import CahuinTextField from '../components/CahuinTextField';
import CahuinModal from '../components/CahuinModal';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

// Requisito de Clerk y Expo para que las ventanas de login externo funcionen
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  // 🌟 Hooks de Clerk para manejar la sesión
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoSocial, setCargandoSocial] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  // Calienta el navegador en segundo plano (Recomendado por Clerk para que abra más rápido en Android)
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const showModal = (title, message, accent = '#F0444F') => {
    setModalInfo({ title, message, emoji: '!', accent, tone: 'danger' });
  };

  const revisarOnboarding = (userData) => {
    const usuarioFinal = userData?.usuario || userData;
    if (
      !usuarioFinal?.fechaNacimiento ||
      !usuarioFinal?.telefono ||
      !usuarioFinal?.ciudad ||
      usuarioFinal?.ciudad === 'Por definir'
    ) {
      navigation.navigate('OnboardingScreen');
    }
  };

  const handleLogin = async () => {
    if (!isLoaded) return;
    
    if (!email.trim() || !password) {
      showModal('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      // 🌟 Iniciamos sesión con Clerk
      const completeSignIn = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (completeSignIn.status === 'complete') {
        // Guardamos la sesión activa en el celular
        await setActive({ session: completeSignIn.createdSessionId });
        
        // Pasamos un objeto vacío por ahora para forzar que los usuarios nuevos vayan al Onboarding.
        // Más adelante puedes reemplazar esto con los datos que traigas de tu MongoDB.
        revisarOnboarding({});
      }
    } catch (error) {
      // Clerk devuelve los errores en un array 'errors'
      showModal('Error', error.errors?.[0]?.message || 'Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const loginSocial = async (red) => {
    setCargandoSocial(red);
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startGoogleOAuthFlow({
        redirectUrl: Linking.createURL('/'),
      });

      if (createdSessionId) {
        // Activamos la sesión con Clerk
        await setOAuthActive({ session: createdSessionId });
        
        // Redirigimos al onboarding (igual que en el inicio de sesión por correo)
        revisarOnboarding({});
      }
    } catch (error) {
      showModal(
        red, 
        error.errors?.[0]?.message || `No pudimos iniciar sesión con ${red}.`, 
        '#F0444F'
      );
    } finally {
      setCargandoSocial(null);
    }
  };

  return (
    <LinearGradient colors={['#05070D', '#120B12', '#09070B']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.glow} />

          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Ionicons name="flame" size={32} color="#F0444F" />
              <Text style={styles.logo}>Cahuín</Text>
            </View>
            <Text style={styles.subtitle}>Ingresa a tu cuenta para ver qué está pasando cerca tuyo.</Text>
          </View>

          <View style={styles.form}>
            <Field
              icon="mail-outline"
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleLogin} disabled={cargando} style={styles.primaryButton}>
              <LinearGradient colors={['#FF5A3C', '#F71374']} style={styles.primaryGradient}>
                {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Iniciar sesión</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>o entra rápido con</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#FFF' }]}
              onPress={() => loginSocial('Google')}
              disabled={!!cargandoSocial}
            >
              {cargandoSocial === 'Google' ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Ionicons name="logo-google" size={22} color="#DB4437" />
              )}
              <Text style={[styles.socialText, { color: '#111827' }]}>Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <CahuinModal
          visible={!!modalInfo}
          title={modalInfo?.title}
          message={modalInfo?.message}
          emoji={modalInfo?.emoji}
          accent={modalInfo?.accent}
          tone={modalInfo?.tone}
          onClose={() => setModalInfo(null)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({ icon, ...props }) {
  return <CahuinTextField icon={icon} {...props} />;
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, padding: SPACING[5], justifyContent: 'center' },
  glow: {
    position: 'absolute',
    top: 40,
    left: -80,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(240,68,79,0.18)',
  },
  header: { alignItems: 'center', marginBottom: 34 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  logo: { fontSize: 38, fontWeight: '900', color: '#FFF', fontFamily: FONTS.display },
  subtitle: { fontSize: 15, color: '#8B95A7', textAlign: 'center', lineHeight: 22, paddingHorizontal: 18 },
  form: { gap: 14 },
  primaryButton: { marginTop: 8, borderRadius: 18, overflow: 'hidden', ...SHADOWS.medium },
  primaryGradient: { height: 58, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: '#8B95A7', fontSize: 13 },
  socialRow: { gap: 12 },
  socialButton: {
    height: 52,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    gap: 10,
  },
  socialText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 34 },
  footerText: { color: '#8B95A7', fontSize: 14 },
  footerLink: { color: '#F71374', fontSize: 14, fontWeight: '900' },
});