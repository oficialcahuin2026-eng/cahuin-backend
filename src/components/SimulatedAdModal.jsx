import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SimulatedAdModal({ visible, onAdFinished, onClose }) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (visible) {
      setCountdown(5);
      setCanClose(false);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        {/* Fake Ad Content */}
        <LinearGradient colors={['#FF0000', '#800000']} style={styles.adContent}>
          <Ionicons name="fast-food" size={80} color="#FFF" style={styles.icon} />
          <Text style={styles.title}>¡Mega Oferta en Burger King!</Text>
          <Text style={styles.subtitle}>Obtén un 50% de descuento en tu primer pedido con PedidosYa.</Text>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
            <Text style={styles.ctaText}>PIDE YA</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Overlay superior con el contador y botón de cierre */}
        <View style={styles.topBar}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Anuncio (Simulado)</Text>
          </View>
          {canClose ? (
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              onAdFinished();
              onClose();
            }}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  adContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { marginBottom: 20 },
  title: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#FFF', fontSize: 18, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  ctaButton: { backgroundColor: '#FFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  ctaText: { color: '#FF0000', fontSize: 18, fontWeight: '900' },
  topBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  countdownBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  countdownText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }
});
