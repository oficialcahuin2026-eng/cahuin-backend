import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

export default function MatchCelebrationModal({ visible, onClose, miFoto, suFoto, suNombre, compatibilidad }) {
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const viewShotRef = useRef();
  
  // Animaciones
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideLeft = useRef(new Animated.Value(-300)).current;
  const slideRight = useRef(new Animated.Value(300)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(slideLeft, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(slideRight, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
          ])
        ).start();
      });
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      slideLeft.setValue(-300);
      slideRight.setValue(300);
      glowAnim.setValue(0);
    }
  }, [visible]);

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
    <Modal visible={visible} animationType="none" transparent={true}>
      <Animated.View style={[styles.modalFondo, { opacity: fadeAnim }]}>
        
        {/* LA TARJETA QUE SE CONVERTIRÁ EN IMAGEN */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', alignItems: 'center' }}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <View style={styles.tarjetaCompartible}>
              
              <Text style={styles.tituloApp}>CAHUÍN 🌶️</Text>
              
              <View style={styles.textoMatchContainer}>
                <Text style={styles.textoMatch}>¡HAY CAHUÍN CON</Text>
                <Text style={styles.textoMatchNombre}>{suNombre?.toUpperCase()}!</Text>
              </View>

              {/* Contenedor Animado de Fotos */}
              <View style={styles.fotosWrapper}>
                <Animated.View style={[styles.glowBackground, { opacity: glowAnim }]} />
                
                <Animated.View style={[styles.fotoContenedorIzquierdo, { transform: [{ translateX: slideLeft }, { rotate: '-5deg' }] }]}>
                  <Image source={{ uri: miFoto || 'https://via.placeholder.com/150' }} style={styles.fotoGrande} />
                </Animated.View>
                
                <Animated.View style={[styles.fotoContenedorDerecho, { transform: [{ translateX: slideRight }, { rotate: '5deg' }] }]}>
                  <Image source={{ uri: suFoto || 'https://via.placeholder.com/150' }} style={styles.fotoGrande} />
                </Animated.View>

                <Animated.View style={[styles.circuloFuegoCentral, { transform: [{ scale: scaleAnim }] }]}>
                  <Text style={{ fontSize: 40 }}>🔥</Text>
                </Animated.View>
              </View>

              {compatibilidad > 0 && (
                <View style={styles.compatibilidadBadge}>
                  <Ionicons name="sparkles" size={16} color="#F59E0B" />
                  <Text style={styles.compatibilidadTexto}>{compatibilidad}% de compatibilidad</Text>
                </View>
              )}

              <Text style={styles.textoFooter}>El destino hizo lo suyo en Cahuín 🇨🇱</Text>
            </View>
          </ViewShot>
        </Animated.View>

        {/* BOTONES FUERA DE LA FOTO CAPTURADA */}
        <Animated.View style={[styles.botonesContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.btnCompartir} onPress={compartirMatch}>
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.btnCompartirTexto}>Compartir en Historias</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnChatear} onPress={onClose}>
            <Text style={styles.btnChatearTexto}>Ir a conversar</Text>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>
    </Modal>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: SPACING[5] },
  
  tarjetaCompartible: { width: 340, backgroundColor: 'transparent', padding: SPACING[4], alignItems: 'center' },
  tituloApp: { color: COLORS.primario, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display, letterSpacing: 2, marginBottom: 10, textShadowColor: 'rgba(233, 30, 99, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  
  textoMatchContainer: { alignItems: 'center', marginBottom: 25 },
  textoMatch: { color: '#FFF', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  textoMatchNombre: { color: '#A855F7', fontSize: 36, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center', textShadowColor: 'rgba(168, 85, 247, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },

  fotosWrapper: { width: '100%', height: 180, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 30 },
  glowBackground: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(233, 30, 99, 0.15)' },
  
  fotoContenedorIzquierdo: { position: 'absolute', left: 20, zIndex: 2, ...SHADOWS.dark },
  fotoContenedorDerecho: { position: 'absolute', right: 20, zIndex: 1, ...SHADOWS.dark },
  
  fotoGrande: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: COLORS.primario },
  
  circuloFuegoCentral: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', zIndex: 3, ...SHADOWS.lg, borderWidth: 3, borderColor: '#F59E0B' },

  compatibilidadBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#F59E0B', marginBottom: 15 },
  compatibilidadTexto: { color: '#F59E0B', fontSize: 16, fontWeight: '900', marginLeft: 8 },
  
  textoFooter: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 10, fontStyle: 'italic' },
  
  botonesContainer: { marginTop: 40, width: '100%', alignItems: 'center', gap: 15 },
  btnCompartir: { flexDirection: 'row', backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.round, alignItems: 'center', justifyContent: 'center', width: '90%', ...SHADOWS.md },
  btnCompartirTexto: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  btnChatear: { backgroundColor: COLORS.primario, paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.round, alignItems: 'center', justifyContent: 'center', width: '90%', ...SHADOWS.md },
  btnChatearTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});