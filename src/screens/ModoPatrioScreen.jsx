import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CahuinModal from '../components/CahuinModal';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const DESAFIOS = [
  'El Cuecazo: cada uno graba su paso más digno y lo mandan al chat.',
  'Ramada Express: propongan una fonda, mote con huesillo o anticucho y voten.',
  'Payita piola: escribe una paya de dos líneas para invitar a salir.',
];

export default function ModoPatrioScreen({ navigation }) {
  const [modal, setModal] = useState(null);
  const activo = useMemo(() => {
    const hoy = new Date();
    return hoy.getMonth() === 8 && hoy.getDate() >= 15 && hoy.getDate() <= 20;
  }, []);

  const abrirDesafio = () => {
    const desafio = DESAFIOS[Math.floor(Math.random() * DESAFIOS.length)];
    setModal({
      title: activo ? 'Modo 18 prendido' : 'Calentando la ramada',
      message: `${desafio}\n\nCuando sea 15 al 20 de septiembre, Cahuín cambia colores, badges y desafíos patrios automáticamente.`,
      emoji: '🇨🇱',
    });
  };

  return (
    <LinearGradient colors={['#FFF7F0', '#FFE8E8', '#F7FBFF']} style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#101828" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modo 18</Text>
          <View style={styles.back} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.emoji}>🇨🇱</Text>
          <Text style={styles.title}>La previa dieciochera de Cahuín</Text>
          <Text style={styles.text}>Del 15 al 20 de septiembre la app se viste de ramada: desafíos, badges patrios y cuecazos para romper el hielo.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>El Cuecazo</Text>
          <Text style={styles.cardText}>Una dinámica liviana para mandar una invitación al chat sin sonar fome. Ideal para probar química antes de verse.</Text>
          <TouchableOpacity style={styles.primary} onPress={abrirDesafio}>
            <Text style={styles.primaryText}>Probar desafío</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.mini}><Text style={styles.miniEmoji}>🎖️</Text><Text style={styles.miniText}>Badge patrio permanente</Text></View>
          <View style={styles.mini}><Text style={styles.miniEmoji}>🎶</Text><Text style={styles.miniText}>Cueca virtual en chat</Text></View>
        </View>

        <CahuinModal visible={!!modal} title={modal?.title} message={modal?.message} emoji={modal?.emoji} onClose={() => setModal(null)} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, padding: SPACING[5] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,24,40,0.08)' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#101828', fontFamily: FONTS.display },
  hero: { alignItems: 'center', paddingVertical: 48 },
  emoji: { fontSize: 78 },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: '#101828', fontFamily: FONTS.display, textAlign: 'center', marginTop: 14 },
  text: { fontSize: 17, lineHeight: 25, color: '#667085', textAlign: 'center', marginTop: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 28, padding: SPACING[5], borderWidth: 1, borderColor: 'rgba(240,68,79,0.2)', ...SHADOWS.medium },
  cardTitle: { fontSize: 26, fontWeight: '900', color: '#F0444F', fontFamily: FONTS.display },
  cardText: { fontSize: 16, lineHeight: 24, color: '#667085', marginTop: 10 },
  primary: { height: 56, borderRadius: 28, backgroundColor: '#F0444F', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  row: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[4] },
  mini: { flex: 1, backgroundColor: '#FFF', borderRadius: RADIUS.xl, padding: SPACING[4], alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,24,40,0.08)' },
  miniEmoji: { fontSize: 32 },
  miniText: { color: '#101828', fontWeight: '900', textAlign: 'center', marginTop: 8 },
});
