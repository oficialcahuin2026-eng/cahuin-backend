import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, RADIUS, SPACING } from '../utils/theme';

export default function PremiumBanner({ likesRestantes = 0 }) {
  const nav = useNavigation();
  return (
    <View style={styles.banner}>
      <View style={styles.izquierda}>
        <Text style={{ fontSize: 24 }}>💎</Text>
        <View>
          <Text style={styles.titulo}>
            {likesRestantes === 0 ? '¡Se acabaron tus likes!' : `Te quedan ${likesRestantes} likes hoy`}
          </Text>
          <Text style={styles.sub}>Premium = likes ilimitados ∞</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('Premium')}>
        <Text style={styles.btnText}>¡Me subo!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor: COLORS.doradoLight, borderWidth:1, borderColor: COLORS.doradoPremium, borderRadius: RADIUS.xl, padding: SPACING[4], margin: SPACING[4] },
  izquierda: { flexDirection:'row', alignItems:'center', gap: SPACING[3], flex:1 },
  titulo: { fontFamily: FONTS.bodyBold, fontSize:14, color: COLORS.textPrimary },
  sub:    { fontFamily: FONTS.body, fontSize:12, color: COLORS.textMuted },
  btn: { backgroundColor: COLORS.doradoPremium, borderRadius: RADIUS.full, paddingHorizontal: SPACING[4], paddingVertical: SPACING[2] },
  btnText: { fontFamily: FONTS.bodyBold, color:'#FFF', fontSize:13 },
});