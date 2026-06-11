import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { socialService } from '../services/api';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

export default function MapaCalorScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      setData(await socialService.getMapaCalor());
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
      <Text style={styles.title}>Mapa de Calor</Text>
      <Text style={styles.subtitle}>Zonas prendidas de {data?.ciudad || 'tu ciudad'}, sin mostrar ubicaciones exactas.</Text>

      {cargando ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 40 }} /> : (
        <View style={styles.mapCard}>
          <View style={styles.mapBg}>
            {(data?.zonas || []).map((zona, index) => (
              <View
                key={zona.nombre}
                style={[
                  styles.heatBubble,
                  {
                    left: `${12 + (index % 2) * 43}%`,
                    top: `${10 + index * 15}%`,
                    width: 90 + zona.intensidad,
                    height: 90 + zona.intensidad,
                    borderRadius: (90 + zona.intensidad) / 2,
                    opacity: 0.16 + zona.intensidad / 280,
                  },
                ]}
              />
            ))}
            <Text style={styles.mapLabel}>Cahuin live</Text>
          </View>

          {(data?.zonas || []).map((zona) => (
            <LinearGradient key={zona.nombre} colors={['#FFFFFF', '#FFF7F7']} style={styles.zoneRow}>
              <View style={styles.zoneIcon}><Ionicons name="flame" size={20} color="#F0444F" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.zoneName}>{zona.nombre}</Text>
                <Text style={styles.zoneMeta}>{zona.personas} activos · {zona.vibe}</Text>
              </View>
              <Text style={styles.zonePct}>{zona.intensidad}%</Text>
            </LinearGradient>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING[5] },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.tarjeta, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[4], ...SHADOWS.light },
  title: { color: COLORS.textPrimary, fontSize: 35, fontWeight: '900', fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: SPACING[5] },
  mapCard: { flex: 1 },
  mapBg: { height: 310, borderRadius: 32, backgroundColor: '#101827', overflow: 'hidden', marginBottom: SPACING[4], ...SHADOWS.dark },
  heatBubble: { position: 'absolute', backgroundColor: '#F0444F' },
  mapLabel: { position: 'absolute', left: 24, bottom: 24, color: '#FFF', fontSize: 28, fontWeight: '900', fontFamily: FONTS.display },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[3], marginBottom: SPACING[3], ...SHADOWS.light },
  zoneIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.softRed, alignItems: 'center', justifyContent: 'center' },
  zoneName: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900' },
  zoneMeta: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  zonePct: { color: COLORS.primario, fontWeight: '900' },
});
