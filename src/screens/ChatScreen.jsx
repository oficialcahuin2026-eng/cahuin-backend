import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchService, userService, panoramaService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  CahuinLogo, EmptyState, FilterPills,
  InterestChip, OnlineDot, ScreenScaffold, SoftCard, SegmentedControl
} from '../components/CahuinUI';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

const emptyChats = require('../assets/illustrations/empty-cahuines.png');

export default function ChatScreen({ navigation }) {
  const [tabActiva, setTabActiva] = useState('matches');
  const [matches, setMatches] = useState([]);
  const [grupos, setGrupos] = useState([]);
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
      const [dataMatches, dataGrupos] = await Promise.all([
        matchService.getMisMatches().catch(() => ({ matches: [] })),
        panoramaService.listarMisGrupos().catch(() => ({ panoramas: [] }))
      ]);
      setMatches(dataMatches.matches || []);
      setGrupos(dataGrupos.panoramas || []);
    } catch (error) {
      console.log('Error cargando datos:', error);
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
    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Nuevos Cahuines</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
          {/* ── Premium Card: Te Tincan ── */}
          <TouchableOpacity activeOpacity={0.9} style={[styles.premiumCard, { marginLeft: SPACING[5] }]} onPress={() => navigation.navigate('LikesCahuin', { tab: 'likes' })}>
            <Image 
              source={{ uri: likesData.likes[0]?.remitente?.foto || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200' }} 
              style={styles.premiumCardBg} 
              blurRadius={likesData.puedeRevelar ? 0 : 25}
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.premiumCardOverlay} />
            
            {!likesData.puedeRevelar && (
               <View style={styles.premiumLockWrap}>
                 <Ionicons name="lock-closed" size={16} color="#FFF" />
               </View>
            )}

            <View style={styles.premiumCardContent}>
               <View style={styles.premiumIconBox}>
                 <Ionicons name="heart" size={16} color="#F0444F" />
               </View>
               <View style={{ marginLeft: 10, flex: 1 }}>
                 <Text style={styles.premiumCardTitle}>Le Tincas</Text>
                 <Text style={styles.premiumCardSubtitle}>{likesData.likes.length} personas</Text>
               </View>
            </View>
          </TouchableOpacity>

          {/* ── Premium Card: La Pica ── */}
          <TouchableOpacity activeOpacity={0.9} style={styles.premiumCard} onPress={() => navigation.navigate('LikesCahuin', { tab: 'pica' })}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.premiumCardBg} />
            <LinearGradient colors={['rgba(96,165,250,0.15)', 'transparent']} style={styles.premiumCardOverlay} />
            
            <View style={styles.premiumCardContent}>
               <View style={[styles.premiumIconBox, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
                 <Ionicons name="diamond" size={16} color="#60A5FA" />
               </View>
               <View style={{ marginLeft: 10, flex: 1 }}>
                 <Text style={styles.premiumCardTitle}>La Pica</Text>
                 <Text style={styles.premiumCardSubtitle}>Perfiles top</Text>
               </View>
            </View>
          </TouchableOpacity>

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

  const renderGrupo = ({ item }) => {
    const isCreador = item.creador?._id === usuario?._id;
    const ultimoMensaje = item.mensajesGrupo?.[item.mensajesGrupo.length - 1];
    
    return (
      <TouchableOpacity 
        style={styles.matchCard} 
        activeOpacity={0.7} 
        onPress={() => navigation.navigate('SalaChatGrupo', { panorama: item })}
      >
        <View style={styles.fotoContainer}>
          <Image source={{ uri: item.imagen || item.creador?.foto || 'https://via.placeholder.com/150' }} style={styles.foto} />
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.nombre} numberOfLines={1}>{item.titulo}</Text>
            {isCreador && <Ionicons name="star" size={14} color={COLORS.doradoPremium} />}
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {ultimoMensaje ? `${ultimoMensaje.remitente?.nombre || 'Alguien'}: ${ultimoMensaje.texto}` : 'No hay mensajes aún'}
          </Text>
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

  const isEmpty = tabActiva === 'matches' ? matches.length === 0 : grupos.length === 0;

  return (
    <ScreenScaffold COLORS={COLORS} scroll={isEmpty}>
      <View style={{ height: 20 }} />

      {tabActiva === 'matches' && renderLikesCarousel()}

      <View style={{ paddingHorizontal: SPACING[5] }}>
        <Text style={styles.mensajesTitle}>Chats</Text>
        
        <SegmentedControl 
          options={[
            { value: 'matches', label: 'Matches', icon: 'chatbubbles' },
            { value: 'grupos', label: 'Grupos', icon: 'people' }
          ]} 
          value={tabActiva}
          onChange={(val) => setTabActiva(val)}
          COLORS={COLORS}
        />

        {tabActiva === 'matches' && (
          <View style={{ marginTop: 10 }}>
            <FilterPills options={filtroOptions} value={filtro} onChange={setFiltro} COLORS={COLORS} />
          </View>
        )}
      </View>

      {isEmpty ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingBottom: 60 }}>
          <Image source={emptyChats} style={{ width: 340, height: 340, resizeMode: 'contain', marginBottom: 16 }} />
          <Text style={{ fontSize: 24, fontWeight: '900', fontFamily: FONTS.display, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 }}>
            {tabActiva === 'matches' ? 'Sin cahuines nuevos' : 'Sin panoramas activos'}
          </Text>
          <Text style={{ fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 32 }}>
            {tabActiva === 'matches' ? 'No te desanimes, ¡sigue haciendo swipe!' : 'Anótate en un panorama de la comunidad o crea el tuyo.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tabActiva === 'matches' ? matchesFiltrados : grupos}
          keyExtractor={(item) => tabActiva === 'matches' ? item.roomId : item._id}
          renderItem={tabActiva === 'matches' ? renderMatch : renderGrupo}
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
  premiumCard: {
    width: 170,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.tarjeta,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'flex-end',
    ...SHADOWS.light,
  },
  premiumCardBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  premiumCardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumLockWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(17,24,39,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  premiumIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  premiumCardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
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
