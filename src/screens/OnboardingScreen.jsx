import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

// La misma base de datos de Chile para que no haya errores ortográficos
const CHILE_DATA = {
  "Arica y Parinacota": ["Arica", "Putre", "Camarones"],
  "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte"],
  "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "San Pedro de Atacama"],
  "Atacama": ["Copiapó", "Vallenar", "Caldera", "Chañaral"],
  "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Vicuña"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "San Antonio", "Los Andes"],
  "Metropolitana": ["Santiago", "Puente Alto", "Maipú", "Providencia", "Las Condes", "San Bernardo"],
  "O'Higgins": ["Rancagua", "Machalí", "San Fernando", "Pichilemu"],
  "Maule": ["Talca", "Curicó", "Linares", "Constitución"],
  "Ñuble": ["Chillán", "San Carlos", "Bulnes"],
  "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Lota"],
  "La Araucanía": ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol", "Victoria"],
  "Los Ríos": ["Valdivia", "La Unión", "Panguipulli"],
  "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Puerto Varas"],
  "Aysén": ["Coyhaique", "Puerto Aysén", "Chile Chico"],
  "Magallanes": ["Punta Arenas", "Puerto Natales", "Porvenir"]
};

export default function OnboardingScreen() {
  const { usuario, actualizarUsuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  
  // Estados para lo que falta del perfil
  const [region, setRegion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [genero, setGenero] = useState('');
  const [preferencia, setPreferencia] = useState('');

  const [modalRegion, setModalRegion] = useState(false);
  const [modalCiudad, setModalCiudad] = useState(false);

  const handleCompletarPerfil = async () => {
    if (!ciudad || !region || !genero || !preferencia) {
      Alert.alert('Faltan datos 👀', 'Para mostrarte los mejores cahuines, necesitamos saber todo esto.');
      return;
    }

    setCargando(true);
    try {
      // Guardamos la información en la base de datos
      const res = await userService.actualizar({ region, ciudad, genero, preferencia });
      
      // 🌟 MAGIA: Al actualizar el contexto global, la app detectará que 
      // ya no dice "Por definir" y te teletransportará a la pantalla principal automáticamente.
      if (actualizarUsuario) actualizarUsuario(res.usuario);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la información');
      setCargando(false);
    }
  };

  const seleccionarRegion = (seleccion) => {
    setRegion(seleccion);
    setCiudad(''); 
    setModalRegion(false);
  };

  const BotonSeleccion = ({ label, activo, onPress }) => (
    <TouchableOpacity style={[styles.btnSeleccion, activo && styles.btnSeleccionActivo]} onPress={onPress}>
      <Text style={[styles.txtSeleccion, activo && styles.txtSeleccionActivo]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        
        <View style={styles.header}>
          <Image source={{ uri: usuario?.foto || 'https://via.placeholder.com/100' }} style={styles.fotoPerfil} />
          <Text style={styles.title}>¡Hola {usuario?.nombre?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Como entraste con Google, nos faltan un par de datitos para armar tu perfil.</Text>
        </View>

        <View style={[styles.form, SHADOWS.medium]}>
          <Text style={styles.label}>¿De dónde eres?</Text>
          
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setModalRegion(true)}>
            <Text style={region ? styles.selectorTextoActivo : styles.selectorTextoInactivo}>{region || "Elige tu Región"}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gris} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.selectorBtn} onPress={() => region ? setModalCiudad(true) : Alert.alert("¡Epa!", "Elige la región primero.")}>
            <Text style={ciudad ? styles.selectorTextoActivo : styles.selectorTextoInactivo}>{ciudad || "Elige tu Ciudad"}</Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.gris} />
          </TouchableOpacity>

          <Text style={styles.label}>Yo soy:</Text>
          <View style={styles.filaBotones}>
            <BotonSeleccion label="Hombre" activo={genero === 'Hombre'} onPress={() => setGenero('Hombre')} />
            <BotonSeleccion label="Mujer" activo={genero === 'Mujer'} onPress={() => setGenero('Mujer')} />
            <BotonSeleccion label="Otro" activo={genero === 'Otro'} onPress={() => setGenero('Otro')} />
          </View>

          <Text style={styles.label}>Y busco conocer:</Text>
          <View style={styles.filaBotones}>
            <BotonSeleccion label="Hombres" activo={preferencia === 'Hombres'} onPress={() => setPreferencia('Hombres')} />
            <BotonSeleccion label="Mujeres" activo={preferencia === 'Mujeres'} onPress={() => setPreferencia('Mujeres')} />
            <BotonSeleccion label="Todos" activo={preferencia === 'Todos'} onPress={() => setPreferencia('Todos')} />
          </View>

          <TouchableOpacity style={styles.btnGuardar} onPress={handleCompletarPerfil} disabled={cargando}>
            {cargando ? <ActivityIndicator color="white" /> : <Text style={styles.btnGuardarTexto}>Listo, ¡A cahuinear! 🌶️</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* --- MODAL DE REGIONES --- */}
      <Modal visible={modalRegion} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elige tu Región</Text>
            <FlatList data={Object.keys(CHILE_DATA)} keyExtractor={(item) => item} renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOpcion} onPress={() => seleccionarRegion(item)}>
                  <Text style={styles.modalOpcionTexto}>{item}</Text>
                </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.modalBtnCerrar} onPress={() => setModalRegion(false)}><Text style={styles.modalBtnCerrarTexto}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MODAL DE CIUDADES --- */}
      <Modal visible={modalCiudad} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elige tu Ciudad</Text>
            <FlatList data={region ? CHILE_DATA[region] : []} keyExtractor={(item) => item} renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalOpcion} onPress={() => { setCiudad(item); setModalCiudad(false); }}>
                  <Text style={styles.modalOpcionTexto}>{item}</Text>
                </TouchableOpacity>
            )} />
            <TouchableOpacity style={styles.modalBtnCerrar} onPress={() => setModalCiudad(false)}><Text style={styles.modalBtnCerrarTexto}>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: SPACING[5], justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING[6] },
  fotoPerfil: { width: 80, height: 80, borderRadius: 40, marginBottom: SPACING[3], borderWidth: 2, borderColor: COLORS.primario },
  title: { fontSize: 26, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold' },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginTop: SPACING[2], textAlign: 'center', lineHeight: 22 },
  
  form: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl },
  label: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: SPACING[3], marginBottom: SPACING[2] },
  
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, padding: SPACING[3], marginBottom: SPACING[3] },
  selectorTextoInactivo: { fontSize: 16, color: COLORS.gris },
  selectorTextoActivo: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },

  filaBotones: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[4] },
  btnSeleccion: { flex: 1, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#ddd', paddingVertical: SPACING[3], marginHorizontal: 2, borderRadius: RADIUS.md, alignItems: 'center' },
  btnSeleccionActivo: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  txtSeleccion: { color: COLORS.gris, fontWeight: 'bold', fontSize: 14 },
  txtSeleccionActivo: { color: 'white' },

  btnGuardar: { backgroundColor: COLORS.primario, paddingVertical: SPACING[4], borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING[4] },
  btnGuardarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[5], maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[4], textAlign: 'center' },
  modalOpcion: { paddingVertical: SPACING[4], borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalOpcionTexto: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center' },
  modalBtnCerrar: { marginTop: SPACING[5], paddingVertical: SPACING[3], backgroundColor: '#f0f0f0', borderRadius: RADIUS.lg, alignItems: 'center' },
  modalBtnCerrarTexto: { color: COLORS.gris, fontSize: 16, fontWeight: 'bold' }
});