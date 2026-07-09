import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { panoramaService, socialService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const fallback = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1000';

export default function SwipePanoramasScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS, isDarkMode);
  const [panoramas, setPanoramas] = useState([]);
  const [index, setIndex] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [region, setRegion] = useState('');
  const [modalInfo, setModalInfo] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await socialService.getSwipePanoramas();
      setPanoramas(data.panoramas || []);
      setRegion(data.region || '');
      setIndex(0);
    } catch (error) {
      try {
        const regionFallback = usuario?.region || usuario?.ciudad || 'Metropolitana';
        const data = await panoramaService.listar({ region: regionFallback });
        setPanoramas((data.panoramas || []).filter((p) => p.esOficial));
        setRegion(regionFallback);
        setIndex(0);
      } catch {
        setPanoramas([]);
        setRegion(usuario?.region || '');
      }
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const votar = async (decision) => {
    const panorama = panoramas[index];
    if (!panorama) return;
    try {
      const data = await socialService.votarPanorama(panorama._id, decision);
      if (data.match) {
        setModalInfo({
          title: 'Match por destino',
          message: data.message || 'Ambos quieren ir al mismo panorama.',
          icon: 'ticket',
          accent: COLORS.primario,
          actions: [{ label: 'Ir al chat', onPress: () => { setModalInfo(null); navigation.navigate('Chat'); } }],
        });
      }
    } catch (error) {
      if (decision === 'like') {
        setModalInfo({
          title: 'Guardado en pruebas',
          message: 'El servidor no respondió, pero avanzamos al siguiente panorama.',
          icon: 'ticket',
          accent: COLORS.primario,
        });
      }
    }
    setIndex((prev) => prev + 1);
  };

  const panorama = panoramas[index];

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.title}>Swipe de Panoramas</Text>
      <Text style={styles.subtitle}>Dale like a eventos de tu región{region ? ` (${region})` : ''}. Si alguien más quiere ir, nace un match con plan listo.</Text>

      {cargando ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 40 }} /> : panorama ? (
        <ImageBackground source={{ uri: panorama.imagen || fallback }} style={styles.card} imageStyle={styles.cardImage}>
          <LinearGradient colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.85)']} style={styles.overlay}>
            <View style={styles.emojiWrap}><Ionicons name="ticket" size={40} color="#FFF" /></View>
            <Text style={styles.cardTitle}>{panorama.titulo}</Text>
            <Text style={styles.desc}>{panorama.descripcion}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={18} color="#FFF" />
              <Text style={styles.meta}>{panorama.lugar}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.action, styles.pass]} onPress={() => votar('pass')}>
                <Ionicons name="close" size={34} color="#F0444F" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.action, styles.like]} onPress={() => votar('like')}>
                <Ionicons name="heart" size={38} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}><Ionicons name="ticket-outline" size={60} color={COLORS.primario} /></View>
          <Text style={styles.emptyTitle}>No hay más panoramas por deslizar.</Text>
          <TouchableOpacity style={styles.reload} onPress={cargar}>
            <Text style={styles.reloadText}>Recargar</Text>
          </TouchableOpacity>
        </View>
      )}
      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        icon={modalInfo?.icon}
        actions={modalInfo?.actions || []}
        accent={modalInfo?.accent}
        tone={modalInfo?.tone}
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING[5] },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.tarjeta, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[4], ...(isDarkMode ? {} : SHADOWS.light) },
  title: { color: COLORS.textPrimary, fontSize: 34, fontWeight: '900', fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: SPACING[5] },
  card: { flex: 1, minHeight: 560, borderRadius: 32, overflow: 'hidden', ...(isDarkMode ? SHADOWS.dark : SHADOWS.medium) },
  cardImage: { borderRadius: 32 },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: SPACING[5] },
  emojiWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { color: '#FFF', fontSize: 36, lineHeight: 42, fontWeight: '900', fontFamily: FONTS.display },
  desc: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 24, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: SPACING[3] },
  meta: { color: '#FFF', flex: 1, fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 26, marginTop: SPACING[6] },
  action: { alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  pass: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF' },
  like: { width: 86, height: 86, borderRadius: 43, backgroundColor: COLORS.primario },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  reload: { marginTop: 20, backgroundColor: COLORS.primario, borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12 },
  reloadText: { color: '#FFF', fontWeight: '900' },
});
