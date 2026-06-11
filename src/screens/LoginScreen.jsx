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
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { useAuth } from '../context/AuthContext';
import CahuinTextField from '../components/CahuinTextField';
import CahuinModal from '../components/CahuinModal';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';
const GOOGLE_CLIENT_FALLBACK = 'missing-google-client-id.apps.googleusercontent.com';
const FACEBOOK_CLIENT_FALLBACK = '000000000000000';

export default function LoginScreen({ navigation }) {
  const { login, loginGoogle, loginFacebook } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoSocial, setCargandoSocial] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_CLIENT_FALLBACK,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_FALLBACK,
    webClientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_CLIENT_FALLBACK,
    selectAccount: true,
  });

  const [, facebookResponse, promptFacebook] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID || FACEBOOK_CLIENT_FALLBACK,
  });

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

  useEffect(() => {
    const idToken = googleResponse?.params?.id_token || googleResponse?.authentication?.idToken;
    if (googleResponse?.type !== 'success' || !idToken) return;

    (async () => {
      setCargandoSocial('Google');
      try {
        const data = await loginGoogle(idToken);
        revisarOnboarding(data);
      } catch (error) {
        showModal('Google', error.message || 'No pudimos iniciar sesión con Google.');
      } finally {
        setCargandoSocial(null);
      }
    })();
  }, [googleResponse]);

  useEffect(() => {
    const accessToken = facebookResponse?.authentication?.accessToken || facebookResponse?.params?.access_token;
    if (facebookResponse?.type !== 'success' || !accessToken) return;

    (async () => {
      setCargandoSocial('Facebook');
      try {
        const data = await loginFacebook(accessToken);
        revisarOnboarding(data);
      } catch (error) {
        showModal('Facebook', error.message || 'No pudimos iniciar sesión con Facebook.', '#1877F2');
      } finally {
        setCargandoSocial(null);
      }
    })();
  }, [facebookResponse]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showModal('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const userData = await login({ email: email.trim().toLowerCase(), password });
      revisarOnboarding(userData);
    } catch (error) {
      showModal('Error', error.message || 'Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const loginSocial = async (red) => {
    if (red === 'Google') {
      if (!GOOGLE_ANDROID_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_WEB_CLIENT_ID) {
        showModal('Google', 'Falta configurar los client IDs de Google antes de publicar.');
        return;
      }
      await promptGoogle();
      return;
    }

    if (!FACEBOOK_APP_ID) {
      showModal('Facebook', 'Falta configurar el App ID de Facebook antes de publicar.', '#1877F2');
      return;
    }
    await promptFacebook();
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

            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
              onPress={() => loginSocial('Facebook')}
              disabled={!!cargandoSocial}
            >
              {cargandoSocial === 'Facebook' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Ionicons name="logo-facebook" size={22} color="#FFF" />
              )}
              <Text style={styles.socialText}>Facebook</Text>
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
    justifyContent: 'center',
    gap: 10,
  },
  socialText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 34 },
  footerText: { color: '#8B95A7', fontSize: 14 },
  footerLink: { color: '#F71374', fontSize: 14, fontWeight: '900' },
});
