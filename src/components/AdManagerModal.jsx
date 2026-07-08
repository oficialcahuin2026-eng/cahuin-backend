import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { AdEventType, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import mobileAds from 'react-native-google-mobile-ads';

const REAL_REWARDED_AD_UNIT_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID || 'ca-app-pub-9649235284758114/1860146658';
const USE_TEST_AD_UNIT = __DEV__ || process.env.EXPO_PUBLIC_ADMOB_USE_TEST_ADS === 'true';
const TEST_DEVICE_IDS = ['A7A0666EB5EC2BDB16A8E125875659C1'];
const adUnitId = USE_TEST_AD_UNIT ? TestIds.REWARDED : REAL_REWARDED_AD_UNIT_ID;
let mobileAdsInitPromise = null;

export default function AdManagerModal({ visible, requiredAdsCount = 1, onAdFinished, onClose }) {
  const [loadingMsg, setLoadingMsg] = useState('Cargando anuncio...');
  const [errorMsg, setErrorMsg] = useState('');
  const adsWatchedRef = useRef(0);
  const earnedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      adsWatchedRef.current = 0;
      earnedRef.current = false;
      setErrorMsg('');
      return;
    }

    setErrorMsg('');
    setLoadingMsg('Cargando anuncio...');

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
          mobileAdsInitPromise = mobileAds()
            .setRequestConfiguration({ testDeviceIdentifiers: TEST_DEVICE_IDS })
            .then(() => mobileAds().initialize());
        }
        await mobileAdsInitPromise;
        cargarSiguienteAnuncio();
      } catch (err) {
        console.warn('Error inicializando AdMob:', err);
        mostrarAnuncioNoDisponible();
      }
    };

    const cargarSiguienteAnuncio = () => {
      if (finished) return;
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
          mostrarAnuncioNoDisponible();
        }
      });

      unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        console.log(`AdMob recompensa recibida ${adsWatchedRef.current + 1}/${requiredAdsCount}`);
        earnedRef.current = true;
      });

      unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        limpiarListeners();
        if (!earnedRef.current) {
          mostrarAnuncioCerradoAntes();
          return;
        }

        adsWatchedRef.current += 1;
        if (adsWatchedRef.current >= requiredAdsCount) {
          if (finished) return;
          finished = true;
          onAdFinished();
          onClose();
        } else {
          cargarSiguienteAnuncio();
        }
      });

      // Si AdMob falla, no desbloqueamos la accion porque no se vio el anuncio.
      unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
        console.warn("AdMob Error Event:", err);
        mostrarAnuncioNoDisponible();
      });

      timeoutId = setTimeout(() => {
        console.warn('AdMob no respondió a tiempo.');
        mostrarAnuncioNoDisponible();
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

    const mostrarError = (message) => {
      if (finished) return;
      finished = true;
      limpiarListeners();
      setErrorMsg(message);
      setLoadingMsg(message);
    };

    const mostrarAnuncioNoDisponible = () => {
      mostrarError('No hay anuncios disponibles ahora. Intenta de nuevo en unos minutos.');
    };

    const mostrarAnuncioCerradoAntes = () => {
      mostrarError('Debes terminar el anuncio para desbloquear esta opción.');
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
          {errorMsg ? null : <ActivityIndicator size="large" color="#8B5CF6" />}
          <Text style={styles.text}>{loadingMsg}</Text>
          {errorMsg ? (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 16, alignItems: 'center' },
  text: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  closeButton: { marginTop: 18, backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
  closeButtonText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
});
