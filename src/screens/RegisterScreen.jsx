import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// 🌟 Importamos useSignUp para que funcione el registro por correo
import { useOAuth, useSignUp } from '@clerk/clerk-expo';

import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import CahuinLogo from '../components/CahuinLogo';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

const onlyNumbers = (text) => text.replace(/\D/g, '');

const calculateAge = (date) => {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age;
};

const buildBirthDate = (day, month, year) => {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (day.length < 1 || month.length < 1 || year.length !== 4) return null;
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  const date = new Date(y, m - 1, d);
  const isExactDate = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;

  return isExactDate ? date : null;
};

export default function RegisterScreen({ navigation }) {
  // 🌟 Hooks de Clerk
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  
  const mesRef = useRef(null);
  const anioRef = useRef(null);

  const [cargando, setCargando] = useState(false);
  const [cargandoSocial, setCargandoSocial] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const avisar = (title, message) => setModal({ title, message, emoji: '!' });

  const revisarOnboarding = () => {
    navigation.navigate('OnboardingScreen');
  };

  const handleRegistro = async () => {
    if (!isLoaded) return;

    if (!nombre.trim() || !email.trim() || !password) {
      avisar('Faltan datos', 'Completa tu nombre, correo, contraseña y fecha de nacimiento.');
      return;
    }

    if (password.length < 8) {
      avisar('Contraseña corta', 'Clerk requiere contraseñas de al menos 8 caracteres para ser segura.');
      return;
    }

    const fecha = buildBirthDate(dia, mes, anio);
    if (!fecha) {
      avisar('Fecha inválida', 'Revisa el día, mes y año de nacimiento.');
      return;
    }

    const edad = calculateAge(fecha);
    if (edad < 18) {
      avisar('Solo mayores de 18', 'Cahuín es para personas mayores de edad.');
      return;
    }

    setCargando(true);
    try {
      // 🌟 Usamos Clerk para crear la cuenta
      const result = await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password: password,
      });

      if (result.status === 'complete') {
        // Si no pide código de verificación, activa la sesión y entra
        await setActive({ session: result.createdSessionId });
        revisarOnboarding();
      } else {
        // Si Clerk tiene encendida la Verificación de correo
        avisar('Revisa tu correo', 'Clerk te ha enviado un código de verificación. (Puedes desactivar esto en el dashboard de Clerk).');
      }
    } catch (error) {
      avisar('Error', error.errors?.[0]?.message || 'No se pudo crear la cuenta.');
    } finally {
      setCargando(false);
    }
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
        revisarOnboarding();
      }
    } catch (error) {
      const isSessionExists = error.errors?.some(e => e.code === 'session_exists');
      if (isSessionExists) {
        revisarOnboarding();
      } else {
        avisar(red, error.errors?.[0]?.message || `No pudimos registrarte con ${red}.`);
      }
    } finally {
      setCargandoSocial(null);
    }
  };

  return (
    <>
      <LinearGradient colors={['#05070D', '#120B12', '#09070B']} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.glow} />
              <View style={styles.header}>
                <CahuinLogo style={styles.brandRow} size={25} />
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Solo lo básico para empezar. Luego armaremos tu perfil completo.</Text>
              </View>

              <View style={styles.form}>
                <Field icon="person-outline" placeholder="¿Cómo te llamas?" value={nombre} onChangeText={setNombre} />
                <Field icon="mail-outline" placeholder="Tu mejor correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <Field icon="lock-closed-outline" placeholder="Contraseña (mín. 8 letras)" value={password} onChangeText={setPassword} secureTextEntry />

                <View style={styles.birthBlock}>
                  <Text style={styles.birthLabel}>Fecha de nacimiento</Text>
                  <View style={styles.birthRow}>
                    <BirthInput 
                      placeholder="DD" 
                      maxLength={2} 
                      value={dia} 
                      onChangeText={(text) => {
                        const val = onlyNumbers(text);
                        setDia(val);
                        if (val.length === 2) mesRef.current?.focus();
                      }} 
                    />
                    <BirthInput 
                      ref={mesRef} 
                      placeholder="MM" 
                      maxLength={2} 
                      value={mes} 
                      onChangeText={(text) => {
                        const val = onlyNumbers(text);
                        setMes(val);
                        if (val.length === 2) anioRef.current?.focus();
                      }} 
                    />
                    <BirthInput 
                      ref={anioRef} 
                      placeholder="AAAA" 
                      maxLength={4} 
                      value={anio} 
                      onChangeText={(text) => setAnio(onlyNumbers(text))} 
                      style={styles.yearInput} 
                    />
                  </View>
                </View>

                <TouchableOpacity onPress={handleRegistro} disabled={cargando} style={styles.primaryButton}>
                  <LinearGradient colors={['#FF5A3C', '#F71374']} style={styles.primaryGradient}>
                    {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Siguiente</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>o regístrate rápido con</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#FFF', flex: 1 }]} onPress={() => loginSocial('Google')} disabled={!!cargandoSocial}>
                  {cargandoSocial === 'Google' ? <ActivityIndicator color="#111827" /> : <Ionicons name="logo-google" size={20} color="#DB4437" />}
                  <Text style={[styles.socialText, { color: '#111827' }]}>Google</Text>
                </TouchableOpacity>

                {Platform.OS !== 'android' && (
                  <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#FFF', flex: 1 }]} onPress={() => loginSocial('Apple')} disabled={!!cargandoSocial}>
                    {cargandoSocial === 'Apple' ? <ActivityIndicator color="#111827" /> : <Ionicons name="logo-apple" size={20} color="#111827" />}
                    <Text style={[styles.socialText, { color: '#111827' }]}>Apple</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Inicia sesión aquí</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      <CahuinModal visible={!!modal} title={modal?.title} message={modal?.message} emoji={modal?.emoji} onClose={() => setModal(null)} />
    </>
  );
}

function Field({ icon, ...props }) {
  return <CahuinTextField icon={icon} {...props} />;
}

const BirthInput = React.forwardRef(({ style, ...props }, ref) => {
  return (
    <View style={[styles.birthInputWrap, style]}>
      <TextInput
        ref={ref}
        {...props}
        keyboardType="number-pad"
        placeholderTextColor="#8B95A7"
        selectionColor="#F0444F"
        cursorColor="#F0444F"
        textAlign="center"
        style={styles.birthInput}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING[5] },
  glow: { position: 'absolute', top: 60, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(247,19,116,0.16)' },
  header: { alignItems: 'center', marginBottom: 28 },
  brandRow: { marginBottom: 16 },
  logo: { fontSize: 25, fontWeight: '900', color: '#FFF', fontFamily: FONTS.display },
  title: { fontSize: 32, fontWeight: '900', color: '#F0444F', fontFamily: FONTS.display, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#8B95A7', textAlign: 'center', lineHeight: 22, paddingHorizontal: 18 },
  form: { gap: 14 },
  birthBlock: { gap: 8, width: '100%' },
  birthLabel: { color: '#CBD5E1', fontWeight: '900', fontSize: 13 },
  birthRow: { flexDirection: 'row', gap: 8, width: '100%' },
  birthInputWrap: {
    flex: 1,
    minWidth: 0,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(240,68,79,0.34)',
    backgroundColor: '#111827',
    justifyContent: 'center',
  },
  yearInput: { flex: 1.45 },
  birthInput: { flex: 1, color: '#FFF', fontSize: 17, fontWeight: '900', paddingHorizontal: 4 },
  primaryButton: { marginTop: 8, borderRadius: 18, overflow: 'hidden', ...SHADOWS.medium },
  primaryGradient: { height: 58, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { color: '#8B95A7', fontSize: 13 },
  socialRow: { gap: 12 },
  socialButton: { height: 52, borderRadius: RADIUS.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  socialText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 34 },
  footerText: { color: '#8B95A7', fontSize: 14 },
  footerLink: { color: '#F71374', fontSize: 14, fontWeight: '900' },
});
