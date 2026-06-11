import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/CahuinUI';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

export default function HistoriasExitoScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Historias de exito</Text>
        <View style={{ width: 48 }} />
      </View>

      <LinearGradient colors={['#FFF1F2', COLORS.bg]} style={styles.hero}>
        <Text style={styles.heroEmoji}>💕</Text>
        <Text style={styles.heroTitle}>Cahuin Legends</Text>
        <Text style={styles.heroText}>
          Aqui apareceran historias verificadas por el equipo cuando parejas reales decidan compartir que encontraron su cahuin.
        </Text>
      </LinearGradient>

      <EmptyState
        COLORS={COLORS}
        title="Aun no hay historias verificadas."
        subtitle="Preferimos mostrar solo casos reales. Cuando alguien active Encontramos el cahuin, su historia podra aparecer aqui."
        tip={{
          emoji: '✅',
          title: 'Verificadas',
          text: 'Sin ejemplos inventados ni parejas falsas.',
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING[5] },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  hero: { marginHorizontal: SPACING[5], borderRadius: 28, padding: SPACING[5], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  heroEmoji: { fontSize: 48, marginBottom: 10 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },
  heroText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
});
