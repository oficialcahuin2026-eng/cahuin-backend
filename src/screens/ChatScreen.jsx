import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchService, userService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  CahuinLogo, EmptyState, FilterPills,
  InterestChip, OnlineDot, ScreenScaffold, SoftCard,
} from '../components/CahuinUI';
import { FONTS, RADIUS, SPACING } from '../utils/theme';

const emptyChats = require('../assets/illustrations/empty-cahuines.png');

// Sin emojis de interes

export default function ChatScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [likesData, setLikesData] = useState({ likes: [], topPicks: [], puedeRevelar: false, plan: 'free' });
  const [cargandoLikes, setCargandoLikes] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const { COLORS } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS);

  useFocusEffect(
    useCallback(() => {
      cargarMatches();
      cargarLikes();
    }, [])
  );

  const cargarLikes = async () => {
    try {
      setCargandoLikes(true);
      const data = await userService.getLikesRecibidos();
      setLikesData({
        likes: data.likes || [],
        topPicks: data.topPicks || [],
        puedeRevelar: Boolean(data.puedeRevelar),
        plan: data.plan || 'free',
      });
    } catch (error) {
      console.log('Error cargando likes:', error);
    } finally {
      setCargandoLikes(false);
    }
  };

  const cargarMatches = async () => {
    try {
      setCargando(true);
      const data = await matchService.getMisMatches();
      setMatches(data.matches || []);
    } catch (error) {
      console.log('Error cargando matches:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirChat = (item) => {
    if (!item.yaRespondi) {
      navigation.navigate('Rompehielo', { matchId: item.roomId, usuario: item.usuario });
      return;
    }

    navigation.navigate('SalaChat', {
      matchId: item.roomId,
      usuario: item.usuario,
      compatibilidad: item.compatibilidad || 85,
      elYaRespondio: item.elYaRespondio,
    });
  };

  const estadoActividad = (fecha) => {
    if (!fecha) return { color: COLORS.gris, texto: 'Sin actividad reciente', status: 'offline' };
    const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 120) return { color: '#22C55E', texto: minutos < 5 ? 'En línea' : `Hace ${minutos} min`, status: 'online' };
    if (minutos < 60 * 24) return { color: '#F59E0B', texto: 'Activo hoy', status: 'recent' };
    return { color: COLORS.gris, texto: 'Ayer', status: 'offline' };
  };

  // Calcular intereses compartidos entre usuario actual y otro
  const getInteresesCompartidos = (otroUsuario) => {
    if (!usuario?.intereses || !otroUsuario?.intereses) return [];
    return usuario.intereses.filter(i => otroUsuario.intereses.includes(i)).slice(0, 2);
  };

  // Filtrar matches según selección
  const matchesFiltrados = matches.filter(item => {
    if (filtro === 'nuevos') return item.noLeidos > 0;
    if (filtro === 'activos') {
      const fecha = item.usuario?.ultimaConexion;
      if (!fecha) return false;
      return (Date.now() - new Date(fecha).getTime()) < 2 * 60 * 60 * 1000;
    }
    return true;
  });

  const filtroOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'nuevos', label: 'Nuevos', dot: '#EF4444' },
    { value: 'activos', label: 'Activos', dot: '#22C55E' },
  ];

  const renderLikesCarousel = () => {
    if (!likesData.likes.length && !likesData.topPicks.length) return null;

    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Nuevos Cahuines</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
          
          {/* Burbuja de Likes */}
          {likesData.likes.length > 0 && (
            <TouchableOpacity activeOpacity={0.8} style={styles.carouselItem} onPress={() => navigation.navigate('LikesCahuin', { tab: 'likes' })}>
              <View style={[styles.carouselBubble, styles.likesBubble]}>
                <Image 
                  source={{ uri: likesData.likes[0]?.foto || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200' }} 
                  style={styles.carouselPhoto} 
                  blurRadius={likesData.puedeRevelar ? 0 : 15}
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.carouselOverlay} />
                <View style={styles.likesCountWrap}>
                  <Ionicons name="heart" size={14} color="#FFF" />
                  <Text style={styles.likesCountText}>{likesData.likes.length}</Text>
                </View>
                {!likesData.puedeRevelar && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={18} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.carouselLabel} numberOfLines={1}>Me tincaron</Text>
            </TouchableOpacity>
          )}

          {/* Burbujas de La Pica (Top Picks) */}
          {likesData.topPicks.map((pick, idx) => (
            <TouchableOpacity key={`pick-${pick._id || idx}`} activeOpacity={0.8} style={styles.carouselItem} onPress={() => navigation.navigate('LikesCahuin', { tab: 'pica' })}>
              <View style={[styles.carouselBubble, styles.picaBubble]}>
                <Image 
                  source={{ uri: pick.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} 
                  style={styles.carouselPhoto} 
                  blurRadius={likesData.puedeRevelar ? 0 : 15}
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.carouselOverlay} />
                <View style={styles.picaIconWrap}>
                  <Ionicons name="sparkles" size={14} color="#FFD166" />
                </View>
                {!likesData.puedeRevelar && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={18} color="#FFF" />
                  </View>
                )}
              </View>
              <Text style={styles.carouselLabel} numberOfLines={1}>{likesData.puedeRevelar ? pick.nombre : 'La Pica'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMatch = ({ item }) => {
    const listo = item.yaRespondi && item.elYaRespondio;
    const esperando = item.yaRespondi && !item.elYaRespondio;
    const actividad = estadoActividad(item.usuario?.ultimaConexion);
    const interesesCompartidos = getInteresesCompartidos(item.usuario);
    const compat = item.compatibilidad || 85;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => handleAbrirChat(item)}>
        <View style={styles.matchCard}>
          {/* Avatar con indicador online */}
          <View style={styles.avatarWrap}>
            <Image source={{ uri: item.usuario.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.avatar} />
            <View style={styles.dotWrap}>
              <OnlineDot status={actividad.status} size={14} />
            </View>
          </View>

          {/* Info central */}
          <View style={styles.matchInfo}>
            {/* Nombre + edad + timestamp */}
            <View style={styles.nameRow}>
              <Text style={styles.nombre} numberOfLines={1}>
                {item.usuario.nombre}{item.usuario.edad ? `, ${item.usuario.edad}` : ''}
              </Text>
              {item.usuario.isPremium && <Ionicons name="star" size={14} color={COLORS.doradoPremium} />}
              <Text style={styles.timestamp}>{actividad.texto}</Text>
            </View>

            {/* Preview del último mensaje o estado */}
            <Text style={styles.preview} numberOfLines={1}>
              {listo
                ? item.ultimoMensaje || '¡Ya pueden cahuinear! Escríbele algo.'
                : esperando
                  ? `Esperando que ${item.usuario.nombre} responda`
                  : 'Toca para romper el hielo'}
            </Text>

            {/* Compat + intereses compartidos */}
            {listo && (
              <View style={styles.chipsRow}>
                <View style={styles.compatMini}>
                  <Ionicons name="heart" size={10} color={COLORS.primario} />
                  <Text style={styles.compatMiniText}>{compat}%</Text>
                </View>
                {interesesCompartidos.map((interes, idx) => (
                  <InterestChip
                    key={idx}
                    icon="star-outline"
                    text={interes}
                    COLORS={COLORS}
                    small
                  />
                ))}
              </View>
            )}
          </View>

          {/* Badge no leídos o chevron */}
          {item.noLeidos > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.noLeidos > 9 ? '9+' : item.noLeidos}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <ScreenScaffold COLORS={COLORS} scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primario} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold COLORS={COLORS} scroll={matches.length === 0}>
      <View style={{ height: 20 }} />

      {renderLikesCarousel()}

      <View style={{ paddingHorizontal: SPACING[5] }}>
        <Text style={styles.mensajesTitle}>Mensajes</Text>
        {/* ── Filtros ── */}
        <FilterPills options={filtroOptions} value={filtro} onChange={setFiltro} COLORS={COLORS} />
      </View>

      {matches.length === 0 ? (
        <EmptyState
          COLORS={COLORS}
          image={emptyChats}
          title="Todavía no hay matches."
          subtitle="Sigue deslizando para encontrar con quién cahuinear."
          imageStyle={styles.emptyImage}
          tip={{
            icon: 'flame-outline',
            title: 'Tip Cahuín',
            text: 'Sé tú mismo, sé auténtico y la conversación correcta llegará.',
          }}
        />
      ) : (
        <FlatList
          data={matchesFiltrados}
          keyExtractor={(item) => item.roomId}
          renderItem={renderMatch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
        />
      )}
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyImage: { width: '94%', marginTop: 12, marginBottom: 0 },

  // ── Mensajes ──
  mensajesTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.display,
    marginBottom: SPACING[3],
    marginTop: SPACING[2],
  },

  // ── Carousel (Likes / Top Picks) ──
  carouselContainer: {
    marginBottom: SPACING[3],
  },
  carouselTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONTS.display,
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[5],
  },
  carouselContent: {
    paddingHorizontal: SPACING[5],
    gap: 16,
  },
  carouselItem: {
    alignItems: 'center',
    width: 80,
  },
  carouselBubble: {
    width: 80,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.tarjeta,
    marginBottom: 8,
    position: 'relative',
    borderWidth: 2,
  },
  likesBubble: {
    borderColor: '#A855F7',
  },
  picaBubble: {
    borderColor: '#FFD166',
  },
  carouselPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  carouselOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  likesCountWrap: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCountText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  picaIconWrap: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.tarjeta,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planPillText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900' },
  titulo: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONTS.display,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: SPACING[4],
    lineHeight: 20,
  },

  lista: { 
    paddingBottom: 120,
    paddingHorizontal: SPACING[5] 
  },

  // ── Match Card ──
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    marginBottom: SPACING[3],
    backgroundColor: 'transparent',
  },
  avatarWrap: {
    width: 62,
    height: 62,
    marginRight: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.softRed,
  },
  dotWrap: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  matchInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONTS.display,
    flexShrink: 1,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  preview: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },

  // ── Compat + Chips ──
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  compatMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.softRed,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  compatMiniText: {
    color: COLORS.primario,
    fontSize: 11,
    fontWeight: '900',
  },

  // ── Badge ──
  unreadBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primario,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    marginLeft: 8,
  },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
});
