import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'activos', 'nuevos'

  const cargarMatches = useCallback(async () => {
    try {
      // 1. Cargar desde caché local (instantáneo) para no mostrar pantalla de carga si ya hay datos
      const cached = await AsyncStorage.getItem('@cahuin_matches_cache');
      if (cached) {
        setMatches(JSON.parse(cached));
        setCargando(false); 
      }

      // 2. Fetch silencioso al servidor para actualizar
      const data = await matchService.getMisMatches();
      setMatches(data.matches || []);
      
      // Guardar el nuevo estado en caché local
      await AsyncStorage.setItem('@cahuin_matches_cache', JSON.stringify(data.matches || []));
    } catch (error) {
      console.log('Error cargando matches:', error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarMatches();
    const intervalo = setInterval(cargarMatches, 15000); // Polling cada 15s (menos frecuente gracias a caché)
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
          {otroUsuario?.ultimaConexion && (Date.now() - new Date(otroUsuario.ultimaConexion).getTime() < 2 * 3600 * 1000) && (
            <View style={styles.onlineBadge} />
          )}
          
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

      {/* Match Stories (Likes, La Pica y Matches) */}
      <View style={styles.storiesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContainer}>
          
          {/* Círculo de Likes (Dorado/Borrorso) */}
          <TouchableOpacity style={styles.storyItem} onPress={() => navigation.navigate('LikesCahuin')}>
            <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.storyRing}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200' }} 
                style={styles.storyImg} 
                blurRadius={esPremium ? 0 : 15} 
              />
              <View style={styles.likesCountBadge}>
                <Text style={styles.likesCountText}>3</Text>
              </View>
            </LinearGradient>
            <Text style={styles.storyName}>Likes</Text>
          </TouchableOpacity>

          {/* Círculo de La Pica (Top Picks) */}
          <TouchableOpacity style={styles.storyItem} onPress={() => Alert.alert('La Pica', 'Aquí verás los perfiles ultra-destacados del día.')}>
            <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.storyRing}>
              <View style={[styles.storyImg, { backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="diamond" size={28} color="#FFF" />
              </View>
            </LinearGradient>
            <Text style={styles.storyName}>La Pica</Text>
          </TouchableOpacity>

          {/* Matches Reales */}
          {matches.map((m, idx) => (
            <TouchableOpacity key={idx} style={styles.storyItem} onPress={() => abrirChat(m)}>
              <View style={[styles.storyRing, { padding: 0 }]}>
                <Image source={{ uri: m.usuario?.foto || m.usuario?.fotos?.[0] }} style={styles.storyImg} />
                {!m.yaRespondi && (
                  <View style={styles.newMatchDot} />
                )}
              </View>
              <Text style={styles.storyName}>{m.usuario?.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        <View style={styles.tabsContainer}>
          {['todos', 'activos', 'nuevos'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setFiltro(tab)} style={[styles.tabFiltro, filtro === tab && styles.tabFiltroActivo]}>
              <Text style={[styles.tabFiltroTexto, filtro === tab && styles.tabFiltroTextoActivo]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {matches.length === 0 ? (
          <View style={styles.centroVacio}>
            <Text style={{ fontSize: 60, marginBottom: 12 }}>💬</Text>
            <Text style={styles.textoVacio}>Aún no tienes mensajes</Text>
            <Text style={styles.subtextoVacio}>Sigue deslizando en el radar para encontrar a tu próximo match.</Text>
          </View>
        ) : (
          <FlatList
            data={matches.filter(m => {
              if (filtro === 'activos') {
                return m.usuario?.ultimaConexion && (Date.now() - new Date(m.usuario.ultimaConexion).getTime() < 2 * 3600 * 1000);
              }
              if (filtro === 'nuevos') {
                return m.mensajesSinLeer > 0 || !m.yaRespondi;
              }
              return true;
            })}
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
  storyRing: { padding: 3, borderRadius: 36, width: 72, height: 72, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storyImg: { width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: COLORS.bg },
  storyName: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600', marginTop: 6 },
  likesCountBadge: { position: 'absolute', bottom: -4, backgroundColor: '#F59E0B', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2, borderColor: COLORS.bg },
  likesCountText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  newMatchDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primario, borderWidth: 2, borderColor: COLORS.bg },

  // ── Chat List ──
  listContainer: { flex: 1, backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: 10, ...SHADOWS.md },
  
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, gap: 10 },
  tabFiltro: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.fondo },
  tabFiltroActivo: { backgroundColor: COLORS.primario },
  tabFiltroTexto: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabFiltroTextoActivo: { color: '#FFF' },
  
  matchCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: 'transparent' },
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
