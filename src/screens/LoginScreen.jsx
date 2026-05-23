import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oye ✋', 'Pon tus credenciales po\'');
      return;
    }
    setCargando(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', error.message || 'Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      "Conexión con Google 🌐", 
      "El botón está listo. Para que funcione en el mundo real, necesitamos registrar Cahuín en Google Cloud Console para obtener tu 'Client ID'. (Próximo paso de Producción)"
    );
  };

  const handleFacebookLogin = () => {
    Alert.alert(
      "Conexión con Facebook 💙", 
      "El botón está listo. Requiere crear una cuenta de Meta Developer para verificar tu negocio."
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.emoji}>🌶️</Text>
          <Text style={styles.title}>Cahuín</Text>
          <Text style={styles.subtitle}>Donde el amor entra por el chisme.</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Ionicons name="mail-outline" size={20} color={COLORS.gris} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.gris} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.btnLogin, SHADOWS.medium]} onPress={handleLogin} disabled={cargando}>
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnLoginText}>Entrar al Cahuín</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O entra rápido con</Text>
            <View style={styles.divider} />
          </View>

          {/* BOTONES SOCIALES */}
          <TouchableOpacity style={[styles.btnSocial, styles.btnGoogle, SHADOWS.light]} onPress={handleGoogleLogin}>
            <Ionicons name="logo-google" size={22} color="#DB4437" />
            <Text style={styles.btnGoogleText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btnSocial, styles.btnFacebook, SHADOWS.light]} onPress={handleFacebookLogin}>
            <Ionicons name="logo-facebook" size={22} color="white" />
            <Text style={styles.btnFacebookText}>Continuar con Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnRegister} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.btnRegisterText}>¿No tienes cuenta? <Text style={styles.btnRegisterBold}>Créala aquí</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: SPACING[5], justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING[6] },
  emoji: { fontSize: 60, marginBottom: SPACING[2] },
  title: { fontSize: 40, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: SPACING[2] },
  
  formContainer: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl, ...SHADOWS.medium },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, paddingHorizontal: SPACING[3], marginBottom: SPACING[4] },
  icon: { marginRight: SPACING[2] },
  input: { flex: 1, paddingVertical: SPACING[3], fontSize: 16, color: COLORS.textPrimary },
  
  btnLogin: { backgroundColor: COLORS.primario, paddingVertical: SPACING[4], borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING[2] },
  btnLoginText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING[5] },
  divider: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: SPACING[3], color: COLORS.gris, fontSize: 14 },

  btnSocial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING[3], borderRadius: RADIUS.lg, marginBottom: SPACING[3] },
  btnGoogle: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd' },
  btnGoogleText: { color: '#333', fontSize: 16, fontWeight: 'bold', marginLeft: SPACING[3] },
  btnFacebook: { backgroundColor: '#1877F2' },
  btnFacebookText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: SPACING[3] },

  btnRegister: { marginTop: SPACING[4], alignItems: 'center' },
  btnRegisterText: { color: COLORS.textMuted, fontSize: 15 },
  btnRegisterBold: { color: COLORS.acento, fontWeight: 'bold' }
});