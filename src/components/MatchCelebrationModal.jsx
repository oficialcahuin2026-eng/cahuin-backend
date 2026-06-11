import React, { useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

export default function MatchCelebrationModal({ visible, onClose, miFoto, suFoto, suNombre, compatibilidad }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const viewShotRef = useRef();

  const compartirMatch = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, {
        dialogTitle: '¡Encontramos el Cahuín!',
        mimeType: 'image/png'
      });
    } catch (error) {
      console.log('Error al compartir', error);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalFondo}>
        
        {/* LA TARJETA QUE SE CONVERTIRÁ EN IMAGEN */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <View style={styles.tarjetaCompartible}>
            <Text style={styles.tituloApp}>CAHUÍN 🌶️</Text>
            
            <View style={styles.fotosContainer}>
              <Image source={{ uri: miFoto || 'https://via.placeholder.com/150' }} style={[styles.foto, styles.fotoIzquierda]} />
              <View style={styles.circuloFuego}><Text style={{ fontSize: 30 }}>🔥</Text></View>
              <Image source={{ uri: suFoto || 'https://via.placeholder.com/150' }} style={[styles.foto, styles.fotoDerecha]} />
            </View>

            <Text style={styles.textoMatch}>¡HAY CAHUÍN CON {suNombre?.toUpperCase()}!</Text>
            
            {compatibilidad > 0 && (
              <View style={styles.compatibilidadBadge}>
                <Text style={styles.compatibilidadTexto}>{compatibilidad}% de compatibilidad</Text>
              </View>
            )}

            <Text style={styles.textoFooter}>Descarga Cahuín y encuentra tu match ideal 🇨🇱</Text>
          </View>
        </ViewShot>

        {/* BOTONES FUERA DE LA FOTO CAPTURADA */}
        <View style={styles.botonesContainer}>
          <TouchableOpacity style={styles.btnCompartir} onPress={compartirMatch}>
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.btnCompartirTexto}>Compartir en Historias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnChatear} onPress={onClose}>
            <Text style={styles.btnChatearTexto}>Ir a conversar</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: SPACING[5] },
  
  tarjetaCompartible: { backgroundColor: '#1A1A1A', borderRadius: RADIUS.xl, padding: SPACING[6], alignItems: 'center', width: 320, borderWidth: 2, borderColor: COLORS.primario, ...SHADOWS['2xl'] },
  tituloApp: { fontSize: 24, fontWeight: 'bold', color: 'white', fontFamily: FONTS.display, letterSpacing: 2, marginBottom: 30 },
  
  fotosContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 140, width: '100%', marginBottom: 30 },
  foto: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: COLORS.primario },
  fotoIzquierda: { zIndex: 1, transform: [{ translateX: 15 }] },
  fotoDerecha: { zIndex: 1, transform: [{ translateX: -15 }] },
  circuloFuego: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', zIndex: 10, ...SHADOWS.lg, borderWidth: 2, borderColor: COLORS.primario },
  
  textoMatch: { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 15, fontFamily: FONTS.display },
  compatibilidadBadge: { backgroundColor: 'rgba(76, 175, 80, 0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#4CAF50', marginBottom: 20 },
  compatibilidadTexto: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  textoFooter: { color: COLORS.gris, fontSize: 11, fontStyle: 'italic' },

  botonesContainer: { marginTop: 40, width: '100%', alignItems: 'center', gap: 15 },
  btnCompartir: { flexDirection: 'row', backgroundColor: '#E1306C', paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.lg, alignItems: 'center', width: 320, justifyContent: 'center' },
  btnCompartirTexto: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  btnChatear: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.lg, width: 320, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 2, borderColor: 'white' },
  btnChatearTexto: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});