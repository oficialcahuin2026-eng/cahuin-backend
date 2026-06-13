import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { ScreenScaffold } from '../components/CahuinUI';
import { FONTS, SPACING, SHADOWS } from '../utils/theme';
import { PLAN_REVELA_LIKES } from '../config/economia';

const TABS = [
  { key: 'likes', label: 'Me tincaron', icon: 'heart' },
  { key: 'pica', label: 'La Pica', icon: 'sparkles' },
];

export default function LikesCahuinScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [tab, setTab] = useState('likes');
  const [data, setData] = useState({ likes: [], topPicks: [], puedeRevelar: false, plan: 'free' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async (modoRefresh = false) => {
    try {
      if (modoRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await userService.getLikesRecibidos();
      setData({
        likes: res.likes || [],
        topPicks: res.topPicks || [],
        puedeRevelar: Boolean(res.puedeRevelar),
        plan: res.plan || 'free',
      });
    } catch (error) {
      console.log('Likes Cahuin:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar(false);
    }, [])
  );

  const puedeRevelar = data.puedeRevelar || PLAN_REVELA_LIKES.includes(data.plan);
  const lista = tab === 'likes' ? data.likes : data.topPicks;
  const tituloCTA = tab === 'likes' ? 'Sapear quien te tinca' : 'Desbloquear La Pica';
  const bajadaCTA = tab === 'likes'
    ? 'Con Cahuín a Fondo ves los nombres, fotos y ciudad de quienes te dieron like.'
    : 'La Pica muestra una seleccion diaria de perfiles con mas onda cerca de ti.';

  const abrirPerfil = (item) => {
    if (!puedeRevelar) {
      navigation.navigate('Premium');
      return;
    }
    if (item?._id) navigation.navigate('OtroPerfil', { id: item._id, userId: item._id });
  };

  return (
    <ScreenScaffold
      COLORS={COLORS}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => cargar(true)} tintColor={COLORS.primario} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Likes</Text>
          <Text style={styles.subtitle}>Lo que se esta moviendo en tu cahuin.</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item.key === tab;
          const count = item.key === 'likes' ? data.likes.length : data.topPicks.length;
          return (
            <TouchableOpacity key={item.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(item.key)}>
              <Ionicons name={item.icon} size={18} color={active ? '#FFF' : COLORS.textMuted} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primario} size="large" style={{ marginTop: 60 }} />
      ) : (
        <>
          <View style={styles.grid}>
            {lista.map((item, index) => (
              <TouchableOpacity key={`${item._id || index}-${tab}`} activeOpacity={0.9} style={styles.tile} onPress={() => abrirPerfil(item)}>
                <Image
                  source={{ uri: item.foto || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=500' }}
                  style={styles.photo}
                  blurRadius={puedeRevelar ? 0 : 20}
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={styles.overlay} />
                <View style={styles.tileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {puedeRevelar ? `${item.nombre || 'Cahuin'}, ${item.edad || ''}` : `${item.edad || '??'}`}
                    </Text>
                    {puedeRevelar && item.verificado ? (
                      <MaterialCommunityIcons name="check-decagram" size={16} color="#93C5FD" />
                    ) : null}
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.activoReciente ? 'Activo hace poco' : tab === 'pica' ? `Quedan ${item.horasRestantes || 6} h` : 'Te tiro like'}
                  </Text>
                </View>
                {!puedeRevelar ? (
                  <View style={styles.lockBubble}>
                    <Ionicons name="lock-closed" size={16} color="#FFF" />
                  </View>
                ) : null}
                {tab === 'pica' ? (
                  <View style={styles.starBubble}>
                    <Ionicons name="star" size={17} color="#BFD7FF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {!lista.length ? (
            <View style={styles.empty}>
              <Ionicons name={tab === 'likes' ? 'heart-outline' : 'sparkles-outline'} size={42} color={COLORS.primario} />
              <Text style={styles.emptyTitle}>{tab === 'likes' ? 'Todavia no hay likes' : 'La Pica esta calentando'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'likes' ? 'Completa tu perfil y sigue usando Radar para aparecerle a mas gente.' : 'Vuelve pronto para ver una seleccion nueva.'}
              </Text>
            </View>
          ) : null}

          {!puedeRevelar ? (
            <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate('Premium')} style={styles.ctaWrap}>
              <LinearGradient colors={['#111827', '#7A1518']} style={styles.cta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ctaTitle}>{tituloCTA}</Text>
                  <Text style={styles.ctaText}>{bajadaCTA}</Text>
                </View>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Ver planes</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  content: { paddingBottom: 150 },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], marginBottom: SPACING[4] },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.tarjeta,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.light,
  },
  title: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    gap: SPACING[2],
    backgroundColor: COLORS.tarjeta,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    marginBottom: SPACING[4],
    ...SHADOWS.light,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabActive: { backgroundColor: COLORS.primario },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: '#FFF' },
  tabCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900' },
  tabCountActive: { color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] },
  tile: {
    width: '47.8%',
    aspectRatio: 0.73,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.tarjeta,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  photo: { width: '100%', height: '100%', position: 'absolute' },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  tileInfo: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: FONTS.display, flexShrink: 1 },
  meta: { color: '#FFD166', fontSize: 12, fontWeight: '900', marginTop: 3 },
  lockBubble: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(17,24,39,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBubble: {
    position: 'absolute',
    right: 10,
    bottom: 46,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(17,24,39,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWrap: { marginTop: SPACING[5], borderRadius: 24, overflow: 'hidden', ...SHADOWS.dark },
  cta: { minHeight: 118, padding: SPACING[4], flexDirection: 'row', alignItems: 'center', gap: SPACING[3] },
  ctaTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  ctaText: { color: '#E5E7EB', fontSize: 13, lineHeight: 19, marginTop: 4 },
  ctaButton: { backgroundColor: '#FFF', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 },
  ctaButtonText: { color: '#111827', fontWeight: '900', fontSize: 13 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tarjeta,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING[6],
    marginTop: SPACING[4],
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display, marginTop: 12 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 6 },
});
