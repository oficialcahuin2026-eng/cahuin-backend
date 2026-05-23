import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const CHILE_DATA = {
  "Arica y Parinacota": ["Arica", "Putre", "Camarones"], "Tarapacá": ["Iquique", "Alto Hospicio", "Pozo Almonte"], "Antofagasta": ["Antofagasta", "Calama", "Tocopilla", "San Pedro de Atacama"], "Atacama": ["Copiapó", "Vallenar", "Caldera", "Chañaral"], "Coquimbo": ["La Serena", "Coquimbo", "Ovalle", "Vicuña"], "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "San Antonio", "Los Andes"], "Metropolitana": ["Santiago", "Puente Alto", "Maipú", "Providencia", "Las Condes", "San Bernardo"], "O'Higgins": ["Rancagua", "Machalí", "San Fernando", "Pichilemu"], "Maule": ["Talca", "Curicó", "Linares", "Constitución"], "Ñuble": ["Chillán", "San Carlos", "Bulnes"], "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Lota"], "La Araucanía": ["Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol", "Victoria"], "Los Ríos": ["Valdivia", "La Unión", "Panguipulli"], "Los Lagos": ["Puerto Montt", "Osorno", "Castro", "Puerto Varas"], "Aysén": ["Coyhaique", "Puerto Aysén", "Chile Chico"], "Magallanes": ["Punta Arenas", "Puerto Natales", "Porvenir"]
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [cargando, setCargando] = useState(false);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [edad, setEdad] = useState('');
  const [region, setRegion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [genero, setGenero] = useState('');
  const [preferencia, setPreferencia] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [modalRegion, setModalRegion] = useState(false);
  const [modalCiudad, setModalCiudad] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password || !ciudad || !region || !genero || !preferencia || !edad) {
      Alert.alert('Oye ✋', 'Llena todos los datos para armar bien tu perfil.'); return;
    }
    if (parseInt(edad) < 18) {
      Alert.alert('Epa 🛑', 'Debes ser mayor de 18 años para usar esta aplicación.'); return;
    }
    if (!aceptaTerminos) {
      Alert.alert('Aviso Legal ⚖️', 'Debes aceptar los Términos y Condiciones para registrarte.'); return;
    }

    setCargando(true);
    try {
      await register({ nombre, email, password, ciudad, region, genero, preferencia, edad: parseInt(edad), aceptaTerminos });
    } catch (error) { Alert.alert('Error', error.message || 'No se pudo crear la cuenta'); } finally { setCargando(false); }
  };

  const seleccionarRegion = (seleccion) => { setRegion(seleccion); setCiudad(''); setModalRegion(false); };
  const BotonSeleccion = ({ label, activo, onPress }) => (
    <TouchableOpacity style={[styles.btnSeleccion, activo && styles.btnSeleccionActivo]} onPress={onPress}>
      <Text style={[styles.txtSeleccion, activo && styles.txtSeleccionActivo]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta 🌶️</Text>
            <Text style={styles.subtitle}>Encuentra tu media naranja por todo Chile.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Tus Datos Básicos</Text>
            <TextInput style={styles.input} placeholder="Tu Nombre o Apodo" value={nombre} onChangeText={setNombre} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput style={[styles.input, { flex: 2 }]} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Edad" value={edad} onChangeText={setEdad} keyboardType="numeric" maxLength={2} />
            </View>
            <TextInput style={styles.input} placeholder="Contraseña secreta" value={password} onChangeText={setPassword} secureTextEntry />

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

            {/* 🌟 CHECKBOX DE TÉRMINOS OBLIGATORIO */}
            <TouchableOpacity style={styles.termsContainer} onPress={() => setAceptaTerminos(!aceptaTerminos)}>
              <Ionicons name={aceptaTerminos ? "checkbox" : "square-outline"} size={24} color={aceptaTerminos ? COLORS.primario : COLORS.gris} />
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink} onPress={() => Linking.openURL('https://www.google.com')}>Términos, Condiciones y Políticas de Privacidad</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnRegistrar, SHADOWS.medium]} onPress={handleRegister} disabled={cargando}>
              {cargando ? <ActivityIndicator color="white" /> : <Text style={styles.btnRegistrarTexto}>¡Entrar al Cahuín!</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.btnVolverTexto}>¿Ya tienes cuenta? Inicia sesión aquí.</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalRegion} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}><View style={styles.modalCard}><Text style={styles.modalTitle}>Elige tu Región</Text><FlatList data={Object.keys(CHILE_DATA)} keyExtractor={(item) => item} renderItem={({ item }) => ( <TouchableOpacity style={styles.modalOpcion} onPress={() => seleccionarRegion(item)}><Text style={styles.modalOpcionTexto}>{item}</Text></TouchableOpacity> )} /><TouchableOpacity style={styles.modalBtnCerrar} onPress={() => setModalRegion(false)}><Text style={styles.modalBtnCerrarTexto}>Cancelar</Text></TouchableOpacity></View></View>
      </Modal>

      <Modal visible={modalCiudad} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}><View style={styles.modalCard}><Text style={styles.modalTitle}>Elige tu Ciudad</Text><FlatList data={region ? CHILE_DATA[region] : []} keyExtractor={(item) => item} renderItem={({ item }) => ( <TouchableOpacity style={styles.modalOpcion} onPress={() => { setCiudad(item); setModalCiudad(false); }}><Text style={styles.modalOpcionTexto}>{item}</Text></TouchableOpacity> )} /><TouchableOpacity style={styles.modalBtnCerrar} onPress={() => setModalCiudad(false)}><Text style={styles.modalBtnCerrarTexto}>Cancelar</Text></TouchableOpacity></View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SPACING[5], justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING[6], marginTop: SPACING[4] },
  title: { fontSize: 32, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: SPACING[2], textAlign: 'center' },
  form: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl, ...SHADOWS.light },
  label: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: SPACING[3], marginBottom: SPACING[2] },
  input: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, padding: SPACING[3], fontSize: 16, marginBottom: SPACING[3] },
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, padding: SPACING[3], marginBottom: SPACING[3] },
  selectorTextoInactivo: { fontSize: 16, color: COLORS.gris },
  selectorTextoActivo: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500' },
  filaBotones: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[4] },
  btnSeleccion: { flex: 1, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#ddd', paddingVertical: SPACING[3], marginHorizontal: 2, borderRadius: RADIUS.md, alignItems: 'center' },
  btnSeleccionActivo: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  txtSeleccion: { color: COLORS.gris, fontWeight: 'bold', fontSize: 14 },
  txtSeleccionActivo: { color: 'white' },
  
  // Estilos de los Términos
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING[2], marginBottom: SPACING[4], paddingRight: 20 },
  termsText: { marginLeft: 10, fontSize: 13, color: COLORS.textPrimary, flexWrap: 'wrap' },
  termsLink: { color: COLORS.primario, fontWeight: 'bold', textDecorationLine: 'underline' },

  btnRegistrar: { backgroundColor: COLORS.primario, paddingVertical: SPACING[4], borderRadius: RADIUS.lg, alignItems: 'center' },
  btnRegistrarTexto: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  btnVolver: { marginTop: SPACING[4], alignItems: 'center' },
  btnVolverTexto: { color: COLORS.acento, fontSize: 15, fontWeight: 'bold' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[5], maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[4], textAlign: 'center' },
  modalOpcion: { paddingVertical: SPACING[4], borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalOpcionTexto: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center' },
  modalBtnCerrar: { marginTop: SPACING[5], paddingVertical: SPACING[3], backgroundColor: '#f0f0f0', borderRadius: RADIUS.lg, alignItems: 'center' },
  modalBtnCerrarTexto: { color: COLORS.gris, fontSize: 16, fontWeight: 'bold' }
});