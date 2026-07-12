import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  const [loadingText, setLoadingText] = useState('Modo Expo Go: Saltando anuncio...');

  useEffect(() => {
    if (!visible) return;
    
    const timer = setTimeout(() => {
      onAdFinished();
      onClose();
    }, 1000);

    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.text}>{loadingText}</Text>
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
