import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import mobileAds from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-9649235284758114/1860146658';
let mobileAdsInitPromise = null;

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  const [loadingMsg, setLoadingMsg] = useState('Cargando anuncio...');
  const adsWatchedRef = useRef(0);
  const earnedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      adsWatchedRef.current = 0;
      earnedRef.current = false;
      return;
    }

    let ad = null;
    let unsubscribeLoaded = null;
    let unsubscribeEarned = null;
    let unsubscribeClosed = null;
    let unsubscribeError = null;
    let timeoutId = null;
    let finished = false;

    const inicializarYCargar = async () => {
      try {
        if (!mobileAdsInitPromise) {
          mobileAdsInitPromise = mobileAds().initialize();
        }
        await mobileAdsInitPromise;
        cargarSiguienteAnuncio();
      } catch (err) {
        console.warn('Error inicializando AdMob:', err);
        finalizarPorError();
      }
    };

    const cargarSiguienteAnuncio = () => {
      setLoadingMsg(`Cargando anuncio ${adsWatchedRef.current + 1} de ${requiredAdsCount}...`);
      earnedRef.current = false;
      
      ad = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        try {
          ad.show();
        } catch (e) {
          console.warn("Error showing ad:", e);
          finalizarPorError();
        }
      });

      unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earnedRef.current = true;
      });

      unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        limpiarListeners();
        if (earnedRef.current) {
          adsWatchedRef.current += 1;
        }
        
        if (adsWatchedRef.current >= requiredAdsCount) {
          if (finished) return;
          finished = true;
          onAdFinished();
          onClose();
        } else {
          // Cargar el siguiente
          cargarSiguienteAnuncio();
        }
      });

      // Si ocurre un error, por diseño le damos la recompensa para evitar bloqueos/crashes
      unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn("AdMob Error Event:", err);
        finalizarPorError();
      });

      timeoutId = setTimeout(() => {
        console.warn('AdMob no respondió a tiempo.');
        finalizarPorError();
      }, 15000);

      ad.load();
    };

    const limpiarListeners = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribeLoaded) unsubscribeLoaded();
      if (unsubscribeEarned) unsubscribeEarned();
      if (unsubscribeClosed) unsubscribeClosed();
      if (unsubscribeError) unsubscribeError();
    };

    const finalizarPorError = () => {
      if (finished) return;
      finished = true;
      limpiarListeners();
      onAdFinished(); // Fallback reward
      onClose();
    };

    inicializarYCargar();

    return () => {
      limpiarListeners();
    };
  }, [visible, requiredAdsCount]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.text}>{loadingMsg}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 16, alignItems: 'center' },
  text: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: 'bold' }
});
