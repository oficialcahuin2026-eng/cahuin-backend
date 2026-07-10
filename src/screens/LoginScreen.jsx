import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';

import CahuinModal from '../components/CahuinModal';
import CahuinLogo from '../components/CahuinLogo';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const FRASES = [
  "Descubre qué está pasando cerca tuyo.",
  "Conoce gente que vibra igual que tú.",
  "Haz match, únete a los mejores panoramas.",
  "Bienvenidos al verdadero Cahuín."
];

export default function LoginScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();

  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const [cargandoSocial, setCargandoSocial] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);
  const [fraseIndex, setFraseIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    
    // Animación de entrada del Logo
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 10,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Rotación del Carrusel
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFraseIndex((prev) => (prev + 1) % FRASES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3500);

    return () => {
      void WebBrowser.coolDownAsync();
      clearInterval(interval);
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
    <View style={styles.mainWrapper}>
      {/* 🌟 Fondo Degradado Premium */}
      <LinearGradient 
        colors={isDarkMode ? ['#050505', '#1a0512', '#330818'] : ['#FFF', '#FFF0F3', '#FFE4E9']} 
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* 🌟 Círculo de luz ambiental decorativo */}
      <View style={[styles.glowCircle, { backgroundColor: isDarkMode ? 'rgba(240, 68, 79, 0.15)' : 'rgba(240, 68, 79, 0.08)' }]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.content}>
            
            <View style={styles.heroSection}>
              <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity }}>
                <CahuinLogo size={68} color={COLORS.textPrimary} />
              </Animated.View>
              
              <View style={styles.carouselContainer}>
                <Animated.Text style={[styles.subtitle, { opacity: fadeAnim, color: COLORS.textMuted }]}>
                  {FRASES[fraseIndex]}
                </Animated.Text>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#FFFFFF', borderWidth: isDarkMode ? 1 : 0, borderColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={() => loginSocial('Google')}
                  disabled={!!cargandoSocial}
                  activeOpacity={0.8}
                >
                  {cargandoSocial === 'Google' ? (
                    <ActivityIndicator color={isDarkMode ? '#FFF' : '#111827'} />
                  ) : (
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                  )}
                  <Text style={[styles.socialText, { color: isDarkMode ? '#FFF' : '#111827' }]}>Continuar con Google</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1 },
  glowCircle: {
    position: 'absolute',
    top: height * 0.1,
    left: -width * 0.5,
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    blurRadius: 50,
  },
  content: { 
    flex: 1, 
    paddingHorizontal: SPACING[6], 
    justifyContent: 'space-between',
    paddingTop: height * 0.15,
    paddingBottom: 40
  },
  heroSection: { 
    alignItems: 'center', 
  },
  carouselContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20
  },
  subtitle: { 
    fontSize: 22, 
    textAlign: 'center', 
    fontWeight: '700',
    lineHeight: 32, 
    fontFamily: FONTS.display,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center'
  },
  buttonsContainer: { 
    width: '100%',
    marginBottom: 40
  },
  socialButton: {
    height: 64,
    borderRadius: 32,
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
  },
  footerText: { 
    fontSize: 13,
    fontWeight: '500'
  },
  footerLink: { 
    fontSize: 13, 
    fontWeight: '800',
    marginTop: 6
  },
});
