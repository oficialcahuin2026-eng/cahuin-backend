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
import { FONTS, SHADOWS, SPACING } from '../utils/theme';
import {
  GradientButton, ScreenScaffold, SectionTitle, SoftIcon,
} from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';

const rouletteBanner = require('../assets/illustrations/roulette-banner.png');

const features = [
  { title: 'Historias culturales', text: 'Fotos y momentos por 24h.', icon: 'camera', route: 'HistoriasCulturales', emoji: '📸' },
  { title: 'Cahuín del Día', text: 'Vota a las 20:00.', icon: 'chatbubble-ellipses', route: 'CahuinDelDia', emoji: '💬' },
  { title: 'Swipe Panoramas', text: 'Match por destino.', icon: 'ticket', route: 'SwipePanoramas', emoji: '🎫' },
  { title: 'Mapa de Calor', text: 'Zonas con más gente.', icon: 'map', route: 'MapaCalor', emoji: '🗺️' },
  { title: 'Historias de éxito', text: 'Parejas verificadas.', icon: 'heart', route: 'HistoriasExito', emoji: '❤️' },
  { title: 'Mapa Conexiones', text: 'Tu red en el mapa.', icon: 'globe', route: 'MapaConexiones', emoji: '🌐' },
  { title: 'Botella digital', text: 'Mensaje anónimo.', icon: 'mail-open', route: 'Botellas', emoji: '🍾' },
  { title: 'Modo Patrio', text: 'Orgullo regional.', icon: 'flag', route: 'ModoPatrio', emoji: '🇨🇱' },
];

export default function ExplorarScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [cargandoRuleta, setCargandoRuleta] = useState(false);
  const [uniendoId, setUniendoId] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);
  const [metricas, setMetricas] = useState({ ruleta: 0, comunidades: {} });
  const [trendingPerfiles, setTrendingPerfiles] = useState([]);

  const categoriasUnidas = useMemo(() => usuario?.categoriasExplorar || [], [usuario?.categoriasExplorar]);
  const totalUnidas = categoriasUnidas.length;
  const avisar = (title, message, emoji = '🌶️', actions = [], extra = {}) => setModalInfo({ title, message, emoji, actions, ...extra });

  const formatearConteo = (numero) => {
    if (!numero) return '0';
    if (numero >= 1000) return (numero / 1000).toFixed(numero >= 10000 ? 0 : 1) + 'K';
    return String(numero);
  };

  const cargarMetricas = useCallback(async () => {
    try {
      const radar = await userService.descubrir({});
      const perfilesRadar = radar.perfiles || [];
      // Usar primeros 6 perfiles como trending
      setTrendingPerfiles(perfilesRadar.slice(0, 6));

      const respuestas = await Promise.all(
        EXPLORAR_CATEGORIAS.map(async (categoria) => {
          try {
            const data = await userService.descubrir({ categoria: categoria.id });
            return [categoria.id, data.perfiles?.length || 0];
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
      'Te empareja al azar con alguien por 1 hora de chat sin fotos. Cuesta 500 cahuines.',
      '🎭',
      [
        { label: 'Cancelar', variant: 'secondary', color: COLORS.primario, onPress: () => setModalInfo(null) },
        {
          label: 'Girar por 500',
          icon: 'sparkles',
          color: COLORS.primario,
          onPress: async () => {
            if ((usuario?.cahuines || 0) < 500) {
              avisar('Oops', 'No te alcanzan los cahuines por ahora.', '💎', [], { tone: 'premium' });
              return;
            }
            setModalInfo(null);
            setCargandoRuleta(true);
            try {
              const data = await matchService.jugarRuletaCiega();
              actualizarUsuario({ cahuines: (usuario?.cahuines || 0) - 500 });
              avisar('Match ciego', data?.message || 'Ve a tus cahuines. Tienes 1 hora para descubrir quién es.', '🎭', [], { accent: COLORS.primario });
              navigation.navigate('Chat');
            } catch (error) {
              avisar('Error', error.message || 'No pudimos girar la ruleta.', '🌶️', [], { tone: 'danger' });
            } finally {
              setCargandoRuleta(false);
            }
          },
        },
      ],
      { accent: COLORS.primario }
    );
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
      {/* ── Header con subtítulo ── */}
      <View style={styles.headerWrap}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Explorar ✨</Text>
          <Text style={styles.headerSub}>Descubre personas, panoramas y conexiones que te mueven</Text>
        </View>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.avatar} />
          <View style={styles.statusDot} />
        </View>
      </View>

      {/* ── Banner Ruleta a Ciegas Premium ── */}
      <TouchableOpacity activeOpacity={0.92} onPress={girarRuleta} disabled={cargandoRuleta} style={[styles.heroCard, SHADOWS.dark]}>
        <ImageBackground source={rouletteBanner} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
          <LinearGradient colors={['rgba(10,14,24,0.08)', 'rgba(10,14,24,0.85)']} style={styles.heroOverlay}>
            {/* Badge destacado */}
            <View style={styles.destacadoBadge}>
              <Ionicons name="sparkles" size={12} color="#FFD166" />
              <Text style={styles.destacadoText}>DESTACADO</Text>
            </View>

            {cargandoRuleta ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <>
                <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                  <Text style={styles.heroTitle}>Ruleta a Ciegas</Text>
                  <Text style={styles.heroSubtitle}>1 hora de chat sin fotos. Puro bla bla.</Text>

                  {/* Live counter */}
                  <View style={styles.liveRow}>
                    <View style={styles.avatarStack}>
                      {[0, 1, 2].map((item) => (
                        <View key={item} style={[styles.liveAvatar, { marginLeft: item === 0 ? 0 : -10 }]}>
                          <Ionicons name="person" size={14} color="#FFF" />
                        </View>
                      ))}
                    </View>
                    <Text style={styles.liveCount}>{formatearConteo(metricas.ruleta)} conectando ahora</Text>
                  </View>
                </View>

                {/* Botón jugar */}
                <TouchableOpacity style={styles.playButton} onPress={girarRuleta} activeOpacity={0.9}>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                  <Text style={styles.playButtonText}>JUGAR AHORA</Text>
                  <Text style={styles.playButtonPrice}>🔥 500</Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

      {/* ── Comunidades en scroll horizontal ── */}
      <SectionTitle
        title="Comunidades Cahuín"
        subtitle={totalUnidas > 0 ? `${totalUnidas} categorías activas` : 'Únete según lo que buscas'}
        COLORS={COLORS}
        actionText="Ver todas"
        onAction={() => navigation.navigate('EditarPerfil')}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comunidadesScroll} contentContainerStyle={styles.comunidadesContent}>
        {EXPLORAR_CATEGORIAS.map((item) => {
          const joined = categoriasUnidas.includes(item.id);
          const count = metricas.comunidades[item.id] || 0;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => abrirCategoria(item)}
              style={[styles.comunidadCard, { borderColor: joined ? item.color : COLORS.border, backgroundColor: COLORS.tarjeta }]}
            >
              <View style={[styles.cardAccent, { backgroundColor: item.bg }]} />
              <View style={styles.comunidadTop}>
                <SoftIcon name={item.icon} emoji={item.emoji} color={item.color} bg={item.bg} size={50} rounded={25} iconSize={22} />
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

      {/* ── Funciones destacadas (grid compacto) ── */}
      <SectionTitle
        title="Funciones destacadas"
        icon="✨"
        COLORS={COLORS}
        actionText="Ver todas"
        onAction={() => {}}
      />

      <View style={styles.featureGrid}>
        {features.map((item) => (
          <TouchableOpacity key={item.title} style={styles.featureCard} onPress={() => navigation.navigate(item.route)} activeOpacity={0.85}>
            <View style={styles.featureIcon}>
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            </View>
            <Text style={styles.featureTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.featureText} numberOfLines={1}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Perfiles trending ── */}
      {trendingPerfiles.length > 0 && (
        <>
          <SectionTitle
            title="Perfiles trending"
            icon="🔥"
            COLORS={COLORS}
            actionText="Ver más"
            onAction={() => navigation.navigate('Trending')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContent}>
            {trendingPerfiles.map((p, idx) => (
              <TouchableOpacity key={p._id || idx} style={styles.trendingCard} activeOpacity={0.85} onPress={() => navigation.navigate('OtroPerfil', { userId: p._id })}>
                <Image source={{ uri: p.foto || p.fotos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }} style={styles.trendingAvatar} />
                <Text style={styles.trendingName} numberOfLines={1}>{p.nombre}</Text>
                {p.arquetipoCahuinero && (
                  <View style={styles.trendingChip}>
                    <Text style={styles.trendingChipText} numberOfLines={1}>{p.arquetipoCahuinero}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      <View style={{ height: 120 }} />

      {/* ── Modal unirse a categoría ── */}
      <Modal visible={!!categoriaActiva} transparent animationType="fade" onRequestClose={() => setCategoriaActiva(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.joinModal}>
            {categoriaActiva ? (
              <>
                <View style={styles.modalTop}>
                  <SoftIcon name={categoriaActiva.icon} emoji={categoriaActiva.emoji} bg={categoriaActiva.bg} color={categoriaActiva.color} size={68} rounded={34} iconSize={30} />
                  <TouchableOpacity onPress={() => setCategoriaActiva(null)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>Unirte a {categoriaActiva.title}</Text>
                <Text style={styles.modalText}>{categoriaActiva.prompt}</Text>
                <Text style={styles.modalHint}>Te mostraremos perfiles de tu región y dentro de tu distancia configurada. Puedes salir o unirte a más categorías cuando quieras.</Text>
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
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  // ── Header ──
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[5],
    gap: 12,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 34, fontWeight: '900', fontFamily: FONTS.display },
  headerSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: COLORS.primario, ...SHADOWS.light },
  avatar: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: COLORS.softRed },
  statusDot: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#22C55E', borderWidth: 3, borderColor: COLORS.bg },

  // ── Hero Banner ──
  heroCard: { height: 260, borderRadius: 24, overflow: 'hidden', marginBottom: SPACING[2], backgroundColor: COLORS.navy },
  heroImage: { flex: 1 },
  heroImageStyle: { borderRadius: 24 },
  heroOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  destacadoBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
  },
  destacadoText: { color: '#FFD166', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: 0 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 },
  liveRow: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  liveAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(240,68,79,0.9)', borderWidth: 1.5, borderColor: '#FFF' },
  liveCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  playButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primario, borderRadius: 99,
    paddingVertical: 14, paddingHorizontal: 20, marginTop: 14,
    ...SHADOWS.light,
  },
  playButtonText: { color: '#FFF', fontSize: 15, fontWeight: '900', fontFamily: FONTS.display },
  playButtonPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  // ── Comunidades horizontal ──
  comunidadesScroll: { marginBottom: SPACING[2] },
  comunidadesContent: { gap: 12, paddingRight: 20 },
  comunidadCard: {
    width: 170, minHeight: 190, borderRadius: 20, borderWidth: 1.5,
    padding: 14, overflow: 'hidden', ...SHADOWS.light,
  },
  cardAccent: { position: 'absolute', right: -30, top: -40, width: 100, height: 100, borderBottomLeftRadius: 60 },
  comunidadTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  activeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  comunidadTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 4 },
  comunidadSub: { color: COLORS.textMuted, fontSize: 12, lineHeight: 16, flex: 1 },
  comunidadBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  memberDot: { width: 7, height: 7, borderRadius: 4 },
  memberText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },

  // ── Feature grid compacto ──
  featureGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', rowGap: 10, columnGap: 10,
    marginTop: SPACING[2],
  },
  featureCard: {
    width: '23%', minHeight: 100, backgroundColor: COLORS.tarjeta,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    padding: 10, alignItems: 'center', ...SHADOWS.light,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.softRed, marginBottom: 6,
  },
  featureTitle: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 14 },
  featureText: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center', marginTop: 2 },

  // ── Trending ──
  trendingContent: { gap: 14, paddingRight: 20, paddingTop: 4 },
  trendingCard: { alignItems: 'center', width: 80 },
  trendingAvatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: COLORS.softRed, borderWidth: 2.5, borderColor: COLORS.primario,
  },
  trendingName: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  trendingChip: {
    backgroundColor: COLORS.chipBg, borderRadius: 99,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 3,
  },
  trendingChipText: { color: COLORS.chipText, fontSize: 9, fontWeight: '600' },

  // ── Modal ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(16,24,40,0.45)', justifyContent: 'flex-end' },
  joinModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: SPACING[5], paddingBottom: 36, borderWidth: 1, borderColor: COLORS.border },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.textPrimary, fontSize: 30, lineHeight: 36, fontWeight: '900', fontFamily: FONTS.display, marginTop: SPACING[4] },
  modalText: { color: COLORS.textMuted, fontSize: 17, lineHeight: 25, marginTop: SPACING[2] },
  modalHint: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, marginTop: SPACING[4] },
  joinButton: { height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: SPACING[5], ...SHADOWS.light },
  joinButtonText: { color: '#FFF', fontSize: 17, fontWeight: '900', fontFamily: FONTS.display },
});
