import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SPACING } from '../utils/theme';

export default function PremiumBanner({ likesRestantes = 0 }) {
  const nav = useNavigation();
  return (
    <View style={styles.banner}>
      <View style={styles.izquierda}>
        <Text style={{ fontSize: 24 }}>{'\uD83D\uDD25'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>
            {likesRestantes === 0 ? 'Se acabaron tus likes' : `Te quedan ${likesRestantes} likes hoy`}
          </Text>
          <Text style={styles.sub}>Cahuin Piola = likes sin limite</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('Premium')}>
        <Text style={styles.btnText}>Me subo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.softAmber,
    borderWidth: 1,
    borderColor: COLORS.doradoPremium,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    margin: SPACING[4],
    gap: SPACING[3],
  },
  izquierda: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], flex: 1 },
  titulo: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.textPrimary, fontWeight: '900' },
  sub: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  btn: { backgroundColor: COLORS.doradoPremium, borderRadius: RADIUS.xl, paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] },
  btnText: { fontFamily: FONTS.bodyBold, color: '#111827', fontSize: 13, fontWeight: '900' },
});
