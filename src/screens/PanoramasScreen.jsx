import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS } from '../utils/theme';
import { panoramaService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Datos de prueba con REGIONES asignadas
const EVENTOS_OFICIALES = [
  {
    _id: 'oficial_1',
    titulo: 'Concierto Rock Chileno',
    descripcion: 'Tremenda tocata con bandas locales y tributos. No te quedes fuera.',
    lugar: 'Estadio Germán Becker',
    region: 'La Araucanía', // 👈 Etiqueta regional
    fecha: new Date(Date.now() + 86400000 * 2).toISOString(),
    hora: '21:00',
    categoria: 'Música',
    emoji: '🎸',
    esOficial: true
  },
  {
    _id: 'oficial_2',
    titulo: 'Carnaval Andino Con la Fuerza del Sol',
    descripcion: 'Uno de los carnavales más grandes de Sudamérica, lleno de colores y bailes.',
    lugar: 'Circuito Histórico',
    region: 'Arica y Parinacota', // 👈 Evento solo para el norte
    fecha: new Date(Date.now() + 86400000 * 5).toISOString(),
    hora: '12:00',
    categoria: 'Cultura',
    emoji: '🎭',
    esOficial: true
  }
];

export default function PanoramasScreen() {
  const { usuario } = useAuth();
  const [panoramas, setPanoramas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [tabActivo, setTabActivo] = useState('comunidad'); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');
  const [fechaInput, setFechaInput] = useState(''); 
  const [horaInput, setHoraInput] = useState('');   
  const [creando, setCreando] = useState(false);

  // Definimos la región del usuario (si no tiene, por defecto asume La Araucanía para no mostrar pantalla vacía en pruebas)
  const miRegion = usuario?.region || 'La Araucanía';

  useEffect(() => {
    cargarPanoramas();
  }, [tabActivo]);

  const cargarPanoramas = async () => {
    try {
      if (tabActivo === 'oficiales') {
        // 🌟 FILTRO REGIONAL Y DE FECHA: Solo eventos que no hayan pasado y que sean de MI REGIÓN
        const eventosVigentes = EVENTOS_OFICIALES.filter(
          evt => new Date(evt.fecha) >= new Date() && evt.region === miRegion
        );
        setPanoramas(eventosVigentes);
      } else {
        // 🌟 PANORAMAS DE LA COMUNIDAD: El backend ahora debe buscar por 'region' y no por 'ciudad'
        const data = await panoramaService.listar({ region: miRegion });
        const eventosVigentes = (data.panoramas || []).filter(evt => new Date(evt.fecha) >= new Date());
        setPanoramas(eventosVigentes);
      }
    } catch (error) {
      console.log("Error cargando panoramas:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const handleRefresh = () => {
    setRefrescando(true);
    cargarPanoramas();
  };

  const abrirGoogleMaps = (destino) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`;
    Linking.openURL(url).catch(err => Alert.alert("Error", "No se pudo abrir el mapa."));
  };

  const handleCrearPanorama = async () => {
    if (!titulo || !descripcion || !lugar || !fechaInput || !horaInput) {
      Alert.alert("Oye ✋", "Faltan datos po'. Llena la fecha y la hora para que la gente sepa cuándo llegar.");
      return;
    }

    setCreando(true);
    try {
      const [dia, mes, anio] = fechaInput.split('/');
      const [hora, min] = horaInput.split(':');
      const fechaArmada = new Date(`${anio}-${mes}-${dia}T${hora}:${min}:00`);

      await panoramaService.crear({
        titulo,
        descripcion,
        lugar,
        region: miRegion, // 👈 Se guarda asociado a la región entera
        fecha: fechaArmada.toISOString(),
        categoria: 'Comunidad',
        emoji: '🙌',
        maxPersonas: 15
      });

      Alert.alert("¡Espectacular! 🌶️", "Tu panorama ya está publicado para toda tu región.");
      setModalVisible(false);
      setTitulo(''); setDescripcion(''); setLugar(''); setFechaInput(''); setHoraInput('');
      cargarPanoramas(); 
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo armar el cahuín.");
    } finally {
      setCreando(false);
    }
  };

  const renderPanorama = ({ item }) => {
    const fechaFormateada = new Date(item.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
    const horaVisual = item.hora || new Date(item.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.card, item.esOficial ? styles.cardOficial : SHADOWS.medium]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <View style={styles.categoriaBadge}>
            <Text style={styles.categoriaText}>{item.emoji} {item.categoria}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>{item.descripcion}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={COLORS.primario} />
            <Text style={styles.infoText}>{fechaFormateada}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={COLORS.primario} />
            <Text style={styles.infoText}>{horaVisual} hrs</Text>
          </View>
        </View>

        <View style={styles.ubicacionRow}>
          <View style={styles.infoRowLocal}>
            <Ionicons name="location" size={18} color={COLORS.acento} />
            <Text style={styles.infoTextLocal} numberOfLines={1}>{item.lugar}</Text>
          </View>
          <TouchableOpacity style={styles.btnMapa} onPress={() => abrirGoogleMaps(item.lugar)}>
            <Ionicons name="map" size={16} color="white" />
            <Text style={styles.btnMapaTexto}>Ver Mapa</Text>
          </TouchableOpacity>
        </View>

        {!item.esOficial && (
          <TouchableOpacity style={styles.btnUnirse} onPress={() => Alert.alert("¡Anotado!", "Le avisaremos al organizador.")}>
            <Text style={styles.btnUnirseText}>¡Me anoto! ☝️</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cartelera 🗺️</Text>
        <Text style={styles.headerSubtitle}>Mostrando eventos en {miRegion}</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBoton, tabActivo === 'comunidad' && styles.tabBotonActivo]}
            onPress={() => setTabActivo('comunidad')}
          >
            <Text style={[styles.tabTexto, tabActivo === 'comunidad' && styles.tabTextoActivo]}>Comunidad</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBoton, tabActivo === 'oficiales' && styles.tabBotonActivo]}
            onPress={() => setTabActivo('oficiales')}
          >
            <Text style={[styles.tabTexto, tabActivo === 'oficiales' && styles.tabTextoActivo]}>Oficiales 🎟️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {cargando ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primario} /></View>
      ) : panoramas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🏜️</Text>
          <Text style={styles.emptyTitle}>Nada por aquí</Text>
          <Text style={styles.emptyText}>No hay eventos próximos en tu región.</Text>
        </View>
      ) : (
        <FlatList
          data={panoramas}
          keyExtractor={(item) => item._id}
          renderItem={renderPanorama}
          contentContainerStyle={styles.lista}
          refreshing={refrescando}
          onRefresh={handleRefresh}
        />
      )}

      {tabActivo === 'comunidad' && (
        <TouchableOpacity style={[styles.fab, SHADOWS.dark]} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, SHADOWS['2xl']]}>
            <Text style={styles.modalTitle}>Armar un Panorama 🍻</Text>
            
            <TextInput style={styles.input} placeholder="¿Qué haremos? (Ej: Asado)" value={titulo} onChangeText={setTitulo} />
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Detalles (qué llevar...)" value={descripcion} onChangeText={setDescripcion} multiline />
            <TextInput style={styles.input} placeholder="Lugar (Ej: Parque Isla Cautín)" value={lugar} onChangeText={setLugar} />
            
            <View style={styles.fechasRow}>
              <TextInput style={[styles.input, styles.inputMitad]} placeholder="Día (DD/MM/AAAA)" value={fechaInput} onChangeText={setFechaInput} keyboardType="numeric" />
              <TextInput style={[styles.input, styles.inputMitad]} placeholder="Hora (Ej: 20:30)" value={horaInput} onChangeText={setHoraInput} />
            </View>

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)} disabled={creando}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={handleCrearPanorama} disabled={creando}>
                {creando ? <ActivityIndicator color="white" /> : <Text style={styles.btnGuardarText}>Publicar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING[5], backgroundColor: COLORS.tarjeta, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 26, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING[3], marginTop: 2 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg, padding: 4 },
  tabBoton: { flex: 1, paddingVertical: SPACING[2], alignItems: 'center', borderRadius: RADIUS.md },
  tabBotonActivo: { backgroundColor: COLORS.tarjeta, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  tabTexto: { fontSize: 15, fontWeight: 'bold', color: COLORS.gris },
  tabTextoActivo: { color: COLORS.primario },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[6] },
  lista: { padding: SPACING[4], paddingBottom: 100 },
  
  card: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: SPACING[5], marginBottom: SPACING[4] },
  cardOficial: { backgroundColor: '#FFFDF0', borderRadius: RADIUS.xl, padding: SPACING[5], marginBottom: SPACING[4], borderWidth: 1, borderColor: '#FFE082' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING[2] },
  cardTitle: { fontSize: 20, fontFamily: FONTS.display, color: COLORS.textPrimary, flex: 1, fontWeight: 'bold' },
  categoriaBadge: { backgroundColor: '#E0F7FA', paddingHorizontal: SPACING[2], paddingVertical: SPACING[1], borderRadius: RADIUS.md, marginLeft: SPACING[2] },
  categoriaText: { fontSize: 12, color: COLORS.acento, fontWeight: 'bold' },
  cardDesc: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING[4], lineHeight: 22 },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[3], backgroundColor: COLORS.fondo, padding: SPACING[3], borderRadius: RADIUS.md },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 14, color: COLORS.textPrimary, marginLeft: SPACING[2], fontWeight: 'bold' },
  
  ubicacionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING[2] },
  infoRowLocal: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  infoTextLocal: { fontSize: 14, color: COLORS.textMuted, marginLeft: SPACING[2] },
  btnMapa: { backgroundColor: '#4285F4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[3], paddingVertical: SPACING[2], borderRadius: RADIUS.lg },
  btnMapaTexto: { color: 'white', fontWeight: 'bold', fontSize: 13, marginLeft: 5 },

  btnUnirse: { backgroundColor: COLORS.like, paddingVertical: SPACING[3], borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING[4] },
  btnUnirseText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  emptyEmoji: { fontSize: 60, marginBottom: SPACING[2] },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[2] },
  emptyText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center' },

  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: COLORS.primario, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING[4] },
  modalCard: { backgroundColor: COLORS.tarjeta, width: '100%', borderRadius: RADIUS.xl, padding: SPACING[5] },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[5] },
  input: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#ddd', borderRadius: RADIUS.md, padding: SPACING[3], fontSize: 15, marginBottom: SPACING[3] },
  fechasRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputMitad: { width: '48%' },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: SPACING[2] },
  btnCancelar: { paddingVertical: SPACING[3], paddingHorizontal: SPACING[4] },
  btnCancelarText: { color: COLORS.gris, fontSize: 16, fontWeight: 'bold' },
  btnGuardar: { backgroundColor: COLORS.primario, paddingVertical: SPACING[3], paddingHorizontal: SPACING[5], borderRadius: RADIUS.lg, marginLeft: SPACING[2] },
  btnGuardarText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});