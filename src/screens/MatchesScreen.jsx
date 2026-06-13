import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { matchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function MatchesScreen({ navigation }) {
  const { usuario, esPremium } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [matches, setMatches] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarMatches = useCallback(async () => {
    try {
      const data = await matchService.getMisMatches();
      setMatches(data.matches || []);
    } catch (error) {
      console.log('Error cargando matches:', error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarMatches();
    const intervalo = setInterval(cargarMatches, 10000);
    return () => clearInterval(intervalo);
  }, [cargarMatches]);

  const abrirChat = (match) => {
    // Si aún no he respondido el rompehielo, me manda a responderlo
    // Y el rompehielo, apenas lo responda, me mandará a la SalaChat
    if (!match.yaRespondi) {
      navigation.navigate('Rompehielo', { matchId: match.roomId, usuario: match.usuario });
    } else {
      navigation.navigate('SalaChat', { 
        matchId: match.roomId, 
        usuario: match.usuario,
        compatibilidad: match.compatibilidad,
        elYaRespondio: match.elYaRespondio,
      });
    }
  };

  const confirmarEliminar = (matchId) => {
    Alert.alert('¿Eliminar match?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await matchService.eliminar(matchId);
          setMatches(prev => prev.filter(m => m.roomId !== matchId));
        } catch (e) { Alert.alert('Error', 'No se pudo eliminar.'); }
      }}
    ]);
  };

  const renderMatch = ({ item }) => {
    const otroUsuario = item.usuario;
    if (!otroUsuario) return null;

    const foto = otroUsuario.foto || otroUsuario.fotos?.[0] || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900';
    const esRelampago = item.esRelampago;
    // Asumimos que si hay "ultimoMensaje", ya hay una conversación activa,
    // de lo contrario usamos texto default para animar a chatear.
    const ultimoMsj = item.ultimoMensaje || '¡Toca para chatear!';
    const timeAgo = item.fechaUltimoMensaje ? new Date(item.fechaUltimoMensaje).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora';

    return (
      <TouchableOpacity activeOpacity={0.8} style={styles.matchCard} onPress={() => abrirChat(item)} onLongPress={() => confirmarEliminar(item.roomId)}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: foto }} style={styles.avatar} />
          {/* Indicador de estado (Punto verde) */}
          <View style={styles.onlineBadge} />
          
          {esRelampago && (
            <View style={styles.badgeRelampago}>
              <Text style={{ fontSize: 10 }}>⚡</Text>
            </View>
          )}
          {!item.yaRespondi && (
            <LinearGradient colors={['#A855F7', '#8B5CF6']} style={styles.badgeRompehielo}>
              <Text style={{ fontSize: 10 }}>🧊</Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.matchNombre}>{otroUsuario.nombre}</Text>
            {item.rachaConversacion >= 2 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {item.rachaConversacion}</Text>
              </View>
            )}
          </View>
          
          {!item.yaRespondi ? (
            <Text style={[styles.matchMensajeTexto, { color: '#8B5CF6', fontWeight: '800' }]}>Rompe el hielo para chatear</Text>
          ) : (
            <Text style={styles.matchMensajeTexto} numberOfLines={1}>{ultimoMsj}</Text>
          )}
        </View>

        <View style={styles.matchDerecha}>
          <Text style={styles.timeTexto}>{timeAgo}</Text>
          {item.mensajesSinLeer > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadTexto}>{item.mensajesSinLeer}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return <View style={styles.centro}><ActivityIndicator size="large" color={COLORS.primario} /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mensajes</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Match Stories (Highlights horizontales) - Dummy data visual para dar aspecto premium */}
      <View style={styles.storiesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContainer}>
          <View style={styles.storyItem}>
            <LinearGradient colors={['#E91E63', '#F0444F']} style={styles.storyRing}>
              <Image source={{ uri: usuario?.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }} style={styles.storyImg} />
            </LinearGradient>
            <Text style={styles.storyName}>Tu Nota</Text>
          </View>
          {matches.map((m, idx) => (
            <TouchableOpacity key={idx} style={styles.storyItem} onPress={() => abrirChat(m)}>
              <View style={[styles.storyRing, { padding: 0 }]}>
                <Image source={{ uri: m.usuario?.foto || m.usuario?.fotos?.[0] }} style={styles.storyImg} />
              </View>
              <Text style={styles.storyName}>{m.usuario?.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {matches.length === 0 ? (
          <View style={styles.centroVacio}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>💬</Text>
            <Text style={styles.textoVacio}>Aún no tienes mensajes</Text>
            <Text style={styles.subtextoVacio}>Sigue deslizando en el radar para encontrar a tu próximo match.</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.roomId?.toString()}
            renderItem={renderMatch}
            contentContainerStyle={{ padding: SPACING[4] }}
            showsVerticalScrollIndicator={false}
            onRefresh={cargarMatches}
            refreshing={cargando}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  titulo: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.fondo, alignItems: 'center', justifyContent: 'center' },

  // ── Stories Horizontales ──
  storiesWrapper: { paddingVertical: 10 },
  storiesContainer: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 68 },
  storyRing: { padding: 3, borderRadius: 36, width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  storyImg: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: COLORS.bg },
  storyName: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600', marginTop: 6 },

  // ── Chat List ──
  listContainer: { flex: 1, backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 10, ...SHADOWS.md },
  
  matchCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.fondo },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: COLORS.tarjeta },
  badgeRelampago: { position: 'absolute', top: -2, left: -2, backgroundColor: '#FFC107', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.tarjeta },
  badgeRompehielo: { position: 'absolute', top: -2, left: -2, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.tarjeta },
  
  matchInfo: { flex: 1, justifyContent: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  matchNombre: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, fontFamily: FONTS.display },
  streakBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  streakText: { color: '#F59E0B', fontSize: 11, fontWeight: '900' },
  matchMensajeTexto: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  
  matchDerecha: { alignItems: 'flex-end', justifyContent: 'center' },
  timeTexto: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
  unreadBadge: { backgroundColor: COLORS.primario, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadTexto: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  centroVacio: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  textoVacio: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 8, fontFamily: FONTS.display },
  subtextoVacio: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
