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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
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
  const { usuario: perfilResumido } = route.params;
  const [perfil, setPerfil] = useState(perfilResumido);
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

  useEffect(() => {
    const cargarPerfilCompleto = async () => {
      try {
        const data = await userService.getPerfil(perfilResumido._id);
        if (data.perfil) setPerfil(data.perfil);
        setPreguntasPublicas(data.preguntas || []);
      } catch (error) {
        console.log('Error', error);
      } finally {
        setCargando(false);
      }
    };
    cargarPerfilCompleto();
  }, [perfilResumido._id]);

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
          <Image source={{ uri: perfil.foto || 'https://via.placeholder.com/400' }} style={styles.fotoPrincipal} />
          {cargando ? <View style={styles.overlayCarga}><ActivityIndicator size="large" color={COLORS.primario} /></View> : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.perfilHeader}>
            <Text style={styles.nombre}>{perfil.nombre}, {perfil.edad}</Text>
            {perfil.verificado ? <MaterialCommunityIcons name="check-decagram" size={24} color="#2196F3" style={{ marginLeft: 6 }} /> : null}
          </View>

          <View style={styles.ubicacionRow}>
            <Ionicons name="location-sharp" size={16} color={COLORS.gris} />
            <Text style={styles.ciudad}>{perfil.ciudad || 'Chile'}, {perfil.region}</Text>
          </View>

          <View style={styles.calendarioBox}>
            <View style={styles.calendarioHeader}>
              <Ionicons name="calendar" size={20} color="#E91E63" />
              <Text style={styles.calendarioTitle}>Días libres esta semana</Text>
            </View>
            <View style={styles.diasRow}>
              {perfil.fechasDisponibles?.length > 0 ? perfil.fechasDisponibles.slice(0, 4).map((fecha, idx) => (
                <View key={`${fecha}-${idx}`} style={styles.diaBadge}>
                  <Text style={styles.diaTexto}>{new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</Text>
                </View>
              )) : (
                <Text style={styles.emptySmall}>Aun no ha marcado su disponibilidad.</Text>
              )}
            </View>
          </View>

          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.primario} />
              <Text style={styles.seccionTitulo}>Su bio</Text>
            </View>
            <Text style={styles.bioTexto}>{perfil.descripcion || 'Persona misteriosa sin bio.'}</Text>
          </View>

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

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
  btnVolver: { position: 'absolute', top: 50, left: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  btnReportar: { position: 'absolute', top: 50, right: 20, zIndex: 100, backgroundColor: 'rgba(240,68,79,0.88)', padding: 10, borderRadius: 20 },
  scrollContent: { flexGrow: 1 },
  contenedorFoto: { width: '100%', height: 450, position: 'relative' },
  fotoPrincipal: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlayCarga: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 20, backgroundColor: COLORS.tarjeta, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  perfilHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  nombre: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  ciudad: { fontSize: 15, color: COLORS.textMuted, marginLeft: 4 },
  calendarioBox: { backgroundColor: 'rgba(233, 30, 99, 0.05)', padding: 15, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(233, 30, 99, 0.2)', marginBottom: 25 },
  calendarioHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  calendarioTitle: { fontWeight: '900', color: '#E91E63', marginLeft: 8 },
  diasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  diaBadge: { backgroundColor: '#E91E63', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  diaTexto: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  emptySmall: { color: COLORS.textMuted, fontSize: 13 },
  nglBox: { backgroundColor: COLORS.fondo, padding: 20, borderRadius: RADIUS.xl, marginBottom: 25, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  nglHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  nglEmoji: { width: 38, height: 38, borderRadius: 19, textAlign: 'center', textAlignVertical: 'center', backgroundColor: COLORS.softPurple, color: COLORS.primario, fontSize: 22, fontWeight: '900' },
  nglTitulo: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
  nglSubtitulo: { fontSize: 13, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },
  nglInputRow: { flexDirection: 'row', gap: 10 },
  nglInput: { flex: 1, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12, color: COLORS.textPrimary },
  btnEnviarNGL: { backgroundColor: COLORS.primario, paddingHorizontal: 20, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  seccion: { marginBottom: 25 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  seccionTitulo: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginLeft: 8 },
  bioTexto: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  qaCard: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: SPACING[4], marginBottom: SPACING[3] },
  qaQuestion: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  qaAnswer: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 23, marginTop: 8, fontWeight: '800' },
  cancionDestacada: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondo, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
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
