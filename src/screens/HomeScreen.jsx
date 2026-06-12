import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { matchService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  CahuinesCounter, EmptyState, ExpandableSection,
  GradientButton, InterestChip, ScreenScaffold, SoftCard,
} from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import MatchCelebrationModal from '../components/MatchCelebrationModal';
import { inferirRegionPorCiudad, normalizarCiudadChile, normalizarRegionChile } from '../utils/chileLocations';
import { calcularCompatibilidad, emojiCompatibilidad } from '../hooks/useCompatibilidad';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const emptyRadar = require('../assets/illustrations/empty-radar.png');

// Mapeo de intereses a emojis
const INTERES_EMOJI = {
  'Café': '☕', 'Fotografía': '📸', 'Montaña': '🏔️', 'Música en vivo': '🎵',
  'Cocinar': '👨‍🍳', 'Gym / Deporte': '💪', 'Gym': '💪', 'Deporte': '💪',
  'Playa': '🏖️', 'Memes': '😂', 'Perros': '🐶', 'Gatos': '🐱',
  'Viajes': '✈️', 'Senderismo': '🥾', 'Cine': '🎬', 'Lectura': '📚',
  'Arte': '🎨', 'Bailar': '💃', 'Yoga': '🧘', 'Cerveza': '🍺',
};

export default function HomeScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [perfilActual, setPerfilActual] = useState(0);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [modalTransparencia, setModalTransparencia] = useState(false);
  const [motivosAlgoritmo, setMotivosAlgoritmo] = useState([]);
  const [matchCelebrado, setMatchCelebrado] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });

  useEffect(() => { iniciarRadarGPS(); }, []);
  useEffect(() => { setFotoIndex(0); }, [perfilActual]);

  const iniciarRadarGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const ubicacion = await Location.getCurrentPositionAsync({});
        const ubicacionPerfil = { latitud: ubicacion.coords.latitude, longitud: ubicacion.coords.longitude };
        try {
          const [geo] = await Location.reverseGeocodeAsync(ubicacion.coords);
          const ciudadDetectada = normalizarCiudadChile(geo?.city || geo?.subregion || geo?.district || '');
          const regionDetectada = normalizarRegionChile(geo?.region || inferirRegionPorCiudad(ciudadDetectada));
          const ciudadActual = usuario?.ciudad;
          if (ciudadDetectada && (!ciudadActual || ciudadActual === 'Por definir' || ciudadActual === 'Santiago' || ciudadActual === ciudadDetectada)) {
            ubicacionPerfil.ciudad = ciudadDetectada;
            ubicacionPerfil.region = regionDetectada || inferirRegionPorCiudad(ciudadDetectada);
          }
        } catch {
          console.log('No se pudo traducir GPS a ciudad.');
        }
        const data = await userService.actualizar(ubicacionPerfil);
        if (data?.usuario) actualizarUsuario(data.usuario);
      }
      cargarPerfilesConFiltros();
    } catch {
      cargarPerfilesConFiltros();
    }
  };

  const cargarPerfilesConFiltros = async () => {
    try {
      const data = await userService.descubrir({});
      setPerfiles(data.perfiles || []);
    } catch {
      setPerfiles([]);
    } finally {
      setCargando(false);
    }
  };

  const procesarInteraccion = async (tipo) => {
    if (perfilActual >= perfiles.length || procesandoAccion) return;
    const perfilVisto = perfiles[perfilActual];
    setProcesandoAccion(true);
    setPerfilActual((prev) => prev + 1);

    try {
      if (tipo === 'like') {
        const data = await matchService.darLike(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
        if (data?.esMatch) {
          setMatchCelebrado(perfilVisto);
        }
      } else if (tipo === 'superlike') {
        const data = await matchService.darSuperLike(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
        if (data?.esMatch) setMatchCelebrado(perfilVisto);
      } else {
        const data = await matchService.pasar(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
      }
    } catch (error) {
      console.log(error.message);
      avisar('Oops', error.message || 'No pudimos procesar la acción.', {
        emoji: '🌶️',
        tone: 'danger',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const deshacerUltimo = async () => {
    if (procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const data = await matchService.deshacerUltimoDislike();
      if (data?.perfil) {
        setPerfiles((prev) => {
          const copia = [...prev];
          copia.splice(perfilActual, 0, data.perfil);
          return copia;
        });
        if (data?.usuario) actualizarUsuario(data.usuario);
        avisar('¡Listo!', data.message || 'Reencuentro activado. Ese perfil volverá a aparecer en tu radar.', {
          emoji: '⏪',
          accent: '#F0444F',
        });
      }
    } catch (error) {
      avisar('Rewind', error.message || 'No hay un perfil reciente para recuperar.', {
        emoji: '↩️',
        tone: 'warning',
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const activarBoost = () => {
    avisar('Modo Destacado', 'Aparece primero en el radar de tu ciudad durante 30 minutos.', {
      emoji: '🔥',
      tone: 'premium',
      details: `500 Cahuines\nTu saldo actual: ${usuario?.cahuines || 0} Cahuines`,
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: '#F0444F', onPress: () => setModalInfo(null) },
        {
          label: 'Activar',
          icon: 'sparkles',
          color: '#F0444F',
          onPress: async () => {
            setModalInfo(null);
            try {
              const data = await userService.activarBoost();
              if (data?.usuario) actualizarUsuario(data.usuario);
              avisar('Prendido', data?.message || 'Tu perfil queda destacado por 30 minutos.', {
                emoji: '🔥',
                accent: '#F0444F',
              });
            } catch (error) {
              avisar('Boost', error.message || 'No pudimos activar destacado.', {
                emoji: '💎',
                tone: 'danger',
              });
            }
          },
        },
      ],
    });
  };

  const avisarmeMasTarde = () => {
    avisar('Te avisamos', 'Cuando aparezcan nuevos perfiles en tu ciudad, Cahuín te lo recordará.', {
      emoji: '🔔',
      accent: '#F0444F',
    });
  };

  const abrirTransparencia = () => {
    const p = perfiles[perfilActual];
    const motivos = [];

    if (p.queBuscas === usuario?.queBuscas && p.queBuscas) motivos.push(`Ambos buscan lo mismo: ${p.queBuscas}.`);
    if (p.tipoApego === usuario?.tipoApego && p.tipoApego) motivos.push(`Comparten apego relacional ${p.tipoApego}.`);
    if (typeof p.distanciaKm === 'number' && p.distanciaKm <= 10) motivos.push(`Está muy cerca tuyo: a ${p.distanciaKm} km.`);
    if (p.habitos?.beber === usuario?.habitos?.beber && p.habitos?.beber) motivos.push('Tienen hábitos sociales compatibles.');
    if (motivos.length === 0) motivos.push('El radar detectó una buena vibra general.');

    setMotivosAlgoritmo(motivos);
    setModalTransparencia(true);
  };

  // ── Calcular compatibilidad ──
  const getCompat = (perfil) => {
    try {
      return calcularCompatibilidad(usuario, perfil);
    } catch { return 75; }
  };

  if (cargando) {
    return (
      <ScreenScaffold COLORS={COLORS} scroll={false}>
        <View style={styles.centro}><ActivityIndicator size="large" color={COLORS.primario} /></View>
      </ScreenScaffold>
    );
  }

  const perfil = perfiles[perfilActual];

  if (!perfil) {
    return (
      <ScreenScaffold COLORS={COLORS}>
        <EmptyState
          COLORS={COLORS}
          image={emptyRadar}
          title="No hay más perfiles en tu "
          highlight="radar."
          subtitle="Hemos mostrado todos los perfiles disponibles por ahora."
          action={(
            <>
              <SoftCard COLORS={COLORS} style={styles.emptyHint}>
                <Text style={styles.emptyHintIcon}>✨</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyHintTitle}>¿Quieres ver más?</Text>
                  <Text style={styles.emptyHintText}>Intenta más tarde o amplía tus preferencias para descubrir nuevas personas.</Text>
                </View>
                <TouchableOpacity onPress={cargarPerfilesConFiltros} style={styles.emptyIconButton}>
                  <Ionicons name="refresh" size={22} color="#8B5CF6" />
                </TouchableOpacity>
              </SoftCard>
              <GradientButton onPress={avisarmeMasTarde} icon="notifications-outline" colors={['#FFFFFF', '#FFFFFF']} textStyle={styles.emptyButtonText} style={styles.emptyButton}>
                Avisarme más tarde
              </GradientButton>
            </>
          )}
        />
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

  const fotosGaleria = perfil.fotos?.length > 0 ? perfil.fotos : [perfil.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'];
  const compatPorcentaje = getCompat(perfil);
  const compatInfo = emojiCompatibilidad(compatPorcentaje);
  const interesesPerfil = (perfil.intereses || []).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header: Radar + subtítulo + CahuinesCounter ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Radar ✨</Text>
          <Text style={styles.headerSub}>Descubre gente cerca</Text>
        </View>
        <CahuinesCounter cantidad={usuario?.cahuines || 0} COLORS={COLORS} onPress={() => navigation.navigate('Premium')} />
      </View>

      {/* ── Card principal ── */}
      <View style={styles.tarjetaContenedor}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Galería de fotos */}
          <View style={styles.contenedorGaleria}>
            <Image source={{ uri: fotosGaleria[fotoIndex] }} style={styles.fotoPrincipal} />

            {/* Barras de fotos */}
            {fotosGaleria.length > 1 ? (
              <View style={styles.barrasContainer}>
                {fotosGaleria.map((_, i) => (
                  <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
                ))}
              </View>
            ) : null}

            {/* Zonas táctiles */}
            <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
            <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />

            {/* Badge ubicación flotante */}
            <View style={styles.ubicacionBadge}>
              <Ionicons name="location" size={14} color="#FFF" />
              <Text style={styles.ubicacionBadgeText}>{perfil.ciudad || 'Chile'}</Text>
              {perfil.distanciaKm && <Text style={styles.ubicacionBadgeDist}>· A {perfil.distanciaKm} km</Text>}
            </View>

            {/* Botón transparencia IA */}
            <TouchableOpacity style={styles.iaButton} onPress={abrirTransparencia}>
              <Ionicons name="sparkles" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* Gradient overlay para texto */}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.gradientOverlay} />

            {/* Nombre sobre la foto */}
            <View style={styles.nombreOverlay}>
              <Text style={styles.nombre}>{perfil.nombre}, {perfil.edad}</Text>
              {perfil.verificado && <MaterialCommunityIcons name="check-decagram" size={22} color="#3B82F6" style={{ marginLeft: 6 }} />}
            </View>
          </View>

          {/* Info section */}
          <View style={styles.infoContainer}>
            {/* Subtítulo de arquetipo */}
            {(perfil.arquetipoCahuinero || perfil.queBuscas) && (
              <View style={styles.subtipoRow}>
                <Ionicons name="ribbon" size={14} color={COLORS.primario} />
                <Text style={styles.subtipoText}>{perfil.arquetipoCahuinero || perfil.queBuscas}</Text>
              </View>
            )}

            {/* Descripción */}
            <Text style={styles.bioTexto}>{perfil.descripcion || 'En busca de buenas conversaciones.'}</Text>

            {/* Chips de intereses */}
            {interesesPerfil.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
                {interesesPerfil.map((interes, idx) => (
                  <InterestChip key={idx} emoji={INTERES_EMOJI[interes] || '✨'} text={interes} COLORS={COLORS} />
                ))}
              </ScrollView>
            )}

            {/* Compatibilidad expandible */}
            <ExpandableSection title={`Buena onda ✨`} icon="💜" COLORS={COLORS}>
              <View style={styles.compatContent}>
                <View style={styles.compatCircleWrap}>
                  <Text style={[styles.compatPercent, { color: COLORS.compatHigh }]}>{compatPorcentaje}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.compatLabel, { color: COLORS.textPrimary }]}>{compatInfo}</Text>
                  <Text style={[styles.compatDesc, { color: COLORS.textMuted }]}>
                    Tienen intereses en común y estilos de vida compatibles.
                  </Text>
                </View>
              </View>
            </ExpandableSection>

            {/* Por qué te la mostramos */}
            <ExpandableSection title="¿Por qué te la mostramos?" icon="✨" COLORS={COLORS}>
              {motivosAlgoritmo.length > 0 ? motivosAlgoritmo.map((motivo, idx) => (
                <View key={idx} style={styles.motivoRowInline}>
                  <Ionicons name="checkmark-circle" size={18} color="#34A853" />
                  <Text style={[styles.motivoTextInline, { color: COLORS.textPrimary }]}>{motivo}</Text>
                </View>
              )) : (
                <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>
                  Toca el botón ✨ en la foto para ver los motivos del algoritmo.
                </Text>
              )}
            </ExpandableSection>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* ── Botones de acción con labels ── */}
        <View style={styles.botonesOverlay}>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={deshacerUltimo} disabled={procesandoAccion}>
            <View style={[styles.btnAccion, styles.btnSmallAction]}>
              <Ionicons name="arrow-undo" size={22} color="#F59E0B" />
            </View>
            <Text style={[styles.btnLabel, { color: COLORS.textMuted }]}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => procesarInteraccion('dislike')} disabled={procesandoAccion}>
            <View style={[styles.btnAccion, styles.btnDislike]}>
              <Ionicons name="close" size={30} color="#F0444F" />
            </View>
            <Text style={[styles.btnLabel, { color: COLORS.textMuted }]}>Nope</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => procesarInteraccion('superlike')} disabled={procesandoAccion}>
            <View style={[styles.btnAccion, styles.btnSuperLike]}>
              <Ionicons name="star" size={24} color="#FFF" />
            </View>
            <Text style={[styles.btnLabel, { color: COLORS.textMuted }]}>Súper Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => procesarInteraccion('like')} disabled={procesandoAccion}>
            <View style={[styles.btnAccion, styles.btnLike]}>
              <Ionicons name="heart" size={34} color="#FFF" />
            </View>
            <Text style={[styles.btnLabel, { color: COLORS.textMuted }]}>Me gusta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ alignItems: 'center' }} onPress={activarBoost}>
            <View style={[styles.btnAccion, styles.btnSmallAction]}>
              <Ionicons name="flash" size={22} color="#8B5CF6" />
              {usuario?.boostGratisDisponibles > 0 && (
                <View style={styles.boostBadge}>
                  <Text style={styles.boostBadgeText}>{usuario.boostGratisDisponibles}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.btnLabel, { color: COLORS.textMuted }]}>Boost</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Modal transparencia ── */}
      <Modal visible={modalTransparencia} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={30} color={COLORS.primario} />
              <Text style={styles.modalTitulo}>Algoritmo transparente</Text>
            </View>
            <Text style={styles.modalIntro}>Te mostramos a {perfil.nombre} porque Cahuín detectó estas pistas de compatibilidad:</Text>
            {motivosAlgoritmo.map((motivo, idx) => (
              <View key={idx} style={styles.motivoRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34A853" />
                <Text style={styles.motivoText}>{motivo}</Text>
              </View>
            ))}
            <GradientButton onPress={() => setModalTransparencia(false)} style={{ marginTop: 18 }}>
              Entendido
            </GradientButton>
          </View>
        </View>
      </Modal>

      <MatchCelebrationModal
        visible={!!matchCelebrado}
        onClose={() => {
          setMatchCelebrado(null);
          navigation.navigate('Chat');
        }}
        miFoto={usuario?.foto || usuario?.fotos?.[0]}
        suFoto={matchCelebrado?.foto || matchCelebrado?.fotos?.[0]}
        suNombre={matchCelebrado?.nombre}
        compatibilidad={85}
      />
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
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },
  headerSub: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },

  // ── Card principal ──
  tarjetaContenedor: {
    flex: 1,
    backgroundColor: COLORS.tarjeta,
    borderRadius: 28,
    marginHorizontal: 12,
    marginBottom: 106,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  scrollContent: { flexGrow: 1 },

  // ── Galería ──
  contenedorGaleria: { width: '100%', height: 440, position: 'relative' },
  fotoPrincipal: { width: '100%', height: '100%', resizeMode: 'cover' },
  barrasContainer: { position: 'absolute', top: 15, left: 12, right: 12, flexDirection: 'row', gap: 5, zIndex: 5 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  zonaTactilIzq: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 2 },
  zonaTactilDer: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 2 },

  // ── Badges flotantes sobre foto ──
  ubicacionBadge: {
    position: 'absolute', top: 16, left: 16, zIndex: 5,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 99, gap: 4,
  },
  ubicacionBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  ubicacionBadgeDist: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  iaButton: {
    position: 'absolute', top: 16, right: 16, zIndex: 5,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },

  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
    zIndex: 1,
  },

  nombreOverlay: {
    position: 'absolute', bottom: 16, left: 22, zIndex: 3,
    flexDirection: 'row', alignItems: 'center',
  },
  nombre: { fontSize: 30, fontWeight: '900', color: '#FFF', fontFamily: FONTS.display, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },

  // ── Info section ──
  infoContainer: { padding: 20, backgroundColor: COLORS.tarjeta },
  subtipoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  subtipoText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  bioTexto: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 12 },

  // ── Interest chips ──
  chipsScroll: { marginBottom: 14 },
  chipsContent: { gap: 8 },

  // ── Compatibilidad ──
  compatContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compatCircleWrap: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: COLORS.compatHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  compatPercent: { fontSize: 16, fontWeight: '900', fontFamily: FONTS.display },
  compatLabel: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  compatDesc: { fontSize: 13, lineHeight: 18 },

  // ── Motivos inline ──
  motivoRowInline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  motivoTextInline: { fontSize: 14, flex: 1, lineHeight: 20 },

  // ── Action buttons ──
  botonesOverlay: {
    position: 'absolute', bottom: 18, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8,
  },
  btnAccion: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.tarjeta, ...SHADOWS.medium,
  },
  btnLike: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primario,
    shadowColor: COLORS.primario, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  btnDislike: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: COLORS.border },
  btnSuperLike: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#3B82F6' },
  btnSmallAction: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: COLORS.border },
  btnLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  boostBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primario,
    alignItems: 'center', justifyContent: 'center',
  },
  boostBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  // ── Modal transparencia ──
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.55)' },
  modalBox: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  modalTitulo: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  modalIntro: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  motivoText: { color: COLORS.textPrimary, fontSize: 14, flex: 1, lineHeight: 20 },

  // ── Empty state ──
  emptyHint: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, width: '100%', backgroundColor: COLORS.softPurple },
  emptyHintIcon: { fontSize: 26 },
  emptyHintTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  emptyHintText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 2 },
  emptyIconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta },
  emptyButton: { width: '100%', marginTop: 28, borderWidth: 1.5, borderColor: 'rgba(240,68,79,0.35)', shadowOpacity: 0 },
  emptyButtonText: { color: COLORS.primario },
});
