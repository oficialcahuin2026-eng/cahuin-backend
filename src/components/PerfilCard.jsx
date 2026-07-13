import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme'; 
import useCompatibilidad, { emojiCompatibilidad } from '../hooks/useCompatibilidad';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function PerfilCard({ perfil, onLike, onPass, onSuperLike }) {
  const { usuario } = useAuth();
  const { calcular } = useCompatibilidad(usuario);
  const compatibilidad = calcular(perfil);
  const [fotoIndex, setFotoIndex] = useState(0);

  const fotos = perfil.fotos?.length > 0 ? perfil.fotos : [perfil.foto || `https://picsum.photos/seed/${perfil._id}/400/500`];

  // Unimos los intereses (nuestro modelo real) con los que pide el sistema de compatibilidad
  const etiquetas = perfil.intereses?.length > 0 ? perfil.intereses : (perfil.gastronomia || []);

  const changePhoto = (direction) => {
    Haptics.selectionAsync();
    if (direction === 'next' && fotoIndex < fotos.length - 1) {
      setFotoIndex(fotoIndex + 1);
    } else if (direction === 'prev' && fotoIndex > 0) {
      setFotoIndex(fotoIndex - 1);
    }
  };

  return (
    <View style={[styles.card, SHADOWS.medium, perfil.leDioSuperLike && styles.cardSuperLike]}> 
      <View style={styles.fotoContainer}>
        <Image source={{ uri: fotos[fotoIndex] }} style={styles.foto} resizeMode="cover" />
        
        {/* Barras de paginación */}
        {fotos.length > 1 && (
          <View style={styles.barrasContainer}>
            {fotos.map((_, i) => (
              <View key={i} style={[styles.barraFoto, { backgroundColor: i === fotoIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }]} />
            ))}
          </View>
        )}
        
        {/* Zonas táctiles invisibles para cambiar de foto */}
        <TouchableOpacity style={styles.zonaTactilIzq} onPress={() => changePhoto('prev')} activeOpacity={1} />
        <TouchableOpacity style={styles.zonaTactilDer} onPress={() => changePhoto('next')} activeOpacity={1} />
      </View>

      {perfil.verificado && (
        <View style={styles.verificadoBadge}>
          <Text style={styles.verificadoText}>🛡️ Verificado</Text>
        </View>
      )}

      <View style={styles.compatBadge}>
        <Text style={styles.compatText}>{compatibilidad}% {emojiCompatibilidad(compatibilidad)}</Text>
      </View>

      <View style={styles.infoContainer}>
        {perfil.leDioSuperLike && (
          <View style={styles.superLikeBanner}>
            <Text style={styles.superLikeBannerText}>⭐ ¡Este cahuín te tiró un Súper Like! Está súper interesadx en ti.</Text>
          </View>
        )}
        <View style={styles.nombreRow}>
          <Text style={styles.nombre}>{perfil.nombre}</Text>
          <Text style={styles.region}>📍 {perfil.ciudad || perfil.region}</Text>
        </View>
        {perfil.bio ? <Text style={styles.bio} numberOfLines={2}>{perfil.bio}</Text> : null}
        <View style={styles.tagsRow}>
          {etiquetas.slice(0,3).map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>✨ {tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.accionesRow}>
        <TouchableOpacity style={styles.btnPass} onPress={() => onPass(perfil._id)}>
          <Text style={{ fontSize: 22 }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSuperLike} onPress={() => onSuperLike(perfil._id)}>
          <Text style={{ fontSize: 20 }}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLike} onPress={() => onLike(perfil._id)}>
          <Text style={{ fontSize: 22 }}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 3. Corregido: Traducimos todos los colores inventados a los que realmente existen
const styles = StyleSheet.create({
  card: { width:'92%', borderRadius: RADIUS['2xl'], backgroundColor: COLORS.tarjeta, overflow:'hidden', alignSelf:'center', borderWidth: 2, borderColor: 'transparent' },
  cardSuperLike: { borderColor: COLORS.superlike, shadowColor: COLORS.superlike, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  fotoContainer: { width: '100%', height: 420 },
  foto: { width:'100%', height: '100%' },
  barrasContainer: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', gap: 4, zIndex: 5 },
  barraFoto: { flex: 1, height: 4, borderRadius: 2 },
  zonaTactilIzq: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', zIndex: 4 },
  zonaTactilDer: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '60%', zIndex: 4 },
  verificadoBadge: { position:'absolute', top: SPACING[6], left: SPACING[4], backgroundColor: COLORS.like, borderRadius: 50, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1], zIndex: 5 },
  verificadoText: { color:'#fff', fontSize:11, fontFamily: FONTS.bodyBold },
  compatBadge: { position:'absolute', top: SPACING[6], right: SPACING[4], backgroundColor:'rgba(0,0,0,0.65)', borderRadius: 50, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1], zIndex: 5 },
  compatText: { color:'#fff', fontSize:11, fontFamily: FONTS.bodyBold },
  infoContainer: { padding: SPACING[5], paddingBottom: SPACING[2] },
  superLikeBanner: { backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: SPACING[2], borderRadius: RADIUS.md, marginBottom: SPACING[3], borderWidth: 1, borderColor: COLORS.superlike },
  superLikeBannerText: { color: COLORS.superlike, fontSize: 13, fontFamily: FONTS.bodyBold, textAlign: 'center' },
  nombreRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'baseline', marginBottom: SPACING[2] },
  nombre: { fontFamily: FONTS.display, fontSize:22, color: COLORS.textPrimary },
  region: { fontFamily: FONTS.body, fontSize:13, color: COLORS.textMuted },
  bio: { fontFamily: FONTS.body, fontSize:14, color: COLORS.textMuted, marginBottom: SPACING[3] },
  tagsRow: { flexDirection:'row', flexWrap:'wrap', gap: SPACING[2], marginBottom: SPACING[3] },
  tag: { backgroundColor: '#FFEBEE', borderRadius: 50, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1] }, 
  tagText: { fontSize:11, fontFamily: FONTS.body, color: COLORS.textPrimary },
  accionesRow: { flexDirection:'row', justifyContent:'center', alignItems:'center', gap: SPACING[6], paddingVertical: SPACING[5] },
  btnPass: { width:56, height:56, borderRadius: 50, backgroundColor: COLORS.fondo, borderWidth:1, borderColor: COLORS.gris, justifyContent:'center', alignItems:'center' },
  btnSuperLike: { width:48, height:48, borderRadius: 50, backgroundColor: '#E0F7FA', borderWidth:1, borderColor: COLORS.superlike, justifyContent:'center', alignItems:'center' },
  btnLike: { width:56, height:56, borderRadius: 50, backgroundColor: COLORS.primario, justifyContent:'center', alignItems:'center' },
});