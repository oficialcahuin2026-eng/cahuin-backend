import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { matchService } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function ChatScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect hace que la lista se actualice sola cada vez que entras a esta pestaña
  useFocusEffect(
    useCallback(() => {
      cargarMatches();
    }, [])
  );

  const cargarMatches = async () => {
    try {
      const data = await matchService.getMisMatches();
      setMatches(data.matches || []);
    } catch (error) {
      console.log("Error cargando matches:", error);
    } finally {
      setCargando(false);
    }
  };

  const renderMatch = ({ item }) => (
    <TouchableOpacity 
      style={[styles.matchCard, SHADOWS.light]} 
      onPress={() => navigation.navigate('SalaChat', { matchId: item.roomId, usuario: item.usuario })}
    >
      <Image source={{ uri: item.usuario.foto || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <View style={styles.matchInfo}>
        <Text style={styles.nombre}>{item.usuario.nombre}</Text>
        <Text style={styles.ciudad}>📍 {item.usuario.ciudad || 'Chile'}</Text>
        <Text style={styles.mensajePlaceholder}>Toca para empezar el cahuín...</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tus Cahuines 💬</Text>
        <Text style={styles.headerSubtitle}>Aquí están tus matches listos para hablar.</Text>
      </View>

      {cargando ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primario} /></View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 60, marginBottom: 10 }}>🏜️</Text>
          <Text style={styles.emptyText}>Todavía no hay matches po'.</Text>
          <Text style={styles.emptySub}>¡Sigue deslizando en la pantalla principal para encontrar con quién cahuinear!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.roomId}
          renderItem={renderMatch}
          contentContainerStyle={styles.lista}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING[5], backgroundColor: COLORS.tarjeta, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 26, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  emptySub: { fontSize: 16, color: COLORS.textMuted, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  lista: { padding: SPACING[4] },
  matchCard: { flexDirection: 'row', backgroundColor: COLORS.tarjeta, padding: SPACING[4], borderRadius: RADIUS.lg, marginBottom: SPACING[3], alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: SPACING[3] },
  matchInfo: { flex: 1 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  ciudad: { fontSize: 13, color: COLORS.acento, marginTop: 2 },
  mensajePlaceholder: { fontSize: 14, color: COLORS.gris, marginTop: 4, fontStyle: 'italic' }
});