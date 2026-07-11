import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import { userService, matchService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const MOTIVOS_REPORTE = [
  'Perfil falso o suplantacion',
  'Acoso o insultos',
  'Fotos o contenido inapropiado',
  'Spam o intento de estafa',
  'Menor de edad',
  'Otro',
];

export default function OtroPerfilScreen({ route, navigation }) {
  const { usuario: paramUsuario, userId: paramUserId, id, origen = 'radar' } = route.params || {};
  const userId = paramUserId || id;
  const targetUserId = paramUsuario?._id || userId;
  const [perfil, setPerfil] = useState(paramUsuario || null);
  const [preguntasPublicas, setPreguntasPublicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [preguntaAnonima, setPreguntaAnonima] = useState('');
  const [enviandoPregunta, setEnviandoPregunta] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [modalReporteVisible, setModalReporteVisible] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState('');
  const [detalleReporte, setDetalleReporte] = useState('');
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const avisar = (title, message, emoji = '🌶️', actions = []) => setModalInfo({ title, message, emoji, actions });

  const [fotoIndex, setFotoIndex] = useState(0);

  // Audio Playback
  const [soundToPlay, setSoundToPlay] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const enviarAccion = async (accion) => {
    try {
      let res;
      if (accion === 'like') {
        res = await matchService.darLike(targetUserId, origen);
      } else if (accion === 'superlike') {
        res = await matchService.darSuperLike(targetUserId, origen);
      } else {
        res = await matchService.pasar(targetUserId);
      }

      if (res?.esMatch || res?.data?.esMatch) {
        setModalInfo({
          title: '¡Match! ¿YOOO?',
          emoji: '🔥',
          message: 'Se armó el Cahuín. ¡Anda a hablarle!',
          actions: [{ label: 'Ir a Mensajes', primary: true, onPress: () => { setModalInfo(null); navigation.navigate('Chat'); } }]
        });
      } else {
        navigation.goBack();
      }
    } catch (e) {
      if (e.response?.status === 403) {
         setModalInfo({
           title: 'Límite alcanzado',
           emoji: '😅',
           message: e.response.data?.message || 'Llegaste al límite.',
           actions: [
             { label: 'Ver Planes', primary: true, onPress: () => { setModalInfo(null); navigation.navigate('Premium'); } },
             { label: 'Cerrar', onPress: () => setModalInfo(null) }
           ]
         });
      }
    }
  };

  const toggleAudio = async () => {
    if (!perfil.audioRompehielos) return;
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
      const { sound } = await Audio.Sound.createAsync({ uri: perfil.audioRompehielos });
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

  useEffect(() => {
    const cargarPerfilCompleto = async () => {
      if (!targetUserId) return;
      try {
        const data = await userService.getPerfil(targetUserId);
        if (data.perfil) setPerfil(data.perfil);
        setPreguntasPublicas(data.preguntas || []);
      } catch (error) {
        console.log('Error', error);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfilCompleto();
  }, [targetUserId]);

  const enviarPreguntaAnonima = async () => {
    if (!preguntaAnonima.trim()) return;
    setEnviandoPregunta(true);
    try {
      await userService.enviarPreguntaAnonima(perfil._id, preguntaAnonima);
      avisar('Enviada', `Le mandaste una pregunta anonima a ${perfil.nombre}. Si responde, aparecera en su perfil.`, '👻');
      setPreguntaAnonima('');
    } catch (error) {
      avisar('Oops', error.message || 'No se pudo enviar la pregunta.');
    } finally {
      setEnviandoPregunta(false);
    }
  };

  const reportarPerfil = () => {
    setMotivoReporte('');
    setDetalleReporte('');
    setModalReporteVisible(true);
  };

  const enviarReporte = async () => {
    if (!motivoReporte) {
      avisar('Falta motivo', 'Elige por que quieres reportar este perfil.');
      return;
    }
    if (motivoReporte === 'Otro' && detalleReporte.trim().length < 4) {
      avisar('Cuentanos mas', 'Escribe brevemente que paso.');
      return;
    }

    setEnviandoReporte(true);
    try {
      await userService.reportar(perfil._id, {
        motivo: motivoReporte,
        detalle: detalleReporte,
        origen: 'perfil',
      });
      setModalReporteVisible(false);
      avisar('Listo', 'Gracias. La cuenta oficial revisara este reporte.', '🛡️');
    } catch {
      avisar('Error', 'No pudimos reportar el perfil.');
    } finally {
      setEnviandoReporte(false);
    }
  };

  const renderLifestylePills = (p) => {
    const pills = [];
    const pushPill = (icon, text) => {
      if (text) {
        pills.push(
          <View key={text+icon} style={styles.lsChip}>
            <Text style={styles.lsChipIcon}>{icon}</Text>
            <Text style={styles.lsChipText}>{text}</Text>
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
    return <View style={styles.lsWrap}>{pills}</View>;
  };



  if (!perfil) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primario} />
        </View>
      </SafeAreaView>
    );
  }

  const fotosGaleria = perfil.fotos?.length > 0 ? perfil.fotos : [perfil.foto || 'https://via.placeholder.com/400'];
  const interesesPerfil = perfil.intereses || [];

  const getProximosDias = () => {
    const dias = [];
    for(let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0,0,0,0);
      dias.push(d);
    }
    return dias;
  };
  const diasDisponibilidad = getProximosDias();
  const tieneDisponibilidad = perfil.fechasDisponibles?.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
        <Ionicons name="arrow-back" size={26} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={reportarPerfil} style={styles.btnReportar}>
        <Ionicons name="flag" size={22} color="#FFF" />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={styles.contenedorFoto}>
          <Image source={{ uri: fotosGaleria[fotoIndex] }} style={styles.fotoPrincipal} />
          {fotosGaleria.length > 1 && (
            <View style={styles.barrasContainer}>
              {fotosGaleria.map((_, i) => (
                <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.35)' }]} />
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { Haptics.selectionAsync(); if (fotoIndex > 0) setFotoIndex(fotoIndex - 1); }} />
          <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { Haptics.selectionAsync(); if (fotoIndex < fotosGaleria.length - 1) setFotoIndex(fotoIndex + 1); }} />
          {cargando ? <View style={styles.overlayCarga}><ActivityIndicator size="large" color={COLORS.primario} /></View> : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.perfilHeader}>
            <Text style={styles.nombre}>{perfil.nombre}<Text style={{fontSize: 22, color: COLORS.textMuted}}>, {perfil.edad}</Text></Text>
            {perfil.verificado ? <MaterialCommunityIcons name="check-decagram" size={24} color="#3B82F6" style={{ marginLeft: 6 }} /> : null}
          </View>

          <View style={styles.metaRow}>
            {(perfil.arquetipoCahuinero || perfil.arquetipo?.nombre) && (
              <View style={[styles.metaChip, { backgroundColor: perfil.arquetipo?.color || COLORS.primario }]}>
                <Text style={styles.metaChipTextLight}>{perfil.arquetipoCahuinero || perfil.arquetipo?.nombre}</Text>
              </View>
            )}
            {perfil.profesion && (
              <View style={styles.metaChipNeutral}>
                <Ionicons name="briefcase-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaChipText}>{perfil.profesion}</Text>
              </View>
            )}
            {perfil.universidad && (
              <View style={styles.metaChipNeutral}>
                <Ionicons name="school-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaChipText}>{perfil.universidad}</Text>
              </View>
            )}
          </View>

          <View style={styles.ubicacionRow}>
            <Ionicons name="location-sharp" size={16} color={COLORS.gris} />
            <Text style={styles.ciudad}>{perfil.ciudad || 'Chile'}, {perfil.region}</Text>
          </View>
          
          <View style={styles.seccion}>
            <Text style={styles.bioTexto}>{perfil.descripcion || perfil.biografia || 'En busca de buenas vibras y algo piola.'}</Text>
          </View>

          {tieneDisponibilidad && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.primario} />
                <Text style={styles.seccionTitulo}>Disponibilidad</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
                {diasDisponibilidad.map(d => {
                   const iso = d.toISOString();
                   const selected = (perfil.fechasDisponibles || []).includes(iso);
                   const diaNombre = d.toLocaleDateString('es-ES', { weekday: 'short' });
                   const diaNum = d.getDate();
                   return (
                     <View 
                       key={iso} 
                       style={[styles.dayBox, selected && styles.dayBoxSelected, { borderColor: selected ? COLORS.primario : COLORS.border, backgroundColor: selected ? COLORS.primario : COLORS.tarjeta }]} 
                     >
                       <Text style={[styles.dayName, { color: selected ? '#FFF' : COLORS.textMuted }]}>{diaNombre.toUpperCase()}</Text>
                       <Text style={[styles.dayNum, { color: selected ? '#FFF' : COLORS.textPrimary }]}>{diaNum}</Text>
                     </View>
                   );
                })}
              </ScrollView>
            </View>
          )}

          {renderLifestylePills(perfil)}
          
          {perfil.audioRompehielos && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Ionicons name="mic-circle" size={24} color="#A855F7" />
                <Text style={[styles.seccionTitulo, { color: '#A855F7' }]}>Mi Voz</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleAudio} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#A855F7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ marginLeft: 15, flex: 1 }}>
                  <Text style={{ color: '#A855F7', fontWeight: 'bold', fontSize: 16 }}>Audio Rompehielos</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 2 }}>{isPlaying ? "Reproduciendo..." : "Escucha su saludo"}</Text>
                </View>
              </View>
            </View>
          )}

          {interesesPerfil.length > 0 && (
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Ionicons name="heart-circle-outline" size={20} color={COLORS.primario} />
                <Text style={styles.seccionTitulo}>Intereses</Text>
              </View>
              <View style={styles.lsWrap}>
                {interesesPerfil.map((interes, idx) => (
                  <View key={idx} style={styles.interesChip}>
                    <Text style={styles.interesText}>{interes}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.nglBox}>
            <View style={styles.nglHeader}>
              <Text style={styles.nglEmoji}>?</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.nglTitulo}>Preguntale algo a {perfil.nombre}</Text>
                <Text style={styles.nglSubtitulo}>Cahuín lo manda sin mostrar tu nombre. Si responde, puede publicarlo aquí.</Text>
              </View>
            </View>
            <View style={styles.nglInputRow}>
              <CahuinTextField
                icon="help-circle-outline"
                containerStyle={{ flex: 1 }}
                placeholder="Ej: Cual fue tu peor cita?"
                value={preguntaAnonima}
                onChangeText={setPreguntaAnonima}
              />
              <TouchableOpacity style={styles.btnEnviarNGL} onPress={enviarPreguntaAnonima} disabled={enviandoPregunta}>
                {enviandoPregunta ? <ActivityIndicator color="#FFF" /> : <Ionicons name="send" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>

          {preguntasPublicas.length > 0 ? (
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primario} />
                <Text style={styles.seccionTitulo}>Preguntas que respondió</Text>
              </View>
              {preguntasPublicas.map((item) => (
                <View key={item._id} style={styles.qaCard}>
                  <Text style={styles.qaQuestion}>{item.pregunta}</Text>
                  <Text style={styles.qaAnswer}>{item.respuesta}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {((perfil.musica && perfil.musica.length > 0) || perfil.cancion?.nombre) ? (
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Ionicons name="musical-notes-outline" size={20} color={COLORS.primario} />
                <Text style={styles.seccionTitulo}>Gustos musicales</Text>
              </View>
              {perfil.cancion?.nombre ? (
                <View style={styles.cancionDestacada}>
                  <Image source={{ uri: perfil.cancion.foto }} style={styles.cancionFoto} />
                  <View style={styles.cancionInfo}>
                    <Text style={styles.cancionLabel}>Ultima cancion escuchada</Text>
                    <Text style={styles.cancionNombre}>{perfil.cancion.nombre}</Text>
                  </View>
                  <Ionicons name="musical-note" size={24} color={COLORS.primario} />
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      {!route.params?.hideActions && (
        <View style={styles.floatingActionBar}>
          <TouchableOpacity style={styles.fabPass} onPress={() => enviarAccion('pasar')}>
            <Ionicons name="close" size={32} color="#F43F5E" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabSuperlike} onPress={() => enviarAccion('superlike')}>
            <Ionicons name="star" size={30} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabLike} onPress={() => enviarAccion('like')}>
            <Ionicons name="heart" size={36} color="#10B981" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalReporteVisible} transparent animationType="fade" onRequestClose={() => setModalReporteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reporteModal}>
            <Text style={styles.reporteTitle}>Reportar perfil</Text>
            <Text style={styles.reporteSubtitle}>Elige el motivo. La cuenta oficial revisara el caso.</Text>
            <View style={styles.motivosWrap}>
              {MOTIVOS_REPORTE.map((motivo) => (
                <TouchableOpacity
                  key={motivo}
                  style={[styles.motivoChip, motivoReporte === motivo && styles.motivoChipActive]}
                  onPress={() => setMotivoReporte(motivo)}
                >
                  <Text style={[styles.motivoChipText, motivoReporte === motivo && styles.motivoChipTextActive]}>{motivo}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={detalleReporte}
              onChangeText={setDetalleReporte}
              placeholder={motivoReporte === 'Otro' ? 'Explica que paso...' : 'Detalle opcional'}
              placeholderTextColor={COLORS.textMuted}
              multiline
              textAlignVertical="top"
              style={styles.detalleReporteInput}
            />
            <View style={styles.reporteActions}>
              <TouchableOpacity style={[styles.reporteBtn, styles.reporteCancel]} onPress={() => setModalReporteVisible(false)}>
                <Text style={styles.reporteCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.reporteBtn, styles.reporteSubmit]} onPress={enviarReporte} disabled={enviandoReporte}>
                {enviandoReporte ? <ActivityIndicator color="#FFF" /> : <Text style={styles.reporteSubmitText}>Enviar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CahuinModal visible={!!modalInfo} title={modalInfo?.title} message={modalInfo?.message} emoji={modalInfo?.emoji} actions={modalInfo?.actions || []} onClose={() => setModalInfo(null)} />
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  floatingActionBar: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  fabPass: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.tarjeta, justifyContent: 'center', alignItems: 'center', shadowColor: '#F43F5E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  fabSuperlike: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.tarjeta, justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  fabLike: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.tarjeta, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  btnVolver: { position: 'absolute', top: 50, left: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  btnReportar: { position: 'absolute', top: 50, right: 20, zIndex: 100, backgroundColor: 'rgba(240,68,79,0.88)', padding: 10, borderRadius: 20 },
  scrollContent: { flexGrow: 1, backgroundColor: COLORS.bg },
  contenedorFoto: { width: '100%', height: Dimensions.get('window').height * 0.55, position: 'relative', backgroundColor: '#111' },
  fotoPrincipal: { width: '100%', height: '100%', resizeMode: 'cover' },
  barrasContainer: { flexDirection: 'row', gap: 6, position: 'absolute', top: 50, left: 60, right: 60, zIndex: 10 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  zonaTactilIzq: { position: 'absolute', top: 80, bottom: 0, left: 0, width: '50%', zIndex: 5 },
  zonaTactilDer: { position: 'absolute', top: 80, bottom: 0, right: 0, width: '50%', zIndex: 5 },
  overlayCarga: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 24, backgroundColor: COLORS.bg, marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  perfilHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nombre: { fontSize: 34, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' },
  metaChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  metaChipTextLight: { color: '#FFF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  metaChipNeutral: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  metaChipText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '700' },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ciudad: { fontSize: 15, color: COLORS.textMuted, marginLeft: 4, fontWeight: '600' },
  nglBox: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 20, borderRadius: RADIUS.xl, marginBottom: 25 },
  nglHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  nglEmoji: { width: 38, height: 38, borderRadius: 19, textAlign: 'center', textAlignVertical: 'center', backgroundColor: COLORS.softPurple, color: COLORS.primario, fontSize: 22, fontWeight: '900' },
  nglTitulo: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  nglSubtitulo: { fontSize: 13, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },
  nglInputRow: { flexDirection: 'row', gap: 10 },
  nglInput: { flex: 1, backgroundColor: 'rgba(150,150,150,0.1)', borderRadius: RADIUS.lg, padding: 12, color: COLORS.textPrimary },
  btnEnviarNGL: { backgroundColor: COLORS.primario, paddingHorizontal: 20, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  seccion: { marginBottom: 25 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  seccionTitulo: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginLeft: 8 },
  bioTexto: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 24 },
  
  // ── Lifestyle Pills ──
  lsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  lsChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  lsChipIcon: { fontSize: 14 },
  lsChipText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  interesChip: { backgroundColor: 'rgba(139,92,246,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  interesText: { color: '#8B5CF6', fontSize: 13, fontWeight: '700' },

  qaCard: { backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 18, padding: SPACING[4], marginBottom: SPACING[3] },
  qaQuestion: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  qaAnswer: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 23, marginTop: 8, fontWeight: '800' },
  cancionDestacada: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 16 },
  cancionFoto: { width: 45, height: 45, borderRadius: 8, marginRight: 12 },
  cancionInfo: { flex: 1 },
  cancionLabel: { color: COLORS.gris, fontSize: 12, marginBottom: 2 },
  cancionNombre: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', padding: SPACING[5] },
  reporteModal: { backgroundColor: COLORS.tarjeta, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[5] },
  reporteTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  reporteSubtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  motivosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING[4] },
  motivoChip: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: COLORS.fondo },
  motivoChipActive: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  motivoChipText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800' },
  motivoChipTextActive: { color: '#FFF' },
  detalleReporteInput: { minHeight: 110, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.fondo, color: COLORS.textPrimary, padding: 14, marginTop: SPACING[4], fontWeight: '700' },
  reporteActions: { flexDirection: 'row', gap: 10, marginTop: SPACING[4] },
  reporteBtn: { flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  reporteCancel: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  reporteSubmit: { backgroundColor: COLORS.primario },
  reporteCancelText: { color: COLORS.textPrimary, fontWeight: '900' },
  reporteSubmitText: { color: '#FFF', fontWeight: '900' },
});
