import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
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
import { GradientButton, ScreenHeader, ScreenScaffold, SoftIcon } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';

const rouletteBanner = require('../assets/illustrations/roulette-banner.png');

const features = [
  { title: 'Historias culturales', text: 'Sube foto, lugar y comentarios por 24h.', icon: 'camera', route: 'HistoriasCulturales' },
  { title: 'Cahuín del Día', text: 'Vota a las 20:00 y conecta por humor.', icon: 'chatbubble-ellipses', route: 'CahuinDelDia' },
  { title: 'Swipe de Panoramas', text: 'Haz match por destino regional.', icon: 'ticket', route: 'SwipePanoramas' },
  { title: 'Historias de éxito', text: 'Solo historias verificadas por el equipo.', icon: 'heart', route: 'HistoriasExito' },
  { title: 'Botella digital', text: 'Un mensaje anónimo flotando por Chile.', icon: 'mail-open', route: 'Botellas' },
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
      setMetricas({ ruleta: radar.perfiles?.length || 0, comunidades });
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
      <ScreenHeader
        title="Explorar"
        right={(
          <View style={styles.avatarWrap}>
            <Image source={{ uri: usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.avatar} />
            <View style={styles.statusDot} />
          </View>
        )}
      />

      <TouchableOpacity activeOpacity={0.92} onPress={girarRuleta} disabled={cargandoRuleta} style={[styles.heroCard, SHADOWS.dark]}>
        <ImageBackground source={rouletteBanner} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
          <LinearGradient colors={['rgba(10,14,24,0.12)', 'rgba(10,14,24,0.82)']} style={styles.heroOverlay}>
            {cargandoRuleta ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <>
                <Ionicons name="happy" size={48} color="#FFF" style={{ marginBottom: 8 }} />
                <Text style={styles.heroTitle}>Ruleta a Ciegas</Text>
                <Text style={styles.heroSubtitle}>1 hora de chat sin fotos. Puro bla bla.</Text>
                <View style={styles.liveRow}>
                  <View style={styles.avatarStack}>
                    {[0, 1, 2].map((item) => (
                      <View key={item} style={[styles.liveAvatar, { marginLeft: item === 0 ? 0 : -10 }]}>
                        <Ionicons name="person" size={14} color="#FFF" />
                      </View>
                    ))}
                  </View>
                  <View>
                    <Text style={styles.liveCount}>{formatearConteo(metricas.ruleta)}</Text>
                    <Text style={styles.liveLabel}>cerca de ti</Text>
                  </View>
                </View>
                <View style={styles.pricePill}>
                  <Ionicons name="flame" size={25} color="#FFD7DA" />
                  <Text style={styles.priceText}>500</Text>
                </View>
              </>
            )}
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Comunidades Cahuín</Text>
          <Text style={styles.sectionSubtitle}>
            {totalUnidas > 0 ? `${totalUnidas} categorías activas en tu radar` : `Únete según lo que buscas y tu distancia (${usuario?.distanciaMax || 50} km).`}
          </Text>
        </View>
        <TouchableOpacity style={styles.editPrefs} onPress={() => navigation.navigate('EditarPerfil')}>
          <Ionicons name="options" size={18} color={COLORS.primario} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {EXPLORAR_CATEGORIAS.map((item) => {
          const joined = categoriasUnidas.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => abrirCategoria(item)}
              style={[styles.categoryCard, { borderColor: joined ? item.color : COLORS.border, backgroundColor: COLORS.tarjeta }, SHADOWS.light]}
            >
              <View style={[styles.cardAccent, { backgroundColor: item.bg }]} />
              <SoftIcon name={item.icon} emoji={item.emoji} color={item.color} bg={item.bg} size={62} rounded={31} iconSize={26} />
              {joined ? (
                <View style={[styles.joinedPill, { backgroundColor: item.color }]}>
                  <Ionicons name="checkmark" size={13} color="#FFF" />
                  <Text style={styles.joinedText}>Dentro</Text>
                </View>
              ) : null}
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
              <View style={styles.memberRow}>
                <View style={[styles.memberDot, { backgroundColor: item.color }]} />
                <Text style={styles.memberText}>{formatearConteo(metricas.comunidades[item.id] || 0)} dentro de tu distancia</Text>
              </View>
              <View style={[styles.arrowCircle, { borderColor: item.color }]}>
                <Ionicons name={joined ? 'people' : 'add'} size={20} color={item.color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <GradientButton icon="sparkles" style={styles.wideButton} onPress={() => navigation.navigate('Trending')}>
        Ver perfiles trending
      </GradientButton>

      <View style={styles.featureGrid}>
        {features.map((item) => (
          <TouchableOpacity key={item.title} style={styles.featureCard} onPress={() => navigation.navigate(item.route)}>
            <View style={styles.featureIcon}>
              <Ionicons name={item.icon} size={24} color={COLORS.primario} />
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureText}>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
  avatarWrap: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: '#FFF', ...SHADOWS.light },
  avatar: { width: '100%', height: '100%', borderRadius: 29, backgroundColor: COLORS.softRed },
  statusDot: { position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primario, borderWidth: 3, borderColor: '#FFF' },
  heroCard: { height: 250, borderRadius: 28, overflow: 'hidden', marginBottom: SPACING[6], backgroundColor: COLORS.navy },
  heroImage: { flex: 1 },
  heroImageStyle: { borderRadius: 28 },
  heroOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING[5] },
  heroTitle: { color: '#FFF', fontSize: 34, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center', letterSpacing: 0 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 17, textAlign: 'center', marginTop: 8 },
  liveRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: 'rgba(10,14,24,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  liveAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(240,68,79,0.9)', borderWidth: 1.5, borderColor: '#FFF' },
  liveCount: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  liveLabel: { color: 'rgba(255,255,255,0.74)', fontSize: 11, fontWeight: '800', marginTop: 1 },
  pricePill: { marginTop: 24, minWidth: 130, height: 56, borderRadius: 28, backgroundColor: COLORS.primario, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  priceText: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING[4] },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 3, maxWidth: 260 },
  editPrefs: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.softRed, borderWidth: 1, borderColor: COLORS.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING[4] },
  categoryCard: { width: '48%', minHeight: 228, borderRadius: 26, borderWidth: 1.5, padding: SPACING[4], overflow: 'hidden' },
  cardAccent: { position: 'absolute', right: -34, top: -44, width: 120, height: 120, borderBottomLeftRadius: 70 },
  joinedPill: { position: 'absolute', top: 14, right: 14, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  joinedText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  categoryTitle: { color: COLORS.textPrimary, fontSize: 21, lineHeight: 26, fontWeight: '900', fontFamily: FONTS.display, marginTop: SPACING[6], letterSpacing: 0 },
  categorySubtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: SPACING[2], paddingRight: 8 },
  memberRow: { position: 'absolute', left: SPACING[4], bottom: SPACING[4], right: 58, minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  memberDot: { width: 8, height: 8, borderRadius: 4 },
  memberText: { color: COLORS.textMuted, fontSize: 11, lineHeight: 14, fontWeight: '900', flex: 1 },
  arrowCircle: { position: 'absolute', right: SPACING[4], bottom: SPACING[4], width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  wideButton: { marginTop: SPACING[6] },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING[3], marginTop: SPACING[5], marginBottom: 110 },
  featureCard: { width: '48%', minHeight: 150, backgroundColor: COLORS.tarjeta, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4], ...SHADOWS.light },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.softRed, marginBottom: 10 },
  featureTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  featureText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 },
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


