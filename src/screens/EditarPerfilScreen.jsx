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
  TextInput,
  Dimensions,
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

const { width } = Dimensions.get('window');

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
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [fotosGaleria, setFotosGaleria] = useState(usuario?.fotos?.length > 0 ? usuario.fotos : (usuario?.foto ? [usuario.foto] : []));
  const [guardando, setGuardando] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
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

  const fotoPrincipal = fotosGaleria[0] || (usuario?.fotos && usuario.fotos.length > 0 ? usuario.fotos[0] : usuario?.foto) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=800';
  const categoriasElegidas = useMemo(
    () => EXPLORAR_CATEGORIAS.filter((categoria) => categoriasExplorar.includes(categoria.id)),
    [categoriasExplorar]
  );

  const agregarFotoGaleria = async (index) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.6 });
    if (!result.canceled) {
      const nuevasFotos = [...fotosGaleria];
      nuevasFotos[index] = result.assets[0].uri;
      // Filtrar undefined o vacíos si se saltó un índice
      setFotosGaleria(nuevasFotos.filter(Boolean).slice(0, 6));
    }
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
        fotos: fotosGaleria // Asumimos que se guardaron correctamente para actualizar local
      });
      setModalInfo({
        title: '¡Perfil Actualizado!',
        message: 'Tus cambios han sido guardados con éxito.',
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

  const renderFotoSlot = (index, styleExtra = {}) => {
    const uri = fotosGaleria[index];
    return (
      <View style={[styles.cajaFotoSlot, styleExtra]}>
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.fotoEnGrid} />
            <TouchableOpacity style={styles.btnEliminarFoto} onPress={() => eliminarFotoGaleria(index)}>
              <Ionicons name="close" size={16} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.btnAgregarFoto} onPress={() => agregarFotoGaleria(index)}>
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={25} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Editar Perfil</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* GRID ASIMÉTRICO (Tinder-style) */}
        <View style={styles.gridContainer}>
          <View style={styles.gridTopRow}>
            {renderFotoSlot(0, styles.gridLargeSlot)}
            <View style={styles.gridRightCol}>
              {renderFotoSlot(1, styles.gridSmallSlot)}
              {renderFotoSlot(2, styles.gridSmallSlot)}
            </View>
          </View>
          <View style={styles.gridBottomRow}>
            {renderFotoSlot(3, styles.gridSmallSlot)}
            {renderFotoSlot(4, styles.gridSmallSlot)}
            {renderFotoSlot(5, styles.gridSmallSlot)}
          </View>
        </View>
        <Text style={styles.gridHint}>Mantén presionado para ordenar (próximamente). La foto más grande es tu portada.</Text>

        <SectionTitle styles={styles} title="Lo básico" subtitle="Cuentale al mundo quién eres." />
        <View style={styles.floatingInputWrap}>
          <Ionicons name="person" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput 
            style={styles.floatingInput} 
            placeholder="Tu Nombre" 
            placeholderTextColor={COLORS.textMuted}
            value={nombre} 
            onChangeText={setNombre} 
          />
        </View>

        <View style={styles.rowInputs}>
          <View style={[styles.floatingInputWrap, styles.halfInput]}>
            <Ionicons name="business" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={styles.floatingInput} 
              placeholder="Ciudad" 
              placeholderTextColor={COLORS.textMuted}
              value={ciudad} 
              onChangeText={actualizarCiudad} 
            />
          </View>
          <View style={[styles.floatingInputWrap, styles.halfInput]}>
            <Ionicons name="map" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={styles.floatingInput} 
              placeholder="Región" 
              placeholderTextColor={COLORS.textMuted}
              value={region} 
              onChangeText={setRegion} 
            />
          </View>
        </View>

        <View style={[styles.floatingInputWrap, styles.bioInputWrap]}>
          <TextInput 
            style={[styles.floatingInput, styles.bioInput]} 
            placeholder="Preséntate de forma original..." 
            placeholderTextColor={COLORS.textMuted}
            value={descripcion} 
            onChangeText={setDescripcion} 
            multiline 
            textAlignVertical="top"
          />
        </View>

        <SectionTitle styles={styles} title="Qué buscas" subtitle="Esto conecta Explorar, Radar y las comunidades." />
        <View style={styles.chipWrap}>
          {INTENCIONES.map((item) => (
            <SelectableChip key={item} label={item} selected={queBuscas === item} onPress={() => setQueBuscas(item)} styles={styles} COLORS={COLORS} />
          ))}
        </View>

        <SectionTitle styles={styles} title="Distancia del radar" subtitle="¿Qué tan lejos estás dispuesto a ir?" />
        <View style={styles.distanceRow}>
          {DISTANCIAS.map((km) => (
            <TouchableOpacity key={km} onPress={() => setDistanciaMax(km)} style={[styles.distanceChip, distanciaMax === km && { backgroundColor: COLORS.primario, borderColor: COLORS.primario }]}>
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

        <SectionTitle styles={styles} title="Comunidades de Explorar" subtitle="Únete a las comunidades vibrantes." />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {EXPLORAR_CATEGORIAS.map((categoria) => {
            const selected = categoriasExplorar.includes(categoria.id);
            return (
              <TouchableOpacity key={categoria.id} onPress={() => toggleCategoria(categoria.id)} style={[styles.categoryCard, selected && { borderColor: categoria.color, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <SoftIcon name={categoria.icon} bg={selected ? categoria.color : COLORS.fondo} color={selected ? '#FFF' : categoria.color} size={46} rounded={23} iconSize={22} />
                <Text style={[styles.categoryCardName, selected && { color: '#FFF' }]} numberOfLines={1}>{categoria.title}</Text>
                {selected && <View style={[styles.categoryCardCheck, { backgroundColor: categoria.color }]}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
            <Text style={styles.musicButtonText}>Buscar canción en Apple Music</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.subLabel}>Altura (m)</Text>
        <View style={styles.floatingInputWrap}>
          <Ionicons name="resize" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput 
            style={styles.floatingInput} 
            placeholder="Ej: 1.75" 
            placeholderTextColor={COLORS.textMuted}
            value={altura} 
            onChangeText={setAltura} 
            keyboardType="numeric"
          />
        </View>
        
        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* ── STICKY BOTTOM BAR ── */}
      <LinearGradient colors={['transparent', COLORS.bg, COLORS.bg]} style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnPreviewCircle} onPress={() => setPreviewVisible(true)}>
          <Ionicons name="eye" size={26} color={COLORS.primario} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSaveFloating, guardando && { opacity: 0.7 }]} onPress={guardarDetalles} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnSaveFloatingText}>Guardar Perfil</Text>}
        </TouchableOpacity>
      </LinearGradient>

      {/* ── MODALS ── */}
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
                <Image source={{ uri: (fotosGaleria.length > 0 ? fotosGaleria[previewIndex] : fotoPrincipal) }} style={styles.publicImage} />
                
                {/* Carrusel functionality */}
                {fotosGaleria.length > 1 && (
                  <View style={styles.barrasContainer}>
                    {fotosGaleria.map((_, i) => (
                      <View key={i} style={[styles.barraFoto, { backgroundColor: i === previewIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => { if (previewIndex > 0) setPreviewIndex(previewIndex - 1); }} />
                <TouchableOpacity style={styles.zonaTactilDer} onPress={() => { if (previewIndex < fotosGaleria.length - 1) setPreviewIndex(previewIndex + 1); }} />

                <LinearGradient colors={['transparent', 'rgba(10,14,24,0.95)']} style={styles.publicOverlay}>
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

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.bg },
  headerIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta },
  tituloHeader: { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  
  content: { padding: SPACING[4], paddingBottom: 120 },

  // ── Grid Asimétrico ──
  gridContainer: { gap: 10 },
  gridTopRow: { flexDirection: 'row', gap: 10, height: 260 },
  gridLargeSlot: { flex: 2, height: '100%' },
  gridRightCol: { flex: 1, gap: 10, height: '100%' },
  gridSmallSlot: { flex: 1, height: '100%' },
  gridBottomRow: { flexDirection: 'row', gap: 10, height: 125 },

  cajaFotoSlot: { 
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
    borderRadius: RADIUS.lg, 
    overflow: 'hidden', 
    borderWidth: 1.5, 
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fotoEnGrid: { width: '100%', height: '100%', resizeMode: 'cover' },
  btnAgregarFoto: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  addIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(240,68,79,0.8)', justifyContent: 'center', alignItems: 'center' },
  btnEliminarFoto: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gridHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 10, textAlign: 'center' },

  // ── Typography ──
  label: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  sectionTitleWrap: { marginTop: SPACING[6], marginBottom: SPACING[3] },
  sectionSubtitle: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },

  // ── Minimalist Inputs ──
  floatingInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    paddingHorizontal: 16,
    marginBottom: 10,
    ...SHADOWS.dark,
  },
  inputIcon: { marginRight: 10 },
  floatingInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 18,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  bioInputWrap: { alignItems: 'flex-start', paddingVertical: 12 },
  bioInput: { height: 120, paddingTop: 0, paddingBottom: 0 },

  // ── Chips ──
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  selectChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
  selectChipText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 13 },
  
  distanceRow: { flexDirection: 'row', gap: 10 },
  distanceChip: { flex: 1, minHeight: 46, borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', alignItems: 'center', justifyContent: 'center' },
  distanceText: { color: COLORS.textMuted, fontWeight: '900' },
  distanceTextActive: { color: '#FFF' },

  // ── Category Scroll ──
  categoryScroll: { gap: 12, paddingRight: 20 },
  categoryCard: { width: 110, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', alignItems: 'center' },
  categoryCardName: { color: COLORS.textMuted, fontSize: 12, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  categoryCardCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // ── Bottom Bar (Sticky) ──
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    gap: 15,
  },
  btnPreviewCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(240,68,79,0.15)',
    borderWidth: 1, borderColor: 'rgba(240,68,79,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnSaveFloating: {
    flex: 1, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primario,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.dark,
    shadowColor: COLORS.primario, shadowOpacity: 0.5, shadowRadius: 15,
  },
  btnSaveFloatingText: { color: '#FFF', fontSize: 16, fontWeight: '900', fontFamily: FONTS.display },

  // ── Other components ──
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLabel: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', marginBottom: 12, marginTop: SPACING[5] },
  smallPrimary: { height: 36, borderRadius: 18, paddingHorizontal: 14, backgroundColor: COLORS.primario, flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallPrimaryText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  fechasContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipFecha: { flexDirection: 'row', backgroundColor: 'rgba(240, 68, 79, 0.1)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(240, 68, 79, 0.3)', alignItems: 'center' },
  textoFecha: { color: COLORS.primario, fontWeight: '900', fontSize: 14 },
  
  btnBuscarMusica: { flexDirection: 'row', backgroundColor: '#1DB954', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10 },
  musicButtonText: { color: '#111827', fontWeight: '900', fontSize: 15 },
  cancionSeleccionada: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' },
  album: { width: 52, height: 52, borderRadius: 10, marginRight: 14 },
  songName: { flex: 1, color: COLORS.textPrimary, fontWeight: '900', fontSize: 16 },

  // ── Modals ──
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display },
  trackItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  trackTitle: { color: COLORS.textPrimary, fontWeight: '900' },
  trackArtist: { color: COLORS.textMuted, marginTop: 2 },
  
  // ── Preview Modal ──
  previewModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '90%' },
  previewScroll: { paddingBottom: SPACING[5] },
  publicCard: { height: 480, borderRadius: 28, overflow: 'hidden', backgroundColor: COLORS.fondo, position: 'relative' },
  publicImage: { width: '100%', height: '100%' },
  publicOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: SPACING[5], paddingTop: 100 },
  publicName: { color: '#FFF', fontSize: 36, lineHeight: 42, fontWeight: '900', fontFamily: FONTS.display },
  publicLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  publicLocation: { color: 'rgba(255,255,255,0.9)', fontSize: 16, flex: 1, fontWeight: '600' },
  publicBio: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 24, marginTop: SPACING[4] },
  publicChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING[3] },
  publicChip: { backgroundColor: 'rgba(240,68,79,0.15)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(240,68,79,0.3)' },
  publicChipText: { color: COLORS.primario, fontWeight: '900', fontSize: 13 },
  previewCategories: { marginTop: SPACING[4], gap: 10 },
  previewCategory: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewCategoryText: { fontWeight: '900', fontSize: 15 },

  // ── Carrusel Controls ──
  barrasContainer: { position: 'absolute', top: 15, left: 12, right: 12, flexDirection: 'row', gap: 5, zIndex: 10 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  zonaTactilIzq: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 5 },
  zonaTactilDer: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 5 },
});
