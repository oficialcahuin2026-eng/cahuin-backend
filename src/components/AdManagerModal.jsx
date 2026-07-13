import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

// IMPORTANTE: Reemplazar TestIds.REWARDED por tu ID real de AdMob cuando pases a producción.
const adUnitId = __DEV__ ? TestIds.REWARDED : TestIds.REWARDED; 

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  const [loadingText, setLoadingText] = useState('Cargando anuncio...');
  const [adsWatched, setAdsWatched] = useState(0);

  useEffect(() => {
    if (!visible) {
      setAdsWatched(0);
      return;
    }

    if (adsWatched >= requiredAdsCount) {
      onAdFinished();
      onClose();
      return;
    }

    setLoadingText(`Cargando anuncio ${adsWatched + 1} de ${requiredAdsCount}...`);

    let ad = null;
    let unsubLoaded = null;
    let unsubEarned = null;
    let unsubClosed = null;
    let unsubError = null;

    try {
      ad = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoadingText(`Anuncio ${adsWatched + 1} cargado...`);
        ad.show();
      });

      unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        // Se ganó la recompensa
      });

      unsubClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        setAdsWatched(prev => prev + 1);
      });

      // Manejo de errores (por si no hay conexión o falta compilar la app nativa)
      unsubError = ad.addAdEventListener('error', (err) => {
        console.warn('AdMob Error (saltando anuncio como fallback):', err);
        setAdsWatched(prev => prev + 1);
      });

      ad.load();
    } catch (error) {
      console.warn('Error al inicializar AdMob (probablemente en Expo Go). Simulando...', error);
      setTimeout(() => {
        setAdsWatched(prev => prev + 1);
      }, 1500);
    }

    return () => {
      if (unsubLoaded) unsubLoaded();
      if (unsubEarned) unsubEarned();
      if (unsubClosed) unsubClosed();
      if (unsubError) unsubError();
    };
  }, [visible, adsWatched, requiredAdsCount]);

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
