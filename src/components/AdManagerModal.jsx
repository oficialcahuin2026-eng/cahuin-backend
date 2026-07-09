import React, { useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  useEffect(() => {
    if (!visible) return;
    
    // Bypass de anuncios para poder probar en Expo Go sin que explote
    const timer = setTimeout(() => {
      onAdFinished();
      onClose();
    }, 1500);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.text}>Simulando anuncio en Expo...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 16, alignItems: 'center' },
  text: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});

