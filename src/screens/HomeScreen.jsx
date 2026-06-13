import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { matchService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState, ExpandableSection, GradientButton, InterestChip, SoftCard } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import MatchCelebrationModal from '../components/MatchCelebrationModal';
import PreferenciasModal from '../components/PreferenciasModal';
import SimulatedAdModal from '../components/SimulatedAdModal';
import { inferirRegionPorCiudad, normalizarCiudadChile, normalizarRegionChile } from '../utils/chileLocations';
import { calcularCompatibilidad, emojiCompatibilidad } from '../hooks/useCompatibilidad';
import { FONTS, SHADOWS, SPACING, RADIUS } from '../utils/theme';

const emptyRadar = require('../assets/illustrations/empty-radar.png');

const INTERES_EMOJI = {
  'Café': '☕', 'Fotografía': '📸', 'Montaña': '🏔️', 'Música en vivo': '🎵',
  'Cocinar': '👨‍🍳', 'Gym / Deporte': '💪', 'Gym': '💪', 'Deporte': '💪',
  'Playa': '🏖️', 'Memes': '😂', 'Perros': '🐶', 'Gatos': '🐱',
  'Viajes': '✈️', 'Senderismo': '🥾', 'Cine': '🎬', 'Lectura': '📚',
  'Arte': '🎨', 'Bailar': '💃', 'Yoga': '🧘', 'Cerveza': '🍺',
};

export default function HomeScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [perfilActual, setPerfilActual] = useState(0);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [modalTransparencia, setModalTransparencia] = useState(false);
  const [motivosAlgoritmo, setMotivosAlgoritmo] = useState([]);
  const [matchCelebrado, setMatchCelebrado] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [modalPreferencias, setModalPreferencias] = useState(false);
  const [modalAnuncio, setModalAnuncio] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);

  const iniciarAnuncioYEjecutar = (accionFn) => {
    if (usuario?.isPremium) {
      accionFn();
    } else {
      setAccionPendiente(() => accionFn);
      setModalAnuncio(true);
    }
  };

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
      const recibidos = data.perfiles || data.usuarios || [];
      
      if (!usuario?.isPremium && recibidos.length > 2) {
        recibidos.splice(2, 0, {
          _id: 'AD_MOCK_' + Date.now(),
          nombre: 'Oferta Especial',
          edad: 99,
          ciudad: 'Publicidad',
          foto: 'https://i.imgur.com/vHqJk6K.jpeg',
          fotos: ['https://i.imgur.com/vHqJk6K.jpeg'],
          descripcion: '¡🍔 + 🥤 Envío sin costo! Desliza a la derecha para reclamar tu código en la App.',
          intereses: ['Promoción', 'Descuento'],
          isAd: true
        });
      }

      setPerfiles(recibidos);
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
      if (perfilVisto.isAd) {
        if (tipo === 'like' || tipo === 'superlike') {
          avisar('Oferta', 'Aquí se abriría la página del anunciante.', { emoji: '🍔', accent: '#F59E0B' });
        }
      } else if (tipo === 'like') {
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
      // Para efectos del rediseño fluido, ignoramos errores de conexión al dar swipe y seguimos.
    } finally {
      setProcesandoAccion(false);
    }
  };

  const deshacerUltimoReal = async () => {
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
        avisar('¡Listo!', data.message || 'Ese perfil volverá a aparecer en tu radar.', { emoji: '⏪', accent: '#F59E0B' });
      }
    } catch (error) {
      avisar('Rewind', error.message || 'No hay un perfil reciente para recuperar.', { emoji: '↩️', tone: 'warning' });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const deshacerUltimo = () => {
    iniciarAnuncioYEjecutar(deshacerUltimoReal);
  };

  const activarBoost = () => {
    avisar('Modo Destacado', 'Aparece primero en el radar de tu ciudad durante 30 minutos.', {
      emoji: '🔥',
      tone: 'premium',
      details: 'Incluido en Cahuin a Fondo',
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: '#8B5CF6', onPress: () => setModalInfo(null) },
        {
          label: 'Activar',
          icon: 'sparkles',
          color: '#8B5CF6',
          onPress: () => {
            setModalInfo(null);
            iniciarAnuncioYEjecutar(async () => {
              try {
                const data = await userService.activarBoost();
                if (data?.usuario) actualizarUsuario(data.usuario);
                avisar('Prendido', data?.message || 'Tu perfil queda destacado por 30 minutos.', { emoji: '🔥', accent: '#8B5CF6' });
              } catch (error) {
                avisar('Boost', error.message || 'No pudimos activar destacado.', { emoji: '💎', tone: 'danger' });
              }
            });
          },
        },
      ],
    });
  };

  const abrirTransparencia = () => {
    const p = perfiles[perfilActual];
    if (!p) return;
    const motivos = [];

    if (p.queBuscas === usuario?.queBuscas && p.queBuscas) motivos.push(`Ambos buscan lo mismo: ${p.queBuscas}.`);
    if (p.tipoApego === usuario?.tipoApego && p.tipoApego) motivos.push(`Comparten apego relacional ${p.tipoApego}.`);
    if (typeof p.distanciaKm === 'number' && p.distanciaKm <= 10) motivos.push(`Está muy cerca tuyo: a ${p.distanciaKm} km.`);
    if (p.habitos?.beber === usuario?.habitos?.beber && p.habitos?.beber) motivos.push('Tienen hábitos sociales compatibles.');
    if (motivos.length === 0) motivos.push('El radar detectó una buena vibra general.');

    setMotivosAlgoritmo(motivos);
    setModalTransparencia(true);
  };

  const getCompat = (perfil) => {
    try { return calcularCompatibilidad(usuario, perfil); } catch { return 75; }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={{ marginTop: 20, color: COLORS.primario, fontWeight: '800' }}>Buscando a tu alrededor...</Text>
      </View>
    );
  }

  const perfil = perfiles[perfilActual];

  if (!perfil) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Radar <Text style={{color: COLORS.primario}}>✨</Text></Text>
        </View>
        <EmptyState
          COLORS={COLORS}
          image={emptyRadar}
          title="No hay más perfiles en tu "
          highlight="radar."
          subtitle="Hemos mostrado todos los perfiles disponibles por ahora."
          action={(
            <GradientButton onPress={cargarPerfilesConFiltros} icon="refresh" style={{ width: '100%', marginTop: 20 }}>
              Recargar Radar
            </GradientButton>
          )}
        />
        <CahuinModal visible={!!modalInfo} title={modalInfo?.title} message={modalInfo?.message} emoji={modalInfo?.emoji} actions={modalInfo?.actions || []} accent={modalInfo?.accent} tone={modalInfo?.tone} details={modalInfo?.details} onClose={() => setModalInfo(null)} />
      </SafeAreaView>
    );
  }

  const fotosGaleria = perfil.fotos?.length > 0 ? perfil.fotos : [perfil.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'];
  const compatPorcentaje = getCompat(perfil);
  const compatInfo = emojiCompatibilidad(compatPorcentaje);
  const interesesPerfil = (perfil.intereses || []).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Tarjeta Pantalla Completa Premium ── */}
      <View style={styles.cardWrapper}>
        <ImageBackground source={{ uri: fotosGaleria[fotoIndex] }} style={styles.fullScreenImage} imageStyle={styles.imageRadius}>
          
          {/* Header integrado a la tarjeta */}
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient}>
            <View style={styles.innerHeader}>
              <TouchableOpacity onPress={() => setModalPreferencias(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="options-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.innerHeaderTitle}>Radar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.planPill} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            
            {/* Barras de fotos (Snapchat/Tinder style) */}
            {fotosGaleria.length > 1 && (
              <View style={styles.barrasContainer}>
                {fotosGaleria.map((_, i) => (
                  <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.3)' }]} />
                ))}
              </View>
            )}

            <View style={styles.topBadgesRow}>
              <View style={styles.ubicacionBadge}>
                <Ionicons name="location" size={14} color="#FFF" />
                <Text style={styles.ubicacionBadgeText}>{perfil.ciudad || 'Chile'}</Text>
              </View>
              <TouchableOpacity style={styles.iaButton} onPress={abrirTransparencia}>
                <Ionicons name="sparkles" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Navegación fotos invisible */}
          <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
          <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />

          {/* Contenido inferior */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']} style={styles.bottomGradient}>
            <View style={styles.infoScrollWrap}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Nombre y Edad */}
                <View style={styles.nombreRow}>
                  <Text style={styles.nombre}>{perfil.nombre}<Text style={styles.edad}>, {perfil.edad}</Text></Text>
                  {perfil.verificado && <MaterialCommunityIcons name="check-decagram" size={26} color="#3B82F6" style={{ marginLeft: 8 }} />}
                </View>

                {/* Arquetipo */}
                {(perfil.arquetipoCahuinero || perfil.queBuscas || perfil.arquetipo?.nombre) && (
                  <View style={[styles.arquetipoChip, { backgroundColor: perfil.arquetipo?.color || COLORS.primario }]}>
                    <Text style={styles.arquetipoEmoji}>{perfil.arquetipo?.emoji || '✨'}</Text>
                    <Text style={styles.arquetipoTexto}>{perfil.arquetipoCahuinero || perfil.arquetipo?.nombre || perfil.queBuscas}</Text>
                  </View>
                )}

                {/* Bio */}
                <Text style={styles.bioTexto}>{perfil.descripcion || perfil.biografia || 'En busca de buenas vibras y algo piola.'}</Text>

                {/* Profesion / Universidad si existen */}
                {(perfil.profesion || perfil.universidad) && (
                  <View style={styles.metaRow}>
                    {perfil.profesion && <View style={styles.metaChip}><Ionicons name="briefcase-outline" size={14} color="#FFF" /><Text style={styles.metaText}>{perfil.profesion}</Text></View>}
                    {perfil.universidad && <View style={styles.metaChip}><Ionicons name="school-outline" size={14} color="#FFF" /><Text style={styles.metaText}>{perfil.universidad}</Text></View>}
                  </View>
                )}

                {/* Intereses */}
                {interesesPerfil.length > 0 && (
                  <View style={styles.chipsWrap}>
                    {interesesPerfil.map((interes, idx) => (
                      <View key={idx} style={styles.interesChip}>
                        <Text style={styles.interesEmoji}>{INTERES_EMOJI[interes] || '✨'}</Text>
                        <Text style={styles.interesText}>{interes}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Compatibilidad Compacta */}
                <View style={styles.compatBox}>
                  <View style={styles.compatCircleWrap}>
                    <Text style={styles.compatPercent}>{compatPorcentaje}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compatLabel}>{compatInfo}</Text>
                    <Text style={styles.compatDesc}>Tienen intereses compatibles.</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </LinearGradient>

          {/* ── Botones de acción flotantes ── */}
          <View style={styles.floatingActionRow}>
            <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={deshacerUltimo} disabled={procesandoAccion}>
              <View style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? 'rgba(20,20,20,0.6)' : '#FFF', borderWidth: 1, borderColor: isDarkMode ? '#555' : '#E5E7EB' }]}>
                <Ionicons name="refresh" size={24} color="#F59E0B" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => procesarInteraccion('dislike')} disabled={procesandoAccion}>
              <View style={[styles.actionBtnLarge, { borderColor: '#F0444F', borderWidth: 2, backgroundColor: isDarkMode ? 'rgba(20,20,20,0.4)' : '#FFF' }]}>
                <Ionicons name="close" size={38} color="#F0444F" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={() => procesarInteraccion('superlike')} disabled={procesandoAccion}>
              <View style={[styles.actionBtnSmall, { backgroundColor: isDarkMode ? 'rgba(20,20,20,0.6)' : '#FFF', borderWidth: 1, borderColor: isDarkMode ? '#3B82F6' : '#93C5FD' }]}>
                <Ionicons name="star" size={24} color="#3B82F6" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => procesarInteraccion('like')} disabled={procesandoAccion}>
              <LinearGradient colors={['#F0444F', '#E91E63']} style={styles.actionBtnLarge}>
                <Ionicons name="heart" size={36} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={activarBoost}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.actionBtnSmall}>
                <Ionicons name="flash" size={24} color="#8B5CF6" />
                {usuario?.boostGratisDisponibles > 0 && (
                  <View style={styles.boostBadge}><Text style={styles.boostBadgeText}>{usuario.boostGratisDisponibles}</Text></View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
        </ImageBackground>
      </View>

      {/* ── Modal transparencia ── */}
      <Modal visible={modalTransparencia} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={30} color={COLORS.primario} />
              <Text style={styles.modalTitulo}>Radar IA</Text>
            </View>
            <Text style={styles.modalIntro}>¿Por qué te mostramos a {perfil.nombre}?</Text>
            {motivosAlgoritmo.map((motivo, idx) => (
              <View key={idx} style={styles.motivoRow}>
                <Ionicons name="checkmark-circle" size={20} color="#34A853" />
                <Text style={styles.motivoText}>{motivo}</Text>
              </View>
            ))}
            <GradientButton onPress={() => setModalTransparencia(false)} style={{ marginTop: 24 }}>
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
        compatibilidad={compatPorcentaje}
      />
      <CahuinModal visible={!!modalInfo} title={modalInfo?.title} message={modalInfo?.message} emoji={modalInfo?.emoji} actions={modalInfo?.actions || []} accent={modalInfo?.accent} tone={modalInfo?.tone} details={modalInfo?.details} onClose={() => setModalInfo(null)} />
      <PreferenciasModal 
        visible={modalPreferencias} 
        onClose={() => setModalPreferencias(false)} 
        onSave={() => cargarPerfilesConFiltros()} 
      />

      <SimulatedAdModal
        visible={modalAnuncio}
        onClose={() => setModalAnuncio(false)}
        onAdFinished={() => {
          if (accionPendiente) {
            accionPendiente();
            setAccionPendiente(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDarkMode ? '#000' : COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000' : COLORS.bg },
  header: { padding: SPACING[4], alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },
  
  // ── Tarjeta Full Screen ──
  cardWrapper: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 96,
    borderRadius: 24,
    ...SHADOWS.dark,
    backgroundColor: '#111',
  },
  fullScreenImage: { flex: 1, width: '100%', height: '100%' },
  imageRadius: { borderRadius: 24 },

  // ── Header Interno ──
  topGradient: { padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  innerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  innerHeaderTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', fontFamily: FONTS.display, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  planPill: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  
  barrasContainer: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  
  topBadgesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ubicacionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ubicacionBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  iaButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // ── Zonas Táctiles ──
  zonaTactilIzq: { position: 'absolute', top: 120, bottom: '40%', left: 0, width: '50%', zIndex: 10 },
  zonaTactilDer: { position: 'absolute', top: 120, bottom: '40%', right: 0, width: '50%', zIndex: 10 },

  // ── Bottom Section ──
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  infoScrollWrap: { maxHeight: '100%', paddingHorizontal: 20 },
  
  nombreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nombre: { fontSize: 36, fontWeight: '900', color: '#FFF', fontFamily: FONTS.display, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  edad: { fontSize: 26, fontWeight: '400', fontFamily: FONTS.regular },
  
  arquetipoChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  arquetipoEmoji: { fontSize: 14, marginRight: 6 },
  arquetipoTexto: { color: '#FFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },

  bioTexto: { fontSize: 16, color: 'rgba(255,255,255,0.95)', lineHeight: 24, marginBottom: 16, fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  metaText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  interesChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  interesEmoji: { fontSize: 14 },
  interesText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  compatBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  compatCircleWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  compatPercent: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  compatLabel: { color: '#FFF', fontSize: 14, fontWeight: '900', marginBottom: 2 },
  compatDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // ── Botones Flotantes ──
  floatingActionRow: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  actionBtnSmallWrap: { ...SHADOWS.md },
  actionBtnSmall: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  actionBtnLargeWrap: { ...SHADOWS.lg },
  actionBtnLarge: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  boostBadge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFF' },
  boostBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  // ── Modales ──
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBox: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  modalTitulo: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  modalIntro: { color: COLORS.textMuted, fontSize: 16, lineHeight: 24, marginBottom: 20 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  motivoText: { color: COLORS.textPrimary, fontSize: 15, flex: 1, lineHeight: 22, fontWeight: '600' },
});
