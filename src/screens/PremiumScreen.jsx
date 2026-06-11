import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Purchases from 'react-native-purchases';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { premiumService } from '../services/api';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';

const PLANS = [
  {
    id: 'premium_plus_month',
    tier: 'plus',
    name: 'Cahuín Plus',
    price: '$4.590',
    color: '#F0444F',
    icon: 'flame',
    cahuines: 700,
    tagline: 'Para partir fuerte sin pagar de más.',
    features: [
      'Likes ilimitados',
      'Rewind si pasaste a alguien por error',
      'Modo viajero nacional',
      '700 Cahuines incluidos',
    ],
  },
  {
    id: 'premium_gold_month',
    tier: 'gold',
    name: 'Cahuín Gold',
    price: '$7.490',
    color: '#F6B73C',
    icon: 'crown',
    cahuines: 1500,
    tagline: 'El plan para ver quién ya quiere cahuinear contigo.',
    features: [
      'Todo lo de Plus',
      'Descubre quién te dio like',
      'Top Picks de tu región',
      '1 Boost gratis al mes',
      '1500 Cahuines incluidos',
    ],
  },
  {
    id: 'premium_platinum_month',
    tier: 'platinum',
    name: 'Cahuín Platinum',
    price: '$11.450',
    color: '#A1A1AA',
    icon: 'diamond-stone',
    cahuines: 3000,
    tagline: 'Más prioridad, más control, más visibilidad.',
    features: [
      'Todo lo de Gold',
      'Likes prioritarios',
      '3 Super Likes por semana',
      'Modo incógnito',
      '3000 Cahuines incluidos',
    ],
  },
];

const COIN_PACKS = [
  { id: 'cahuines_1000', amount: 1000, label: '1.000', price: '$1.990', tag: 'Starter' },
  { id: 'cahuines_3000', amount: 3000, label: '3.000', price: '$4.990', tag: 'Popular' },
  { id: 'cahuines_7000', amount: 7000, label: '7.000', price: '$9.990', tag: 'Full' },
  { id: 'cahuines_15000', amount: 15000, label: '15.000', price: '$17.990', tag: 'Mejor valor' },
];

export default function PremiumScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [tabActiva, setTabActiva] = useState('planes');
  const [comprandoId, setComprandoId] = useState(null);
  const [offerings, setOfferings] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
        if (!apiKey) return;
        Purchases.configure({ apiKey, appUserID: usuario?._id });
        const data = await Purchases.getOfferings();
        setOfferings(data);
      } catch (error) {
        console.warn('RevenueCat no disponible:', error?.message);
      }
    })();
  }, [usuario?._id]);

  const buscarPackage = (productoId) => {
    const disponibles = offerings?.current?.availablePackages || [];
    return disponibles.find((pack) => pack.product?.identifier === productoId || pack.identifier === productoId);
  };

  const comprarProducto = async (producto, tipo) => {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
    if (!apiKey) {
      Alert.alert('Google Play', 'Falta configurar RevenueCat/Google Play Billing antes de publicar esta compra.');
      return;
    }

    const paquete = buscarPackage(producto.id);
    if (!paquete) {
      Alert.alert('Google Play', `No encontramos el producto ${producto.id}. Revisa que esté creado en Google Play y RevenueCat.`);
      return;
    }

    setComprandoId(producto.id);
    try {
      await Purchases.purchasePackage(paquete);
      const res = tipo === 'plan'
        ? await premiumService.suscribir(producto.id)
        : await premiumService.comprarMonedas(producto.amount);
      if (res?.usuario) actualizarUsuario(res.usuario);
      Alert.alert('Listo', tipo === 'plan' ? `Activamos ${producto.name}.` : `Agregamos ${producto.label} Cahuines a tu cuenta.`);
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert('Compra no completada', error.message || 'Google Play no pudo completar la compra.');
      }
    } finally {
      setComprandoId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.balancePill}>
          <Ionicons name="flame" size={18} color={COLORS.primario} />
          <Text style={styles.balanceText}>{usuario?.cahuines || 0}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#0B1020', '#182033']} style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroKicker}>Cahuín Premium</Text>
          <Text style={styles.heroTitle}>Más matches, más control, más cahuín.</Text>
          <Text style={styles.heroText}>
            Compra segura con Google Play. Tu plan y tus Cahuines quedan asociados a la misma cuenta que usas en la web.
          </Text>
        </LinearGradient>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tabActiva === 'planes' && styles.tabActive]} onPress={() => setTabActiva('planes')}>
            <Text style={[styles.tabText, tabActiva === 'planes' && styles.tabTextActive]}>Planes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tabActiva === 'cahuines' && styles.tabActive]} onPress={() => setTabActiva('cahuines')}>
            <Text style={[styles.tabText, tabActiva === 'cahuines' && styles.tabTextActive]}>Cahuines</Text>
          </TouchableOpacity>
        </View>

        {tabActiva === 'planes' ? (
          <View style={styles.section}>
            {PLANS.map((plan, index) => (
              <View key={plan.id} style={[styles.planCard, index === 1 && styles.planFeatured]}>
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: `${plan.color}22` }]}>
                    <MaterialCommunityIcons name={plan.icon} size={28} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planNameRow}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      {index === 1 ? <Text style={styles.bestBadge}>Más pedido</Text> : null}
                    </View>
                    <Text style={styles.planTagline}>{plan.tagline}</Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>/ mes</Text>
                  <View style={styles.coinPill}>
                    <Ionicons name="flame" size={14} color={COLORS.primario} />
                    <Text style={styles.coinText}>{plan.cahuines} incluidos</Text>
                  </View>
                </View>

                <View style={styles.features}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Ionicons name="checkmark" size={22} color={plan.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.buyButton, { backgroundColor: plan.color }]} onPress={() => comprarProducto(plan, 'plan')} disabled={comprandoId === plan.id}>
                  {comprandoId === plan.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buyButtonText}>Comprar con Google Play</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recarga Cahuines</Text>
            <Text style={styles.sectionSub}>Para Boosts, Rewind, Ruleta a Ciegas, regalos y futuras dinámicas.</Text>
            <View style={styles.coinGrid}>
              {COIN_PACKS.map((pack) => (
                <TouchableOpacity key={pack.id} style={styles.coinCard} onPress={() => comprarProducto(pack, 'coins')} disabled={comprandoId === pack.id}>
                  <Text style={styles.coinTag}>{pack.tag}</Text>
                  {comprandoId === pack.id ? <ActivityIndicator color={COLORS.primario} /> : <Ionicons name="flame" size={30} color={COLORS.primario} />}
                  <Text style={styles.coinAmount}>{pack.label}</Text>
                  <Text style={styles.coinPrice}>{pack.price}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  closeButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, ...SHADOWS.light },
  balanceText: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 16 },
  scroll: { padding: SPACING[5], paddingBottom: 120 },
  heroCard: { borderRadius: 32, padding: SPACING[5], overflow: 'hidden', ...SHADOWS.dark },
  heroGlow: { position: 'absolute', right: -50, top: -60, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(240,68,79,0.35)' },
  heroKicker: { color: '#FFB5B9', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', lineHeight: 36, marginTop: 12, fontFamily: FONTS.display },
  heroText: { color: '#CBD5E1', fontSize: 16, lineHeight: 24, marginTop: 12 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, padding: 5, marginTop: SPACING[5], marginBottom: SPACING[4] },
  tab: { flex: 1, minHeight: 48, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.textPrimary },
  tabText: { color: COLORS.textMuted, fontWeight: '900' },
  tabTextActive: { color: COLORS.bg },
  section: { gap: SPACING[4] },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display },
  sectionSub: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22 },
  planCard: { backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: 28, padding: SPACING[4], ...SHADOWS.light },
  planFeatured: { borderColor: 'rgba(246,183,60,0.55)' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3] },
  planIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  bestBadge: { color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', fontSize: 11, fontWeight: '900' },
  planTagline: { color: COLORS.textMuted, fontSize: 14, marginTop: 4, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: SPACING[4] },
  planPrice: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900' },
  planPeriod: { color: COLORS.textMuted, fontSize: 14, fontWeight: '800' },
  coinPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.softRed, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  coinText: { color: COLORS.primario, fontWeight: '900', fontSize: 12 },
  features: { marginTop: SPACING[4], gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', flex: 1 },
  buyButton: { minHeight: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: SPACING[4], ...SHADOWS.medium },
  buyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  coinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3] },
  coinCard: { width: '47%', minHeight: 156, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: 26, padding: SPACING[4], alignItems: 'center', justifyContent: 'center', ...SHADOWS.light },
  coinTag: { position: 'absolute', top: 12, left: 12, color: COLORS.primario, backgroundColor: COLORS.softRed, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden', fontSize: 11, fontWeight: '900' },
  coinAmount: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', marginTop: 8 },
  coinPrice: { color: COLORS.textMuted, fontSize: 14, fontWeight: '900', marginTop: 4 },
});
