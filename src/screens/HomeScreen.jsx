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
import * as Location from 'expo-location';
import { matchService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { EmptyState, GradientButton, ScreenScaffold, SoftCard } from '../components/CahuinUI';
import CahuinModal from '../components/CahuinModal';
import MatchCelebrationModal from '../components/MatchCelebrationModal';
import { inferirRegionPorCiudad, normalizarCiudadChile, normalizarRegionChile } from '../utils/chileLocations';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const emptyRadar = require('../assets/illustrations/empty-radar.png');

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Radar</Text>
        <View style={styles.headerBadge}>
          <Ionicons name="flame" size={18} color={COLORS.primario} />
          <Text style={styles.headerBadgeText}>{usuario?.cahuines || 0}</Text>
        </View>
      </View>

      <View style={styles.tarjetaContenedor}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.contenedorGaleria}>
            <Image source={{ uri: fotosGaleria[fotoIndex] }} style={styles.fotoPrincipal} />
            <View style={styles.fotoShade} />
            {fotosGaleria.length > 1 ? (
              <View style={styles.barrasContainer}>
                {fotosGaleria.map((_, i) => (
                  <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
                ))}
              </View>
            ) : null}
            <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
            <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.perfilHeader}>
              <Text style={styles.nombre}>{perfil.nombre}, {perfil.edad}</Text>
              {perfil.verificado ? <MaterialCommunityIcons name="check-decagram" size={24} color="#3B82F6" style={{ marginLeft: 6 }} /> : null}
              <TouchableOpacity onPress={abrirTransparencia} style={styles.infoButton}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.ubicacionRow}>
              <Ionicons name="location-sharp" size={16} color={COLORS.primario} />
              <Text style={styles.ciudad}>{perfil.ciudad || 'Chile'} · {perfil.distanciaKm ? `A ${perfil.distanciaKm} km` : 'Cerca tuyo'}</Text>
            </View>

            <View style={styles.bioBox}>
              <Text style={styles.bioTexto}>{perfil.descripcion || 'En busca de buenas conversaciones.'}</Text>
            </View>
            <View style={{ height: 112 }} />
          </View>
        </ScrollView>

        <View style={styles.botonesOverlay}>
          <TouchableOpacity style={[styles.btnAccion, styles.btnSmallAction]} onPress={deshacerUltimo} disabled={procesandoAccion}>
            <Ionicons name="arrow-undo" size={25} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAccion, styles.btnDislike]} onPress={() => procesarInteraccion('dislike')} disabled={procesandoAccion}>
            <Ionicons name="close" size={34} color="#F0444F" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAccion, styles.btnSuperLike]} onPress={() => procesarInteraccion('superlike')} disabled={procesandoAccion}>
            <Ionicons name="star" size={27} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAccion, styles.btnLike]} onPress={() => procesarInteraccion('like')} disabled={procesandoAccion}>
            <Ionicons name="heart" size={38} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAccion, styles.btnSmallAction]} onPress={activarBoost}>
            <Ionicons name="flash" size={25} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.tarjeta, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  headerBadgeText: { color: COLORS.textPrimary, fontWeight: '900' },
  tarjetaContenedor: { flex: 1, backgroundColor: COLORS.tarjeta, borderRadius: 30, marginHorizontal: 12, marginBottom: 106, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  scrollContent: { flexGrow: 1 },
  contenedorGaleria: { width: '100%', height: 470, position: 'relative' },
  fotoPrincipal: { width: '100%', height: '100%', resizeMode: 'cover' },
  fotoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 160, backgroundColor: 'rgba(0,0,0,0.18)' },
  barrasContainer: { position: 'absolute', top: 15, left: 12, right: 12, flexDirection: 'row', gap: 5 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  zonaTactilIzq: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 2 },
  zonaTactilDer: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 2 },
  infoContainer: { padding: 22, backgroundColor: COLORS.tarjeta, marginTop: -24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  perfilHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nombre: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display, letterSpacing: 0 },
  infoButton: { marginLeft: 'auto', backgroundColor: COLORS.softPurple, padding: 10, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  ciudad: { fontSize: 15, color: COLORS.textMuted, marginLeft: 5 },
  bioBox: { backgroundColor: COLORS.fondo, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4] },
  bioTexto: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 23 },
  botonesOverlay: { position: 'absolute', bottom: 22, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  btnAccion: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.tarjeta, ...SHADOWS.medium },
  btnLike: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primario },
  btnDislike: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: COLORS.border },
  btnSuperLike: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#3B82F6', alignSelf: 'center' },
  btnSmallAction: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, alignSelf: 'center' },
  modalFondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.55)' },
  modalBox: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  modalTitulo: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  modalIntro: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 18 },
  motivoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  motivoText: { color: COLORS.textPrimary, fontSize: 14, flex: 1, lineHeight: 20 },
  emptyHint: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 28, width: '100%', backgroundColor: COLORS.softPurple },
  emptyHintIcon: { fontSize: 26 },
  emptyHintTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  emptyHintText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 2 },
  emptyIconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta },
  emptyButton: { width: '100%', marginTop: 28, borderWidth: 1.5, borderColor: 'rgba(240,68,79,0.35)', shadowOpacity: 0 },
  emptyButtonText: { color: COLORS.primario },
});
