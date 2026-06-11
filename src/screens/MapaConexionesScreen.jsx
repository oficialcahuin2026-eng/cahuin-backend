import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const CIUDADES = [
  { nombre: 'Arica', zona: 'Norte grande', x: '54%', y: '6%' },
  { nombre: 'Antofagasta', zona: 'Norte', x: '43%', y: '18%' },
  { nombre: 'La Serena', zona: 'Costa norte', x: '55%', y: '32%' },
  { nombre: 'Santiago', zona: 'Centro', x: '47%', y: '45%' },
  { nombre: 'Concepcion', zona: 'Bio Bio', x: '58%', y: '58%' },
  { nombre: 'Temuco', zona: 'Araucania', x: '45%', y: '69%' },
  { nombre: 'Puerto Montt', zona: 'Los Lagos', x: '58%', y: '80%' },
  { nombre: 'Punta Arenas', zona: 'Magallanes', x: '43%', y: '93%' },
];

const pickConnection = () => {
  const origen = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
  let destino = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
  while (origen.nombre === destino.nombre) {
    destino = CIUDADES[Math.floor(Math.random() * CIUDADES.length)];
  }
  return {
    id: Date.now().toString(),
    origen,
    destino,
    hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  };
};

export default function MapaConexionesScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  const [conexiones, setConexiones] = useState(() => [pickConnection(), pickConnection(), pickConnection()]);
  const [contadorMatches, setContadorMatches] = useState(148);

  useEffect(() => {
    const interval = setInterval(() => {
      setConexiones((prev) => [pickConnection(), ...prev].slice(0, 6));
      setContadorMatches((current) => current + 1);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const ciudadesActivas = new Set(conexiones.flatMap((item) => [item.origen.nombre, item.destino.nombre]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa de conexiones</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.liveCard}>
          <View style={styles.liveTop}>
            <View>
              <Text style={styles.liveLabel}>Chile ahora</Text>
              <Text style={styles.liveTitle}>{contadorMatches} matches activos</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>En vivo</Text>
            </View>
          </View>

          <View style={styles.mapPanel}>
            <View style={styles.chileSpine} />
            {CIUDADES.map((ciudad) => {
              const activa = ciudadesActivas.has(ciudad.nombre);
              return (
                <View key={ciudad.nombre} style={[styles.cityNode, { left: ciudad.x, top: ciudad.y }]}>
                  <View style={[styles.cityDot, activa && styles.cityDotActive]} />
                  <Text style={[styles.cityLabel, activa && styles.cityLabelActive]}>{ciudad.nombre}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.feedHeader}>
          <Ionicons name="sparkles" size={22} color={COLORS.primario} />
          <Text style={styles.feedTitle}>Conexiones recientes</Text>
        </View>

        {conexiones.map((item) => (
          <View key={item.id} style={styles.connectionRow}>
            <View style={styles.routeIcon}>
              <Ionicons name="git-compare" size={20} color={COLORS.primario} />
            </View>
            <View style={styles.connectionTextWrap}>
              <Text style={styles.connectionTitle}>{item.origen.nombre} -> {item.destino.nombre}</Text>
              <Text style={styles.connectionMeta}>{item.origen.zona} conecto con {item.destino.zona} · {item.hora}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070A12' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING[5], backgroundColor: '#101827' },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  backButtonPlaceholder: { width: 44, height: 44 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  content: { padding: SPACING[5], paddingBottom: 110 },
  liveCard: { borderRadius: RADIUS.xl, padding: SPACING[4], backgroundColor: '#101827', borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)', ...SHADOWS.dark },
  liveTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[4] },
  liveLabel: { color: '#FCA5A5', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  liveTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', fontFamily: FONTS.display, marginTop: 4 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.32)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  livePillText: { color: '#BBF7D0', fontSize: 12, fontWeight: '900' },
  mapPanel: { height: 520, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0B1120', borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)' },
  chileSpine: { position: 'absolute', left: '48%', top: 24, bottom: 24, width: 42, borderRadius: 28, backgroundColor: 'rgba(240,68,79,0.22)', borderWidth: 1, borderColor: 'rgba(240,68,79,0.35)', transform: [{ skewY: '-10deg' }] },
  cityNode: { position: 'absolute', minWidth: 120, transform: [{ translateX: -18 }, { translateY: -10 }] },
  cityDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#475569', borderWidth: 3, borderColor: '#0B1120' },
  cityDotActive: { backgroundColor: COLORS.primario, shadowColor: COLORS.primario, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6 },
  cityLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '800', marginTop: 4 },
  cityLabelActive: { color: '#FFF' },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING[6], marginBottom: SPACING[3] },
  feedTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], minHeight: 76, borderRadius: 22, padding: SPACING[3], backgroundColor: '#101827', borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)', marginBottom: SPACING[3] },
  routeIcon: { width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(240,68,79,0.12)' },
  connectionTextWrap: { flex: 1 },
  connectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  connectionMeta: { color: '#94A3B8', fontSize: 13, lineHeight: 18, marginTop: 3 },
});
