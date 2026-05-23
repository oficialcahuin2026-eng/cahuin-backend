import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
// 1. Corregido: Importamos SHADOWS (con S)
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme'; 
import useCompatibilidad, { emojiCompatibilidad } from '../hooks/useCompatibilidad';
import { useAuth } from '../context/AuthContext';

export default function PerfilCard({ perfil, onLike, onPass, onSuperLike }) {
  const { usuario } = useAuth();
  const { calcular } = useCompatibilidad(usuario);
  const compatibilidad = calcular(perfil);

  // Unimos los intereses (nuestro modelo real) con los que pide el sistema de compatibilidad
  const etiquetas = perfil.intereses?.length > 0 ? perfil.intereses : (perfil.gastronomia || []);

  return (
    // 2. Corregido: Usamos SHADOWS.medium que sí existe
    <View style={[styles.card, SHADOWS.medium]}> 
      <Image source={{ uri: perfil.foto || `https://picsum.photos/seed/${perfil._id}/400/500` }}
        style={styles.foto} resizeMode="cover" />

      {perfil.verificado && (
        <View style={styles.verificadoBadge}>
          <Text style={styles.verificadoText}>🛡️ Verificado</Text>
        </View>
      )}

      <View style={styles.compatBadge}>
        <Text style={styles.compatText}>{compatibilidad}% {emojiCompatibilidad(compatibilidad)}</Text>
      </View>

      <View style={styles.infoContainer}>
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
  card: { width:'92%', borderRadius: RADIUS['2xl'], backgroundColor: COLORS.tarjeta, overflow:'hidden', alignSelf:'center' },
  foto: { width:'100%', height: 420 },
  verificadoBadge: { position:'absolute', top: SPACING[4], left: SPACING[4], backgroundColor: COLORS.like, borderRadius: 50, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1] },
  verificadoText: { color:'#fff', fontSize:11, fontFamily: FONTS.bodyBold },
  compatBadge: { position:'absolute', top: SPACING[4], right: SPACING[4], backgroundColor:'rgba(0,0,0,0.65)', borderRadius: 50, paddingHorizontal: SPACING[3], paddingVertical: SPACING[1] },
  compatText: { color:'#fff', fontSize:11, fontFamily: FONTS.bodyBold },
  infoContainer: { padding: SPACING[5], paddingBottom: SPACING[2] },
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