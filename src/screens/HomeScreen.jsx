import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Animated,
  PanResponder
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
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
  const [compatPorcentajeIA, setCompatPorcentajeIA] = useState(0);
  const [matchCelebrado, setMatchCelebrado] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [modalPreferencias, setModalPreferencias] = useState(false);
  const [modalAnuncioVisible, setModalAnuncioVisible] = useState(false);
  const [anunciosRequeridos, setAnunciosRequeridos] = useState(1);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const { usadosHoy, registrarSuperLike } = useSuperLikesDiarios();
  
  const [soundToPlay, setSoundToPlay] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = async (uri) => {
    if (!uri) return;
    try {
      if (isPlaying && soundToPlay) {
        await soundToPlay.pauseAsync();
        setIsPlaying(false);
        return;
      }
      if (soundToPlay) {
        await soundToPlay.playAsync();
        setIsPlaying(true);
        return;
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSoundToPlay(sound);
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (e) {
      console.log('Error playing audio', e);
    }
  };

  const stopAudio = async () => {
    if (soundToPlay) {
      await soundToPlay.stopAsync();
      setIsPlaying(false);
    }
  };
  
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
  const SWIPE_OUT_DURATION = 250;
  
  const position = useRef(new Animated.ValueXY()).current;
  
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const forceSwipe = (direction) => {
    if (procesandoAccion) return;
    setProcesandoAccion(true);
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : (direction === 'left' ? -SCREEN_WIDTH * 1.5 : 0);
    const y = direction === 'up' ? -SCREEN_WIDTH * 1.5 : 0;
    
    Animated.timing(position, {
      toValue: { x, y },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction) => {
    position.setValue({ x: 0, y: 0 });
    const action = direction === 'right' ? 'like' : (direction === 'up' ? 'superlike' : 'dislike');
    setProcesandoAccion(false);
    procesarInteraccion(action);
  };

  const actionsRef = useRef({ forceSwipe, resetPosition });
  useEffect(() => {
    actionsRef.current = { forceSwipe, resetPosition };
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          actionsRef.current.forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          actionsRef.current.forceSwipe('left');
        } else {
          actionsRef.current.resetPosition();
        }
      }
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp'
  });

  const cardStyle = {
    ...position.getLayout(),
    transform: [{ rotate }]
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [10, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  const superLikeOpacity = position.y.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -10],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

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
      const cacheKey = '@cahuin_radar_cache';
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        setPerfiles(JSON.parse(cachedData));
        setCargando(false);
      }

      const data = await userService.descubrir({});
      const recibidos = data.perfiles || data.usuarios || [];
      
      if (JSON.stringify(recibidos) !== cachedData) {
        setPerfiles(recibidos);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(recibidos));
      }
    } catch {
      if (perfiles.length === 0) setPerfiles([]);
    } finally {
      setCargando(false);
    }
  };

  const procesarInteraccion = async (tipo) => {
    stopAudio();
    if (perfilActual >= perfiles.length) return;
    const perfilVisto = perfiles[perfilActual];
    setPerfilActual((prev) => prev + 1);
    setFotoIndex(0); // Reset photo index for next profile

    if (tipo === 'like') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (tipo === 'superlike') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (tipo === 'dislike') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      if (perfilVisto.isAd) {
        if (tipo === 'like' || tipo === 'superlike') {
          avisar('Oferta', 'Aquí se abriría la página del anunciante.', { icon: 'star', accent: '#F59E0B' });
        }
      } else if (tipo === 'like') {
        const data = await matchService.darLike(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
        if (data?.esMatch) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMatchCelebrado(perfilVisto);
        }
      } else if (tipo === 'superlike') {
        const data = await matchService.darSuperLike(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
        if (data?.esMatch) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMatchCelebrado(perfilVisto);
        }
      } else {
        const data = await matchService.pasar(perfilVisto._id);
        if (data?.usuario) actualizarUsuario(data.usuario);
      }
    } catch (error) {
      console.log(error.message);
      // Para efectos del rediseño fluido, ignoramos errores de conexión al dar swipe y seguimos.
    }
  };

  const deshacerUltimoReal = async () => {
    if (procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const data = await matchService.retroceder();
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
    const cantAds = usuario?.isPremium ? 0 : 2;
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
      forceSwipe('up');
    } else {
      const cantAds = isAFondo || isPiola ? 1 : 3;
      avisar('Super Like', 'Destaca tu perfil con una estrella azul vibrante.', {
        tone: 'premium',
        details: isAFondo ? `Super Likes diarios agotados (${maxFree}/${maxFree})` : (isPiola ? `Super Likes diarios agotados (${maxFree}/${maxFree})` : 'Cuesta 3 anuncios'),
        actions: [
          { 
            label: 'Comprar Cahuin Premium', 
            variant: 'secondary', 
            color: '#8B5CF6', 
            onPress: () => { setModalInfo(null); navigation.navigate('Premium'); } 
          },
          { 
            label: `Ver ${cantAds} Anuncio${cantAds > 1 ? 's' : ''}`, 
            icon: 'play',
            color: '#8B5CF6',
            onPress: () => { 
              setModalInfo(null); 
              iniciarAnuncioYEjecutar(() => {
                registrarSuperLike();
                forceSwipe('up');
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

    const cantAds = isAFondo ? 0 : (isPiola ? 1 : 3);

    avisar('Modo Destacado', 'Aparece primero en el radar de tu ciudad durante 30 minutos.', {
      tone: 'premium',
      details: isAFondo ? 'Incluido en tu plan A Fondo' : (isPiola ? 'Para ti solo cuesta 1 anuncio' : 'Cuesta 3 anuncios'),
      actions: [
        ...(isAFondo ? [] : [{ 
          label: 'Comprar Cahuin Premium', 
          variant: 'secondary', 
          color: '#8B5CF6', 
          onPress: () => { setModalInfo(null); navigation.navigate('Premium'); } 
        }]),
        {
          label: isAFondo ? 'Activar' : `Ver ${cantAds} Anuncio${cantAds > 1 ? 's' : ''}`,
          icon: isAFondo ? 'sparkles' : 'play',
          color: '#8B5CF6',
          onPress: () => {
            setModalInfo(null);
            iniciarAnuncioYEjecutar(async () => {
              try {
                const data = await userService.activarBoost({ pagadoConAnuncios: cantAds > 0 });
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
    let puntos = 50;

    if (p.queBuscas === usuario?.queBuscas && p.queBuscas) { motivos.push(`Ambos buscan lo mismo: ${p.queBuscas}.`); puntos += 10; }
    if (p.tipoApego === usuario?.tipoApego && p.tipoApego) { motivos.push(`Comparten apego relacional ${p.tipoApego}.`); puntos += 10; }
    if (typeof p.distanciaKm === 'number' && p.distanciaKm <= 10) { motivos.push(`Está muy cerca tuyo: a ${p.distanciaKm} km.`); puntos += 15; }
    if (p.habitos?.beber === usuario?.habitos?.beber && p.habitos?.beber) { motivos.push('Tienen hábitos sociales compatibles.'); puntos += 5; }
    
    if (p.intereses && usuario?.intereses) {
      const comunes = p.intereses.filter(i => usuario.intereses.includes(i)).length;
      if (comunes > 0) {
         motivos.push(`Tienen ${comunes} intereses en común.`);
         puntos += (comunes * 3);
      }
    }

    if (motivos.length === 0) motivos.push('Tienen una buena vibra general.');

    puntos = Math.min(puntos, 99);
    setMotivosAlgoritmo(motivos);
    setCompatPorcentajeIA(puntos);
    setModalTransparencia(true);
  };

  const getCompat = (perfil) => {
    try { return calcularCompatibilidad(usuario, perfil); } catch { return 75; }
  };

  const renderLifestylePills = (p, isDark) => {
    const pills = [];
    const pushPill = (icon, text) => {
      if (text) {
        pills.push(
          <View key={text+icon} style={isDark ? styles.lsChipDark : styles.lsChipLight}>
            <Text style={isDark ? styles.lsChipIconDark : styles.lsChipIconLight}>{icon}</Text>
            <Text style={isDark ? styles.lsChipTextDark : styles.lsChipTextLight}>{text}</Text>
          </View>
        );
      }
    };

    pushPill('📏', p.altura ? `${p.altura} cm` : null);
    pushPill('♈', p.zodiaco);
    pushPill('🧠', p.personalidad);
    pushPill('🐕', p.mascotas);
    pushPill('🍷', p.habitos?.beber);
    pushPill('🚬', p.habitos?.fumar);
    pushPill('💪', p.habitos?.ejercicio);
    pushPill('✈️', p.habitos?.vacaciones);
    pushPill('🎉', p.habitos?.carrete);
    pushPill('💬', p.estiloComunicacion);
    pushPill('❤️', p.estiloAmor);
    
    if (pills.length === 0) return null;

    return (
      <View style={styles.lsWrap}>
        {pills}
      </View>
    );
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

  const renderFloatingActions = () => (
    <View style={styles.floatingActionRow}>
      <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={deshacerUltimo} disabled={procesandoAccion}>
        <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(30,30,30,0.7)' }]}>
          <Ionicons name="refresh" size={24} color="#F59E0B" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => forceSwipe('left')} disabled={procesandoAccion}>
        <View style={[styles.actionBtnLarge, { borderColor: '#F0444F', borderWidth: 2, backgroundColor: 'rgba(30,30,30,0.5)' }]}>
          <Ionicons name="close" size={38} color="#F0444F" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={intentarSuperLike} disabled={procesandoAccion}>
        <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(30,30,30,0.7)' }]}>
          <Ionicons name="star" size={24} color="#3B82F6" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtnLargeWrap} onPress={() => forceSwipe('right')} disabled={procesandoAccion}>
        <LinearGradient colors={['#F0444F', '#E91E63']} style={styles.actionBtnLarge}>
          <Ionicons name="heart" size={36} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtnSmallWrap} onPress={activarBoost}>
        <View style={[styles.actionBtnSmall, { backgroundColor: 'rgba(139,92,246,0.3)' }]}>
          <Ionicons name="flash" size={24} color="#8B5CF6" />
          {((usuario?.boostGratisDisponibles || 0) + (usuario?.boosts || 0)) > 0 && (
            <View style={styles.boostBadge}><Text style={styles.boostBadgeText}>{(usuario?.boostGratisDisponibles || 0) + (usuario?.boosts || 0)}</Text></View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCard = (p, isTopCard) => {
    if (!p) return null;
    const fotosGaleria = p.fotos?.length > 0 ? p.fotos : [p.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800'];
    const compatPorcentaje = getCompat(p);
    const compatInfo = emojiCompatibilidad(compatPorcentaje);
    const interesesPerfil = (p.intereses || []).slice(0, 4);

    const dynamicWrapperStyle = isTopCard 
      ? [styles.cardWrapper, cardStyle] 
      : [styles.cardWrapper, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, transform: [{ scale: 0.95 }] }];

    return (
      <Animated.View key={p._id} style={dynamicWrapperStyle} {...(isTopCard ? panResponder.panHandlers : {})}>
        <ImageBackground source={{ uri: fotosGaleria[isTopCard ? fotoIndex : 0] }} style={styles.fullScreenImage} imageStyle={styles.imageRadius}>
          {isTopCard && (
            <>
              <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]} pointerEvents="none">
                <Text style={styles.likeStampText}>CAHUÍN</Text>
              </Animated.View>
              <Animated.View style={[styles.nopeStamp, { opacity: nopeOpacity }]} pointerEvents="none">
                <Text style={styles.nopeStampText}>PASO</Text>
              </Animated.View>
              <Animated.View style={[styles.superStamp, { opacity: superLikeOpacity }]} pointerEvents="none">
                <Text style={styles.superStampText}>SUPER</Text>
              </Animated.View>
            </>
          )}
          
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient}>
            <View style={styles.innerHeader}>
                <TouchableOpacity onPress={() => setModalPreferencias(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="options-outline" size={24} color="#FFF" style={{ marginRight: 8 }} />
                </TouchableOpacity>
              <TouchableOpacity style={styles.planPill} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
            {isTopCard && fotosGaleria.length > 1 && (
              <View style={styles.barrasContainer}>
                {fotosGaleria.map((_, i) => (
                  <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.3)' }]} />
                ))}
              </View>
            )}
            <View style={styles.topBadgesRow}>
              <View style={styles.ubicacionBadge}>
                <Ionicons name="location" size={14} color="#FFF" />
                <Text style={styles.ubicacionBadgeText}>{p.ciudad || 'Chile'}</Text>
              </View>
              {isTopCard && (
                <TouchableOpacity style={styles.iaButton} onPress={abrirTransparencia}>
                  <Ionicons name="sparkles" size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>

          {isTopCard && (
            <>
              <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
              <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />
            </>
          )}

          <LinearGradient pointerEvents="box-none" colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']} style={styles.bottomGradient}>
            <View pointerEvents="box-none" style={styles.infoScrollWrap}>
              <View pointerEvents="box-none" style={{ paddingBottom: 120 }}>
                <View style={[styles.nombreRow, { justifyContent: 'space-between' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.nombre} numberOfLines={1}>{p.nombre}<Text style={styles.edad}>, {p.edad}</Text></Text>
                    {p.verificado && <MaterialCommunityIcons name="check-decagram" size={26} color="#3B82F6" style={{ marginLeft: 8 }} />}
                  </View>
                  <TouchableOpacity 
                    disabled={!isTopCard}
                    onPress={() => navigation.navigate('OtroPerfil', { usuario: p, origen: 'radar' })}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="arrow-up-circle" size={36} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {(p.arquetipoCahuinero || p.arquetipo?.nombre) && (
                  <View style={[styles.arquetipoChip, { backgroundColor: p.arquetipo?.color || COLORS.primario }]}>
                    <Text style={styles.arquetipoTexto}>{p.arquetipoCahuinero || p.arquetipo?.nombre}</Text>
                  </View>
                )}
                
                <Text style={styles.bioTexto} numberOfLines={2}>{p.descripcion || p.biografia || 'En busca de buenas vibras y algo piola.'}</Text>
                
                {renderLifestylePills(p, true)}
                
                {(p.profesion || p.universidad) && (
                  <View style={styles.metaRow}>
                    {p.profesion && <View style={styles.metaChip}><Ionicons name="briefcase-outline" size={14} color="#FFF" /><Text style={styles.metaText} numberOfLines={1}>{p.profesion}</Text></View>}
                    {p.universidad && <View style={styles.metaChip}><Ionicons name="school-outline" size={14} color="#FFF" /><Text style={styles.metaText} numberOfLines={1}>{p.universidad}</Text></View>}
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    );
  };

  const perfilSiguiente = perfilActual + 1 < perfiles.length ? perfiles[perfilActual + 1] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1 }}>
        {!perfil ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, paddingHorizontal: 24, paddingBottom: 60 }}>
            <Image 
              source={emptyRadar} 
              style={{ width: 340, height: 340, resizeMode: 'contain', marginBottom: 16 }} 
            />
            <Text style={{ fontSize: 32, fontWeight: '900', fontFamily: FONTS.display, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 }}>
              Radar <Text style={{ color: COLORS.primario }}>vacío.</Text>
            </Text>
            <Text style={{ fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 24 }}>
              No hay nadie más por acá. Ajusta tus filtros o amplía la distancia para encontrar más Cahuines.
            </Text>
            <View style={{ gap: 12, width: '100%', maxWidth: 400 }}>
              <GradientButton onPress={() => setModalPreferencias(true)} icon="options-outline" style={{ width: '100%' }}>
                Ajustar Filtros
              </GradientButton>
              <GradientButton onPress={() => { setCargando(true); cargarPerfilesConFiltros(); }} icon="refresh-outline" style={{ width: '100%' }}>
                Reintentar Búsqueda
              </GradientButton>
            </View>
          </View>
        ) : (
          <>
            {perfilSiguiente && renderCard(perfilSiguiente, false)}
            {renderCard(perfil, true)}
            {renderFloatingActions()}
          </>
        )}
      </View>

      {/* ── Modal transparencia ── */}
      <Modal visible={modalTransparencia} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={30} color={COLORS.primario} />
              <Text style={styles.modalTitulo}>Radar ({compatPorcentajeIA}% compatibles)</Text>
            </View>
            <Text style={styles.modalIntro}>¿Por qué te mostramos a {perfil?.nombre || 'este perfil'}?</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.motivosScroll}>
              {motivosAlgoritmo.map((motivo, idx) => (
                <View key={idx} style={styles.motivoRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#34A853" />
                  <Text style={styles.motivoText}>{motivo}</Text>
                </View>
              ))}
            </ScrollView>
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
        compatibilidad={matchCelebrado ? getCompat(matchCelebrado) : 0}
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
  safe: { flex: 1, backgroundColor: '#000' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000' : COLORS.bg },
  header: { padding: SPACING[4], alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display },

  // ── Dark mode full-screen card ──
  cardWrapper: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    marginTop: Platform.OS === 'android' ? 0 : 0,
    marginBottom: 0,
    borderRadius: 16,
    ...SHADOWS.dark,
    backgroundColor: '#111',
  },
  fullScreenImage: { flex: 1, width: '100%', height: '100%' },
  imageRadius: { borderRadius: 32 },

  // ── Stamps ──
  likeStamp: { position: 'absolute', top: 50, left: 20, zIndex: 100, transform: [{ rotate: '-15deg' }], borderWidth: 4, borderColor: '#4CAF50', borderRadius: 10, padding: 8 },
  likeStampText: { color: '#4CAF50', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  nopeStamp: { position: 'absolute', top: 50, right: 20, zIndex: 100, transform: [{ rotate: '15deg' }], borderWidth: 4, borderColor: '#F44336', borderRadius: 10, padding: 8 },
  nopeStampText: { color: '#F44336', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  superStamp: { position: 'absolute', bottom: 150, alignSelf: 'center', zIndex: 100, transform: [{ rotate: '-5deg' }], borderWidth: 4, borderColor: '#3B82F6', borderRadius: 10, padding: 8, backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  superStampText: { color: '#3B82F6', fontSize: 28, fontWeight: '900', letterSpacing: 1 },

  // ── Shared header ──
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
  zonaTactilIzq: { position: 'absolute', top: 100, bottom: 0, left: 0, width: '50%', zIndex: 10 },
  zonaTactilDer: { position: 'absolute', top: 100, bottom: 0, right: 0, width: '50%', zIndex: 10 },

  // ── Dark mode bottom section ──
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, justifyContent: 'flex-end', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, zIndex: 20, paddingTop: 60 },
  infoScrollWrap: { paddingHorizontal: 20 },
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
  floatingActionRow: { position: 'absolute', bottom: 85, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, zIndex: 9999, elevation: 50, paddingVertical: 10 },
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

  // ── Lifestyle Pills ──
  lsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  lsChipDark: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  lsChipIconDark: { fontSize: 13 },
  lsChipTextDark: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  lsChipLight: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  lsChipIconLight: { fontSize: 13 },
  lsChipTextLight: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
});
