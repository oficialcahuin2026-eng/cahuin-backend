import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { matchService, userService } from '../services/api';
import { EXPLORAR_CATEGORIAS } from '../data/explorarCategorias';
import { FONTS, SHADOWS, SPACING, RADIUS } from '../utils/theme';
import {
  GradientButton, ScreenScaffold, SectionTitle, SoftIcon, BottomSheetHandle
} from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import AdManagerModal from '../components/AdManagerModal';
import { PLAN_PIOLA_O_SUPERIOR } from '../config/economia';

const rouletteBanner = require('../assets/illustrations/roulette-banner.png');

const features = [
  { title: 'Historias', text: 'Fotos por 24h.', icon: 'images-outline', route: 'HistoriasCulturales', color: '#F472B6' },
  { title: 'Cahuín', text: 'Vota diario.', icon: 'chatbubbles-outline', route: 'CahuinDelDia', color: '#3B82F6' },
  { title: 'Panoramas', text: 'Haz match.', icon: 'ticket-outline', route: 'SwipePanoramas', color: '#8B5CF6' },
  { title: 'Éxito', text: 'Parejas.', icon: 'heart-outline', route: 'HistoriasExito', color: '#EF4444' },
  { title: 'Botella', text: 'Anónimo.', icon: 'wine-outline', route: 'Botellas', color: '#F59E0B' },
];

export default function ExplorarScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);
  const [cargandoRuleta, setCargandoRuleta] = useState(false);
  const [uniendoId, setUniendoId] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [metricas, setMetricas] = useState({ ruleta: 0, comunidades: {} });
  const tienePiola = Boolean(usuario?.isPremium && PLAN_PIOLA_O_SUPERIOR.includes(usuario?.premiumPlan || 'gold'));
  const [trendingPerfiles, setTrendingPerfiles] = useState([]);
  const [alertas, setAlertas] = useState({ cahuin: false, historias: false });

  const categoriasUnidas = useMemo(() => usuario?.categoriasExplorar || [], [usuario?.categoriasExplorar]);
  const [modalInfo, setModalInfo] = useState(null);
  const [modalAnuncioVisible, setModalAnuncioVisible] = useState(false);
  const [anunciosRequeridos, setAnunciosRequeridos] = useState(1);
  const [accionPendiente, setAccionPendiente] = useState(null);

  const iniciarAnuncioYEjecutar = (accionFn, cantAds = 1) => {
    if (usuario?.isPremium) {
      accionFn();
    } else {
      setAccionPendiente(() => accionFn);
      setAnunciosRequeridos(cantAds);
      setModalAnuncioVisible(true);
    }
  };

  const totalUnidas = categoriasUnidas.length;
  const avisar = (title, message, emoji = 'ℹ️', actions = [], extra = {}) => setModalInfo({ title, message, emoji, actions, ...extra });

  const formatearConteo = (numero) => {
    if (!numero) return '0';
    if (numero >= 1000) return (numero / 1000).toFixed(numero >= 10000 ? 0 : 1) + 'K';
    return String(numero);
  };

  const cargarMetricas = useCallback(async () => {
    try {
      // Usar getTrending en lugar de descubrir para mostrar perfiles reales
      const trendingRes = await userService.getTrending({ scope: 'region' });
      setTrendingPerfiles((trendingRes.trending || []).slice(0, 6));

      // Fetch alertas (Puntitos rojos)
      try {
        const alertasRes = await require('../services/api').socialService.getAlertas();
        setAlertas(alertasRes || { cahuin: false, historias: false });
      } catch (e) {
        setAlertas({ cahuin: false, historias: false });
      }

      const radar = await userService.descubrir({});
      const perfilesRadar = radar.usuarios || radar.perfiles || [];
      
      const respuestas = await Promise.all(
        EXPLORAR_CATEGORIAS.map(async (categoria) => {
          try {
            const data = await userService.descubrir({ categoria: categoria.id });
            return [categoria.id, (data.usuarios || data.perfiles)?.length || 0];
          } catch {
            return [categoria.id, 0];
          }
        })
      );
      const comunidades = {};
      respuestas.forEach(([id, total]) => { comunidades[id] = total; });
      setMetricas({ ruleta: perfilesRadar.length || 0, comunidades });
    } catch {
      setMetricas({ ruleta: 0, comunidades: {} });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarMetricas();
    }, [cargarMetricas, usuario?.distanciaMax, usuario?.ciudad, usuario?.region, usuario?.categoriasExplorar])
  );

  const girarRuleta = async () => {
    avisar(
      'Ruleta a Ciegas',
      'Te empareja al azar con alguien por 1 hora de chat sin fotos. Incluida en Cahuín Piola y A Fondo.',
      '🎭',
      [

        {
          label: tienePiola ? 'Girar Ruleta' : 'Comprar Plan',
          icon: tienePiola ? 'sparkles' : 'cart',
          color: COLORS.primario,
          onPress: async () => {
            if (!tienePiola) {
              setModalInfo(null);
              navigation.navigate('Premium');
              return;
            }
            ejecutarRuletaBackend();
          },
        },
        ...(!tienePiola ? [{
          label: 'Ver 2 Anuncios',
          icon: 'play',
          variant: 'secondary',
          color: COLORS.primario,
          onPress: () => {
            setModalInfo(null);
            iniciarAnuncioYEjecutar(() => ejecutarRuletaBackend(true), 2);
          }
        }] : [])
      ]
    );
  };

  const ejecutarRuletaBackend = async (pagadoConAnuncios = false) => {
    setModalInfo(null);
    setCargandoRuleta(true);
    try {
      const data = await matchService.jugarRuletaCiega({ pagadoConAnuncios });
      avisar('Match ciego', data?.message || 'Ve a tus conversaciones. Tienes 1 hora para descubrir quien es.', '🎡', [], { accent: COLORS.primario });
    } catch (error) {
      avisar('Ruleta a Ciegas', error.message || 'No se pudo contactar a nadie en este momento.', '🎭', [], { tone: 'warning' });
    } finally {
      setCargandoRuleta(false);
    }
  };

  const abrirCategoria = (categoria) => {
    if (categoriasUnidas.includes(categoria.id)) {
      navigation.navigate('CategoriaExplorar', { categoriaId: categoria.id });
      return;
    }
    setCategoriaActiva(categoria);
  };

  const unirseCategoria = async (categoria) => {
    const nuevas = Array.from(new Set([...categoriasUnidas, categoria.id]));
    setUniendoId(categoria.id);
    try {
      const res = await userService.actualizar({ categoriasExplorar: nuevas });
      actualizarUsuario({ ...(res.usuario || {}), categoriasExplorar: nuevas });
      setCategoriaActiva(null);
      navigation.navigate('CategoriaExplorar', { categoriaId: categoria.id });
    } catch (error) {
      avisar('No se pudo unir', error.message || 'Intenta de nuevo en un ratito.', categoria.emoji, [], { accent: categoria.color });
    } finally {
      setUniendoId(null);
    }
  };

  return (
    <ScreenScaffold COLORS={COLORS}>
      <View style={{ height: 16 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Banner Ruleta a Ciegas Premium ── */}
        <TouchableOpacity activeOpacity={0.92} onPress={girarRuleta} disabled={cargandoRuleta} style={[styles.heroCard, isDarkMode ? {} : SHADOWS.large]}>
          <ImageBackground source={rouletteBanner} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
            <LinearGradient colors={isDarkMode ? ['rgba(10,14,24,0.1)', 'rgba(10,14,24,0.9)'] : ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.7)']} style={styles.heroOverlay}>
              <View style={styles.destacadoBadge}>
                <Ionicons name="sparkles" size={12} color="#F59E0B" />
                <Text style={styles.destacadoText}>DESTACADO</Text>
              </View>

              {cargandoRuleta ? (
                <ActivityIndicator size="large" color="#FFF" style={{ alignSelf: 'center', marginVertical: 40 }} />
              ) : (
                <>
                  <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', marginBottom: 16 }}>
                    <Text style={styles.heroTitle}>Ruleta a Ciegas</Text>
                    <Text style={styles.heroSubtitle}>1 hora de chat sin fotos. Puro bla bla.</Text>

                    <View style={styles.liveRow}>
                      {metricas.ruleta + (metricas.activosRegion || 0) > 0 && (
                        <View style={styles.avatarStack}>
                          {[0, 1, 2].map((item) => (
                            <View key={item} style={[styles.liveAvatar, { marginLeft: item === 0 ? 0 : -10 }]}>
                              <Ionicons name="person" size={12} color="#FFF" />
                            </View>
                          ))}
                        </View>
                      )}
                      <Text style={styles.liveCount}>{formatearConteo(metricas.ruleta + (metricas.activosRegion || 0))} conectando</Text>
                    </View>
                  </View>

                  <LinearGradient colors={['#FFD166', '#F59E0B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.playButtonGradient}>
                    <View style={styles.playButtonInner}>
                      <Ionicons name="sparkles" size={18} color="#FFF" />
                      <Text style={styles.playButtonText}>JUGAR AHORA</Text>
                      <View style={styles.playButtonPricePill}>
                        <Text style={styles.playButtonPrice}>{tienePiola ? 'GRATIS' : 'PREMIUM'}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </>
              )}
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* ── Funciones destacadas (grid) ── */}
        <View style={styles.featureRowScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRowContent}>
            {features.map((item) => {
              let hasAlert = false;
              if (item.title === 'Historias' && alertas.historias) hasAlert = true;
              if (item.title === 'Cahuín' && alertas.cahuin) hasAlert = true;

              return (
                <TouchableOpacity key={item.title} style={styles.featurePill} onPress={() => navigation.navigate(item.route)} activeOpacity={0.85}>
                  <View style={[styles.featureIconWrap, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                    {hasAlert && <View style={styles.alertBadge} />}
                  </View>
                  <Text style={styles.featureTitle} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Comunidades Cahuín ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Comunidades</Text>
            <Text style={styles.sectionSub}>{totalUnidas > 0 ? `${totalUnidas} activas` : 'Únete según lo que buscas'}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comunidadesScroll} contentContainerStyle={styles.comunidadesContent}>
          {EXPLORAR_CATEGORIAS.map((item) => {
            const joined = categoriasUnidas.includes(item.id);
            const count = metricas.comunidades[item.id] || 0;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => abrirCategoria(item)}
                style={[styles.comunidadCard, { borderColor: joined ? item.color : (isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border) }]}
              >
                <LinearGradient 
                  colors={isDarkMode ? ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)'] : ['#FFFFFF', '#F9FAFB']} 
                  style={StyleSheet.absoluteFillObject} 
                />
                <View style={[styles.cardAccent, { backgroundColor: item.color, opacity: 0.1 }]} />
                <View style={styles.comunidadTop}>
                  <SoftIcon name={item.icon} emoji={item.emoji} color={item.color} bg={item.color + '20'} size={48} rounded={18} iconSize={22} />
                  {joined && (
                    <View style={[styles.activeBadge, { backgroundColor: item.color }]}>
                      <Text style={styles.activeBadgeText}>Activa</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.comunidadTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.comunidadSub} numberOfLines={2}>{item.subtitle}</Text>
                <View style={styles.comunidadBottom}>
                  <View style={[styles.memberDot, { backgroundColor: item.color }]} />
                  <Text style={styles.memberText}>{formatearConteo(count)} miembros</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Perfiles trending ── */}
        {trendingPerfiles.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
              <View>
                <Text style={styles.sectionTitle}>En tendencia 🔥</Text>
                <Text style={styles.sectionSub}>Perfiles populares en tu zona</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Trending')} style={styles.verMasBtn}>
                <Text style={styles.verMasText}>Ver más</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContent}>
              {trendingPerfiles.map((p, idx) => (
                <TouchableOpacity key={p._id || idx} style={styles.trendingCard} activeOpacity={0.85} onPress={() => navigation.navigate('OtroPerfil', { userId: p._id, hideActions: true })}>
                  <Image source={{ uri: p.foto || p.fotos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }} style={styles.trendingAvatar} />
                  <View style={styles.trendingOverlay}>
                    <Text style={styles.trendingName} numberOfLines={1}>{p.nombre}</Text>
                    {p.arquetipoCahuinero && (
                      <View style={[styles.trendingChip, { backgroundColor: p.arquetipo?.color || COLORS.primario }]}>
                        <Text style={styles.trendingChipText} numberOfLines={1}>{p.arquetipoCahuinero}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Modal unirse a categoría ── */}
      <Modal visible={!!categoriaActiva} transparent animationType="slide" onRequestClose={() => setCategoriaActiva(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.joinModal}>
            <BottomSheetHandle />
            {categoriaActiva ? (
              <>
                <View style={styles.modalTop}>
                  <SoftIcon name={categoriaActiva.icon} emoji={categoriaActiva.emoji} bg={categoriaActiva.color + '20'} color={categoriaActiva.color} size={70} rounded={24} iconSize={34} />
                  <TouchableOpacity onPress={() => setCategoriaActiva(null)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>Unirte a {categoriaActiva.title}</Text>
                <Text style={styles.modalText}>{categoriaActiva.prompt}</Text>
                
                <View style={styles.modalInfoBox}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primario} />
                  <Text style={styles.modalHint}>Te mostraremos perfiles de tu región y dentro de tu distancia. Puedes salir cuando quieras.</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={uniendoId === categoriaActiva.id}
                  onPress={() => unirseCategoria(categoriaActiva)}
                  style={[styles.joinButton, { backgroundColor: categoriaActiva.color }]}
                >
                  {uniendoId === categoriaActiva.id ? <ActivityIndicator color="#FFF" /> : <Text style={styles.joinButtonText}>Unirme y ver perfiles</Text>}
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        emoji={modalInfo?.emoji}
        actions={modalInfo?.actions || []}
        accent={modalInfo?.accent}
        tone={modalInfo?.tone}
        details={modalInfo?.details}
        onClose={() => setModalInfo(null)}
      />

      <AdManagerModal
        visible={modalAnuncioVisible}
        requiredAdsCount={anunciosRequeridos}
        onClose={() => setModalAnuncioVisible(false)}
        onAdFinished={() => {
          if (accionPendiente) {
            accionPendiente();
            setAccionPendiente(null);
          }
        }}
      />
    </ScreenScaffold>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  scrollContent: { paddingBottom: SPACING[6] },
  // ── Header ──
  headerWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING[5], marginBottom: SPACING[4], gap: 12, marginTop: SPACING[2]
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display },
  headerSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 4, lineHeight: 20 },
  avatarWrap: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: COLORS.primario, ...SHADOWS.light },
  avatar: { width: '100%', height: '100%', borderRadius: 25, backgroundColor: COLORS.softRed },
  statusDot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#34A853', borderWidth: 2, borderColor: COLORS.bg },

  // ── Hero Banner ──
  heroCard: { height: 260, borderRadius: 28, overflow: 'hidden', marginHorizontal: SPACING[5], marginBottom: SPACING[4], backgroundColor: COLORS.tarjeta },
  heroImage: { flex: 1 },
  heroImageStyle: { borderRadius: 28 },
  heroOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  destacadoBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  destacadoText: { color: '#F59E0B', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  heroTitle: { color: '#FFF', fontSize: 30, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 4, fontWeight: '500' },
  liveRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  liveAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primario, borderWidth: 2, borderColor: '#FFF' },
  liveCount: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800' },
  playButtonGradient: { borderRadius: 18, padding: 2, ...SHADOWS.medium },
  playButtonInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'transparent', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  playButtonText: { color: '#FFF', fontSize: 15, fontWeight: '900', fontFamily: FONTS.display },
  playButtonPricePill: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 4 },
  playButtonPrice: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // ── Features (Horizontal Pills) ──
  featureRowScrollWrapper: { marginBottom: SPACING[5] },
  featureRowContent: { paddingHorizontal: SPACING[5], gap: 10 },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : COLORS.tarjeta,
    paddingRight: 16, paddingLeft: 6, paddingVertical: 6, borderRadius: 24,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : COLORS.border,
    ...(isDarkMode ? {} : SHADOWS.light)
  },
  featureIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertBadge: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFF' },
  featureTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },

  // ── Secciones ──
  sectionHeader: { paddingHorizontal: SPACING[5], marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  sectionSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  verMasBtn: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(240,68,79,0.1)', borderRadius: 12 },
  verMasText: { color: COLORS.primario, fontSize: 12, fontWeight: '800' },

  // ── Comunidades ──
  comunidadesScroll: { marginBottom: SPACING[5] },
  comunidadesContent: { gap: 14, paddingHorizontal: SPACING[5] },
  comunidadCard: {
    width: 160, height: 190, borderRadius: 24, borderWidth: 1,
    padding: 16, overflow: 'hidden', backgroundColor: COLORS.tarjeta, ...(isDarkMode ? {} : SHADOWS.light)
  },
  cardAccent: { position: 'absolute', right: -40, top: -40, width: 120, height: 120, borderRadius: 60 },
  comunidadTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  activeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  activeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  comunidadTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 4 },
  comunidadSub: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, flex: 1 },
  comunidadBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  memberDot: { width: 8, height: 8, borderRadius: 4 },
  memberText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },

  // ── Trending ──
  trendingContent: { gap: 14, paddingHorizontal: SPACING[5], paddingBottom: 10 },
  trendingCard: { width: 110, height: 150, borderRadius: 20, overflow: 'hidden', backgroundColor: COLORS.border, ...(isDarkMode ? {} : SHADOWS.medium) },
  trendingAvatar: { width: '100%', height: '100%' },
  trendingOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 30, backgroundColor: 'rgba(0,0,0,0.5)' },
  trendingName: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  trendingChip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  trendingChipText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // ── Modal ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  joinModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SPACING[5], paddingBottom: 40 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.inputBg },
  modalTitle: { color: COLORS.textPrimary, fontSize: 28, lineHeight: 34, fontWeight: '900', fontFamily: FONTS.display, marginTop: 20 },
  modalText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 24, marginTop: 12 },
  modalInfoBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(240,68,79,0.1)', padding: 14, borderRadius: 16, marginTop: 20 },
  modalHint: { color: COLORS.primario, fontSize: 13, lineHeight: 18, flex: 1, fontWeight: '600' },
  joinButton: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 24, ...SHADOWS.medium },
  joinButtonText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
});
