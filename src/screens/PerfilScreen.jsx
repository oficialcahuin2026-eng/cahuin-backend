import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

export default function PerfilScreen({ navigation }) {
  const { usuario, actualizarUsuario, logout } = useAuth();
  
  // Estados para la foto
  const [foto, setFoto] = useState(usuario?.foto || null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Estados para el Modal de Edición de Perfil
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  
  // Estados de los datos del usuario
  const [descripcion, setDescripcion] = useState(usuario?.descripcion || '');
  const [altura, setAltura] = useState(usuario?.altura || '');
  const [peso, setPeso] = useState(usuario?.peso || '');
  const [musica, setMusica] = useState(usuario?.musica || '');
  const [peliculas, setPeliculas] = useState(usuario?.peliculas || '');
  const [deportes, setDeportes] = useState(usuario?.deportes || '');

  // 1. FUNCIÓN PARA CAMBIAR FOTO
  const seleccionarYGuardarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('¡Oye! 🛑', 'Necesitamos permiso para entrar a tus fotos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      const nuevaFotoUri = result.assets[0].uri;
      setFoto(nuevaFotoUri);
      setSubiendoFoto(true);

      try {
        const formData = new FormData();
        const filename = nuevaFotoUri.split('/').pop() || 'perfil.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`; 

        formData.append('foto', { uri: nuevaFotoUri, name: filename, type });

        const data = await userService.actualizarFoto(formData);
        if (actualizarUsuario) actualizarUsuario({ foto: data.foto });
        Alert.alert("¡Espectacular! 🎉", "Tu foto se actualizó.");
      } catch (error) {
        console.log("Error subiendo foto:", error);
        Alert.alert("Error", "No pudimos subir la foto al servidor.");
      } finally {
        setSubiendoFoto(false);
      }
    }
  };

  // 2. FUNCIÓN PARA GUARDAR LA INFORMACIÓN EXTRA
  const guardarDetalles = async () => {
    setGuardando(true);
    try {
      const datosNuevos = { descripcion, altura, peso, musica, peliculas, deportes };
      const res = await userService.actualizar(datosNuevos);
      
      if (actualizarUsuario) actualizarUsuario(res.usuario);
      setModalVisible(false);
      Alert.alert("¡Perfil Actualizado! 🌶️", "Ahora tu perfil tiene mucha más onda.");
    } catch (error) {
      Alert.alert("Error", "No pudimos guardar tus datos.");
    } finally {
      setGuardando(false);
    }
  };

  // Componente visual para las etiquetas (Badges)
  const EtiquetaInfo = ({ icono, texto, tipo }) => {
    if (!texto) return null;
    return (
      <View style={styles.badge}>
        {tipo === 'ion' ? (
          <Ionicons name={icono} size={16} color={COLORS.primario} style={styles.badgeIcon} />
        ) : (
          <MaterialCommunityIcons name={icono} size={16} color={COLORS.primario} style={styles.badgeIcon} />
        )}
        <Text style={styles.badgeText}>{texto}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* CABECERA Y FOTO */}
        <View style={styles.headerContenedor}>
          <View style={styles.fotoContainer}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.fotoPerfil} />
            ) : (
              <View style={[styles.fotoPerfil, styles.fotoVacia]}>
                <Ionicons name="person" size={60} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.botonCambiarFoto} onPress={seleccionarYGuardarFoto} disabled={subiendoFoto}>
              {subiendoFoto ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="camera" size={20} color="white" />}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.nombreUsuario}>{usuario?.nombre}, {usuario?.altura ? `${usuario.altura}m` : '??'}</Text>
          <Text style={styles.ubicacionUsuario}>📍 {usuario?.ciudad}, {usuario?.region}</Text>
          
          <TouchableOpacity style={styles.btnEditar} onPress={() => setModalVisible(true)}>
            <Ionicons name="pencil" size={16} color={COLORS.primario} />
            <Text style={styles.btnEditarTexto}>Editar Información</Text>
          </TouchableOpacity>
        </View>

        {/* SECCIÓN VIP */}
        {!usuario?.isPremium && (
          <TouchableOpacity style={[styles.botonPremium, SHADOWS.light]} onPress={() => navigation.navigate('Premium')}>
            <Ionicons name="diamond" size={24} color="#FFD700" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.botonPremiumTitulo}>Mejorar a Cahuín Premium</Text>
              <Text style={styles.botonPremiumSub}>Consigue likes ilimitados y más visibilidad.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        )}

        {/* BIOGRAFÍA */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Sobre mí</Text>
          {usuario?.descripcion ? (
            <Text style={styles.seccionTexto}>{usuario.descripcion}</Text>
          ) : (
            <Text style={styles.seccionVacia}>Aún no has escrito nada. ¡Cuéntale al mundo quién eres!</Text>
          )}
        </View>

        {/* ETIQUETAS DE GUSTOS Y FÍSICO */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Mis Detalles</Text>
          <View style={styles.badgesContenedor}>
            <EtiquetaInfo icono="barbell" texto={usuario?.peso ? `${usuario.peso} kg` : null} tipo="ion" />
            <EtiquetaInfo icono="musical-notes" texto={usuario?.musica} tipo="ion" />
            <EtiquetaInfo icono="film" texto={usuario?.peliculas} tipo="ion" />
            <EtiquetaInfo icono="soccer" texto={usuario?.deportes} tipo="material" />
            
            {!usuario?.peso && !usuario?.musica && !usuario?.peliculas && !usuario?.deportes && (
              <Text style={styles.seccionVacia}>Añade tus gustos para tener más matches.</Text>
            )}
          </View>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity style={styles.botonLogout} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.acento} style={{ marginRight: 8 }} />
          <Text style={styles.logoutTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- MODAL PARA EDITAR EL PERFIL --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={[styles.modalCard, SHADOWS['2xl']]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Editar Perfil 📝</Text>
                
                <Text style={styles.label}>Biografía (Preséntate)</Text>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Ej: Me encanta salir a tomar un café, busco algo serio..." value={descripcion} onChangeText={setDescripcion} multiline />
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Altura (m)</Text>
                    <TextInput style={styles.input} placeholder="Ej: 1.75" value={altura} onChangeText={setAltura} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <TextInput style={styles.input} placeholder="Ej: 70" value={peso} onChangeText={setPeso} keyboardType="numeric" />
                  </View>
                </View>

                <Text style={styles.label}>Música Favorita</Text>
                <TextInput style={styles.input} placeholder="Ej: Rock Chileno, Pop" value={musica} onChangeText={setMusica} />

                <Text style={styles.label}>Películas o Series</Text>
                <TextInput style={styles.input} placeholder="Ej: Terror, Comedia Romántica" value={peliculas} onChangeText={setPeliculas} />

                <Text style={styles.label}>Deportes que practicas o ves</Text>
                <TextInput style={styles.input} placeholder="Ej: Fútbol, Trekking, Ninguno" value={deportes} onChangeText={setDeportes} />

                <View style={styles.modalBotones}>
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)} disabled={guardando}>
                    <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnGuardarModal} onPress={guardarDetalles} disabled={guardando}>
                    {guardando ? <ActivityIndicator color="white" /> : <Text style={styles.btnGuardarTexto}>Guardar Cambios</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING[5], paddingBottom: 100 },
  
  headerContenedor: { alignItems: 'center', marginBottom: SPACING[6], marginTop: SPACING[2] },
  fotoContainer: { position: 'relative', marginBottom: SPACING[4] },
  fotoPerfil: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: COLORS.primario },
  fotoVacia: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderColor: '#ccc' },
  botonCambiarFoto: { position: 'absolute', bottom: 5, right: 0, backgroundColor: COLORS.primario, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 5, borderWidth: 2, borderColor: 'white' },
  
  nombreUsuario: { fontSize: 26, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  ubicacionUsuario: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
  
  btnEditar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE4E1', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginTop: 15 },
  btnEditarTexto: { color: COLORS.primario, fontWeight: 'bold', marginLeft: 5, fontSize: 14 },

  botonPremium: { flexDirection: 'row', backgroundColor: '#111', padding: SPACING[4], borderRadius: RADIUS.xl, alignItems: 'center', marginBottom: SPACING[6] },
  botonPremiumTitulo: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  botonPremiumSub: { color: '#bbb', fontSize: 13 },

  seccion: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl, marginBottom: SPACING[4], ...SHADOWS.light },
  seccionTitulo: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[3], fontFamily: FONTS.display },
  seccionTexto: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  seccionVacia: { fontSize: 15, color: COLORS.gris, fontStyle: 'italic' },

  badgesContenedor: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  badgeIcon: { marginRight: 6 },
  badgeText: { fontSize: 13, color: '#555', fontWeight: '600' },

  botonLogout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: SPACING[4], marginTop: SPACING[4] },
  logoutTexto: { color: COLORS.acento, fontWeight: 'bold', fontSize: 16 },

  // Estilos del Modal
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[6], maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[5], textAlign: 'center', fontFamily: FONTS.display },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[2], marginTop: SPACING[3] },
  input: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', borderRadius: RADIUS.lg, padding: SPACING[3], fontSize: 15 },
  
  modalBotones: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING[6], marginBottom: SPACING[4] },
  btnCancelar: { flex: 1, paddingVertical: SPACING[4], alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: RADIUS.lg, marginRight: 10 },
  btnCancelarTexto: { color: COLORS.gris, fontWeight: 'bold', fontSize: 16 },
  btnGuardarModal: { flex: 1, paddingVertical: SPACING[4], alignItems: 'center', backgroundColor: COLORS.primario, borderRadius: RADIUS.lg },
  btnGuardarTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});