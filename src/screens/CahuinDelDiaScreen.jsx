import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { socialService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const FALLBACK_CAHUIN = {
  cahuin: {
    texto: 'Primera cita ideal: completo italiano y caminar sin rumbo.',
    autorAnonimo: 'Cahuín anónimo',
  },
  stats: { de_acuerdo: 0, ni_cagando: 0 },
  miVoto: null,
};

export default function CahuinDelDiaScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [votando, setVotando] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      setData(await socialService.getCahuinDia());
    } catch {
      setData(FALLBACK_CAHUIN);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const votar = async (opcion) => {
    if (votando) return;
    const base = data || FALLBACK_CAHUIN;
    const previo = base.miVoto;
    const stats = { ...(base.stats || FALLBACK_CAHUIN.stats) };
    if (previo && stats[previo] > 0) stats[previo] -= 1;
    stats[opcion] = (stats[opcion] || 0) + 1;
    setData({ ...base, stats, miVoto: opcion });
    setVotando(true);
    try {
      const res = await socialService.votarCahuinDia(opcion);
      setData(res);
    } catch {
      setModalInfo({
        title: 'Cahuín del Día',
        message: 'Guardamos tu voto en esta sesión, pero el servidor no respondió.',
        details: 'Tranqui, tu voto cuenta. Si el problema continúa, intenta de nuevo más tarde.',
        emoji: '💬',
        accent: COLORS.primario,
      });
    } finally {
      setVotando(false);
    }
  };

  const total = (data?.stats?.de_acuerdo || 0) + (data?.stats?.ni_cagando || 0);
  const pct = total ? Math.round(((data?.stats?.de_acuerdo || 0) / total) * 100) : 50;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title}>Cahuín del Día</Text>
      <Text style={styles.subtitle}>Todos votan. Mañana tus primeros matches priorizan gente que piensa igual.</Text>

      {cargando ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 40 }} /> : (
        <LinearGradient colors={['#101827', '#1E1320']} style={styles.card}>
          <Text style={styles.time}>20:00 hrs · anónimo</Text>
          <Text style={styles.quote}>“{data?.cahuin?.texto}”</Text>
          <Text style={styles.author}>{data?.cahuin?.autorAnonimo}</Text>

          <View style={styles.voteRow}>
            <TouchableOpacity style={[styles.voteButton, data?.miVoto === 'de_acuerdo' && styles.voteActive]} onPress={() => votar('de_acuerdo')}>
              <Text style={styles.voteEmoji}>🤝</Text>
              <Text style={styles.voteText}>De acuerdo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.voteButton, data?.miVoto === 'ni_cagando' && styles.voteActive]} onPress={() => votar('ni_cagando')}>
              <Text style={styles.voteEmoji}>🙅</Text>
              <Text style={styles.voteText}>Ni cagando</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.stats}>{pct}% de acuerdo · {total} votos</Text>
        </LinearGradient>
      )}
      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        details={modalInfo?.details}
        emoji={modalInfo?.emoji}
        accent={modalInfo?.accent}
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING[5] },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.tarjeta, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[5], ...(isDarkMode ? {} : SHADOWS.light) },
  title: { color: COLORS.textPrimary, fontSize: 36, fontWeight: '900', fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: SPACING[6] },
  card: { borderRadius: 30, padding: SPACING[5], minHeight: 460, justifyContent: 'center', ...SHADOWS.dark },
  time: { color: '#FCA5A5', fontWeight: '900', textTransform: 'uppercase', marginBottom: SPACING[4] },
  quote: { color: '#FFF', fontSize: 31, lineHeight: 40, fontWeight: '900', fontFamily: FONTS.display },
  author: { color: '#CBD5E1', marginTop: SPACING[4], fontSize: 15 },
  voteRow: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[6] },
  voteButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 20, alignItems: 'center', padding: SPACING[3] },
  voteActive: { borderColor: '#F0444F', backgroundColor: 'rgba(240,68,79,0.22)' },
  voteEmoji: { fontSize: 28, marginBottom: 6 },
  voteText: { color: '#FFF', fontWeight: '900' },
  barBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', marginTop: SPACING[5] },
  barFill: { height: '100%', backgroundColor: '#F0444F', borderRadius: 99 },
  stats: { color: '#CBD5E1', textAlign: 'center', marginTop: SPACING[3], fontWeight: '800' },
});
