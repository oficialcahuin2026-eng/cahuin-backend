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
import Purchases from '../utils/revenuecat';
import { FONTS, SPACING, SHADOWS } from '../utils/theme';
import CahuinModal from '../components/CahuinModal';
import { PLANES_CAHUIN } from '../config/economia';
import { paymentService, premiumService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
  const { isDarkMode, COLORS } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);
  
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
    if (Platform.OS === 'web') {
      setPurchasing(true);
      try {
        const res = await paymentService.crearMercadoPagoPreference(plan.id);
        if (res.checkoutUrl && typeof window !== 'undefined') {
          window.location.href = res.checkoutUrl;
        } else {
          setModalMessage(res.message || 'Mercado Pago esta listo para configurarse.');
          setModalVisible(true);
        }
      } catch (e) {
        setModalMessage(e.message || 'Hubo un error al iniciar Mercado Pago.');
        setModalVisible(true);
      } finally {
        setPurchasing(false);
      }
      return;
    }

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
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.iconButtonGhost} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.badgeWrapper}>
              <LinearGradient colors={isDarkMode ? ['rgba(255,209,102,0.2)', 'rgba(255,209,102,0.05)'] : ['#FFF5E6', '#FFF8E1']} style={styles.kickerBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.kicker}>PLANES CAHUÍN</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Dos planes simples para {'\n'}moverte con <Text style={styles.highlightText}>más libertad</Text>.</Text>
            <Text style={styles.subtitle}>
              Gratis sirve para partir. Piola quita límites. A Fondo desbloquea quién te tinca y La Pica.
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#F59E0B" style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.plans}>
              {PLANES_CAHUIN.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  price={precioPlan(plan)}
                  disabled={purchasing}
                  onPress={() => purchasePlan(plan)}
                  isDarkMode={isDarkMode}
                  COLORS={COLORS}
                />
              ))}
            </View>
          )}

          <View style={styles.sectionTitleWrap}>
            <Text style={styles.sectionTitle}>Qué trae cada plan</Text>
          </View>
          
          <View style={styles.compareWrapper}>
            <View style={styles.compareHeader}>
              <Text style={styles.compareHeaderLabel}></Text>
              <Text style={styles.compareHeaderCol}>Gratis</Text>
              <Text style={styles.compareHeaderCol}>Piola</Text>
              <Text style={[styles.compareHeaderCol, { color: '#F59E0B' }]}>A Fondo</Text>
            </View>
            <CompareRow label="Likes diarios" free="5" piola="Ilimitados" full="Ilimitados" isText isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="Retroceder" free={false} piola={true} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="Ver quién te tinca" free={false} piola={false} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="La Pica" free={false} piola={false} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="Ruleta a Ciegas" free={false} piola={true} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="Modo Destacado" free={false} piola={false} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
            <CompareRow label="Salvar Racha" free={false} piola={false} full={true} isDarkMode={isDarkMode} COLORS={COLORS} />
          </View>

          {purchasing ? <ActivityIndicator color="#F59E0B" style={{ marginTop: 20 }} /> : null}
        </ScrollView>
      </SafeAreaView>

      <CahuinModal
        visible={modalVisible}
        title={modalMessage.includes('error') ? 'Oops' : 'Listo'}
        message={modalMessage}
        emoji={modalMessage.includes('error') ? '🌶️' : '✨'}
        onClose={() => {
          setModalVisible(false);
          if (!modalMessage.includes('error')) navigation.goBack();
        }}
      />
    </View>
  );
}

function PlanCard({ plan, price, disabled, onPress, isDarkMode, COLORS }) {
  const isPremium = plan.destacado; // Cahuín a Fondo
  const cardStyles = getCardStyles(COLORS, isDarkMode, isPremium);
  
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} disabled={disabled} style={[cardStyles.planOuter, isPremium && cardStyles.planOuterPremium]}>
      {isPremium && (
        <LinearGradient colors={['#FFD166', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cardStyles.premiumBorderGlow} />
      )}
      <LinearGradient 
        colors={isDarkMode 
          ? (isPremium ? ['#1A1208', '#0D0814'] : ['#1C101A', '#0D0814']) 
          : (isPremium ? ['#FFF8E1', '#FFFFFF'] : ['#FCE7F3', '#FFFFFF'])} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={cardStyles.planCard}
      >
        
        {isPremium && (
          <View style={cardStyles.bestBadgeWrap}>
            <LinearGradient colors={['#FFD166', '#F59E0B']} style={cardStyles.bestBadgeBg}>
              <Text style={cardStyles.bestBadgeText}>✨ MÁS CONVENIENTE</Text>
            </LinearGradient>
          </View>
        )}

        <Text style={[cardStyles.planName, isPremium && { color: '#F59E0B' }]}>{plan.nombre}</Text>
        <Text style={cardStyles.planTagline}>{plan.tagline}</Text>
        <Text style={cardStyles.planPrice}>{price}</Text>
        
        <View style={cardStyles.planDivider} />
        
        <View style={cardStyles.benefitsContainer}>
          {plan.beneficios.slice(0, 5).map((beneficio) => (
            <View key={beneficio} style={cardStyles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={plan.accent} />
              <Text style={cardStyles.benefitText}>{beneficio}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8} 
          style={[cardStyles.planButton, { backgroundColor: isPremium ? '#F59E0B' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }]}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={[cardStyles.planButtonText, { color: isPremium ? '#FFF' : COLORS.textPrimary }]}>
            {isPremium ? 'Obtener A Fondo' : 'Elegir Piola'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function CompareRow({ label, free, piola, full, isText = false, isDarkMode, COLORS }) {
  const rowStyles = getRowStyles(COLORS, isDarkMode);
  
  const renderValue = (val, isFull) => {
    if (isText) {
      return <Text style={[rowStyles.compareValueText, isFull && { color: '#F59E0B' }]}>{val}</Text>;
    }
    return val ? (
      <Ionicons name="checkmark-circle" size={20} color={isFull ? '#F59E0B' : (isDarkMode ? '#E5E7EB' : '#9CA3AF')} />
    ) : (
      <Text style={rowStyles.compareValueEmpty}>—</Text>
    );
  };

  return (
    <View style={rowStyles.compareRow}>
      <Text style={rowStyles.compareLabel}>{label}</Text>
      <View style={rowStyles.compareColWrap}>{renderValue(free, false)}</View>
      <View style={rowStyles.compareColWrap}>{renderValue(piola, false)}</View>
      <View style={rowStyles.compareColWrap}>{renderValue(full, true)}</View>
    </View>
  );
}

const getCardStyles = (COLORS, isDarkMode, isPremium) => StyleSheet.create({
  planOuter: { borderRadius: 32, position: 'relative' },
  planOuterPremium: { shadowColor: '#F59E0B', shadowOpacity: isDarkMode ? 0.15 : 0.4, shadowRadius: 25, shadowOffset: { width: 0, height: 10 }, elevation: isDarkMode ? 0 : 10 },
  premiumBorderGlow: { position: 'absolute', top: -2, bottom: -2, left: -2, right: -2, borderRadius: 34 },
  planCard: { borderRadius: 32, padding: SPACING[5], paddingVertical: 28, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border, position: 'relative', ...(isDarkMode ? {} : SHADOWS.medium) },
  
  bestBadgeWrap: { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  bestBadgeBg: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, ...SHADOWS.dark },
  bestBadgeText: { color: '#111827', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  planName: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 4 },
  planTagline: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  planPrice: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', marginTop: 22, fontFamily: FONTS.display },
  planDivider: { height: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, marginVertical: 20 },
  
  benefitsContainer: { gap: 12, marginBottom: 24 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  benefitText: { color: COLORS.textPrimary, flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  
  planButton: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  planButtonText: { fontSize: 16, fontWeight: '900' },
});

const getRowStyles = (COLORS, isDarkMode) => StyleSheet.create({
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.border },
  compareLabel: { flex: 1.4, color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  compareColWrap: { flex: 0.8, alignItems: 'center', justifyContent: 'center' },
  compareValueText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  compareValueEmpty: { color: COLORS.textMuted, fontSize: 14, fontWeight: '900', opacity: 0.5 },
});

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.fondo,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonGhost: { width: 44, height: 44 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  scroll: { padding: SPACING[5], paddingBottom: 100 },
  
  // ── Hero ──
  hero: { marginBottom: 35, alignItems: 'center' },
  badgeWrapper: { marginBottom: 16 },
  kickerBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,209,102,0.2)' : 'rgba(245,158,11,0.2)' },
  kicker: { color: '#F59E0B', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  title: { color: COLORS.textPrimary, fontSize: 34, lineHeight: 40, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center' },
  highlightText: { color: '#F472B6' },
  subtitle: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginTop: 14, textAlign: 'center', paddingHorizontal: 10 },
  
  // ── Plans ──
  plans: { gap: 24 },
  
  // ── Preview Alert ──
  previewCard: { flexDirection: 'row', gap: 14, backgroundColor: isDarkMode ? 'rgba(255,209,102,0.1)' : '#FFFBEB', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,209,102,0.3)' : '#FDE68A', borderRadius: 20, padding: 20, marginTop: 30 },
  previewIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(255,209,102,0.2)' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  previewTitle: { color: '#F59E0B', fontSize: 16, fontWeight: '900' },
  previewText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  
  // ── Comparison Table ──
  sectionTitleWrap: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: 0.5 },
  
  compareWrapper: { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.border, borderRadius: 24, overflow: 'hidden', paddingVertical: 10, ...(isDarkMode ? {} : SHADOWS.light) },
  compareHeader: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border },
  compareHeaderLabel: { flex: 1.4 },
  compareHeaderCol: { flex: 0.8, color: COLORS.textMuted, fontSize: 12, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
});
