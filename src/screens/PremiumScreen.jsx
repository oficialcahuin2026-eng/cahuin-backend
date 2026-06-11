import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import CahuinModal from '../components/CahuinModal';

// 🌟 Aquí está la corrección: Usamos EXPO_PUBLIC... para leer la llave correcta
const API_KEY = Platform.OS === 'ios' 
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY 
  : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export default function PremiumScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        if (!API_KEY) {
          console.log("Falta la API Key de RevenueCat en el archivo .env");
          setLoading(false);
          return;
        }

        Purchases.configure({ apiKey: API_KEY });
        const offerings = await Purchases.getOfferings();
        
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.error("Error cargando RevenueCat:", e);
      } finally {
        setLoading(false);
      }
    };

    setupRevenueCat();
  }, []);

  const purchasePackage = async (pack) => {
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      if (typeof customerInfo.entitlements.active['Premium'] !== "undefined") {
        setModalMessage("¡Bienvenido a Cahuín Premium! Disfruta de todos tus beneficios.");
        setModalVisible(true);
      }
    } catch (e) {
      if (!e.userCancelled) {
        setModalMessage("Hubo un error al procesar tu compra. Inténtalo de nuevo.");
        setModalVisible(true);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const planAnual = packages.find(p => p.packageType === 'ANNUAL');
  const planMensual = packages.find(p => p.packageType === 'MONTHLY');

  return (
    <LinearGradient colors={['#05070D', '#120B12', '#09070B']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.crownContainer}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.crownGlow}>
              <Ionicons name="star" size={50} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Cahuín <Text style={styles.goldText}>Premium</Text></Text>
          <Text style={styles.subtitle}>Desbloquea todo el poder de la app y sube tus posibilidades de conectar.</Text>

          <View style={styles.features}>
            <Feature icon="flame" title="Boost Semanal" desc="Sé el primero en el radar durante 30 minutos." />
            <Feature icon="eye" title="¿Quién te vio?" desc="Descubre quién visitó tu perfil." />
            <Feature icon="infinite" title="Swipes Ilimitados" desc="Desliza todo lo que quieras sin límites." />
            <Feature icon="beer" title="Filtros Avanzados" desc="Encuentra personas con tus mismos gustos." />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.plansContainer}>
              {planMensual && (
                <TouchableOpacity 
                  style={styles.planCard} 
                  onPress={() => purchasePackage(planMensual)}
                  disabled={purchasing}
                >
                  <Text style={styles.planName}>Mensual</Text>
                  <Text style={styles.planPrice}>{planMensual.product.priceString}</Text>
                  <Text style={styles.planDesc}>Cancela cuando quieras</Text>
                </TouchableOpacity>
              )}

              {planAnual && (
                <TouchableOpacity 
                  style={[styles.planCard, styles.planCardBest]} 
                  onPress={() => purchasePackage(planAnual)}
                  disabled={purchasing}
                >
                  <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>MEJOR VALOR</Text></View>
                  <Text style={[styles.planName, { color: '#000' }]}>Anual</Text>
                  <Text style={[styles.planPrice, { color: '#000' }]}>{planAnual.product.priceString}</Text>
                  <Text style={[styles.planDesc, { color: '#444' }]}>Ahorra un 50%</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {purchasing && <ActivityIndicator color="#FFF" style={{ marginTop: 20 }} />}
        </ScrollView>
      </SafeAreaView>

      <CahuinModal
        visible={modalVisible}
        title={modalMessage.includes('error') ? 'Oops' : '¡Felicidades!'}
        message={modalMessage}
        emoji={modalMessage.includes('error') ? '😢' : '🎉'}
        onClose={() => {
          setModalVisible(false);
          if (!modalMessage.includes('error')) navigation.goBack();
        }}
      />
    </LinearGradient>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#FFD700" />
      </View>
      <View style={styles.featureTexts}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', padding: SPACING[4] },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING[5], paddingBottom: 60 },
  crownContainer: { alignItems: 'center', marginBottom: 20 },
  crownGlow: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', ...SHADOWS.large },
  title: { fontSize: 36, fontFamily: FONTS.display, color: '#FFF', textAlign: 'center', marginBottom: 10 },
  goldText: { color: '#FFD700' },
  subtitle: { fontSize: 16, color: '#A0AEC0', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  features: { gap: 20, marginBottom: 40 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center' },
  featureTexts: { flex: 1 },
  featureTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  featureDesc: { color: '#A0AEC0', fontSize: 14 },
  plansContainer: { flexDirection: 'row', gap: 15 },
  planCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  planCardBest: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  bestBadge: { position: 'absolute', top: -12, backgroundColor: '#F0444F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bestBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  planName: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  planPrice: { color: '#FFF', fontSize: 24, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 5 },
  planDesc: { color: '#A0AEC0', fontSize: 12, textAlign: 'center' }
});