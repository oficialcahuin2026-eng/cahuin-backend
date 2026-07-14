import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

let RewardedAd, RewardedAdEventType, AdEventType, TestIds;

if (!isExpoGo) {
  try {
    const ads = require('react-native-google-mobile-ads');
    RewardedAd = ads.RewardedAd;
    RewardedAdEventType = ads.RewardedAdEventType;
    AdEventType = ads.AdEventType;
    TestIds = ads.TestIds;
  } catch (e) {
    console.warn('No se pudo cargar el módulo de AdMob', e);
  }
}

// IMPORTANTE: ID real de producción de AdMob.
const adUnitId = !isExpoGo ? 'ca-app-pub-9649235284758114/1860146658' : 'test';

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

    if (isExpoGo || !RewardedAd) {
      setLoadingText(`Modo Expo Go: Saltando anuncio ${adsWatched + 1}/${requiredAdsCount}...`);
      const timer = setTimeout(() => {
        setAdsWatched(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    setLoadingText(`Anuncio ${adsWatched + 1}/${requiredAdsCount} cargando...`);

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
        setLoadingText(`Anuncio ${adsWatched + 1}/${requiredAdsCount} listo...`);
        ad.show();
      });

      unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        // Se ganó la recompensa
      });

      unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        setAdsWatched(prev => prev + 1);
      });

      unsubError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
        console.error('Error cargando el anuncio de AdMob', error);
        setLoadingText(`Error al cargar el anuncio...`);
        // Opcional: Podrías cerrarlo o mostrar un aviso.
        setTimeout(() => {
          onClose(); // cerramos para no dejarlo trabado
        }, 2000);
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
