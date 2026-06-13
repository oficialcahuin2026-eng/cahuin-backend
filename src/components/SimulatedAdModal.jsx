import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-9649235284758114/1860146658';

export default function SimulatedAdModal({ visible, onAdFinished, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [rewardedAd, setRewardedAd] = useState(null);

  useEffect(() => {
    if (!visible) return;

    setLoaded(false);
    
    const ad = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    setRewardedAd(ad);

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      ad.show();
    });

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        onAdFinished();
      },
    );

    const unsubscribeClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
      onClose();
    });

    const unsubscribeError = ad.addAdEventListener('error', (err) => {
      console.warn("AdMob Error:", err);
      // Si falla la carga del anuncio, regalamos la recompensa como fallback
      onAdFinished();
      onClose();
    });

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        {!loaded && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.text}>Cargando anuncio para continuar...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#1E1E1E', padding: 30, borderRadius: 16, alignItems: 'center' },
  text: { color: '#FFF', marginTop: 16, fontSize: 16, fontWeight: 'bold' }
});
