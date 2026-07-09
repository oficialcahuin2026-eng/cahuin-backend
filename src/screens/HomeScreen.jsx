import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import { matchService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState, ExpandableSection, GradientButton, InterestChip, SoftCard } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import MatchCelebrationModal from '../components/MatchCelebrationModal';
import PreferenciasModal from '../components/PreferenciasModal';
import AdManagerModal from '../components/AdManagerModal';
import { useSuperLikesDiarios } from '../hooks/useSuperLikesDiarios';
import { consultarPermisoUbicacion, detectarUbicacionChile, obtenerCoordenadasActuales } from '../utils/location';
import { calcularCompatibilidad, emojiCompatibilidad } from '../hooks/useCompatibilidad';
import { FONTS, SHADOWS, SPACING, RADIUS } from '../utils/theme';

const emptyRadar = require('../assets/illustrations/empty-radar.png');

// Sin interes emoji

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
  const [modalAnuncioVisible, setModalAnuncioVisible] = useState(false);
  const [anunciosRequeridos, setAnunciosRequeridos] = useState(1);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const { usadosHoy, registrarSuperLike } = useSuperLikesDiarios();

  const iniciarAnuncioYEjecutar = (accionFn, cantAds = 1) => {
    if (cantAds === 0) {
      accionFn();
    } else {
      setAccionPendiente(() => accionFn);
      setAnunciosRequeridos(cantAds);
      setModalAnuncioVisible(true);
    }
  };

  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });

  useEffect(() => { iniciarRadarGPS(); }, []);
  useEffect(() => { setFotoIndex(0); }, [perfilActual]);

  const iniciarRadarGPS = async () => {
    try {
      if (usuario?.latitud && usuario?.longitud) {
        cargarPerfilesConFiltros();
        return;
      }

      const { status } = await consultarPermisoUbicacion();
      if (status === 'granted') {
        const ubicacion = await obtenerCoordenadasActuales();
        const ubicacionPerfil = { latitud: ubicacion.coords.latitude, longitud: ubicacion.coords.longitude };
        try {
          const ubicacionDetectada = await detectarUbicacionChile(ubicacion.coords);
          const ciudadActual = usuario?.ciudad;
          if (
            ubicacionDetectada?.ciudad &&
            (!ciudadActual || ciudadActual === 'Por definir' || ciudadActual === 'Santiago' || ciudadActual === ubicacionDetectada.ciudad)
          ) {
            ubicacionPerfil.ciudad = ubicacionDetectada.ciudad;
            ubicacionPerfil.region = ubicacionDetectada.region;
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
      
      // Inyección de mock publicitario general
      if (!usuario?.isPremium && recibidos.length > 2) {
        recibidos.splice(2, 0, {
          _id: 'AD_MOCK_' + Date.now(),
          nombre: 'Oferta Especial',
          edad: 99,
          ciudad: 'Publicidad',
          foto: 'https://i.imgur.com/vHqJk6K.jpeg',
          fotos: ['https://i.imgur.com/vHqJk6K.jpeg'],
          descripcion: '¡Promo especial de envío sin costo! Desliza a la derecha para reclamar tu código.',
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
          avisar('Oferta', 'Aquí se abriría la página del anunciante.', { icon: 'star', accent: '#F59E0B' });
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
        avisar('¡Listo!', data.message || 'Ese perfil volverá a aparecer en tu radar.', { accent: '#F59E0B' });
      }
    } catch (error) {
      avisar('Rewind', error.message || 'No hay un perfil reciente para recuperar.', { tone: 'warning' });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const deshacerUltimo = () => {
    const cantAds = usuario?.isPremium ? 0 : 1;
    iniciarAnuncioYEjecutar(deshacerUltimoReal, cantAds);
  };

  const intentarSuperLike = () => {
    const plan = usuario?.premiumPlan || 'free';
    const isAFondo = plan === 'a_fondo' || plan === 'gold' || plan === 'platinum';
    const isPiola = plan === 'piola';

    const maxFree = isAFondo ? 3 : (isPiola ? 1 : 0);
    const hasFree = usadosHoy < maxFree;

    if (hasFree) {
      registrarSuperLike();
      procesarInteraccion('superlike');
    } else {
      const cantAds = isAFondo || isPiola ? 1 : 2;
      avisar('Super Like', 'Destaca tu perfil con una estrella azul vibrante.', {
        tone: 'premium',
        details: isAFondo ? `Super Likes diarios agotados (${maxFree}/${maxFree})` : (isPiola ? `Super Likes diarios agotados (${maxFree}/${maxFree})` : 'Cuesta 2 anuncios'),
        actions: [
          { label: 'Cancelar', variant: 'secondary', color: '#8B5CF6', onPress: () => setModalInfo(null) },
          { 
            label: `Ver ${cantAds} Anuncio${cantAds > 1 ? 's' : ''}`, 
            icon: 'play',
            color: '#8B5CF6',
            onPress: () => { 
              setModalInfo(null); 
              iniciarAnuncioYEjecutar(() => {
                registrarSuperLike();
                procesarInteraccion('superlike');
              }, cantAds); 
            } 
          }
        ]
      });
    }
  };

  const activarBoost = () => {
    const plan = usuario?.premiumPlan || 'free';
    const isAFondo = plan === 'a_fondo' || plan === 'gold' || plan === 'platinum';
    const isPiola = plan === 'piola';

    const cantAds = isAFondo ? 0 : (isPiola ? 1 : 2);

    avisar('Modo Destacado', 'Aparece primero en el radar de tu ciudad durante 30 minutos.', {
      tone: 'premium',
      details: isAFondo ? 'Incluido en tu plan A Fondo' : (isPiola ? 'Para ti solo cuesta 1 anuncio' : 'Cuesta 2 anuncios'),
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: '#8B5CF6', onPress: () => setModalInfo(null) },
        {
          label: isAFondo ? 'Activar' : `Ver ${cantAds} Anuncio${cantAds > 1 ? 's' : ''}`,
          icon: isAFondo ? 'sparkles' : 'play',
          color: '#8B5CF6',
          onPress: () => {
            setModalInfo(null);
            iniciarAnuncioYEjecutar(async () => {
              try {
                const data = await userService.activarBoost();
                if (data?.usuario) actualizarUsuario(data.usuario);
                avisar('Prendido', data?.message || 'Tu perfil queda destacado por 30 minutos.', { accent: '#8B5CF6' });
              } catch (error) {
                avisar('Boost', error.message || 'No pudimos activar destacado.', { tone: 'danger' });
              }
            }, cantAds);
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
        <CahuinModal visible={!!modalInfo} title={modalInfo?.title} message={modalInfo?.message} icon={modalInfo?.icon} actions={modalInfo?.actions || []} accent={modalInfo?.accent} tone={modalInfo?.tone} details={modalInfo?.details} onClose={() => setModalInfo(null)} />
      </SafeAreaView>
    );
  }

  const fotosGaleria = perfil.fotos?.length > 0 ? perfil.fotos : [perfil.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'];
  const compatPorcentaje = getCompat(perfil);
  const compatInfo = emojiCompatibilidad(compatPorcentaje);
  const interesesPerfil = (perfil.intereses || []).slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>

      {isDarkMode ? (
        // ── DARK MODE: Full Screen Tinder Card ──
        <View style={styles.cardWrapper}>
          <ImageBackground source={{ uri: fotosGaleria[fotoIndex] }} style={styles.fullScreenImage} imageStyle={styles.imageRadius}>
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient}>
              <View style={styles.innerHeader}>
                  <TouchableOpacity onPress={() => setModalPreferencias(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="options-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                  </TouchableOpacity>
                <TouchableOpacity style={styles.planPill} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                  <Ionicons name="sparkles" size={16} color="#F59E0B" />
                </TouchableOpacity>
              </View>
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
            <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
            <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']} style={styles.bottomGradient}>
              <View style={styles.infoScrollWrap}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                  <View style={styles.nombreRow}>
                    <Text style={styles.nombre}>{perfil.nombre}<Text style={styles.edad}>, {perfil.edad}</Text></Text>
                    {perfil.verificado && <MaterialCommunityIcons name="check-decagram" size={26} color="#3B82F6" style={{ marginLeft: 8 }} />}
                  </View>
                  {(perfil.arquetipoCahuinero || perfil.arquetipo?.nombre) && (
                    <View style={[styles.arquetipoChip, { backgroundColor: perfil.arquetipo?.color || COLORS.primario }]}>
                      <Text style={styles.arquetipoTexto}>{perfil.arquetipoCahuinero || perfil.arquetipo?.nombre}</Text>
                    </View>
                  )}
                  <Text style={styles.bioTexto}>{perfil.descripcion || perfil.biografia || 'En busca de buenas vibras y algo piola.'}</Text>
                  {(perfil.profesion || perfil.universidad) && (
                    <View style={styles.metaRow}>
                      {perfil.profesion && <View style={styles.metaChip}><Ionicons name="briefcase-outline" size={14} color="#FFF" /><Text style={styles.metaText}>{perfil.profesion}</Text></View>}
                      {perfil.universidad && <View style={styles.metaChip}><Ionicons name="school-outline" size={14} color="#FFF" /><Text style={styles.metaText}>{perfil.universidad}</Text></View>}
                    </View>
                  )}
                  {interesesPerfil.length > 0 && (
                    <View style={styles.chipsWrap}>
                      {interesesPerfil.map((interes, idx) => (
                        <View key={idx} style={styles.interesChip}>
                          <Text style={styles.interesText}>{interes}</Text>
                        </View>
                      ))}
                    </View>
                  )}
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
            <View style={styles.floatingActionRow}>
              <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={deshacerUltimo} disabled={procesandoAccion}>
                <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(30,30,30,0.7)' }]}>
                  <Ionicons name="refresh" size={24} color="#F59E0B" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => procesarInteraccion('dislike')} disabled={procesandoAccion}>
                <View style={[styles.actionBtnLarge, { borderColor: '#F0444F', borderWidth: 2, backgroundColor: 'rgba(30,30,30,0.5)' }]}>
                  <Ionicons name="close" size={38} color="#F0444F" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={intentarSuperLike} disabled={procesandoAccion}>
                <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(30,30,30,0.7)' }]}>
                  <Ionicons name="star" size={24} color="#3B82F6" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => procesarInteraccion('like')} disabled={procesandoAccion}>
                <LinearGradient colors={['#F0444F', '#E91E63']} style={styles.actionBtnLarge}>
                  <Ionicons name="heart" size={36} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={activarBoost}>
                <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(139,92,246,0.3)' }]}>
                  <Ionicons name="flash" size={24} color="#8B5CF6" />
                  {usuario?.boostGratisDisponibles > 0 && (
                    <View style={styles.boostBadge}><Text style={styles.boostBadgeText}>{usuario.boostGratisDisponibles}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      ) : (
        // ── LIGHT MODE: Split Photo + White Info Panel ──
        <>
          {/* ── Photo ── */}
          <View style={styles.lmPhotoWrap}>
            <ImageBackground source={{ uri: fotosGaleria[fotoIndex] }} style={StyleSheet.absoluteFill} imageStyle={{ borderRadius: 20 }}>
              <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} style={styles.topGradient}>
                <View style={styles.innerHeader}>
                  <TouchableOpacity onPress={() => setModalPreferencias(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="options-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.planPill} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                    <Ionicons name="sparkles" size={16} color="#F59E0B" />
                  </TouchableOpacity>
                </View>
                {fotosGaleria.length > 1 && (
                  <View style={styles.barrasContainer}>
                    {fotosGaleria.map((_, i) => (
                      <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.35)' }]} />
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
              <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
              <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />
            </ImageBackground>
          </View>

          {/* ── White Info Panel ── */}
          <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={styles.lmInfoPanel} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.lmNombreRow}>
              <Text style={styles.lmNombre}>{perfil.nombre}
                <Text style={styles.lmEdad}>, {perfil.edad}</Text>
              </Text>
              {perfil.verificado && <MaterialCommunityIcons name="check-decagram" size={22} color="#3B82F6" style={{ marginLeft: 8 }} />}
              <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={abrirTransparencia}>
                <View style={styles.lmIaBtn}>
                  <Ionicons name="analytics-outline" size={18} color={COLORS.primario} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.lmTagsRow}>
              {(perfil.arquetipoCahuinero || perfil.arquetipo?.nombre) && (
                <View style={[styles.lmArqChip, { backgroundColor: perfil.arquetipo?.color || COLORS.primario }]}>
                  <Text style={styles.lmArqText}>{perfil.arquetipoCahuinero || perfil.arquetipo?.nombre}</Text>
                </View>
              )}
              {perfil.profesion && (
                <View style={styles.lmMetaChip}>
                  <Ionicons name="briefcase-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.lmMetaText}>{perfil.profesion}</Text>
                </View>
              )}
              {perfil.universidad && (
                <View style={styles.lmMetaChip}>
                  <Ionicons name="school-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.lmMetaText}>{perfil.universidad}</Text>
                </View>
              )}
            </View>

            {(perfil.descripcion || perfil.biografia) ? (
              <Text style={styles.lmBio} numberOfLines={2}>{perfil.descripcion || perfil.biografia}</Text>
            ) : null}

            <View style={styles.lmCompatBox}>
              <View style={styles.lmCompatCircle}>
                <Text style={styles.lmCompatPct}>{compatPorcentaje}%</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lmCompatLabel}>{compatInfo}</Text>
                <Text style={styles.lmCompatDesc}>Tienen intereses compatibles.</Text>
              </View>
            </View>

            {/* ── Action buttons ── */}
            <View style={styles.lmActionRow}>
              <TouchableOpacity style={styles.lmBtnSm} onPress={deshacerUltimo} disabled={procesandoAccion}>
                <Ionicons name="refresh" size={22} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.lmBtnLgBorder} onPress={() => procesarInteraccion('dislike')} disabled={procesandoAccion}>
                <Ionicons name="close" size={36} color="#F0444F" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.lmBtnSm} onPress={intentarSuperLike} disabled={procesandoAccion}>
                <Ionicons name="star" size={22} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => procesarInteraccion('like')} disabled={procesandoAccion}>
                <LinearGradient colors={['#F0444F', '#E91E63']} style={styles.lmBtnLgGrad}>
                  <Ionicons name="heart" size={32} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.lmBtnSm, { backgroundColor: '#F3EEFF' }]} onPress={activarBoost}>
                <Ionicons name="flash" size={22} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}

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
      <CahuinModal visible={!!modalInfo} title={modalInfo?.title} message={modalInfo?.message} icon={modalInfo?.icon} actions={modalInfo?.actions || []} accent={modalInfo?.accent} tone={modalInfo?.tone} details={modalInfo?.details} onClose={() => setModalInfo(null)} />
      <PreferenciasModal
        visible={modalPreferencias}
        onClose={() => setModalPreferencias(false)}
        onSave={() => cargarPerfilesConFiltros()}
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
    </SafeAreaView>
  );
}

const SCREEN_H = Dimensions.get('window').height;
const PHOTO_H = Math.round(SCREEN_H * 0.54);

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDarkMode ? '#000' : COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000' : COLORS.bg },
  header: { padding: SPACING[4], alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },

  // ── Dark mode full-screen card ──
  cardWrapper: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: Platform.OS === 'android' ? 35 : 12,
    marginBottom: 105,
    borderRadius: 32,
    ...SHADOWS.dark,
    backgroundColor: '#111',
  },
  fullScreenImage: { flex: 1, width: '100%', height: '100%' },
  imageRadius: { borderRadius: 32 },

  // ── Light mode split layout ──
  lmPhotoWrap: {
    height: PHOTO_H,
    marginHorizontal: 12,
    marginTop: Platform.OS === 'android' ? 30 : 12,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#111',
    ...SHADOWS.dark,
  },
  lmInfoPanel: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    flexGrow: 1,
  },
  lmNombreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lmNombre: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  lmEdad: { fontSize: 20, fontWeight: '400', color: COLORS.textMuted },
  lmIaBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.softRed, alignItems: 'center', justifyContent: 'center' },
  lmTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10, alignItems: 'center' },
  lmArqChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  lmArqText: { color: '#FFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  lmMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  lmMetaText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  lmBio: { fontSize: 14, color: COLORS.textMuted, lineHeight: 21, marginBottom: 10 },
  lmCompatBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent', paddingVertical: 10, marginBottom: 6 },
  lmCompatCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  lmCompatPct: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '900' },
  lmCompatLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '900', marginBottom: 1 },
  lmCompatDesc: { color: COLORS.textMuted, fontSize: 12 },
  lmActionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 10 },
  lmBtnSm: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.03)', alignItems: 'center', justifyContent: 'center', ...SHADOWS.light },
  lmBtnLgBorder: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  lmBtnLgGrad: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },

  // ── Shared header (works in both modes) ──
  topGradient: { padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  innerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  innerHeaderTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', fontFamily: FONTS.display, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  planPill: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  barrasContainer: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  topBadgesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ubicacionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, gap: 4 },
  ubicacionBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  iaButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },

  // ── Zonas táctiles ──
  zonaTactilIzq: { position: 'absolute', top: 120, bottom: 0, left: 0, width: '50%', zIndex: 10 },
  zonaTactilDer: { position: 'absolute', top: 120, bottom: 0, right: 0, width: '50%', zIndex: 10 },

  // ── Dark mode bottom section ──
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  infoScrollWrap: { maxHeight: '100%', paddingHorizontal: 20 },
  nombreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  nombre: { fontSize: 36, fontWeight: '900', color: '#FFF', fontFamily: FONTS.display, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  edad: { fontSize: 26, fontWeight: '400', fontFamily: FONTS.regular },
  arquetipoChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  arquetipoTexto: { color: '#FFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  bioTexto: { fontSize: 16, color: 'rgba(255,255,255,0.95)', lineHeight: 24, marginBottom: 16, fontWeight: '500' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  metaText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  interesChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  interesText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  compatBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'transparent', paddingVertical: 12 },
  compatCircleWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#A855F7', alignItems: 'center', justifyContent: 'center' },
  compatPercent: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  compatLabel: { color: '#FFF', fontSize: 14, fontWeight: '900', marginBottom: 2 },
  compatDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  // ── Dark mode floating action buttons ──
  floatingActionRow: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  actionBtnSmallWrap: { ...SHADOWS.md },
  actionBtnSmall: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
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
