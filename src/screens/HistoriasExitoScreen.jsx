import React, { useState } from 'react';
import {
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const FORM_INICIAL = {
  nombres: '',
  ciudad: '',
  historia: '',
  contacto: '',
};

export default function HistoriasExitoScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [form, setForm] = useState(FORM_INICIAL);
  const [foto, setFoto] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const setCampo = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setModalInfo({
        title: 'Permiso necesario',
        message: 'Necesitamos acceso a tus fotos para adjuntar la imagen de la historia.',
        emoji: '📸',
        tone: 'danger',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setFoto(result.assets[0].uri);
    }
  };

  const enviarHistoria = () => {
    const nombres = form.nombres.trim();
    const historia = form.historia.trim();

    if (!nombres || !historia || !foto) {
      setModalInfo({
        title: 'Falta completar',
        message: 'Agrega los nombres, la historia y una foto de ambos para dejarla lista.',
        emoji: '💕',
        tone: 'danger',
      });
      return;
    }

    setForm(FORM_INICIAL);
    setFoto(null);
    setModalInfo({
      title: 'Historia recibida',
      message: 'Quedara guardada solo en esta version de prueba. Mas adelante la cuenta admin podra revisar estos formularios.',
      emoji: '✨',
      accent: COLORS.primario,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitulo}>Historias de exito</Text>
            <View style={{ width: 48 }} />
          </View>

          <LinearGradient colors={['rgba(255,70,92,0.24)', COLORS.tarjeta]} style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="heart" size={34} color={COLORS.primario} />
            </View>
            <Text style={styles.heroTitle}>Encontraron su cahuin</Text>
            <Text style={styles.heroText}>
              Comparte una historia real para que el equipo la pueda revisar cuando activemos la cuenta admin.
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="sparkles" size={22} color={COLORS.primario} />
              <Text style={styles.sectionTitle}>Enviar historia</Text>
            </View>

            <TouchableOpacity activeOpacity={0.88} style={styles.photoPicker} onPress={elegirFoto}>
              {foto ? (
                <Image source={{ uri: foto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera" size={32} color={COLORS.primario} />
                  <Text style={styles.photoTitle}>Foto de ambos</Text>
                  <Text style={styles.photoHint}>Toca para elegir una imagen</Text>
                </View>
              )}
            </TouchableOpacity>

            <Field
              COLORS={COLORS}
              icon="people"
              label="Nombres"
              placeholder="Ej: Fran y Mati"
              value={form.nombres}
              onChangeText={(text) => setCampo('nombres', text)}
            />
            <Field
              COLORS={COLORS}
              icon="location"
              label="Ciudad"
              placeholder="Ej: Temuco"
              value={form.ciudad}
              onChangeText={(text) => setCampo('ciudad', text)}
            />
            <Field
              COLORS={COLORS}
              icon="chatbubble-ellipses"
              label="Su historia"
              placeholder="Cuenta como se conocieron en Cahuín..."
              value={form.historia}
              onChangeText={(text) => setCampo('historia', text)}
              multiline
              maxLength={700}
            />
            <Field
              COLORS={COLORS}
              icon="mail"
              label="Contacto opcional"
              placeholder="Instagram o correo para coordinar"
              value={form.contacto}
              onChangeText={(text) => setCampo('contacto', text)}
            />

            <TouchableOpacity activeOpacity={0.9} style={styles.submitButton} onPress={enviarHistoria}>
              <Ionicons name="send" size={21} color="#FFF" />
              <Text style={styles.submitText}>Enviar historia</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyCard}>
            <Ionicons name="shield-checkmark" size={26} color={COLORS.primario} />
            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>Aun no hay historias publicadas</Text>
              <Text style={styles.emptyText}>Solo apareceran historias reales revisadas por el equipo.</Text>
            </View>
          </View>
        </ScrollView>
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

function Field({ COLORS, icon, label, multiline, ...props }) {
  const styles = fieldStyles(COLORS);
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={COLORS.primario} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

const fieldStyles = (COLORS) => StyleSheet.create({
  wrap: { marginTop: SPACING[4] },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  input: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  textarea: { minHeight: 132, paddingTop: 14, lineHeight: 22 },
});

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING[5] },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  hero: { marginHorizontal: SPACING[5], borderRadius: 28, padding: SPACING[5], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.softRed, marginBottom: 12 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center' },
  heroText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  formCard: { margin: SPACING[5], marginBottom: SPACING[4], padding: SPACING[5], borderRadius: 28, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: SPACING[4] },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  photoPicker: { height: 210, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING[4] },
  photoTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  photoHint: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  submitButton: { minHeight: 58, borderRadius: 29, backgroundColor: COLORS.primario, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: SPACING[5], ...SHADOWS.light },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '900', fontFamily: FONTS.display },
  emptyCard: { marginHorizontal: SPACING[5], borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.tarjeta, padding: SPACING[4], flexDirection: 'row', gap: 12, alignItems: 'center' },
  emptyCopy: { flex: 1 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
});
