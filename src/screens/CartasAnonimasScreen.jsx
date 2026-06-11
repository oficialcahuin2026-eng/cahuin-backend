import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; // 🌟 IMPORTADO PARA SABER QUIÉN SOY
import { cartaService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CahuinTextField from '../components/CahuinTextField';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

export default function CartasAnonimasScreen() {
  const { usuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  
  const [cartas, setCartas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaCarta, setNuevaCarta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reaccionadas, setReaccionadas] = useState([]);

  useEffect(() => { cargarCartas(); }, []);

  const cargarCartas = async () => {
    try {
      const data = await cartaService.getCartas();
      setCartas(data.cartas);
    } catch (error) { console.log(error); } finally { setCargando(false); }
  };

  const enviarCarta = async () => {
    if (nuevaCarta.length < 10) return Alert.alert('Muy corta', 'Escribe un buen cahuín (mínimo 10 caracteres).');
    setEnviando(true);
    try {
      await cartaService.crear(nuevaCarta);
      setNuevaCarta('');
      setModalVisible(false);
      Alert.alert('¡Publicada!', 'Tu carta ha sido lanzada al viento anónimamente. 🌬️💌');
      cargarCartas(); 
    } catch (error) { Alert.alert('Error', 'No pudimos publicarla.'); } finally { setEnviando(false); }
  };

  // 🌟 FUNCIÓN PARA BORRAR LA CARTA
  const eliminarCarta = async (cartaId) => {
    Alert.alert('Borrar Carta', '¿Seguro que quieres borrar este cahuín del universo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('@cahuin_token');
            // Fetch directo para evitar tener que modificar api.js a mano
            await fetch(`http://192.168.1.13:5000/api/cartas/${cartaId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            Alert.alert('Lista', 'Carta borrada.');
            cargarCartas();
          } catch (e) { Alert.alert('Error', 'No se pudo borrar.'); }
      }}
    ]);
  };

  const handleReaccion = (cartaId, tipo) => {
    if (reaccionadas.includes(cartaId)) return Alert.alert('Oye ✋', 'Ya reaccionaste a este Cahuín. Deja algo para los demás.');
    setReaccionadas([...reaccionadas, cartaId]);
    const nuevasCartas = cartas.map(c => c._id === cartaId ? { ...c, reacciones: { ...c.reacciones, [tipo]: c.reacciones[tipo] + 1 } } : c);
    setCartas(nuevasCartas);
    cartaService.reaccionar(cartaId, tipo).catch(() => console.log('Error reaccionando'));
  };

  const renderCarta = ({ item }) => (
    <View style={styles.cartaContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Ionicons name="mail-open-outline" size={24} color={COLORS.primario} />
        {/* 🌟 SI SOY EL CREADOR, VEO EL BASURERO */}
        {item.creador === usuario?._id && (
          <TouchableOpacity onPress={() => eliminarCarta(item._id)}>
            <Ionicons name="trash-outline" size={22} color="#FF5252" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.cartaTexto}>"{item.texto}"</Text>
      
      <View style={styles.reaccionesFila}>
        <TouchableOpacity style={styles.btnReaccion} onPress={() => handleReaccion(item._id, 'fuego')}><Text style={styles.emojiReaccion}>🔥</Text><Text style={styles.contadorReaccion}>{item.reacciones?.fuego || 0}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnReaccion} onPress={() => handleReaccion(item._id, 'risa')}><Text style={styles.emojiReaccion}>😂</Text><Text style={styles.contadorReaccion}>{item.reacciones?.risa || 0}</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnReaccion} onPress={() => handleReaccion(item._id, 'triste')}><Text style={styles.emojiReaccion}>😢</Text><Text style={styles.contadorReaccion}>{item.reacciones?.triste || 0}</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Cartas Anónimas 💌</Text>
        <TouchableOpacity style={styles.btnEscribir} onPress={() => setModalVisible(true)}>
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.btnEscribirTexto}>Escribir</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitulo}>Desahógate o busca a tu amor perdido. Nadie sabrá que fuiste tú.</Text>

      {cargando ? (
        <ActivityIndicator size="large" color={COLORS.primario} style={{ marginTop: 50 }} />
      ) : (
        <FlatList data={cartas} keyExtractor={(item) => item._id} renderItem={renderCarta} contentContainerStyle={styles.lista} />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Redactar Carta ✍️</Text>
              <Text style={styles.modalSub}>Recuerda, no pongas tu nombre real ni datos privados de otros.</Text>
              <CahuinTextField icon="paper-plane-outline" placeholder="Para el ni�o del Metro Tobalaba..." multiline variant="textarea" autoFocus value={nuevaCarta} onChangeText={setNuevaCarta} />
              <View style={styles.modalBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnEnviarCarta} onPress={enviarCarta} disabled={enviando}>
                  {enviando ? <ActivityIndicator color="white" /> : <Text style={styles.btnEnviarCartaTexto}>Lanzar al viento</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING[5], borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitulo: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  btnEscribir: { flexDirection: 'row', backgroundColor: COLORS.primario, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  btnEscribirTexto: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  subtitulo: { fontSize: 14, color: COLORS.textMuted, paddingHorizontal: SPACING[5], paddingTop: SPACING[3] },
  lista: { padding: SPACING[5], paddingBottom: 100 },
  cartaContainer: { backgroundColor: COLORS.tarjeta, padding: 20, borderRadius: RADIUS.xl, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  cartaTexto: { fontSize: 18, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 26, marginBottom: 20 },
  reaccionesFila: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 15 },
  btnReaccion: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondo, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border },
  emojiReaccion: { fontSize: 16, marginRight: 5 },
  contadorReaccion: { color: COLORS.textMuted, fontWeight: 'bold' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[6] },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 5 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  inputCarta: { backgroundColor: COLORS.fondo, height: 150, textAlignVertical: 'top', padding: 15, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, color: COLORS.textPrimary, fontSize: 16, marginBottom: 20 },
  modalBotones: { flexDirection: 'row', gap: 15 },
  btnCancelar: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  btnCancelarTexto: { color: COLORS.textPrimary, fontWeight: 'bold' },
  btnEnviarCarta: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: COLORS.primario, borderRadius: RADIUS.lg },
  btnEnviarCartaTexto: { color: 'white', fontWeight: 'bold' }
});
