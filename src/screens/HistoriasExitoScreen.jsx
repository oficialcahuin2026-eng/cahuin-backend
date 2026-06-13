import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';
import { socialService, userService } from '../services/api';

const ADMIN_EMAIL = 'oficialcahuin2026@gmail.com';

const FORM_INICIAL = {
  nombres: '',
  ciudad: '',
  historia: '',
  contacto: '',
};

export default function HistoriasExitoScreen({ navigation }) {
  const { usuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const esAdmin = (usuario?.email || '').toLowerCase() === ADMIN_EMAIL;

  const [form, setForm] = useState(FORM_INICIAL);
  const [foto, setFoto] = useState(null);
  const [historiasPublicas, setHistoriasPublicas] = useState([]);
  const [historiasPendientes, setHistoriasPendientes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [tabAdmin, setTabAdmin] = useState('historias');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);
  const [revision, setRevision] = useState(null);
  const [motivoRevision, setMotivoRevision] = useState('');

  const setCampo = (campo, valor) => setForm((actual) => ({ ...actual, [campo]: valor }));

  const cargar = async () => {
    setCargando(true);
    try {
      const publicas = await socialService.listarHistoriasExito('publicadas');
      setHistoriasPublicas(publicas.historias || []);

      if (esAdmin) {
        const [pendientesRes, reportesRes] = await Promise.all([
          socialService.listarHistoriasExito('pendiente'),
          userService.listarReportesAdmin('pendiente'),
        ]);
        setHistoriasPendientes(pendientesRes.historias || []);
        setReportes(reportesRes.reportes || []);
      }
    } catch (error) {
      setModalInfo({
        title: 'No pudimos cargar',
        message: error.message || 'Intenta de nuevo en un rato.',
        tone: 'danger',
      });
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, [esAdmin]));

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setModalInfo({
        title: 'Permiso necesario',
        message: 'Necesitamos acceso a tus fotos para adjuntar la imagen de la historia.',
        tone: 'danger',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setFoto({
        uri: asset.uri,
        name: asset.fileName || 'historia-exito.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const enviarHistoria = async () => {
    const nombres = form.nombres.trim();
    const historia = form.historia.trim();

    if (!nombres || !historia || !foto) {
      setModalInfo({
        title: 'Falta completar',
        message: 'Agrega nombres, historia y una foto donde salgan ambos.',
        tone: 'danger',
      });
      return;
    }

    setEnviando(true);
    try {
      await socialService.crearHistoriaExito({ ...form, imagen: foto });
      setForm(FORM_INICIAL);
      setFoto(null);
      setModalInfo({
        title: 'Historia enviada',
        message: 'La cuenta oficial la revisara antes de publicarla. Si falta algo, podras enviarla de nuevo corregida.',
        accent: COLORS.primario,
      });
      await cargar();
    } catch (error) {
      setModalInfo({ title: 'Error', message: error.message || 'No pudimos enviar la historia.', tone: 'danger' });
    } finally {
      setEnviando(false);
    }
  };

  const compartirHistoria = async (historia) => {
    await Share.share({
      message: `${historia.nombres} encontraron su Cahuin. ${historia.historia}`,
      url: historia.imagen,
      title: 'Historia de exito Cahuín',
    });
  };

  const aprobarHistoria = async (historia) => {
    try {
      await socialService.revisarHistoriaExito(historia._id, { accion: 'aprobar' });
      setModalInfo({ title: 'Publicada', message: 'La historia ya aparece en Historias de exito.' });
      await cargar();
    } catch (error) {
      setModalInfo({ title: 'Error', message: error.message || 'No se pudo aprobar.', tone: 'danger' });
    }
  };

  const abrirRechazoHistoria = (historia) => {
    setRevision({ tipo: 'historia', item: historia });
    setMotivoRevision('');
  };

  const abrirResolucionReporte = (reporte, estado) => {
    setRevision({ tipo: 'reporte', item: reporte, estado });
    setMotivoRevision('');
  };

  const confirmarRevision = async () => {
    if (!motivoRevision.trim()) return;
    try {
      if (revision?.tipo === 'historia') {
        await socialService.revisarHistoriaExito(revision.item._id, {
          accion: 'rechazar',
          motivo: motivoRevision,
        });
        setModalInfo({
          title: 'Rechazada',
          message: 'Se guardo la razon. La pareja puede volver a enviar el formulario corregido.',
        });
      } else if (revision?.tipo === 'reporte') {
        await userService.resolverReporteAdmin(revision.item._id, {
          estado: revision.estado,
          resolucion: motivoRevision,
        });
        setModalInfo({ title: 'Reporte actualizado', message: 'La resolucion quedo guardada.' });
      }
      setRevision(null);
      setMotivoRevision('');
      await cargar();
    } catch (error) {
      setModalInfo({ title: 'Error', message: error.message || 'No se pudo guardar.', tone: 'danger' });
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name="sparkles" size={22} color={COLORS.primario} />
        <Text style={styles.sectionTitle}>Enviar historia</Text>
      </View>

      <TouchableOpacity activeOpacity={0.88} style={styles.photoPicker} onPress={elegirFoto}>
        {foto ? (
          <Image source={{ uri: foto.uri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoEmpty}>
            <Ionicons name="camera" size={32} color={COLORS.primario} />
            <Text style={styles.photoTitle}>Foto de ambos</Text>
            <Text style={styles.photoHint}>Debe verse la pareja para aprobarla.</Text>
          </View>
        )}
      </TouchableOpacity>

      <Field COLORS={COLORS} icon="people" label="Nombres" placeholder="Ej: Fran y Mati" value={form.nombres} onChangeText={(text) => setCampo('nombres', text)} />
      <Field COLORS={COLORS} icon="location" label="Ciudad" placeholder="Ej: Temuco" value={form.ciudad} onChangeText={(text) => setCampo('ciudad', text)} />
      <Field COLORS={COLORS} icon="chatbubble-ellipses" label="Su historia" placeholder="Cuenta como se conocieron en Cahuin..." value={form.historia} onChangeText={(text) => setCampo('historia', text)} multiline maxLength={1200} />
      <Field COLORS={COLORS} icon="mail" label="Contacto opcional" placeholder="Instagram o correo para coordinar" value={form.contacto} onChangeText={(text) => setCampo('contacto', text)} />

      <TouchableOpacity activeOpacity={0.9} style={styles.submitButton} onPress={enviarHistoria} disabled={enviando}>
        {enviando ? <ActivityIndicator color="#FFF" /> : <Ionicons name="send" size={21} color="#FFF" />}
        <Text style={styles.submitText}>Enviar a revision</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoria = (historia, admin = false) => (
    <View key={historia._id} style={styles.storyCard}>
      <Image source={{ uri: historia.imagen }} style={styles.storyImage} />
      <View style={styles.storyBody}>
        <Text style={styles.storyNames}>{historia.nombres}</Text>
        <Text style={styles.storyCity}>{historia.ciudad || 'Chile'}</Text>
        <Text style={styles.storyText}>{historia.historia}</Text>
        {historia.contacto && admin ? <Text style={styles.metaText}>Contacto: {historia.contacto}</Text> : null}
        {historia.autor?.email && admin ? <Text style={styles.metaText}>Enviado por: {historia.autor.email}</Text> : null}
        <View style={styles.actionRow}>
          {!admin && esAdmin ? (
            <TouchableOpacity style={styles.smallAction} onPress={() => compartirHistoria(historia)}>
              <Ionicons name="share-social" size={16} color={COLORS.primario} />
              <Text style={styles.smallActionText}>Compartir</Text>
            </TouchableOpacity>
          ) : null}
          {admin ? (
            <>
              <TouchableOpacity style={[styles.smallAction, styles.approveAction]} onPress={() => aprobarHistoria(historia)}>
                <Text style={styles.approveText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallAction, styles.rejectAction]} onPress={() => abrirRechazoHistoria(historia)}>
                <Text style={styles.rejectText}>Rechazar</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderReporte = (reporte) => (
    <View key={reporte._id} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{reporte.motivo}</Text>
        <Text style={styles.reportOrigin}>{reporte.origen}</Text>
      </View>
      <Text style={styles.metaText}>Reportado: {reporte.reportado?.nombre || 'Usuario'} - {reporte.reportado?.email || 'sin correo'}</Text>
      <Text style={styles.metaText}>Denunciante: {reporte.denunciante?.email || 'sin correo'}</Text>
      {reporte.detalle ? <Text style={styles.reportDetail}>{reporte.detalle}</Text> : null}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.smallAction, styles.approveAction]} onPress={() => abrirResolucionReporte(reporte, 'resuelto')}>
          <Text style={styles.approveText}>Resolver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallAction, styles.rejectAction]} onPress={() => abrirResolucionReporte(reporte, 'descartado')}>
          <Text style={styles.rejectText}>Descartar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitulo}>Historias de exito</Text>
            {esAdmin ? (
              <View style={styles.adminPill}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.primario} />
              </View>
            ) : <View style={{ width: 48 }} />}
          </View>

          <LinearGradient colors={['rgba(255,70,92,0.24)', COLORS.tarjeta]} style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="heart" size={34} color={COLORS.primario} />
            </View>
            <Text style={styles.heroTitle}>Encontraron su Cahuin</Text>
            <Text style={styles.heroText}>
              Historias reales revisadas por el equipo antes de publicarse.
            </Text>
          </LinearGradient>

          {esAdmin ? (
            <View style={styles.adminTabs}>
              <TabButton label={`Historias (${historiasPendientes.length})`} active={tabAdmin === 'historias'} onPress={() => setTabAdmin('historias')} COLORS={COLORS} />
              <TabButton label={`Reportes (${reportes.length})`} active={tabAdmin === 'reportes'} onPress={() => setTabAdmin('reportes')} COLORS={COLORS} />
            </View>
          ) : null}

          {cargando ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 24 }} /> : null}

          {esAdmin && tabAdmin === 'historias' ? (
            <View style={styles.adminCard}>
              <Text style={styles.sectionTitle}>Pendientes de revision</Text>
              {historiasPendientes.length ? historiasPendientes.map((item) => renderHistoria(item, true)) : <Text style={styles.emptyText}>No hay historias pendientes.</Text>}
            </View>
          ) : null}

          {esAdmin && tabAdmin === 'reportes' ? (
            <View style={styles.adminCard}>
              <Text style={styles.sectionTitle}>Reportes pendientes</Text>
              {reportes.length ? reportes.map(renderReporte) : <Text style={styles.emptyText}>No hay reportes pendientes.</Text>}
            </View>
          ) : null}

          {renderForm()}

          <View style={styles.publicCard}>
            <Text style={styles.sectionTitle}>Publicadas</Text>
            {historiasPublicas.length ? historiasPublicas.map((item) => renderHistoria(item)) : (
              <Text style={styles.emptyText}>Aun no hay historias publicadas.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!revision} transparent animationType="fade" onRequestClose={() => setRevision(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reasonModal}>
            <Text style={styles.reasonTitle}>{revision?.tipo === 'historia' ? 'Motivo del rechazo' : 'Resolucion del reporte'}</Text>
            <Text style={styles.reasonHint}>
              {revision?.tipo === 'historia'
                ? 'Explica que falta para que puedan volver a enviar el formulario corregido.'
                : 'Deja una nota interna sobre por que se resolvio o descarto.'}
            </Text>
            <TextInput
              value={motivoRevision}
              onChangeText={setMotivoRevision}
              placeholder="Escribe la razon..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              textAlignVertical="top"
              style={styles.reasonInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setRevision(null)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={confirmarRevision}>
                <Text style={styles.confirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        accent={modalInfo?.accent}
        tone={modalInfo?.tone}
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

function Field({ COLORS, icon, label, multiline, ...props }) {
  const styles = fieldStyles(COLORS);
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={COLORS.primario} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        {...props}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

function TabButton({ label, active, onPress, COLORS }) {
  const styles = tabStyles(COLORS);
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const tabStyles = (COLORS) => StyleSheet.create({
  tab: { flex: 1, minHeight: 42, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  tabText: { color: COLORS.textMuted, fontWeight: '900', fontSize: 13 },
  tabTextActive: { color: '#FFF' },
});

const fieldStyles = (COLORS) => StyleSheet.create({
  wrap: { marginTop: SPACING[4] },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900' },
  input: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', paddingHorizontal: 16 },
  textarea: { minHeight: 132, paddingTop: 14, lineHeight: 22 },
});

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING[5] },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  headerTitulo: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  adminPill: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border },
  hero: { marginHorizontal: SPACING[5], borderRadius: 28, padding: SPACING[5], alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.softRed, marginBottom: 12 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 30, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center' },
  heroText: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  adminTabs: { flexDirection: 'row', gap: 10, marginHorizontal: SPACING[5], marginTop: SPACING[4] },
  adminCard: { margin: SPACING[5], marginBottom: 0, padding: SPACING[4], borderRadius: 24, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  formCard: { margin: SPACING[5], marginBottom: SPACING[4], padding: SPACING[5], borderRadius: 28, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  publicCard: { marginHorizontal: SPACING[5], padding: SPACING[4], borderRadius: 24, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: SPACING[4] },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display, marginBottom: SPACING[3] },
  photoPicker: { height: 210, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING[4] },
  photoTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  photoHint: { color: COLORS.textMuted, fontSize: 14, marginTop: 4 },
  submitButton: { minHeight: 58, borderRadius: 29, backgroundColor: COLORS.primario, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: SPACING[5], ...SHADOWS.light },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '900', fontFamily: FONTS.display },
  storyCard: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, marginBottom: SPACING[4] },
  storyImage: { width: '100%', height: 210, backgroundColor: COLORS.border },
  storyBody: { padding: SPACING[4] },
  storyNames: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display },
  storyCity: { color: COLORS.primario, fontSize: 13, fontWeight: '900', marginTop: 2 },
  storyText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  metaText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING[4] },
  smallAction: { minHeight: 40, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  smallActionText: { color: COLORS.primario, fontWeight: '900' },
  approveAction: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  rejectAction: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  approveText: { color: '#166534', fontWeight: '900' },
  rejectText: { color: '#991B1B', fontWeight: '900' },
  reportCard: { borderRadius: 20, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4], marginBottom: SPACING[3] },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  reportTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', flex: 1 },
  reportOrigin: { color: COLORS.primario, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  reportDetail: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 20, marginTop: 10 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'center', padding: SPACING[5] },
  reasonModal: { borderRadius: 24, backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[5] },
  reasonTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  reasonHint: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  reasonInput: { minHeight: 130, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg, color: COLORS.textPrimary, padding: 14, marginTop: SPACING[4], fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: SPACING[4] },
  modalBtn: { flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  confirmBtn: { backgroundColor: COLORS.primario },
  cancelText: { color: COLORS.textPrimary, fontWeight: '900' },
  confirmText: { color: '#FFF', fontWeight: '900' },
});
