import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { matchService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { EmptyState, ScreenHeader, ScreenScaffold, SoftCard } from '../components/CahuinUI';
import { FONTS, RADIUS, SPACING } from '../utils/theme';

const emptyCahuines = require('../assets/illustrations/empty-cahuines.png');

export default function ChatScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { COLORS } = useTheme();
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
    if (!fecha) return { color: COLORS.gris, texto: 'Sin actividad reciente' };
    const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (minutos < 120) return { color: '#22C55E', texto: minutos < 5 ? 'En linea' : `Activo hace ${minutos} min` };
    if (minutos < 60 * 24) return { color: '#F59E0B', texto: 'Activo hoy' };
    return { color: COLORS.gris, texto: 'Activo hace más de 24h' };
  };

  const renderMatch = ({ item }) => {
    const listo = item.yaRespondi && item.elYaRespondio;
    const esperando = item.yaRespondi && !item.elYaRespondio;
    const actividad = estadoActividad(item.usuario?.ultimaConexion);

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => handleAbrirChat(item)}>
        <SoftCard COLORS={COLORS} style={styles.matchCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: item.usuario.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.avatar} />
            <View style={[styles.activityDot, { backgroundColor: actividad.color }]} />
          </View>
          <View style={styles.matchInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nombre}>{item.usuario.nombre}</Text>
              {listo ? <View style={styles.compatPill}><Text style={styles.compatText}>{item.compatibilidad || 85}%</Text></View> : null}
            </View>
            <Text style={[styles.estado, listo && styles.estadoOk]}>
              {listo
                ? 'Compatibilidad lista. Ya pueden cahuinear.'
                : esperando
                  ? `Esperando que ${item.usuario.nombre} responda`
                  : 'Toca para romper el hielo'}
            </Text>
            <Text style={styles.activityText}>{actividad.texto}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.gris} />
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
      <ScreenHeader title="Tus Cahuines" accent={COLORS.primario} right={<Ionicons name="chatbubble-ellipses-outline" size={42} color={COLORS.textPrimary} />} />

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
          data={matches}
          keyExtractor={(item) => item.roomId}
          renderItem={renderMatch}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={<Text style={styles.listIntro}>Conversaciones listas para empezar suavecito.</Text>}
        />
      )}
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyImage: { width: '94%', marginTop: 12, marginBottom: 0 },
  lista: { paddingHorizontal: SPACING[5], paddingBottom: 120 },
  listIntro: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: SPACING[4],
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
  },
  avatarWrap: {
    width: 66,
    height: 66,
    marginRight: SPACING[4],
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: COLORS.softRed,
  },
  activityDot: { position: 'absolute', right: -2, bottom: -2, width: 17, height: 17, borderRadius: 9, borderWidth: 3, borderColor: COLORS.tarjeta },
  matchInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: {
    color: COLORS.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    fontFamily: FONTS.display,
  },
  estado: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  estadoOk: { color: '#34A853', fontWeight: '700' },
  activityText: { color: COLORS.textMuted, fontSize: 12, marginTop: 3, fontWeight: '700' },
  compatPill: {
    backgroundColor: COLORS.softRed,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  compatText: {
    color: COLORS.primario,
    fontSize: 12,
    fontWeight: '900',
  },
});
