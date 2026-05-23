import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../utils/theme';

export default function MatchModal({ visible, usuario, onChatear, onCerrar }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue:1, tension:60, friction:8, useNativeDriver:true }).start();
    } else { scaleAnim.setValue(0); }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCerrar}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform:[{ scale: scaleAnim }] }]}>
          <View style={styles.banderaStripe} />
          <Text style={styles.emoji}>🎊</Text>
          <Text style={styles.titulo}>¡Se armó el Cahuín!</Text>
          <Text style={styles.subtitulo}>
            Tú y <Text style={{ fontFamily: FONTS.bodyBold }}>{usuario?.nombre}</Text>{'\n'}
            se eligieron mutuamente 🇨🇱
          </Text>
          <View style={styles.fotosRow}>
            <Image source={{ uri: usuario?.foto }} style={styles.foto} />
            <Text style={{ fontSize:28 }}>❤️</Text>
            <Image source={{ uri: 'https://picsum.photos/seed/yo/80/80' }} style={styles.foto} />
          </View>
          <TouchableOpacity style={styles.btnChatear} onPress={onChatear}>
            <Text style={styles.btnChatearText}>¡Háblense al tiro! 💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCerrar} onPress={onCerrar}>
            <Text style={styles.btnCerrarText}>Después los contacto</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'center', alignItems:'center', padding: SPACING[6] },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS['2xl'], padding: SPACING[8], alignItems:'center', width:'100%', overflow:'hidden' },
  banderaStripe: { position:'absolute', top:0, left:0, right:0, height:6, backgroundColor: COLORS.rojoBandera },
  emoji: { fontSize:48, marginBottom: SPACING[3] },
  titulo: { fontFamily: FONTS.display, fontSize:26, color: COLORS.rojoBandera, marginBottom: SPACING[2] },
  subtitulo: { fontFamily: FONTS.body, fontSize:15, color: COLORS.textMuted, textAlign:'center', lineHeight:22, marginBottom: SPACING[6] },
  fotosRow: { flexDirection:'row', alignItems:'center', gap: SPACING[4], marginBottom: SPACING[8] },
  foto: { width:80, height:80, borderRadius: RADIUS.full, borderWidth:3, borderColor: COLORS.rojoBandera },
  btnChatear: { backgroundColor: COLORS.rojoBandera, borderRadius: RADIUS.full, paddingVertical: SPACING[4], paddingHorizontal: SPACING[8], marginBottom: SPACING[3], width:'100%', alignItems:'center' },
  btnChatearText: { fontFamily: FONTS.bodyBold, color: COLORS.textInverse, fontSize:16 },
  btnCerrar: { paddingVertical: SPACING[2] },
  btnCerrarText: { fontFamily: FONTS.body, color: COLORS.textMuted, fontSize:14 },
});