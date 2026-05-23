import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, Vibration, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mensajeService } from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

export default function SalaChatScreen({ route, navigation }) {
  const { matchId, usuario: otroUsuario } = route.params;
  const { usuario: miUsuario } = useAuth();
  
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  
  const flatListRef = useRef();
  const cantidadMensajesRef = useRef(0);

  useEffect(() => {
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarMensajes = async () => {
    try {
      const data = await mensajeService.listar(matchId);
      const mensajesNuevos = data.mensajes || [];

      if (mensajesNuevos.length > cantidadMensajesRef.current && cantidadMensajesRef.current !== 0) {
        const ultimoMensaje = mensajesNuevos[mensajesNuevos.length - 1];
        if (ultimoMensaje.remitente._id !== miUsuario._id) Vibration.vibrate([0, 100, 100, 100]);
      }
      setMensajes(mensajesNuevos);
      cantidadMensajesRef.current = mensajesNuevos.length;
    } catch (error) { console.log("Error cargando mensajes:", error); }
  };

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    const nuevoMensajeLocal = { _id: Date.now().toString(), texto, remitente: { _id: miUsuario._id }, createdAt: new Date().toISOString() };
    setMensajes(prev => [...prev, nuevoMensajeLocal]);
    cantidadMensajesRef.current += 1;
    setTexto('');
    try {
      await mensajeService.enviar(matchId, texto);
      cargarMensajes();
    } catch (error) { console.log("Error enviando mensaje:", error); }
  };

  // 🛑 MENÚ DE SEGURIDAD (REPORTE Y BLOQUEO)
  const ejecutarAccionSeguridad = async (endpoint, mensajeExito) => {
    try {
      // ⚠️ CAMBIA ESTA IP POR LA TUYA (La misma que usas en api.js)
      const response = await fetch(`http://192.168.1.XX:5000/api/users/${otroUsuario._id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${miUsuario.token}` } 
      });
      
      if (response.ok) {
        Alert.alert("Listo 🛡️", mensajeExito);
        navigation.navigate('Tabs'); 
      }
    } catch (error) {
      Alert.alert("Error", "No pudimos procesar la solicitud.");
    }
  };

  const handleOpcionesSeguridad = () => {
    Alert.alert(
      "Opciones de Seguridad 🛑",
      "¿Qué deseas hacer con este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Reportar Comportamiento", onPress: () => ejecutarAccionSeguridad('reportar', 'El perfil ha sido reportado a los moderadores.') },
        { text: "Bloquear Usuario", onPress: () => ejecutarAccionSeguridad('bloquear', 'Usuario bloqueado. Ya no podrá contactarte.'), style: "destructive" }
      ]
    );
  };

  const renderMensaje = ({ item }) => {
    const esMio = item.remitente._id === miUsuario._id;
    return (
      <View style={[styles.burbujaContenedor, esMio ? styles.burbujaMia : styles.burbujaDeEl]}>
        <Text style={[styles.textoMensaje, esMio ? styles.textoMio : styles.textoDeEl]}>{item.texto}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, SHADOWS.light]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <Image source={{ uri: otroUsuario.foto || 'https://via.placeholder.com/50' }} style={styles.avatarHeader} />
        
        <View style={{ flex: 1 }}>
          <Text style={styles.headerNombre}>{otroUsuario.nombre}</Text>
          <Text style={styles.headerCiudad}>📍 {otroUsuario.ciudad || 'Chile'}</Text>
        </View>

        {/* 🛑 EL BOTÓN DE PÁNICO OFICIAL */}
        <TouchableOpacity onPress={handleOpcionesSeguridad} style={{ padding: 5 }}>
          <Ionicons name="warning-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item._id}
          renderItem={renderMensaje}
          contentContainerStyle={styles.listaMensajes}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContenedor}>
          <TextInput style={styles.input} placeholder="Escribe tu cahuín aquí..." value={texto} onChangeText={setTexto} multiline />
          <TouchableOpacity style={styles.btnEnviar} onPress={handleEnviar}>
            <Ionicons name="send" size={20} color="white" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING[4], backgroundColor: COLORS.tarjeta },
  btnBack: { paddingRight: SPACING[4] },
  avatarHeader: { width: 45, height: 45, borderRadius: 25, marginRight: SPACING[3] },
  headerNombre: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  headerCiudad: { fontSize: 12, color: COLORS.gris, marginTop: 2 },
  listaMensajes: { padding: SPACING[4], paddingBottom: SPACING[6] },
  burbujaContenedor: { maxWidth: '80%', padding: SPACING[3], borderRadius: RADIUS.lg, marginBottom: SPACING[3] },
  burbujaMia: { alignSelf: 'flex-end', backgroundColor: COLORS.primario, borderBottomRightRadius: 0 },
  burbujaDeEl: { alignSelf: 'flex-start', backgroundColor: '#EAEAEA', borderBottomLeftRadius: 0 },
  textoMensaje: { fontSize: 16, lineHeight: 22 },
  textoMio: { color: 'white' },
  textoDeEl: { color: COLORS.textPrimary },
  inputContenedor: { flexDirection: 'row', padding: SPACING[3], backgroundColor: COLORS.tarjeta, borderTopWidth: 1, borderColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.fondo, borderRadius: 20, paddingHorizontal: SPACING[4], paddingTop: SPACING[3], paddingBottom: SPACING[3], fontSize: 16, maxHeight: 100 },
  btnEnviar: { backgroundColor: COLORS.primario, width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: SPACING[3] }
});