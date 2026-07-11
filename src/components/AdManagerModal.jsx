import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// IMPORTANTE: Reemplaza TestIds.REWARDED por tu ID de bloque de anuncios de AdMob real para producción
const adUnitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED; // TODO: Poner ID real aquí

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('Cargando anuncio...');

  useEffect(() => {
    if (!visible) return;
    
    setLoadingText('Cargando anuncio...');
    setLoaded(false);

    let adBypassTimer;

    try {
      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
        rewarded.show();
      });

      const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, reward => {
        console.log('Recompensa ganada:', reward);
        onAdFinished();
        onClose();
      });

      const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        onClose();
      });

      const unsubscribeError = rewarded.addAdEventListener('error', (error) => {
        console.log('Error cargando anuncio:', error);
        // Si falla (ej. en Expo Go o sin internet), saltamos el anuncio para no bloquear la app
        setLoadingText('Error cargando. Saltando...');
        adBypassTimer = setTimeout(() => {
          onAdFinished();
          onClose();
        }, 1500);
      });

      rewarded.load();

      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
        if (adBypassTimer) clearTimeout(adBypassTimer);
      };
    } catch (e) {
      console.log('Error inicializando AdMob:', e);
      adBypassTimer = setTimeout(() => {
        onAdFinished();
        onClose();
      }, 1500);
    }
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
