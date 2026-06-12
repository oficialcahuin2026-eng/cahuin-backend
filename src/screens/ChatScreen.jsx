import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { matchService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  CahuinLogo, CahuinesCounter, EmptyState, FilterPills,
  InterestChip, OnlineDot, ScreenScaffold, SoftCard,
} from '../components/CahuinUI';
import { FONTS, RADIUS, SPACING } from '../utils/theme';

const emptyCahuines = require('../assets/illustrations/empty-cahuines.png');

// Mapeo de intereses a emojis
const INTERES_EMOJI = {
  'Café': '☕', 'Fotografía': '📸', 'Montaña': '🏔️', 'Música en vivo': '🎵',
  'Cocinar': '👨‍🍳', 'Gym / Deporte': '💪', 'Gym': '💪', 'Deporte': '💪',
  'Playa': '🏖️', 'Memes': '😂', 'Perros': '🐶', 'Gatos': '🐱',
  'Viajes': '✈️', 'Senderismo': '🥾', 'Cine': '🎬', 'Lectura': '📚',
  'Arte': '🎨', 'Bailar': '💃', 'Yoga': '🧘', 'Cerveza': '🍺',
};

export default function ChatScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const { COLORS } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS);

  useFocusEffect(
    useCallback(() => {
      cargarMatches();
    }, [])
  );

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

  const renderMatch = ({ item }) => {
    const listo = item.yaRespondi && item.elYaRespondio;
    const esperando = item.yaRespondi && !item.elYaRespondio;
    const actividad = estadoActividad(item.usuario?.ultimaConexion);
    const interesesCompartidos = getInteresesCompartidos(item.usuario);
    const compat = item.compatibilidad || 85;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => handleAbrirChat(item)}>
        <SoftCard COLORS={COLORS} style={styles.matchCard}>
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
                  <Text style={{ fontSize: 10 }}>❤️</Text>
                  <Text style={styles.compatMiniText}>{compat}%</Text>
                </View>
                {interesesCompartidos.map((interes, idx) => (
                  <InterestChip
                    key={idx}
                    emoji={INTERES_EMOJI[interes] || '✨'}
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
          ) : (
            <Ionicons name="chevron-forward" size={20} color={COLORS.gris} />
          )}
        </SoftCard>
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
      {/* ── Header con logo + counter + búsqueda ── */}
      <View style={styles.headerRow}>
        <CahuinLogo size={26} showText COLORS={COLORS} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CahuinesCounter cantidad={usuario?.cahuines || 0} COLORS={COLORS} onPress={() => navigation.navigate('Premium')} />
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="search-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Título + subtítulo ── */}
      <Text style={styles.titulo}>Tus Cahuines</Text>
      <Text style={styles.subtitulo}>Conversa, conecta y encuentra tu vibe.</Text>

      {/* ── Filtros ── */}
      <FilterPills options={filtroOptions} value={filtro} onChange={setFiltro} COLORS={COLORS} />

      {matches.length === 0 ? (
        <EmptyState
          COLORS={COLORS}
          image={emptyCahuines}
          title="Todavía no hay matches."
          subtitle="Sigue deslizando para encontrar con quién cahuinear."
          imageStyle={styles.emptyImage}
          tip={{
            emoji: '🔥',
            title: 'Tip Cahuín',
            text: 'Se tu, se autentico y la conversacion correcta llegara.',
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

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
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

  // ── Lista ──
  lista: { paddingBottom: 120 },

  // ── Match Card ──
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    marginBottom: SPACING[2],
    borderRadius: RADIUS.xl,
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
