import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { FONTS, SPACING, SHADOWS } from '../utils/theme';
import CahuinModal from '../components/CahuinModal';
import { PLANES_CAHUIN } from '../config/economia';
import { premiumService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_KEY = Platform.OS === 'ios'
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
  : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

const revenueCatDisponible = !!API_KEY && !API_KEY.startsWith('test_');

const PRODUCTOS_POR_PLAN = PLANES_CAHUIN.reduce((acc, plan) => {
  acc[plan.googleProductId] = plan.id;
  acc[plan.id] = plan.id;
  acc[plan.storeProductId] = plan.id;
  acc[`${plan.storeProductId}:${plan.basePlanId}`] = plan.id;
  (plan.productAliases || []).forEach((alias) => {
    acc[alias] = plan.id;
  });
  return acc;
}, {});

export default function PremiumScreen({ navigation }) {
  const { actualizarUsuario } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        if (!revenueCatDisponible) {
          setLoading(false);
          return;
        }

        Purchases.configure({ apiKey: API_KEY });
        const offerings = await Purchases.getOfferings();
        setPackages(offerings.current?.availablePackages || []);
      } catch (e) {
        console.error('Error cargando RevenueCat:', e);
      } finally {
        setLoading(false);
      }
    };

    setupRevenueCat();
  }, []);

  const packagesPorPlan = useMemo(() => {
    const mapa = {};
    packages.forEach((pack) => {
      const identifier = pack.product?.identifier || pack.identifier;
      const planId = PRODUCTOS_POR_PLAN[identifier];
      if (planId) mapa[planId] = pack;
    });
    return mapa;
  }, [packages]);

  const purchasePlan = async (plan) => {
    const pack = packagesPorPlan[plan.id];
    if (!revenueCatDisponible || !pack) {
      Alert.alert(
        'Modo vista previa',
        `Configura el producto ${plan.storeProductId} con plan basico ${plan.basePlanId} en Google Play y RevenueCat.`
      );
      return;
    }

    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      const active = customerInfo.entitlements.active;
      if (active[plan.revenueCatEntitlement] || active.Premium) {
        const res = await premiumService.suscribir(plan.tier);
        if (res.usuario) actualizarUsuario(res.usuario);
        setModalMessage(`Listo. Ahora tienes ${plan.nombre}.`);
        setModalVisible(true);
      }
    } catch (e) {
      if (!e.userCancelled) {
        setModalMessage('Hubo un error al procesar la compra. Intentalo de nuevo.');
        setModalVisible(true);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const precioPlan = (plan) => packagesPorPlan[plan.id]?.product?.priceString || plan.precioReferencial;

  return (
    <LinearGradient colors={['#07080C', '#140B11', '#07080C']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi suscripcion</Text>
          <View style={styles.iconButtonGhost} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.kicker}>Planes Cahuin</Text>
            <Text style={styles.title}>Dos planes simples para moverte con mas libertad.</Text>
            <Text style={styles.subtitle}>
              Gratis sirve para partir. Piola quita limites. A Fondo desbloquea quien te tinca y La Pica.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#FFD166" style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.plans}>
              {PLANES_CAHUIN.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  price={precioPlan(plan)}
                  disabled={purchasing}
                  onPress={() => purchasePlan(plan)}
                />
              ))}
            </View>
          )}

          {!revenueCatDisponible ? (
            <View style={styles.previewCard}>
              <Ionicons name="construct" size={22} color="#FFD166" />
              <View style={{ flex: 1 }}>
                <Text style={styles.previewTitle}>Compras en vista previa</Text>
                <Text style={styles.previewText}>
                  Cuando RevenueCat tenga llave productiva y los productos existan en Google Play, estos botones compraran de verdad.
                </Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Que trae cada plan</Text>
          <View style={styles.compareCard}>
            <CompareRow label="Likes diarios" free="5" piola="Sin limite" full="Sin limite" />
            <CompareRow label="Retroceder" free="No" piola="Si" full="Si" />
            <CompareRow label="Ver quien te tinca" free="No" piola="No" full="Si" />
            <CompareRow label="La Pica" free="No" piola="No" full="Si" />
            <CompareRow label="Ruleta a Ciegas" free="No" piola="Si" full="Si" />
            <CompareRow label="Modo Destacado" free="No" piola="No" full="Si" />
            <CompareRow label="Salvar Relampago" free="No" piola="No" full="Si" />
          </View>

          {purchasing ? <ActivityIndicator color="#FFF" style={{ marginTop: 20 }} /> : null}
        </ScrollView>
      </SafeAreaView>

      <CahuinModal
        visible={modalVisible}
        title={modalMessage.includes('error') ? 'Oops' : 'Listo'}
        message={modalMessage}
        emoji={modalMessage.includes('error') ? ':(' : ':)'}
        onClose={() => {
          setModalVisible(false);
          if (!modalMessage.includes('error')) navigation.goBack();
        }}
      />
    </LinearGradient>
  );
}

function PlanCard({ plan, price, disabled, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} disabled={disabled} style={styles.planOuter}>
      <LinearGradient colors={[plan.color, '#111827']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.planCard}>
        {plan.destacado ? <Text style={styles.bestBadge}>MAS CONVENIENTE</Text> : null}
        <Text style={styles.planName}>{plan.nombre}</Text>
        <Text style={styles.planTagline}>{plan.tagline}</Text>
        <Text style={styles.planPrice}>{price}</Text>
        <View style={styles.planDivider} />
        {plan.beneficios.slice(0, 5).map((beneficio) => (
          <View key={beneficio} style={styles.benefitRow}>
            <Ionicons name="checkmark" size={18} color={plan.accent} />
            <Text style={styles.benefitText}>{beneficio}</Text>
          </View>
        ))}
        <View style={[styles.planButton, { backgroundColor: plan.accent }]}>
          <Text style={styles.planButtonText}>Elegir plan</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function CompareRow({ label, free, piola, full }) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareValue}>{free}</Text>
      <Text style={styles.compareValue}>{piola}</Text>
      <Text style={[styles.compareValue, styles.compareValueStrong]}>{full}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[2],
    paddingBottom: SPACING[3],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonGhost: { width: 44, height: 44 },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  scroll: { padding: SPACING[5], paddingBottom: 80 },
  hero: { marginBottom: SPACING[5] },
  kicker: { color: '#FFD166', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0 },
  title: { color: '#FFF', fontSize: 32, lineHeight: 38, fontWeight: '900', fontFamily: FONTS.display, marginTop: 8 },
  subtitle: { color: '#CBD5E1', fontSize: 15, lineHeight: 22, marginTop: 12 },
  plans: { gap: SPACING[4] },
  planOuter: { borderRadius: 26, ...SHADOWS.dark },
  planCard: { borderRadius: 26, padding: SPACING[5], overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  bestBadge: {
    alignSelf: 'flex-start',
    color: '#111827',
    backgroundColor: '#FFD166',
    borderRadius: 99,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 12,
  },
  planName: { color: '#FFF', fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },
  planTagline: { color: '#E5E7EB', fontSize: 14, lineHeight: 20, marginTop: 4 },
  planPrice: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 18 },
  planDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  benefitText: { color: '#F8FAFC', flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  planButton: { marginTop: 10, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  planButtonText: { color: '#111827', fontSize: 15, fontWeight: '900' },
  previewCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.28)',
    borderRadius: 18,
    padding: SPACING[4],
    marginTop: SPACING[4],
  },
  previewTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  previewText: { color: '#CBD5E1', fontSize: 13, lineHeight: 19, marginTop: 3 },
  sectionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', fontFamily: FONTS.display, marginTop: SPACING[7], marginBottom: SPACING[2] },
  sectionSub: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginBottom: SPACING[3] },
  compareCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 22, overflow: 'hidden' },
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)' },
  compareLabel: { flex: 1.35, color: '#FFF', fontSize: 13, fontWeight: '800' },
  compareValue: { flex: 0.82, color: '#CBD5E1', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  compareValueStrong: { color: '#FFD166' },
});
