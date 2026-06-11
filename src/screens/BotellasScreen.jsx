import React, { useEffect, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { socialService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

export default function BotellasScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [botella, setBotella] = useState(null);
  const [texto, setTexto] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState(null);

  const avisar = (title, message, emoji = '🍾') => setModal({ title, message, emoji });

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await socialService.getBotellaActual();
      setBotella(data.botella || null);
    } catch (error) {
      avisar('Botella perdida', error.message || 'No pudimos mirar el mar digital.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const lanzar = async () => {
    if (texto.trim().length < 8) return avisar('Muy cortita', 'Escribe algo que a alguien le den ganas de responder.');
    try {
      setEnviando(true);
      const data = await socialService.crearBotella(texto.trim());
      setTexto('');
      avisar('Al mar digital', data.message || 'Tu mensaje ya va flotando por Chile.', '🌊');
      cargar();
    } catch (error) {
      avisar('No salió', error.message || 'Intenta de nuevo en un ratito.');
    } finally {
      setEnviando(false);
    }
  };

  const responder = async () => {
    if (!botella || respuesta.trim().length < 2) return;
    try {
      setEnviando(true);
      const data = await socialService.responderBotella(botella._id, respuesta.trim());
      setBotella(data.botella);
      setRespuesta('');
      avisar('Respondida', data.message || 'La botella ya recibió tu cahuín.', '💌');
    } catch (error) {
      avisar('No pudimos responder', error.message || 'Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const soltar = async () => {
    if (!botella) return;
    try {
      setEnviando(true);
      const data = await socialService.soltarBotella(botella._id);
      setBotella(null);
      avisar('Sigue flotando', data.message || 'La dejamos seguir su camino.', '🌊');
      cargar();
    } catch (error) {
      avisar('No se pudo soltar', error.message || 'Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.bg, COLORS.fondo, COLORS.bg]} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.title}>Botella digital</Text>
              <View style={styles.back} />
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroEmoji}>🌊</Text>
              <Text style={styles.heroTitle}>Lanza un cahuín a cualquier chileno</Text>
              <Text style={styles.heroText}>Sin match, sin presión. Si alguien conecta con lo que escribiste, te puede responder.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Tu botella</Text>
              <CahuinTextField
                value={texto}
                onChangeText={setTexto}
                icon="water-outline"
                multiline
                variant="textarea"
                placeholder="Ej: Hoy vi una micro llena de gente y pensé que todos vamos cargando una historia..."
              />
              <TouchableOpacity style={styles.primaryButton} onPress={lanzar} disabled={enviando}>
                {enviando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Lanzar al mar digital</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.label}>Botella que llegó a ti</Text>
                <TouchableOpacity onPress={cargar}>
                  <Ionicons name="refresh" size={20} color={COLORS.primario} />
                </TouchableOpacity>
              </View>
              {cargando ? (
                <ActivityIndicator color={COLORS.primario} style={{ marginVertical: 24 }} />
              ) : botella ? (
                <>
                  <View style={styles.bottleMessage}>
                    <Text style={styles.bottleText}>{botella.texto}</Text>
                    <Text style={styles.bottleMeta}>Desde {botella.regionOrigen || 'algún rincón de Chile'}</Text>
                  </View>
                  <CahuinTextField
                    value={respuesta}
                    onChangeText={setRespuesta}
                    icon="chatbubble-ellipses-outline"
                    containerStyle={{ marginTop: SPACING[4] }}
                    placeholder="Respóndele algo piola..."
                  />
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.secondaryButton} onPress={soltar} disabled={enviando}>
                      <Text style={styles.secondaryText}>Que siga</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.replyButton} onPress={responder} disabled={enviando}>
                      <Text style={styles.replyText}>Responder</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No llegó ninguna todavía</Text>
                  <Text style={styles.emptyText}>Vuelve a revisar más tarde. Las botellas aparecen cuando alguien activo las deja flotar.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <CahuinModal visible={!!modal} title={modal?.title} message={modal?.message} emoji={modal?.emoji} onClose={() => setModal(null)} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: SPACING[5], paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[5] },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border },
  title: { color: COLORS.textPrimary, fontSize: 26, fontFamily: FONTS.display, fontWeight: '900' },
  hero: { alignItems: 'center', paddingVertical: SPACING[6] },
  heroEmoji: { fontSize: 62 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 30, lineHeight: 36, fontFamily: FONTS.display, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  heroText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  card: { backgroundColor: COLORS.tarjeta, borderRadius: 26, padding: SPACING[4], borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING[4], ...SHADOWS.light },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 12 },
  textArea: { minHeight: 130, color: COLORS.textPrimary, backgroundColor: COLORS.fondo, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4], fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  primaryButton: { marginTop: SPACING[4], height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primario, ...SHADOWS.medium },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  bottleMessage: { backgroundColor: COLORS.softPurple || COLORS.fondo, borderRadius: 22, padding: SPACING[4], borderWidth: 1, borderColor: COLORS.border },
  bottleText: { color: COLORS.textPrimary, fontSize: 18, lineHeight: 27, fontWeight: '800' },
  bottleMeta: { color: COLORS.textMuted, fontSize: 13, marginTop: 12, fontWeight: '700' },
  replyInput: { minHeight: 52, color: COLORS.textPrimary, backgroundColor: COLORS.fondo, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING[4], marginTop: SPACING[4], fontSize: 15 },
  actionRow: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[3] },
  secondaryButton: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.fondo },
  secondaryText: { color: COLORS.textPrimary, fontWeight: '900' },
  replyButton: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primario },
  replyText: { color: '#FFF', fontWeight: '900' },
  emptyBox: { alignItems: 'center', paddingVertical: SPACING[5] },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
});
