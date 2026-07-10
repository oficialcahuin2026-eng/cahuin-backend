import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SHADOWS, SPACING, RADIUS } from '../utils/theme';
import { GradientButton } from '../components/CahuinUI';
import DateTimePicker from '@react-native-community/datetimepicker';
import { panoramaService } from '../services/api';

const VIBES_DISPONIBLES = [
  'Tragos', 'Música', 'Buena onda', 'Bailoteo', 'Carrete', 'Relax', 'Aire libre', 'Comida'
];

export default function CrearPanoramaScreen({ navigation }) {
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);
  
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
  


  const obtenerUbicacionActual = async () => {
    setCargandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});


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
    if (!titulo.trim() || !lugar.trim() || !descripcion.trim()) return;
    setGuardando(true);
    try {
      await panoramaService.crear({
        titulo, 
        lugar, 
        fecha, 
        descripcion, 
        categoria: vibes.length > 0 ? vibes[0] : 'Carrete', 
        maxPersonas: parseInt(cupos) || 4, 
        privacidad
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <LinearGradient colors={isDarkMode ? ['#0A0F1A', '#0D0814'] : [COLORS.fondo, COLORS.bg]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Armar un Panorama</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Título */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>¿Qué van a hacer?</Text>
              <Text style={styles.charCount}>{titulo.length}/80</Text>
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="sparkles-outline" size={22} color={COLORS.primario} style={styles.inputIcon} />
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
              <Ionicons name="location-outline" size={22} color="#34A853" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ej: Bar X, Centro"
                placeholderTextColor={COLORS.textMuted}
                value={lugar}
                onChangeText={setLugar}
              />
            </View>

            <TouchableOpacity style={styles.useLocationBtn} onPress={obtenerUbicacionActual} disabled={cargandoUbicacion}>
              <Ionicons name="navigate" size={18} color={COLORS.primario} />
              <Text style={styles.useLocationText}>{cargandoUbicacion ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}</Text>
            </TouchableOpacity>
          </View>

          {/* Fecha y Hora */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
                <View style={styles.dateIconWrap}>
                  <Ionicons name="calendar" size={18} color="#FF6B45" />
                </View>
                <Text style={styles.dateText}>{fecha.toLocaleDateString()}</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Hora</Text>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowTimePicker(true)}>
                <View style={[styles.dateIconWrap, { backgroundColor: 'rgba(79,111,234,0.15)' }]}>
                  <Ionicons name="time" size={18} color="#4F6FEA" />
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Vibe del panorama (Máx 3)</Text>
              <Text style={styles.charCount}>{vibes.length}/3</Text>
            </View>
            <View style={styles.vibesContainer}>
              {VIBES_DISPONIBLES.map(v => {
                const isActive = vibes.includes(v);
                return (
                  <TouchableOpacity 
                    key={v} 
                    style={[styles.vibeChip, isActive && styles.vibeChipActive]}
                    onPress={() => toggleVibe(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.vibeChipText, isActive && styles.vibeChipTextActive]}>
                      {isActive ? '✓ ' : ''}{v}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.vibeChipAdd}>
                <Ionicons name="add" size={14} color={COLORS.textMuted} />
                <Text style={styles.vibeChipAddText}>Agregar vibe</Text>
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
                <Ionicons name={privacidad === 'Público' ? "globe-outline" : "lock-closed-outline"} size={18} color={COLORS.textMuted} />
                <Text style={[styles.selectText, { flex: 1, marginLeft: 8 }]}>{privacidad}</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <GradientButton 
            style={styles.btnSubmit} 
            onPress={handleCrear} 
            disabled={guardando || !titulo.trim() || !lugar.trim() || !descripcion.trim()}
          >
            {guardando ? "Publicando..." : "Publicar panorama"}
          </GradientButton>

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* Modals para Selección */}
        {showCuposModal && (
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.bottomSheetTitle}>¿Cuántos cupos?</Text>
              {['2', '4', '6', '10', 'Sin límite'].map((opt, i) => (
                <TouchableOpacity key={opt} style={[styles.sheetOption, i === 0 && { borderTopWidth: 0 }]} onPress={() => { setCupos(opt); setShowCuposModal(false); }}>
                  <Text style={[styles.sheetOptionText, cupos === opt && { color: COLORS.primario }]}>{opt} {opt !== 'Sin límite' ? 'personas' : ''}</Text>
                  {cupos === opt && <Ionicons name="checkmark-circle" size={24} color={COLORS.primario} />}
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
              <View style={styles.sheetHandle} />
              <Text style={styles.bottomSheetTitle}>Privacidad del Panorama</Text>
              {['Público', 'Amigos', 'Solo invitación'].map((opt, i) => (
                <TouchableOpacity key={opt} style={[styles.sheetOption, i === 0 && { borderTopWidth: 0 }]} onPress={() => { setPrivacidad(opt); setShowPrivacidadModal(false); }}>
                  <Text style={[styles.sheetOptionText, privacidad === opt && { color: COLORS.primario }]}>{opt}</Text>
                  {privacidad === opt && <Ionicons name="checkmark-circle" size={24} color={COLORS.primario} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPrivacidadModal(false)}>
                <Text style={styles.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: 0.5 },
  scroll: { padding: SPACING[5] },
  inputGroup: { marginBottom: 26 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10, letterSpacing: 0.3 },
  charCount: { fontSize: 13, color: COLORS.textMuted, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg, borderRadius: 18,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    paddingHorizontal: 16, height: 60
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 16, height: '100%', fontWeight: '600' },
  mapContainer: {
    height: 140, borderRadius: 20, overflow: 'hidden', marginTop: 12,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border, position: 'relative'
  },
  mapImage: { width: '100%', height: '100%' },
  mapPinWrap: { alignItems: 'center', justifyContent: 'center' },
  mapPin: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#34A853', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md, borderWidth: 3, borderColor: '#FFF', zIndex: 2 },
  mapPinPulse: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(52,168,83,0.3)', zIndex: 1 },
  useLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(240,68,79,0.15)', borderRadius: 12, alignSelf: 'flex-start' },
  useLocationText: { color: COLORS.primario, fontSize: 14, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 16 },
  dateBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg, borderRadius: 18,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    padding: 12, height: 64
  },
  dateIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,107,69,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dateText: { flex: 1, color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  textArea: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg, borderRadius: 20,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    padding: 18, paddingTop: 18, minHeight: 120,
    color: COLORS.textPrimary, fontSize: 16, textAlignVertical: 'top', fontWeight: '600'
  },
  vibesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibeChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.tarjeta,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : COLORS.border,
    ...(isDarkMode ? {} : SHADOWS.light)
  },
  vibeChipActive: { backgroundColor: 'rgba(240,68,79,0.15)', borderColor: COLORS.primario, ...(isDarkMode ? {} : SHADOWS.light) },
  vibeChipText: { color: isDarkMode ? 'rgba(255,255,255,0.8)' : COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  vibeChipTextActive: { color: COLORS.primario, fontWeight: '900' },
  vibeChipAdd: {
    paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, backgroundColor: 'transparent',
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : COLORS.border, borderStyle: 'dashed'
  },
  vibeChipAddText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  selectBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : COLORS.inputBg, borderRadius: 18,
    borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : COLORS.border,
    paddingHorizontal: 16, height: 60
  },
  selectText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', padding: 0 },
  selectLabel: { color: COLORS.textMuted, fontSize: 14, marginLeft: 6, fontWeight: '600' },
  btnSubmit: { marginTop: 10, height: 60, borderRadius: 20 },
  
  // Modals
  bottomSheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 999 },
  bottomSheet: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : COLORS.border, alignSelf: 'center', marginBottom: 20 },
  bottomSheetTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '900', marginBottom: 24, textAlign: 'center', fontFamily: FONTS.display },
  sheetOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.border },
  sheetOptionText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700' },
  sheetCancel: { marginTop: 24, height: 56, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : COLORS.inputBg, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheetCancelText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' }
});
