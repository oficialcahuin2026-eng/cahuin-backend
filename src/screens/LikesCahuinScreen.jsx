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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ScreenScaffold } from '../components/CahuinUI';
import { FONTS, SPACING, SHADOWS } from '../utils/theme';
import { PLAN_REVELA_LIKES } from '../config/economia';

const TABS = [
  { key: 'likes', label: 'Le tinco', icon: 'heart' },
  { key: 'pica', label: 'La Pica', icon: 'sparkles' },
];

export default function LikesCahuinScreen({ navigation, route }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [tab, setTab] = useState(route.params?.tab || 'likes');
  const [data, setData] = useState({ likes: [], topPicks: [], puedeRevelar: false, plan: 'free' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = async (modoRefresh = false) => {
    try {
      const cacheKey = '@cahuin_likes_cache';
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached && !modoRefresh) {
        setData(JSON.parse(cached));
        setLoading(false);
      } else if (!modoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const res = await userService.getLikesRecibidos();
      const newData = {
        likes: res.likes || [],
        topPicks: res.topPicks || [],
        puedeRevelar: Boolean(res.puedeRevelar),
        plan: res.plan || 'free',
      };
      
      setData(newData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(newData));
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

  const { usuario } = useAuth();
  const esA_Fondo = usuario?.premiumPlan === 'a_fondo' || usuario?.premiumPlan === 'gold' || usuario?.premiumPlan === 'platinum';
  const esPiola = usuario?.premiumPlan === 'piola' || usuario?.premiumPlan === 'plus';
  const countToReveal = esA_Fondo ? data.likes.length : (esPiola ? Math.ceil(data.likes.length / 2) : 0);

  const lista = tab === 'likes' ? data.likes : data.topPicks;
  const tituloCTA = tab === 'likes' ? 'Sapear quien te tinca' : 'Desbloquear La Pica';
  const bajadaCTA = tab === 'likes'
    ? 'Con Cahuín a Fondo ves los nombres, fotos y ciudad de quienes te dieron like.'
    : 'La Pica muestra una seleccion diaria de perfiles con mas onda cerca de ti.';

  const abrirPerfil = (item, isPica, puedeRevelarItem) => {
    if (isPica) {
      if (item?._id) navigation.navigate('OtroPerfil', { id: item._id, userId: item._id, origen: 'pica' });
      return;
    }
    if (!puedeRevelarItem) {
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
            {lista.map((item, index) => {
              const fotoUrl = item.foto || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=500';
              const isPica = tab === 'pica';
              const itemPuedeRevelar = isPica ? true : index < countToReveal;
              
              return (
              <TouchableOpacity key={`${item._id || index}-${tab}`} activeOpacity={0.9} style={styles.tile} onPress={() => abrirPerfil(item, isPica, itemPuedeRevelar)}>
                <Image
                  source={{ uri: fotoUrl }}
                  style={styles.photo}
                  blurRadius={itemPuedeRevelar ? 0 : 30}
                />
                
                {/* Gradiente siempre presente para dar contraste al texto */}
                <LinearGradient colors={['transparent', itemPuedeRevelar ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)']} style={styles.overlay} />

                {/* Contenido cuando ES PREMIUM o se puede revelar */}
                {itemPuedeRevelar ? (
                  <View style={styles.tileInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.nombre || 'Cahuin'}, {item.edad || ''}
                      </Text>
                      {item.verificado ? (
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#93C5FD" />
                      ) : null}
                    </View>
                    <Text style={[styles.meta, item.tipo === 'superlike' && { color: '#60A5FA', fontWeight: '800' }]} numberOfLines={1}>
                      {item.activoReciente ? 'Activo hace poco' : tab === 'pica' ? `Quedan ${item.horasRestantes || 6} h` : (item.tipo === 'superlike' ? 'Súper Like ⭐' : 'Te tiró like')}
                    </Text>
                  </View>
                ) : (
                  /* Contenido cuando NO ES PREMIUM (borroso) */
                  <View style={styles.tileInfoBlurred}>
                    <View style={styles.blurredPill}>
                      <View style={styles.blurredCircle} />
                      <Text style={styles.blurredText}>??</Text>
                    </View>
                    <Text style={styles.blurredSub}>Cerca de ti</Text>
                  </View>
                )}

                {/* Burbuja de estrella para La Pica o Superlikes */}
                {tab === 'pica' ? (
                  <View style={styles.starBubble}>
                    <Ionicons name="star" size={17} color="#BFD7FF" />
                  </View>
                ) : item.tipo === 'superlike' ? (
                  <View style={[styles.starBubble, { backgroundColor: '#3B82F6', borderColor: '#FFF' }]}>
                    <Ionicons name="star" size={17} color="#FFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            )})}
          </View>

          {!lista.length ? (
            <View style={styles.empty}>
              <Ionicons name={tab === 'likes' ? 'heart-outline' : 'sparkles-outline'} size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>{tab === 'likes' ? 'Todavía no hay cahuines' : 'La Pica se está armando'}</Text>
              <Text style={styles.emptyText}>
                {tab === 'likes' ? 'Usa el Radar para que más gente te vea y te tire likes.' : 'Vuelve lueguito para ver los perfiles más cotizados.'}
              </Text>
            </View>
          ) : null}

        </>
      )}

      {/* Floating CTA cuando no puede revelar */}
      {!loading && !esA_Fondo && (
        <View style={styles.floatingCtaContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Premium')} style={styles.floatingCta}>
            <Text style={styles.floatingCtaText}>Sapear a quién le gustas</Text>
          </TouchableOpacity>
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3], width: '100%', paddingHorizontal: SPACING[2] },
  tile: {
    width: '47.8%',
    height: 260,
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
  tileInfoBlurred: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  blurredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  blurredCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  blurredText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  blurredSub: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  floatingCtaContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
  },
  floatingCta: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.dark,
  },
  floatingCtaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: SPACING[6],
    marginTop: SPACING[6],
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display, marginTop: 12 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14, lineHeight: 20, marginTop: 6 },
  starBubble: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
});
// force reload
