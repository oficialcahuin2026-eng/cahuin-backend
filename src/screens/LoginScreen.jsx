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
import * as WebBrowser from 'expo-web-browser';

import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/clerk-expo';

import CahuinModal from '../components/CahuinModal';
import CahuinLogo from '../components/CahuinLogo';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();

  // 🌟 Hooks de Clerk para OAuth
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const [cargandoSocial, setCargandoSocial] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const showModal = (title, message, accent = '#F0444F') => {
    setModalInfo({ title, message, emoji: '!', accent, tone: 'danger' });
  };

  const loginSocial = async (red) => {
    setCargandoSocial(red);
    try {
      const flow = red === 'Apple' ? startAppleOAuthFlow : startGoogleOAuthFlow;
      const { createdSessionId, setActive: setOAuthActive } = await flow({
        redirectUrl: Linking.createURL('/'),
      });

      if (createdSessionId) {
        // Activamos la sesión con Clerk
        await setOAuthActive({ session: createdSessionId });
      }
    } catch (error) {
      const isSessionExists = error.errors?.some(e => e.code === 'session_exists');
      if (!isSessionExists) {
        showModal(
          red, 
          error.errors?.[0]?.message || `No pudimos iniciar sesión con ${red}.`, 
          '#F0444F'
        );
      }
    } finally {
      setCargandoSocial(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <CahuinLogo 
              style={styles.brandRow} 
              size={54} 
              color={COLORS.textPrimary} 
            />
            <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
              Ingresa a tu cuenta para ver qué está pasando cerca tuyo.
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: isDarkMode ? '#FFFFFF' : '#F2F2F2', borderWidth: isDarkMode ? 0 : 1, borderColor: '#E5E7EB' }]}
              onPress={() => loginSocial('Google')}
              disabled={!!cargandoSocial}
              activeOpacity={0.8}
            >
              {cargandoSocial === 'Google' ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              )}
              <Text style={[styles.socialText, { color: '#111827' }]}>Continuar con Google</Text>
            </TouchableOpacity>

            {Platform.OS !== 'android' && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000', marginTop: 16 }]}
                onPress={() => loginSocial('Apple')}
                disabled={!!cargandoSocial}
                activeOpacity={0.8}
              >
                {cargandoSocial === 'Apple' ? (
                  <ActivityIndicator color={isDarkMode ? '#111827' : '#FFFFFF'} />
                ) : (
                  <Ionicons name="logo-apple" size={24} color={isDarkMode ? '#111827' : '#FFFFFF'} />
                )}
                <Text style={[styles.socialText, { color: isDarkMode ? '#111827' : '#FFFFFF' }]}>Continuar con Apple</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
             <Text style={[styles.footerText, { color: COLORS.textMuted }]}>
               Al continuar, aceptas nuestros{' '}
             </Text>
             <TouchableOpacity onPress={() => navigation.navigate('Terminos')}>
               <Text style={[styles.footerLink, { color: COLORS.primario }]}>Términos y Condiciones</Text>
             </TouchableOpacity>
          </View>
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  content: { 
    flex: 1, 
    paddingHorizontal: SPACING[6], 
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 40
  },
  heroSection: { 
    alignItems: 'center', 
    marginTop: 40 
  },
  brandRow: { 
    marginBottom: 24 
  },
  subtitle: { 
    fontSize: 17, 
    textAlign: 'center', 
    lineHeight: 26, 
    paddingHorizontal: 10 
  },
  buttonsContainer: { 
    width: '100%',
    marginTop: 60,
    marginBottom: 'auto'
  },
  socialButton: {
    height: 60,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    ...SHADOWS.medium,
  },
  socialText: { 
    fontSize: 18, 
    fontWeight: '800' 
  },
  footer: { 
    alignItems: 'center',
    marginTop: 20
  },
  footerText: { 
    fontSize: 13 
  },
  footerLink: { 
    fontSize: 13, 
    fontWeight: '800',
    marginTop: 4
  },
});
