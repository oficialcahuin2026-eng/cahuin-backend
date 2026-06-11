import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { EXPLORAR_CATEGORIAS } from '../data/explorarCategorias';
import { inferirRegionPorCiudad } from '../utils/chileLocations';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import { GradientButton, SoftIcon } from '../components/CahuinUI';
import CahuinTextField from '../components/CahuinTextField';
import CahuinModal from '../components/CahuinModal';

const INTENCIONES = [
  'Relación seria',
  'Algo espontáneo',
  'Conversar',
  'Amistad',
  'Cita tranquila',
  'Sin presión',
  'Café rápido',
  'Lo sigo pensando',
];

const INTERESES_BASE = [
  'Música en vivo',
  'Café',
  'Panoramas',
  'Humor',
  'Lectura',
  'Universidad',
  'Naturaleza',
  'Fotografía',
  'Cine y series',
  'Cocina',
  'Deporte',
  'Juntas',
  'Bienestar',
  'Conversaciones reales',
  'Citas tranquilas',
];

const DISTANCIAS = [10, 25, 50, 100];

export default function EditarPerfilScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [fotosGaleria, setFotosGaleria] = useState(usuario?.fotos?.length > 0 ? usuario.fotos : (usuario?.foto ? [usuario.foto] : []));
  const [guardando, setGuardando] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState(null);

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '');
  const [altura, setAltura] = useState(usuario?.altura || '');
  const [ciudad, setCiudad] = useState(usuario?.ciudad || '');
  const [region, setRegion] = useState(usuario?.region || '');
  const [queBuscas, setQueBuscas] = useState(usuario?.queBuscas || 'Lo sigo pensando');
  const [distanciaMax, setDistanciaMax] = useState(Number(usuario?.distanciaMax || 50));
  const [intereses, setIntereses] = useState(usuario?.intereses || []);
  const [categoriasExplorar, setCategoriasExplorar] = useState(usuario?.categoriasExplorar || []);

  const [fechasDisponibles, setFechasDisponibles] = useState(usuario?.fechasDisponibles || []);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [modalMusicaVisible, setModalMusicaVisible] = useState(false);
  const [cancion, setCancion] = useState(usuario?.cancion || null);
  const [queryMusica, setQueryMusica] = useState('');
  const [resultadosMusica, setResultadosMusica] = useState([]);
  const [buscandoMusica, setBuscandoMusica] = useState(false);

  const fotoPrincipal = fotosGaleria[0] || usuario?.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=800';
  const categoriasElegidas = useMemo(
    () => EXPLORAR_CATEGORIAS.filter((categoria) => categoriasExplorar.includes(categoria.id)),
    [categoriasExplorar]
  );

  const agregarFotoGaleria = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.6 });
    if (!result.canceled) setFotosGaleria([...fotosGaleria, result.assets[0].uri].slice(0, 6));
  };

  const eliminarFotoGaleria = (index) => setFotosGaleria(fotosGaleria.filter((_, i) => i !== index));

  const agregarFecha = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const existe = fechasDisponibles.find((d) => new Date(d).toDateString() === selectedDate.toDateString());
      if (!existe) setFechasDisponibles([...fechasDisponibles, selectedDate.toISOString()]);
    }
  };

  const removerFecha = (index) => setFechasDisponibles(fechasDisponibles.filter((_, i) => i !== index));

  const toggleInteres = (item) => {
    setIntereses((actuales) => (
      actuales.includes(item)
        ? actuales.filter((i) => i !== item)
        : [...actuales, item].slice(0, 12)
    ));
  };

  const toggleCategoria = (id) => {
    setCategoriasExplorar((actuales) => (
      actuales.includes(id)
        ? actuales.filter((categoriaId) => categoriaId !== id)
        : [...actuales, id]
    ));
  };

  const actualizarCiudad = (texto) => {
    setCiudad(texto);
    const regionInferida = inferirRegionPorCiudad(texto);
    if (regionInferida) setRegion(regionInferida);
  };

  const guardarDetalles = async () => {
    setGuardando(true);
    try {
      const formData = new FormData();
      formData.append('fotosExistentes', JSON.stringify(fotosGaleria.filter((f) => typeof f === 'string' && f.startsWith('http'))));
      const fotosNuevas = fotosGaleria.filter((f) => typeof f === 'string' && !f.startsWith('http'));
      fotosNuevas.forEach((uri, idx) => {
        formData.append('nuevasFotos', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: `f_${idx}.jpg`, type: 'image/jpeg' });
      });
      await userService.actualizarFotos(formData);

      const res = await userService.actualizar({
        nombre,
        descripcion,
        altura,
        ciudad,
        region,
        queBuscas,
        distanciaMax,
        intereses,
        categoriasExplorar,
        cancion,
        fechasDisponibles,
      });
      actualizarUsuario({
        ...(res.usuario || {}),
        nombre,
        descripcion,
        altura,
        ciudad,
        region,
        queBuscas,
        distanciaMax,
        intereses,
        categoriasExplorar,
        cancion,
        fechasDisponibles,
      });
      setModalInfo({
        title: '¡Listo!',
        message: 'Perfil actualizado. Ahora tu radar entiende mejor tu cahuín.',
        emoji: '✅',
        accent: COLORS.primario,
        actions: [{ label: 'Listo', onPress: () => { setModalInfo(null); navigation.goBack(); } }],
      });
    } catch (error) {
      setModalInfo({ title: 'Error', message: error.message || 'No pudimos guardar.', emoji: '🌶️', tone: 'danger' });
    } finally {
      setGuardando(false);
    }
  };

  const buscarMusica = async (texto) => {
    setQueryMusica(texto);
    if (texto.length < 3) return setResultadosMusica([]);
    setBuscandoMusica(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(texto)}&entity=song&limit=5`);
      const data = await res.json();
      setResultadosMusica(data.results);
    } catch (e) {
      setResultadosMusica([]);
    } finally {
      setBuscandoMusica(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Editar Perfil</Text>
        <TouchableOpacity onPress={guardarDetalles} style={styles.saveTop} disabled={guardando}>
          {guardando ? <ActivityIndicator color={COLORS.primario} /> : <Text style={styles.btnGuardar}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.previewStrip}>
          <Image source={{ uri: fotoPrincipal }} style={styles.previewAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewName} numberOfLines={1}>{nombre || 'Tu nombre'}</Text>
            <Text style={styles.previewMeta} numberOfLines={1}>{ciudad || 'Tu ciudad'} · {queBuscas}</Text>
          </View>
          <TouchableOpacity style={styles.previewButton} onPress={() => setPreviewVisible(true)}>
            <Ionicons name="eye" size={18} color="#FFF" />
            <Text style={styles.previewButtonText}>Vista</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Tus 6 fotos</Text>
        <View style={styles.gridFotos}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View key={index} style={styles.cajaFotoSlot}>
              {fotosGaleria[index] ? (
                <>
                  <Image source={{ uri: fotosGaleria[index] }} style={styles.fotoEnGrid} />
                  <TouchableOpacity style={styles.btnEliminarFoto} onPress={() => eliminarFotoGaleria(index)}>
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.btnAgregarFoto} onPress={agregarFotoGaleria}>
                  <Ionicons name="add" size={30} color={COLORS.primario} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <SectionTitle styles={styles} title="Lo básico" subtitle="Que el perfil se sienta tuyo antes de tirar el primer cahuín." />
        <CahuinTextField icon="person-outline" placeholder="Nombre" value={nombre} onChangeText={setNombre} />
        <View style={styles.rowInputs}>
          <CahuinTextField icon="business-outline" containerStyle={styles.halfInput} placeholder="Ciudad" value={ciudad} onChangeText={actualizarCiudad} />
          <CahuinTextField icon="map-outline" containerStyle={styles.halfInput} placeholder="Región" value={region} onChangeText={setRegion} />
        </View>
        <CahuinTextField icon="sparkles-outline" containerStyle={{ marginTop: SPACING[3] }} placeholder="Presentate de forma original..." value={descripcion} onChangeText={setDescripcion} multiline variant="textarea" />

        <SectionTitle styles={styles} title="Qué buscas" subtitle="Esto conecta Explorar, Radar y las comunidades." />
        <View style={styles.chipWrap}>
          {INTENCIONES.map((item) => (
            <SelectableChip key={item} label={item} selected={queBuscas === item} onPress={() => setQueBuscas(item)} styles={styles} COLORS={COLORS} />
          ))}
        </View>

        <SectionTitle styles={styles} title="Distancia del radar" subtitle="Las comunidades respetan esta distancia cuando muestran perfiles." />
        <View style={styles.distanceRow}>
          {DISTANCIAS.map((km) => (
            <TouchableOpacity key={km} onPress={() => setDistanciaMax(km)} style={[styles.distanceChip, distanciaMax === km && styles.distanceActive]}>
              <Text style={[styles.distanceText, distanciaMax === km && styles.distanceTextActive]}>{km} km</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle styles={styles} title="Intereses" subtitle="Elige hasta 12. Mientras más claro, mejor cahuín." />
        <View style={styles.chipWrap}>
          {INTERESES_BASE.map((item) => (
            <SelectableChip key={item} label={item} selected={intereses.includes(item)} onPress={() => toggleInteres(item)} styles={styles} COLORS={COLORS} />
          ))}
        </View>

        <SectionTitle styles={styles} title="Comunidades de Explorar" subtitle="Puedes estar en todas las que calcen contigo." />
        <View style={styles.categoryList}>
          {EXPLORAR_CATEGORIAS.map((categoria) => {
            const selected = categoriasExplorar.includes(categoria.id);
            return (
              <TouchableOpacity key={categoria.id} onPress={() => toggleCategoria(categoria.id)} style={[styles.categoryRow, selected && { borderColor: categoria.color, backgroundColor: categoria.bg }]}>
                <SoftIcon name={categoria.icon} bg="#FFF" color={categoria.color} size={46} rounded={23} iconSize={22} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, selected && styles.categoryNameSelected]}>{categoria.title}</Text>
                  <Text style={[styles.categoryText, selected && styles.categoryTextSelected]} numberOfLines={2}>{categoria.subtitle}</Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={24} color={selected ? categoria.color : COLORS.gris} />
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionTitle styles={styles} title="Detalles que suman" subtitle="Pequeñas pistas para que te inviten con algo más que hola." />
        <View style={styles.calendarHeader}>
          <Text style={styles.subLabel}>Mi calendario de citas</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.smallPrimary}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.smallPrimaryText}>Fecha</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fechasContainer}>
          {fechasDisponibles.map((fechaIso, idx) => {
            const f = new Date(fechaIso);
            return (
              <View key={`${fechaIso}-${idx}`} style={styles.chipFecha}>
                <Text style={styles.textoFecha}>{f.getDate()} de {f.toLocaleString('es-ES', { month: 'short' })}</Text>
                <TouchableOpacity onPress={() => removerFecha(idx)} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#FF5252" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        {showDatePicker && <DateTimePicker value={new Date()} mode="date" display="default" minimumDate={new Date()} onChange={agregarFecha} />}

        <Text style={styles.subLabel}>Mi himno musical</Text>
        {cancion?.nombre ? (
          <View style={styles.cancionSeleccionada}>
            <Image source={{ uri: cancion.foto }} style={styles.album} />
            <Text style={styles.songName} numberOfLines={1}>{cancion.nombre}</Text>
            <TouchableOpacity onPress={() => setCancion(null)}>
              <Ionicons name="close-circle" size={24} color="#FF5252" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnBuscarMusica} onPress={() => setModalMusicaVisible(true)}>
            <Ionicons name="search" size={20} color="#FFF" />
            <Text style={styles.musicButtonText}>Buscar canción</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.subLabel}>Altura (m)</Text>
        <CahuinTextField icon="resize-outline" placeholder="Ej: 1.75" value={altura} onChangeText={setAltura} keyboardType="numeric" />

        <GradientButton icon="save" style={styles.bottomSave} onPress={guardarDetalles} disabled={guardando}>
          Guardar perfil completo
        </GradientButton>
      </ScrollView>

      <Modal visible={modalMusicaVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar canción</Text>
              <TouchableOpacity onPress={() => setModalMusicaVisible(false)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            <CahuinTextField icon="musical-notes-outline" placeholder="Artista o canción..." value={queryMusica} onChangeText={buscarMusica} autoFocus />
            {buscandoMusica ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 20 }} /> : (
              <FlatList
                data={resultadosMusica}
                keyExtractor={(item) => item.trackId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.trackItem} onPress={() => { setCancion({ nombre: `${item.artistName} - ${item.trackName}`, foto: item.artworkUrl100 }); setModalMusicaVisible(false); }}>
                    <Image source={{ uri: item.artworkUrl100 }} style={styles.album} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackTitle}>{item.trackName}</Text>
                      <Text style={styles.trackArtist}>{item.artistName}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={previewVisible} animationType="slide" transparent onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.modalFondo}>
          <View style={styles.previewModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Así te verían</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
              <View style={styles.publicCard}>
                <Image source={{ uri: fotoPrincipal }} style={styles.publicImage} />
                <LinearGradient colors={['transparent', 'rgba(10,14,24,0.86)']} style={styles.publicOverlay}>
                  <Text style={styles.publicName}>{nombre || 'Tu nombre'}, {usuario?.edad || 18}</Text>
                  <View style={styles.publicLocationRow}>
                    <Ionicons name="location" size={15} color="rgba(255,255,255,0.88)" />
                    <Text style={styles.publicLocation}>{ciudad || 'Tu ciudad'} · hasta {distanciaMax} km</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={styles.publicBio}>{descripcion || 'Escribe una bio con personalidad Cahuín para que te inviten con tema.'}</Text>
              <View style={styles.publicChips}>
                {[queBuscas, ...intereses].filter(Boolean).slice(0, 8).map((chip) => (
                  <View key={chip} style={styles.publicChip}><Text style={styles.publicChipText}>{chip}</Text></View>
                ))}
              </View>
              {categoriasElegidas.length > 0 ? (
                <View style={styles.previewCategories}>
                  {categoriasElegidas.slice(0, 4).map((categoria) => (
                    <View key={categoria.id} style={[styles.previewCategory, { backgroundColor: categoria.bg }]}>
                      <Ionicons name={categoria.icon} size={18} color={categoria.color} />
                      <Text style={[styles.previewCategoryText, { color: categoria.color }]}>{categoria.title}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
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
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ styles, title, subtitle }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function SelectableChip({ label, selected, onPress, styles, COLORS }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.selectChip, selected && { backgroundColor: COLORS.primario, borderColor: COLORS.primario }]}>
      <Text style={[styles.selectChipText, selected && { color: '#FFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.tarjeta },
  headerIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo },
  tituloHeader: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  saveTop: { minWidth: 70, alignItems: 'flex-end' },
  btnGuardar: { color: COLORS.primario, fontWeight: '900', fontSize: 16 },
  content: { padding: SPACING[5], paddingBottom: 120 },
  previewStrip: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, padding: SPACING[3], ...SHADOWS.light },
  previewAvatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.softRed },
  previewName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  previewMeta: { color: COLORS.textMuted, fontSize: 13, marginTop: 3 },
  previewButton: { height: 42, borderRadius: 21, paddingHorizontal: 14, backgroundColor: COLORS.navy, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  label: { fontSize: 19, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  sectionTitleWrap: { marginTop: SPACING[7], marginBottom: SPACING[3] },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  gridFotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginTop: SPACING[3] },
  cajaFotoSlot: { width: '31%', aspectRatio: 0.72, backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  fotoEnGrid: { width: '100%', height: '100%', resizeMode: 'cover' },
  btnAgregarFoto: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnEliminarFoto: { position: 'absolute', top: 7, right: 7, backgroundColor: 'rgba(0,0,0,0.6)', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  inputEmbellecido: { backgroundColor: COLORS.tarjeta, color: COLORS.textPrimary, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, padding: 16, fontSize: 16, ...SHADOWS.light },
  rowInputs: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[3] },
  halfInput: { flex: 1 },
  bioInput: { height: 112, textAlignVertical: 'top', marginTop: SPACING[3] },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  selectChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.tarjeta },
  selectChipText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 },
  distanceRow: { flexDirection: 'row', gap: 10 },
  distanceChip: { flex: 1, minHeight: 50, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.tarjeta, alignItems: 'center', justifyContent: 'center' },
  distanceActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  distanceText: { color: COLORS.textMuted, fontWeight: '900' },
  distanceTextActive: { color: '#FFF' },
  categoryList: { gap: SPACING[3] },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], padding: SPACING[3], borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.tarjeta },
  categoryName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  categoryText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  categoryNameSelected: { color: '#101828' },
  categoryTextSelected: { color: '#667085' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900', marginBottom: 10, marginTop: SPACING[4] },
  smallPrimary: { height: 36, borderRadius: 18, paddingHorizontal: 12, backgroundColor: COLORS.primario, flexDirection: 'row', alignItems: 'center', gap: 4 },
  smallPrimaryText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  fechasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipFecha: { flexDirection: 'row', backgroundColor: 'rgba(240, 68, 79, 0.1)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(240, 68, 79, 0.3)', alignItems: 'center' },
  textoFecha: { color: COLORS.primario, fontWeight: '900', fontSize: 14 },
  btnBuscarMusica: { flexDirection: 'row', backgroundColor: '#1DB954', padding: 15, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginTop: 5, gap: 8 },
  musicButtonText: { color: '#FFF', fontWeight: '900' },
  cancionSeleccionada: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tarjeta, padding: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  album: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  songName: { flex: 1, color: COLORS.textPrimary, fontWeight: '900' },
  bottomSave: { marginTop: SPACING[7] },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  trackTitle: { color: COLORS.textPrimary, fontWeight: '900' },
  trackArtist: { color: COLORS.textMuted, marginTop: 2 },
  previewModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '88%' },
  previewScroll: { paddingBottom: SPACING[5] },
  publicCard: { height: 430, borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.fondo },
  publicImage: { width: '100%', height: '100%' },
  publicOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING[5], paddingTop: 80 },
  publicName: { color: '#FFF', fontSize: 34, lineHeight: 40, fontWeight: '900', fontFamily: FONTS.display },
  publicLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  publicLocation: { color: 'rgba(255,255,255,0.88)', fontSize: 15, flex: 1 },
  publicBio: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 23, marginTop: SPACING[4] },
  publicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING[3] },
  publicChip: { backgroundColor: COLORS.softRed, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 },
  publicChipText: { color: COLORS.primario, fontWeight: '900', fontSize: 12 },
  previewCategories: { marginTop: SPACING[4], gap: 8 },
  previewCategory: { borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewCategoryEmoji: { fontSize: 19 },
  previewCategoryText: { fontWeight: '900' },
});

