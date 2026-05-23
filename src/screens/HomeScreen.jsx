import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { userService, matchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const [perfiles, setPerfiles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [perfilActual, setPerfilActual] = useState(0);

  // 🌟 ESTADOS PARA LOS FILTROS
  const [modalFiltros, setModalFiltros] = useState(false);
  const [minEdad, setMinEdad] = useState('18');
  const [maxEdad, setMaxEdad] = useState('50');
  const [maxDistancia, setMaxDistancia] = useState('50'); // En kilómetros

  useEffect(() => {
    iniciarRadarGPS();
  }, []);

  const iniciarRadarGPS = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let ubicacion = await Location.getCurrentPositionAsync({});
        await userService.actualizar({ latitud: ubicacion.coords.latitude, longitud: ubicacion.coords.longitude });
      }
      cargarPerfilesConFiltros();
    } catch (error) {
      cargarPerfilesConFiltros();
    }
  };

  const aplicarFiltros = () => {
    setModalFiltros(false);
    setCargando(true);
    setPerfilActual(0);
    cargarPerfilesConFiltros();
  };

  const cargarPerfilesConFiltros = async () => {
    try {
      // ⚠️ PON TU IP REAL AQUÍ
      const response = await fetch(`http://192.168.1.XX:5000/api/users/descubrir?minEdad=${minEdad}&maxEdad=${maxEdad}&maxDistancia=${maxDistancia}`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      const data = await response.json();
      setPerfiles(data.perfiles || []);
    } catch (error) {
      console.log("Error cargando perfiles filtrados:", error);
    } finally {
      setCargando(false);
    }
  };

  const procesarInteraccion = async (tipo) => {
    if (perfilActual >= perfiles.length) return;
    const perfilVisto = perfiles[perfilActual];
    setPerfilActual(prev => prev + 1);

    try {
      if (tipo === 'like') {
        const data = await matchService.darLike(perfilVisto._id);
        if (data.hayMatch) Alert.alert("¡HAY CAHUÍN! 🔥", `A ${perfilVisto.nombre} también le gustas.`);
      } else {
        await matchService.darDislike(perfilVisto._id);
      }
    } catch (error) { console.log(`Error al dar ${tipo}:`, error); }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={{ marginTop: 10, color: COLORS.gris }}>Configurando el radar...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubrir 🌶️</Text>
        <TouchableOpacity onPress={() => setModalFiltros(true)} style={styles.btnFiltro}>
          <Ionicons name="options" size={28} color={COLORS.primario} />
        </TouchableOpacity>
      </View>

      {perfilActual >= perfiles.length ? (
        <View style={styles.centro}>
          <Text style={styles.emojiVacio}>🏜️</Text>
          <Text style={styles.textoVacio}>No hay nadie con esos filtros</Text>
          <TouchableOpacity style={styles.btnRecargar} onPress={() => { setModalFiltros(true); }}>
            <Text style={styles.btnRecargarTexto}>Cambiar Filtros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.cardContainer}>
            <View style={[styles.card, SHADOWS['2xl']]}>
              <Image source={{ uri: perfiles[perfilActual].foto || 'https://via.placeholder.com/400' }} style={styles.fotoPerfil} />
              
              <View style={styles.infoContainer}>
                <View style={styles.nombreFila}>
                  <Text style={styles.nombre}>{perfiles[perfilActual].nombre}, {perfiles[perfilActual].edad} años</Text>
                </View>

                <View style={styles.gpsFila}>
                  <Ionicons name="location" size={18} color="white" />
                  <Text style={styles.distanciaTexto}>
                    {perfiles[perfilActual].distanciaKm !== null && perfiles[perfilActual].distanciaKm !== undefined 
                      ? `A ${perfiles[perfilActual].distanciaKm} km de ti` 
                      : `${perfiles[perfilActual].ciudad}, ${perfiles[perfilActual].region}`}
                  </Text>
                </View>

                {perfiles[perfilActual].descripcion ? (
                  <Text style={styles.descripcion} numberOfLines={2}>{perfiles[perfilActual].descripcion}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.botonesContenedor}>
            <TouchableOpacity style={[styles.botonAccion, styles.botonDislike, SHADOWS.medium]} onPress={() => procesarInteraccion('dislike')}>
              <Ionicons name="close" size={38} color="#FF4B4B" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.botonAccion, styles.botonLike, SHADOWS.medium]} onPress={() => procesarInteraccion('like')}>
              <Ionicons name="heart" size={34} color="#4CD964" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 🌟 MODAL DE FILTROS AVANZADOS */}
      <Modal visible={modalFiltros} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filtros del Radar 📡</Text>
            
            <View style={styles.filtroFila}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Edad Mínima</Text>
                <TextInput style={styles.input} value={minEdad} onChangeText={setMinEdad} keyboardType="numeric" maxLength={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Edad Máxima</Text>
                <TextInput style={styles.input} value={maxEdad} onChangeText={setMaxEdad} keyboardType="numeric" maxLength={2} />
              </View>
            </View>

            <Text style={styles.label}>Distancia Máxima (Kilómetros)</Text>
            <TextInput style={styles.input} value={maxDistancia} onChangeText={setMaxDistancia} keyboardType="numeric" maxLength={4} />

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalFiltros(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardarModal} onPress={aplicarFiltros}>
                <Text style={styles.btnGuardarTexto}>Aplicar Filtros</Text>
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
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING[5], paddingBottom: 0 },
  headerTitle: { fontSize: 28, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  btnFiltro: { padding: 5, backgroundColor: '#FFE4E1', borderRadius: 20 },
  
  cardContainer: { flex: 1, padding: SPACING[4], justifyContent: 'center' },
  card: { flex: 1, backgroundColor: 'white', borderRadius: RADIUS['2xl'], overflow: 'hidden', position: 'relative' },
  fotoPerfil: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  infoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING[5], paddingTop: 60, backgroundColor: 'rgba(0,0,0,0.5)' },
  nombreFila: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] },
  nombre: { fontSize: 32, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  
  gpsFila: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] },
  distanciaTexto: { fontSize: 16, color: 'white', marginLeft: 5, fontWeight: '600' },
  descripcion: { fontSize: 14, color: '#f0f0f0', lineHeight: 20 },

  botonesContenedor: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, paddingBottom: SPACING[6] },
  botonAccion: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  botonDislike: { borderWidth: 2, borderColor: '#FF4B4B' },
  botonLike: { borderWidth: 2, borderColor: '#4CD964' },
  
  emojiVacio: { fontSize: 60, marginBottom: SPACING[3] },
  textoVacio: { fontSize: 18, color: COLORS.gris, marginBottom: SPACING[5], fontWeight: 'bold' },
  btnRecargar: { backgroundColor: COLORS.primario, paddingVertical: SPACING[3], paddingHorizontal: SPACING[6], borderRadius: RADIUS.lg },
  btnRecargarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Estilos del Modal
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING[5] },
  modalCard: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: SPACING[6], ...SHADOWS['2xl'] },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[5], textAlign: 'center', fontFamily: FONTS.display },
  filtroFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[3] },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[2] },
  input: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, padding: SPACING[3], fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  modalBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING[6] },
  btnCancelar: { flex: 1, paddingVertical: SPACING[4], alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: RADIUS.lg, marginRight: 10 },
  btnCancelarTexto: { color: COLORS.gris, fontWeight: 'bold', fontSize: 16 },
  btnGuardarModal: { flex: 1, paddingVertical: SPACING[4], alignItems: 'center', backgroundColor: COLORS.primario, borderRadius: RADIUS.lg },
  btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});