import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SHADOWS, SPACING, RADIUS } from '../utils/theme';
import { GradientButton } from '../components/CahuinUI';
import DateTimePicker from '@react-native-community/datetimepicker';
import { panoramaService } from '../services/api';

const VIBES_DISPONIBLES = [
  'Tragos', 'Música', 'Buena onda', 'Bailoteo', 'Carrete', 'Relax', 'Aire libre', 'Comida'
];

export default function CrearPanoramaScreen({ navigation }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  
  const [titulo, setTitulo] = useState('');
  const [lugar, setLugar] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [descripcion, setDescripcion] = useState('');
  const [vibes, setVibes] = useState([]);
  const [cupos, setCupos] = useState('4');
  const [privacidad, setPrivacidad] = useState('Público');
  
  const [showCuposModal, setShowCuposModal] = useState(false);
  const [showPrivacidadModal, setShowPrivacidadModal] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  
  // Coordenadas por defecto (ej. centro de Chile o Santiago)
  const [regionMap, setRegionMap] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const obtenerUbicacionActual = async () => {
    setCargandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegionMap(coords);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        setLugar(`${place.street || ''} ${place.streetNumber || ''}, ${place.city || place.subregion || ''}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const toggleVibe = (vibe) => {
    if (vibes.includes(vibe)) {
      setVibes(vibes.filter(v => v !== vibe));
    } else {
      if (vibes.length < 3) setVibes([...vibes, vibe]);
    }
  };

  const handleCrear = async () => {
    if (!titulo.trim() || !lugar.trim()) return;
    setGuardando(true);
    try {
      await panoramaService.crear({
        titulo, lugar, fecha, descripcion, vibes, cupos: parseInt(cupos) || 4, privacidad
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Armar un Panorama</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Título */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>¿Qué van a hacer?</Text>
            <Text style={styles.charCount}>{titulo.length}/80</Text>
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="sparkles-outline" size={20} color={COLORS.primario} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Juntarse a tomar unas chelas"
              placeholderTextColor={COLORS.textMuted}
              maxLength={80}
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>
        </View>

        {/* Lugar */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>¿Dónde es?</Text>
          <View style={styles.inputBox}>
            <Ionicons name="location-outline" size={20} color="#34A853" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Bar X, Centro"
              placeholderTextColor={COLORS.textMuted}
              value={lugar}
              onChangeText={setLugar}
            />
          </View>
          {/* Map */}
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapImage}
              region={regionMap}
              onRegionChangeComplete={(r) => setRegionMap(r)}
            >
              <Marker coordinate={{ latitude: regionMap.latitude, longitude: regionMap.longitude }}>
                <View style={styles.mapPin}>
                  <Ionicons name="location" size={20} color="#FFF" />
                </View>
              </Marker>
            </MapView>
          </View>
          <TouchableOpacity style={styles.useLocationBtn} onPress={obtenerUbicacionActual} disabled={cargandoUbicacion}>
            <Ionicons name="navigate-outline" size={16} color={COLORS.primario} />
            <Text style={styles.useLocationText}>{cargandoUbicacion ? 'Obteniendo...' : 'Usar mi ubicación actual'}</Text>
          </TouchableOpacity>
        </View>

        {/* Fecha y Hora */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Fecha</Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateIconWrap}>
                <Ionicons name="calendar-outline" size={18} color="#FF6B45" />
              </View>
              <Text style={styles.dateText}>{fecha.toLocaleDateString()}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Hora</Text>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowTimePicker(true)}>
              <View style={[styles.dateIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="time-outline" size={18} color="#4F6FEA" />
              </View>
              <Text style={styles.dateText}>
                {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker 
            value={fecha} 
            mode="date" 
            minimumDate={new Date()} 
            display="default" 
            onChange={(e, d) => { setShowDatePicker(false); if (d) setFecha(d); }} 
          />
        )}
        {showTimePicker && (
          <DateTimePicker 
            value={fecha} 
            mode="time" 
            display="default" 
            onChange={(e, d) => { setShowTimePicker(false); if (d) setFecha(d); }} 
          />
        )}

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción breve</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Añade detalles, si hay cuota, qué llevar..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={descripcion}
            onChangeText={setDescripcion}
          />
        </View>

        {/* Vibes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vibe del panorama (Máx 3)</Text>
          <View style={styles.vibesContainer}>
            {VIBES_DISPONIBLES.map(v => (
              <TouchableOpacity 
                key={v} 
                style={[styles.vibeChip, vibes.includes(v) && styles.vibeChipActive]}
                onPress={() => toggleVibe(v)}
              >
                <Text style={[styles.vibeChipText, vibes.includes(v) && styles.vibeChipTextActive]}>
                  {vibes.includes(v) ? '✓ ' : ''}{v}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.vibeChipAdd}>
              <Text style={styles.vibeChipAddText}>+ Agregar vibe</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ajustes finales */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cupos</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowCuposModal(true)}>
              <Text style={styles.selectText}>{cupos}</Text>
              <Text style={styles.selectLabel}>personas</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, { flex: 1.5 }]}>
            <Text style={styles.label}>Privacidad</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowPrivacidadModal(true)}>
              <Ionicons name={privacidad === 'Público' ? "globe-outline" : "lock-closed-outline"} size={16} color={COLORS.textMuted} />
              <Text style={[styles.selectText, { flex: 1, marginLeft: 8 }]}>{privacidad}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <GradientButton style={styles.btnSubmit} onPress={handleCrear} disabled={guardando}>
          {guardando ? "Creando..." : "Publicar panorama"}
        </GradientButton>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals para Selección */}
      {showCuposModal && (
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>¿Cuántos cupos?</Text>
            {['2', '4', '6', '10', 'Sin límite'].map(opt => (
              <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => { setCupos(opt); setShowCuposModal(false); }}>
                <Text style={styles.sheetOptionText}>{opt} {opt !== 'Sin límite' ? 'personas' : ''}</Text>
                {cupos === opt && <Ionicons name="checkmark-circle" size={20} color={COLORS.primario} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowCuposModal(false)}>
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showPrivacidadModal && (
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>Privacidad del Panorama</Text>
            {['Público', 'Amigos', 'Solo invitación'].map(opt => (
              <TouchableOpacity key={opt} style={styles.sheetOption} onPress={() => { setPrivacidad(opt); setShowPrivacidadModal(false); }}>
                <Text style={styles.sheetOptionText}>{opt}</Text>
                {privacidad === opt && <Ionicons name="checkmark-circle" size={20} color={COLORS.primario} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPrivacidadModal(false)}>
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING[4], paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.tarjeta
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  scroll: { padding: SPACING[4] },
  inputGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  charCount: { fontSize: 12, color: COLORS.textMuted },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, height: 50
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15, height: '100%' },
  mapContainer: {
    height: 120, borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 10,
    borderWidth: 1, borderColor: COLORS.border, position: 'relative'
  },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  mapPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#34A853', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md, borderWidth: 2, borderColor: '#FFF' },
  useLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  useLocationText: { color: COLORS.primario, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15 },
  dateBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 10,
  },
  dateIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,107,69,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  dateText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  textArea: {
    backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 15, paddingTop: 15, minHeight: 100,
    color: COLORS.textPrimary, fontSize: 15, textAlignVertical: 'top'
  },
  vibesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: COLORS.fondo,
    borderWidth: 1, borderColor: COLORS.border
  },
  vibeChipActive: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  vibeChipText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  vibeChipTextActive: { color: '#FFF' },
  vibeChipAdd: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed'
  },
  vibeChipAddText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  selectBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, height: 50
  },
  selectText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', padding: 0 },
  selectLabel: { color: COLORS.textMuted, fontSize: 14, marginLeft: 4 },
  btnSubmit: { marginTop: 10 },
  bottomSheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 999 },
  bottomSheet: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[4], paddingBottom: SPACING[6] },
  bottomSheetTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetOptionText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  sheetCancel: { marginTop: 20, paddingVertical: 15, backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg, alignItems: 'center' },
  sheetCancelText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '700' }
});
