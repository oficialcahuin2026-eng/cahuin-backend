import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Share, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
// 🛑 PARCHE: Import de notificaciones apagado temporalmente para Expo Go
// import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

// 🛑 PARCHE: Handler apagado
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
*/

export default function CitaSeguraModal({ visible, onClose, matchNombre, ciudad }) {
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS);
  const [cargando, setCargando] = useState(false);

  const lugaresSeguros = [
    { id: '1', nombre: 'Cafetería concurrida', icono: 'cafe' },
    { id: '2', nombre: 'Mall o Centro Comercial', icono: 'business' },
    { id: '3', nombre: 'Parque céntrico de día', icono: 'leaf' },
    { id: '4', nombre: 'Restaurante conocido', icono: 'restaurant' },
  ];

  const compartirUbicacion = async () => {
    setCargando(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Oye ✋', 'Necesitamos permiso de GPS para compartir tu ubicación.');
        setCargando(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const urlMaps = `http://googleusercontent.com/maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
      
      const mensaje = `¡Hola! Estoy en una cita de Cahuín con ${matchNombre || 'alguien'}. Esta es mi ubicación actual en tiempo real por si acaso: ${urlMaps}`;

      await Share.share({ message: mensaje });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la ubicación.');
    } finally {
      setCargando(false);
    }
  };

  const activarAlarmaSegura = async () => {
    // 🛑 PARCHE: Simulamos la alarma sin usar notificaciones reales por ahora
    Alert.alert('¡Modo Seguro Simulado! 🛡️', 'Las notificaciones push están pausadas en el modo de pruebas, pero en la app real te llegará una alerta en 2 horas.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalFondo}>
        <View style={styles.modalCard}>
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="shield-check" size={32} color="white" />
            </View>
            <Text style={styles.title}>Cita Segura</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Tu seguridad es primero. Aquí tienes herramientas para tu primera cita con {matchNombre}.
          </Text>

          <Text style={styles.seccionTitulo}>📍 Sugerencias en {ciudad || 'tu zona'}</Text>
          <View style={styles.lugaresContainer}>
            {lugaresSeguros.map((lugar) => (
              <View key={lugar.id} style={styles.lugarBadge}>
                <Ionicons name={lugar.icono} size={16} color={COLORS.primario} style={{ marginRight: 5 }} />
                <Text style={styles.lugarText}>{lugar.nombre}</Text>
              </View>
            ))}
          </View>

          <View style={styles.botonesContainer}>
            <TouchableOpacity style={styles.btnCompartir} onPress={compartirUbicacion} disabled={cargando}>
              {cargando ? <ActivityIndicator color={COLORS.primario} /> : (
                <>
                  <Ionicons name="location" size={20} color={COLORS.primario} />
                  <Text style={styles.btnCompartirTexto}>Avisarle a un amig@ (GPS)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnAlarma} onPress={activarAlarmaSegura}>
              <Ionicons name="alarm" size={20} color="white" />
              <Text style={styles.btnAlarmaTexto}>Activar check de 2 horas</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING[6], ...SHADOWS['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[4] },
  iconContainer: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 20, marginRight: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1, fontFamily: FONTS.display },
  closeBtn: { padding: 5 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING[5], lineHeight: 22 },
  seccionTitulo: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[3] },
  lugaresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING[6] },
  lugarBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondo, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  lugarText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' },
  botonesContainer: { gap: 15, marginBottom: SPACING[4] },
  btnCompartir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: RADIUS.lg, backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primario },
  btnCompartirTexto: { color: COLORS.primario, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  btnAlarma: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: RADIUS.lg, backgroundColor: '#4CAF50', ...SHADOWS.medium },
  btnAlarmaTexto: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});