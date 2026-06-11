import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function MatchesScreen({ navigation }) {
  const { usuario, esPremium } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

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
    // Refresca cada 10 segundos para ver nuevos matches
    const intervalo = setInterval(cargarMatches, 10000);
    return () => clearInterval(intervalo);
  }, [cargarMatches]);

  const abrirChat = (match) => {
    // Si aún ninguno respondió el rompehielo, mandar al rompehielo primero
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

    const foto = otroUsuario.foto || otroUsuario.fotos?.[0] || 'https://via.placeholder.com/60';
    const esRelampago = item.esRelampago;

    return (
      <TouchableOpacity style={styles.matchCard} onPress={() => abrirChat(item)} onLongPress={() => confirmarEliminar(item.roomId)}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: foto }} style={styles.avatar} />
          {esRelampago ? (
            <View style={styles.badgeRelampago}>
              <Text style={{ fontSize: 10 }}>⚡</Text>
            </View>
          ) : null}
          {!item.yaRespondi ? (
            <View style={styles.badgeRompehielo}>
              <Text style={{ fontSize: 10 }}>❓</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.nameLine}>
            <Text style={styles.matchNombre}>{otroUsuario.nombre}, {otroUsuario.edad}</Text>
            {item.rachaConversacion >= 2 ? (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {item.rachaConversacion}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.matchCiudad}>{otroUsuario.ciudad}</Text>
          {esRelampago && !item.salvado ? (
            <Text style={styles.matchRelampago}>⚡ Match Relámpago</Text>
          ) : null}
          {!item.yaRespondi ? (
            <Text style={styles.matchPendiente}>🎯 Responde el rompehielo</Text>
          ) : !item.elYaRespondio ? (
            <Text style={styles.matchEsperando}>⏳ Esperando respuesta...</Text>
          ) : null}
        </View>

        <View style={styles.matchDerecha}>
          <Text style={styles.compatibilidad}>{item.compatibilidad}%</Text>
          <Text style={styles.compatibilidadLabel}>compat.</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gris} style={{ marginTop: 4 }} />
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
        <Text style={styles.titulo}>Tus Cahuines 🌶️</Text>
        <View style={styles.contadorBadge}>
          <Text style={styles.contadorTexto}>{matches.length}</Text>
        </View>
      </View>

      {matches.length === 0 ? (
        <View style={styles.centro}>
          <Text style={{ fontSize: 60 }}>💔</Text>
          <Text style={[styles.textoVacio, { marginTop: 12 }]}>Aún no tienes matches.</Text>
          <Text style={{ color: COLORS.textMuted, marginTop: 8, textAlign: 'center', marginHorizontal: 40 }}>Sigue deslizando en el radar po'.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.roomId?.toString()}
          renderItem={renderMatch}
          contentContainerStyle={{ padding: SPACING.md }}
          showsVerticalScrollIndicator={false}
          onRefresh={cargarMatches}
          refreshing={cargando}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  titulo: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  contadorBadge: { backgroundColor: COLORS.primario, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  contadorTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  textoVacio: { color: COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tarjeta, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  badgeRelampago: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#FFC107', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeRompehielo: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.primario, borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  matchInfo: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  matchNombre: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  streakBadge: { backgroundColor: COLORS.softAmber || 'rgba(245,158,11,0.14)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  streakText: { color: '#F59E0B', fontSize: 12, fontWeight: '900' },
  matchCiudad: { fontSize: 13, color: COLORS.textMuted, marginBottom: 3 },
  matchRelampago: { fontSize: 12, color: '#FFC107', fontWeight: '500' },
  matchPendiente: { fontSize: 12, color: COLORS.primario, fontWeight: '600' },
  matchEsperando: { fontSize: 12, color: COLORS.textMuted },
  matchDerecha: { alignItems: 'center' },
  compatibilidad: { fontSize: 18, fontWeight: '800', color: COLORS.primario },
  compatibilidadLabel: { fontSize: 10, color: COLORS.textMuted },
});
