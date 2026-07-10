import * as Linking from 'expo-linking';
import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import { REGIONES_CHILE, normalizarTexto } from '../utils/chileLocations';
import { detectarUbicacionChile, obtenerCoordenadasActuales, pedirPermisoUbicacion } from '../utils/location';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

const DATOS = {
  generos: ['Hombre', 'Mujer', 'Más allá del binario'],
  orientacion: ['Heterosexual', 'Gay', 'Lesbiana', 'Bisexual', 'Asexual', 'Demisexual', 'Pansexual', 'Queer'],
  preferencias: ['Hombres', 'Mujeres', 'Todxs'],
  buscando: ['Algo serio, pa pololear', 'Pasarlo bien y ver qué onda', 'Un rato nomás, sin atados', 'Conocer gente y apañar', 'Ni idea, fluyendo'],
  distancias: [5, 10, 30, 50, 100],
  beber: ['No tomo, soy sanito/a', 'Su copete social nomás', 'Bueno/a pal copete'],
  fumar: ['Fumo en los carretes', 'Fumo harto', 'Cero humo', 'Tratando de dejarlo'],
  mascotas: ['Team Perro', 'Team Gato', 'Reptiles locos', 'Aves', 'Peces', 'No tengo pero apañan', 'Alergia a los bichos', 'Paso de mascotas'],
  zodiaco: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  mbti: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
  interesesLista: [
    { id: 'h6', nombre: 'Videojuegos', icon: 'game-controller' },
    { id: 'h17', nombre: 'Cine y Series', icon: 'film' },
    { id: 'h33', nombre: 'Conciertos', icon: 'musical-notes' },
    { id: 'h12', nombre: 'Bares y Chelas', icon: 'beer' },
    { id: 'h19', nombre: 'Naturaleza', icon: 'walk' },
    { id: 'h20', nombre: 'Gym / Deporte', icon: 'fitness' },
    { id: 'h4', nombre: 'Cocinar', icon: 'restaurant' },
    { id: 'h38', nombre: 'Viajar', icon: 'airplane' },
    { id: 'h13', nombre: 'Arte / Museos', icon: 'color-palette' },
    { id: 'h9', nombre: 'Fotografía', icon: 'camera' },
    { id: 'h1', nombre: 'Leer', icon: 'book' },
  ],
};

const TOTAL_PASOS = 14;

const calcularEdadOnboarding = (dia, mes, anio) => {
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.getFullYear() !== Number(anio) ||
    fecha.getMonth() !== Number(mes) - 1 ||
    fecha.getDate() !== Number(dia)
  ) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const diffMes = hoy.getMonth() - fecha.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < fecha.getDate())) edad--;
  return edad;
};

export default function OnboardingScreen() {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [nombre, setNombre] = useState(usuario?.nombre === 'Cahuinero' ? '' : usuario?.nombre || '');
  const [fotoLocal, setFotoLocal] = useState(null);
  const [telefono, setTelefono] = useState('');
  const [region, setRegion] = useState(usuario?.region && usuario.region !== 'Por definir' ? usuario.region : '');
  const [ciudad, setCiudad] = useState(usuario?.ciudad && usuario.ciudad !== 'Por definir' ? usuario.ciudad : '');
  
  const [modalLocationVisible, setModalLocationVisible] = useState(false);
  const [locationStep, setLocationStep] = useState('region');
  const [locationSearch, setLocationSearch] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [anio, setAno] = useState('');
  const [trabajo, setTrabajo] = useState('');
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);

  // 🌟 Referencias para saltar automáticamente entre las cajas de fecha
  const mesRef = useRef(null);
  const anioRef = useRef(null);

  const [genero, setGenero] = useState('');
  const [orientacion, setOrientacion] = useState('');
  const [preferencia, setPreferencia] = useState('');
  const [queBuscas, setQueBuscas] = useState('');
  const [distanciaMax, setDistanciaMax] = useState(50);
  const [beber, setBeber] = useState('');
  const [fumar, setFumar] = useState('');
  const [mascotas, setMascotas] = useState('');
  
  const [zodiaco, setZodiaco] = useState('');
  const [altura, setAltura] = useState('');
  const [personalidad, setPersonalidad] = useState('');
  
  const [intereses, setIntereses] = useState([]);
  const [modal, setModal] = useState(null);

  const avisar = (title, message, emoji = '🌶️') => setModal({ title, message, emoji });

  const obtenerUbicacion = async () => {
    setCargandoUbicacion(true);
    try {
      const { status } = await pedirPermisoUbicacion();
      if (status !== 'granted') {
        avisar('Permiso denegado', 'Necesitamos tu ubicación para mostrarte gente cerca.', '😢');
        return;
      }

      const location = await obtenerCoordenadasActuales();
      const ubicacion = await detectarUbicacionChile(location.coords);

      if (ubicacion?.ciudad || ubicacion?.region) {
        setRegion(ubicacion.region || '');
        setCiudad(ubicacion.ciudad || '');
      } else {
        avisar('Error', 'No pudimos determinar tu ciudad automáticamente.', '😢');
      }
    } catch (error) {
      avisar('Error', 'Hubo un problema obteniendo tu ubicación.', '😢');
    } finally {
      setCargandoUbicacion(false);
    }
  };

  const tomarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.65,
    });
    if (!result.canceled) setFotoLocal(result.assets[0].uri);
  };

  const toggleInteres = (interes) => {
    const existe = intereses.some(i => i.id === interes.id);
    if (existe) {
      setIntereses(intereses.filter((item) => item.id !== interes.id));
    } else if (intereses.length < 5) {
      setIntereses([...intereses, interes]);
    } else {
      avisar('Ey', 'Máximo 5 intereses para mantener el misterio.');
    }
  };

  const avanzar = () => {
    if (paso === 1 && nombre.trim().length < 2) return avisar('Oops', 'Dinos cómo te llamas.');
    if (paso === 2 && !fotoLocal) return avisar('Oops', 'Sube tu mejor foto.');
    if (paso === 3 && telefono.length < 8) return avisar('Oops', 'Ingresa un celular válido.');
    if (paso === 4 && (!region || !ciudad)) return avisar('Oops', 'Elige tu región y ciudad. Así el radar no te manda a Santiago.');
    if (paso === 5) {
      const edad = calcularEdadOnboarding(dia, mes, anio);
      if (dia.length < 1 || mes.length < 1 || anio.length < 4 || edad === null) return avisar('Oops', 'Fecha incompleta o inválida.');
      if (edad < 18) return avisar('Cahuín es 18+', 'Para cuidar a todos, solo pueden entrar personas mayores de edad.', '🔞');
    }
    if (paso === 6 && !genero) return avisar('Oops', 'Selecciona una opción.');
    if (paso === 7 && !orientacion) return avisar('Oops', 'Selecciona tu orientación.');
    if (paso === 8 && !preferencia) return avisar('Oops', 'Dinos a quién quieres ver.');
    if (paso === 9 && !queBuscas) return avisar('Oops', 'Dinos qué buscas.');
    if (paso === 10 && !distanciaMax) return avisar('Oops', 'Fija la distancia.');
    if (paso === 11 && (!beber || !fumar || !mascotas)) return avisar('Oops', 'Faltan tus hábitos.');
    if (paso === 12 && (!zodiaco || !altura)) return avisar('Oops', 'Faltan tus detalles físicos/astrales.');
    // Paso 13 (profesion, personalidad) es opcional.
    setPaso(paso + 1);
  };

  const finalizar = async () => {
    if (intereses.length === 0) return avisar('Ya casi...', 'Elige al menos 1 interés.');
    const edad = calcularEdadOnboarding(dia, mes, anio);
    if (edad === null || edad < 18) return avisar('Cahuín es 18+', 'No podemos crear perfiles de menores de edad.', '🔞');
    setCargando(true);

    try {
      const fechaNacimiento = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      const res = await userService.actualizar({
        nombre,
        telefono,
        ciudad,
        region,
        fechaNacimiento,
        genero,
        orientacionSexual: orientacion,
        preferencia,
        queBuscas,
        distanciaMax,
        habitos: { beber, fumar, mascotas, ejercicio: 'Por definir' },
        zodiaco,
        altura: Number(altura),
        personalidad,
        trabajo,
        hobbies: intereses,
      });

      let usuarioFinal = res.usuario;

      if (fotoLocal) {
        try {
          const formData = new FormData();
          formData.append('fotosExistentes', JSON.stringify([]));
          formData.append('nuevasFotos', {
            uri: Platform.OS === 'android' ? fotoLocal : fotoLocal.replace('file://', ''),
            name: 'onboarding.jpg',
            type: 'image/jpeg',
          });
          const fotoRes = await userService.actualizarFotos(formData);
          usuarioFinal = fotoRes?.usuario || fotoRes || usuarioFinal;
        } catch {
          console.log('Error subiendo imagen en Onboarding.');
        }
      }

      actualizarUsuario(usuarioFinal);
    } catch (error) {
      avisar('Error del servidor', error.message || 'El servidor rechazó los datos.');
    } finally {
      setCargando(false);
    }
  };

  const renderOptionList = (lista, estado, setEstado) => (
    <View style={styles.optionsStack}>
      {lista.map((opcion) => (
        <TouchableOpacity key={opcion} style={[styles.optionRow, estado === opcion && styles.optionRowActive]} onPress={() => setEstado(opcion)}>
          <Text style={[styles.optionText, estado === opcion && styles.optionTextActive]}>{opcion}</Text>
          <Ionicons name={estado === opcion ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={estado === opcion ? '#FFF' : '#6B7280'} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChips = (lista, estado, setEstado) => (
    <View style={styles.chipsGrid}>
      {lista.map((opcion) => (
        <TouchableOpacity key={opcion} style={[styles.chip, estado === opcion && styles.chipActive]} onPress={() => setEstado(opcion)}>
          <Text style={[styles.chipText, estado === opcion && styles.chipTextActive]}>{opcion}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const titleWithAccent = (before, accent, after = '') => (
    <Text style={styles.title}>{before}<Text style={styles.titleAccent}>{accent}</Text>{after}</Text>
  );

  return (
    <>
    <View style={[styles.gradient, { backgroundColor: COLORS.bg }]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.container}>
            <View style={styles.topBar}>
              {paso > 1 ? (
                <TouchableOpacity style={styles.backButton} onPress={() => setPaso(paso - 1)}>
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
              ) : <View style={styles.backSpacer} />}
              <View style={styles.progressTrack}>
                <LinearGradient colors={['#FF5A3C', '#F71374']} style={[styles.progressFill, { width: `${(paso / TOTAL_PASOS) * 100}%` }]} />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
              {paso === 1 && (
                <View>
                  {titleWithAccent('Cómo te ', 'llamas?')}
                  <Text style={styles.subtitle}>Así aparecerás en tu perfil. No podrás cambiarlo seguido.</Text>
                  <CahuinTextField icon="person-outline" style={styles.bigInputModern} placeholder="Ej: Gonzalo" value={nombre} onChangeText={setNombre} autoFocus />
                </View>
              )}

              {paso === 2 && (
                <View>
                  {titleWithAccent('Tu mejor ', 'ángulo')}
                  <Text style={styles.subtitle}>Sube una foto clara. Si después verificas con selfie, ganas insignia.</Text>
                  <TouchableOpacity style={styles.photoBox} onPress={tomarFoto}>
                    {fotoLocal ? <Image source={{ uri: fotoLocal }} style={styles.photoPreview} /> : <Ionicons name="camera" size={42} color="#F0444F" />}
                  </TouchableOpacity>
                </View>
              )}

              {paso === 3 && (
                <View>
                  {titleWithAccent('Mi número ', 'es')}
                  <Text style={styles.subtitle}>Solo lo guardaremos en tu perfil, sin códigos SMS molestos.</Text>
                  <View style={styles.phoneRow}>
                    <View style={[styles.bigInput, styles.prefixBox]}><Text style={styles.prefixText}>+56</Text></View>
                    <CahuinTextField icon="call-outline" style={{ flex: 1 }} placeholder="9 1234 5678" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
                  </View>
                </View>
              )}

              {paso === 4 && (
                <View>
                  {titleWithAccent('De dónde ', 'eres?')}
                  <Text style={styles.subtitle}>Activa tu ubicación para conectar con gente y panoramas en tu misma zona. Si viajas, se actualizará.</Text>
                  
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity 
                      style={[styles.bigInputModern, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0444F', borderWidth: 0, marginTop: 20 }]} 
                      onPress={obtenerUbicacion}
                      disabled={cargandoUbicacion}
                    >
                      {cargandoUbicacion ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Ionicons name="location" size={24} color="#FFF" />
                          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>Activar ubicación</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}


                </View>
              )}

              {paso === 5 && (
                <View>
                  {titleWithAccent('Cuándo estás de ', 'cumple?')}
                  <Text style={styles.subtitle}>Calcularemos tu edad real automáticamente.</Text>
                  <View style={styles.dateRow}>
                    <TextInput 
                      style={styles.dateInput} 
                      placeholder="DD" 
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad" 
                      maxLength={2} 
                      value={dia} 
                      onChangeText={(text) => {
                        const val = text.replace(/\D/g, '');
                        setDia(val);
                        if (val.length === 2) mesRef.current?.focus(); // 🌟 Auto-salto a Mes
                      }} 
                    />
                    <Text style={styles.slash}>/</Text>
                    <TextInput 
                      ref={mesRef}
                      style={styles.dateInput} 
                      placeholder="MM" 
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad" 
                      maxLength={2} 
                      value={mes} 
                      onChangeText={(text) => {
                        const val = text.replace(/\D/g, '');
                        setMes(val);
                        if (val.length === 2) anioRef.current?.focus(); // 🌟 Auto-salto a Año
                      }} 
                    />
                    <Text style={styles.slash}>/</Text>
                    <TextInput 
                      ref={anioRef}
                      style={[styles.dateInput, { width: 112 }]} 
                      placeholder="AAAA" 
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad" 
                      maxLength={4} 
                      value={anio} 
                      onChangeText={(text) => setAno(text.replace(/\D/g, ''))} 
                    />
                  </View>
                </View>
              )}

              {paso === 6 && <View>{titleWithAccent('Cuál es tu ', 'género?')}{renderOptionList(DATOS.generos, genero, setGenero)}</View>}
              {paso === 7 && <View>{titleWithAccent('Tu orientación ', 'sexual')}<Text style={styles.subtitle}>Para mostrarte a las personas correctas.</Text>{renderOptionList(DATOS.orientacion, orientacion, setOrientacion)}</View>}
              {paso === 8 && <View>{titleWithAccent('A quién te interesa ', 'ver?')}<Text style={styles.subtitle}>El radar solo te mostrará a este grupo.</Text>{renderOptionList(DATOS.preferencias, preferencia, setPreferencia)}</View>}
              {paso === 9 && <View>{titleWithAccent('Qué andai ', 'buscando?')}<Text style={styles.subtitle}>Sé sincerx, hay Cahuín para todxs.</Text>{renderOptionList(DATOS.buscando, queBuscas, setQueBuscas)}</View>}
              {paso === 10 && (
                <View>
                  {titleWithAccent('A qué distancia ', 'apañas?')}
                  <Text style={styles.subtitle}>¿A cuántos kilómetros te moverías?</Text>
                  
                  <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 40 }}>
                    <Text style={{ fontSize: 48, fontWeight: '900', color: '#F0444F', fontFamily: FONTS.display }}>
                      {distanciaMax} km
                    </Text>
                    <Text style={{ color: '#6B7280', fontSize: 16, marginTop: 5 }}>Radio máximo de búsqueda</Text>
                  </View>

                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    value={distanciaMax}
                    onValueChange={(val) => setDistanciaMax(val)}
                    minimumTrackTintColor="#F0444F"
                    maximumTrackTintColor="#333333"
                    thumbTintColor="#F0444F"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '700' }}>1 km</Text>
                    <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '700' }}>100 km</Text>
                  </View>
                </View>
              )}
              {paso === 11 && <View>{titleWithAccent('Hablemos de ', 'hábitos')}<Text style={styles.label}>¿Tomas alcohol?</Text>{renderOptionList(DATOS.beber, beber, setBeber)}<Text style={styles.label}>¿Fumas?</Text>{renderOptionList(DATOS.fumar, fumar, setFumar)}<Text style={styles.label}>¿Mascotas?</Text>{renderOptionList(DATOS.mascotas, mascotas, setMascotas)}</View>}
              {paso === 12 && (
                <View>
                  {titleWithAccent('Detalles ', 'extra')}
                  <Text style={styles.label}>Tu Altura (cm)</Text>
                  <CahuinTextField 
                    icon="resize" 
                    placeholder="Ej: 175" 
                    keyboardType="number-pad" 
                    maxLength={3}
                    value={altura} 
                    onChangeText={setAltura} 
                    style={styles.bigInputModern}
                  />
                  <Text style={styles.label}>Tu Signo Zodiacal</Text>
                  {renderOptionList(DATOS.zodiaco, zodiaco, setZodiaco)}
                </View>
              )}

              {paso === 13 && (
                <View>
                  {titleWithAccent('Perfil ', 'Pro (Opcional)')}
                  <Text style={styles.label}>¿A qué te dedicas?</Text>
                  <CahuinTextField 
                    icon="briefcase" 
                    placeholder="Ej: Estudiante de Derecho" 
                    value={trabajo} 
                    onChangeText={setTrabajo} 
                    style={styles.bigInputModern}
                  />
                  <Text style={styles.label}>Tipo de Personalidad (MBTI)</Text>
                  {renderOptionList(DATOS.mbti, personalidad, setPersonalidad)}
                </View>
              )}

              {paso === 14 && (
                <View>
                  {titleWithAccent('Qué te ', 'gusta?')}
                  <Text style={styles.subtitle}>Elige hasta 5 intereses para que tu perfil brille.</Text>
                  <View style={styles.chipsGrid}>
                    {DATOS.interesesLista.map((interes) => {
                      const isActive = intereses.some(i => i.id === interes.id);
                      return (
                        <TouchableOpacity key={interes.id} style={[styles.chip, isActive && styles.chipActive]} onPress={() => toggleInteres(interes)}>
                          <Ionicons name={interes.icon} size={16} color={isActive ? '#FFF' : '#333'} style={{ marginRight: 6 }} />
                          <Text style={[styles.chipText, isActive && styles.optionTextActive]}>{interes.nombre}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.continueButton} onPress={paso === TOTAL_PASOS ? finalizar : avanzar} disabled={cargando}>
                <LinearGradient colors={['#FF5A3C', '#F71374']} style={styles.continueGradient}>
                  {cargando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueText}>{paso === TOTAL_PASOS ? 'A Cahuinear' : 'Siguiente'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      <Modal visible={modalLocationVisible} animationType="slide" transparent={true} onRequestClose={() => setModalLocationVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#100B12', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900' }}>{locationStep === 'region' ? 'Elige tu Región' : 'Elige tu Ciudad'}</Text>
              <TouchableOpacity onPress={() => setModalLocationVisible(false)} style={{ padding: 5 }}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16, alignItems: 'center', height: 50, marginBottom: 20 }}>
              <Ionicons name="search" size={20} color="#8B95A7" />
              <TextInput 
                style={{ flex: 1, color: '#FFF', fontSize: 16, marginLeft: 10 }}
                placeholder="Buscar..."
                placeholderTextColor="#8B95A7"
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus
              />
            </View>

            <FlatList
              data={
                (locationStep === 'region' ? Object.keys(REGIONES_CHILE) : (REGIONES_CHILE[region] || []))
                  .filter(item => normalizarTexto(item).includes(normalizarTexto(locationSearch)))
              }
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => {
                    if (locationStep === 'region') {
                      setRegion(item);
                      setCiudad(''); // Reset ciudad if region changes
                      setLocationStep('ciudad');
                      setLocationSearch('');
                    } else {
                      setCiudad(item);
                      setModalLocationVisible(false);
                    }
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600' }}>{item}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#F0444F" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: '#8B95A7', textAlign: 'center', marginTop: 20 }}>No se encontraron resultados.</Text>}
            />

          </View>
        </View>
      </Modal>

    </View>
    <CahuinModal
      visible={!!modal}
      title={modal?.title}
      message={modal?.message}
      emoji={modal?.emoji}
      onClose={() => setModal(null)}
    />
    </>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: SPACING[5] },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: 10, marginBottom: 28 },
  backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' },
  backSpacer: { width: 48 },
  progressTrack: { flex: 1, height: 7, borderRadius: 8, backgroundColor: isDarkMode ? '#202735' : '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  scrollContent: { paddingBottom: 34 },
  title: { color: COLORS.textPrimary, fontSize: 36, lineHeight: 43, fontWeight: '900', fontFamily: FONTS.display, marginTop: 22, letterSpacing: 0 },
  titleAccent: { color: COLORS.primario },
  subtitle: { color: COLORS.textMuted, fontSize: 17, lineHeight: 25, marginTop: 16, marginBottom: 22 },
  label: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '900', marginTop: 24, marginBottom: 12 },
  bigInput: { minHeight: 76, borderRadius: 24, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.primario, color: COLORS.textPrimary, paddingHorizontal: 22, fontSize: 21, ...SHADOWS.light },
  bigInputModern: { borderRadius: 24 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  prefixBox: { width: 92, alignItems: 'center', justifyContent: 'center' },
  prefixText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900' },
  photoBox: { height: 430, borderRadius: 28, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.primario, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  optionsStack: { gap: 12, marginTop: 18 },
  optionRow: { minHeight: 64, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: isDarkMode ? 'rgba(240,68,79,0.26)' : 'rgba(0,0,0,0.1)' },
  optionRowActive: { borderColor: COLORS.primario, backgroundColor: isDarkMode ? 'rgba(240,68,79,0.24)' : 'rgba(240,68,79,0.1)' },
  optionText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800' },
  optionTextActive: { color: isDarkMode ? '#FFF' : COLORS.primario },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderRadius: 22, minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.chipBg, borderWidth: 1, borderColor: isDarkMode ? 'rgba(240,68,79,0.26)' : 'rgba(0,0,0,0.1)' },
  chipActive: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  chipText: { color: isDarkMode ? '#FFF' : COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  chipTextActive: { color: '#FFF' },
  dateRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  dateInput: { width: 78, minHeight: 74, borderRadius: 20, backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.primario, color: COLORS.textPrimary, textAlign: 'center', fontSize: 22, fontWeight: '900' },
  slash: { color: COLORS.textMuted, fontSize: 30 },
  continueButton: { marginTop: 36, marginBottom: 20, borderRadius: 32, overflow: 'hidden', ...SHADOWS.medium },
  continueGradient: { height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: '#FFF', fontSize: 19, fontWeight: '900' },
});
