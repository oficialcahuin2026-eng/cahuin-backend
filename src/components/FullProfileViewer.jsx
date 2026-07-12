import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../utils/theme';
import { Audio } from 'expo-av';
import { emojiCompatibilidad } from '../hooks/useCompatibilidad';

const { width } = Dimensions.get('window');

export default function FullProfileViewer({ perfil, isPreview = false, compatibilidad = null, children }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundToPlay, setSoundToPlay] = useState(null);

  if (!perfil) return null;

  // Unificamos las fotos: si hay array de fotos lo usamos, sino usamos la principal
  let fotos = [];
  if (perfil.fotos && perfil.fotos.length > 0) {
    fotos = perfil.fotos;
  } else if (perfil.foto) {
    fotos = [perfil.foto];
  } else {
    fotos = [`https://picsum.photos/seed/${perfil._id || '1'}/400/500`];
  }

  const onScroll = (e) => {
    const slideSize = e.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(e.nativeEvent.contentOffset.x / slideSize);
    setActivePhoto(index);
  };

  const playAudio = async () => {
    if (isPlaying && soundToPlay) {
      await soundToPlay.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (soundToPlay) {
      await soundToPlay.playAsync();
      setIsPlaying(true);
      return;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: perfil.audioRompehielos });
      setSoundToPlay(sound);
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (e) {
      console.log('Error playing audio', e);
    }
  };

  const renderSectionTitle = (title) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderTag = (icon, text) => {
    if (!text || text === 'Por definir' || text === '') return null;
    return (
      <View style={styles.tag} key={text + icon}>
        {icon && <Text style={styles.tagIcon}>{icon}</Text>}
        <Text style={styles.tagText}>{text}</Text>
      </View>
    );
  };

  const renderCategorizedTags = (title, items) => {
    const validItems = items.filter(i => i.text && i.text !== 'Por definir' && i.text !== '');
    if (validItems.length === 0) return null;
    return (
      <View style={styles.section}>
        {renderSectionTitle(title)}
        <View style={styles.tagsContainer}>
          {validItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {renderTag(item.icon, item.text)}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  const habitos = perfil.habitos || {};
  const mapaValores = perfil.mapaValores || {};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Carrusel de Fotos */}
      <View style={styles.photoContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ width, height: width * 1.3 }}
        >
          {fotos.map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={{ width, height: width * 1.3 }} resizeMode="cover" />
          ))}
        </ScrollView>
        {/* Indicadores de fotos */}
        {fotos.length > 1 && (
          <View style={styles.pagination}>
            {fotos.map((_, idx) => (
              <View key={idx} style={[styles.dot, activePhoto === idx && styles.dotActive]} />
            ))}
          </View>
        )}
        {compatibilidad !== null && (
          <View style={styles.compatBadge}>
            <Text style={styles.compatText}>{compatibilidad}% {emojiCompatibilidad(compatibilidad)}</Text>
          </View>
        )}
        {perfil.verificado && (
          <View style={styles.verificadoBadge}>
            <Text style={styles.verificadoText}>🛡️ Verificado</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Info Básica */}
        <View style={styles.basicInfo}>
          <Text style={styles.nameAge}>{perfil.nombre}, {perfil.mostrarEdad !== false ? (perfil.edad || 18) : ''}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={COLORS.textMuted} />
            <Text style={styles.locationText}>{perfil.ciudad || perfil.region || 'Sin ubicación'}</Text>
          </View>
        </View>

        {(perfil.descripcion || perfil.bio || perfil.biografia) ? <Text style={styles.bio}>{perfil.descripcion || perfil.bio || perfil.biografia}</Text> : null}

        {/* Rompehielos (Prompts) */}
        {perfil.prompts && perfil.prompts.length > 0 && (
          <View style={styles.section}>
            {perfil.prompts.map((p, idx) => (
              <View key={idx} style={styles.promptCard}>
                <Text style={styles.promptQuestion}>{p.pregunta}</Text>
                <Text style={styles.promptAnswer}>{p.respuesta}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Audio Rompehielos */}
        {perfil.audioRompehielos ? (
          <View style={styles.section}>
            {renderSectionTitle('Mi Audio Rompehielos 🎤')}
            <TouchableOpacity style={styles.audioBtn} onPress={playAudio}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFF" />
              <Text style={styles.audioText}>{isPlaying ? 'Pausar audio' : 'Escuchar audio'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Identidad y Relación */}
        {renderCategorizedTags('Identidad y Relación', [
          { icon: '👁️', text: perfil.queBuscas },
          { icon: '👶', text: mapaValores.planesHijos },
          { icon: '👤', text: perfil.pronombres },
          { icon: '⚧️', text: perfil.mostrarGenero !== false ? perfil.genero : null },
          { icon: '🏳️‍🌈', text: perfil.mostrarOrientacion !== false ? perfil.orientacionSexual : null }
        ])}

        {/* Acerca de mí */}
        {renderCategorizedTags('Acerca de mí', [
          { icon: '📏', text: perfil.altura },
          { icon: '🗣️', text: Array.isArray(perfil.idiomas) ? perfil.idiomas.join(', ') : perfil.idiomas },
          { icon: '🎓', text: perfil.centroEstudios },
          { icon: '💼', text: perfil.trabajo },
          { icon: '♈', text: perfil.zodiaco }
        ])}

        {/* Estilo de Vida */}
        {renderCategorizedTags('Estilo de Vida', [
          { icon: '🐾', text: habitos.mascotas },
          { icon: '🍻', text: habitos.beber },
          { icon: '🚬', text: habitos.fumar },
          { icon: '💪', text: habitos.ejercicio },
          { icon: '🥗', text: habitos.alimentacion },
          { icon: '📱', text: habitos.redesSociales },
          { icon: '😴', text: habitos.habitosSueno },
          { icon: '🎉', text: habitos.carrete },
          { icon: '✈️', text: habitos.vacaciones },
          { icon: '🚗', text: habitos.transporte }
        ])}

        {/* Personalidad y Valores */}
        {renderCategorizedTags('Más sobre mí', [
          { icon: '🧠', text: perfil.personalidad },
          { icon: '💬', text: perfil.estiloComunicacion },
          { icon: '💝', text: perfil.recibirAmor }
        ])}

        {/* Intereses Generales */}
        {perfil.intereses && perfil.intereses.length > 0 && renderCategorizedTags('Intereses', perfil.intereses.map(i => ({ icon: '✨', text: i })))}
        
        {/* Hobbies */}
        {perfil.hobbies && perfil.hobbies.length > 0 && renderCategorizedTags('Hobbies', perfil.hobbies.map(h => typeof h === 'string' ? { icon: '🎯', text: h } : { icon: h.icon, text: h.nombre }))}

        {/* Favoritos: Películas, Series, Juegos */}
        {['peliculasFavoritas', 'seriesFavoritas', 'juegosFavoritos'].map(campo => {
          if (!perfil[campo] || perfil[campo].length === 0) return null;
          const titulos = { peliculasFavoritas: 'Películas Favoritas', seriesFavoritas: 'Series Favoritas', juegosFavoritos: 'Juegos Favoritos' };
          return (
            <View style={styles.section} key={campo}>
              {renderSectionTitle(titulos[campo])}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SPACING[4] }} contentContainerStyle={{ paddingHorizontal: SPACING[4], gap: SPACING[3] }}>
                {perfil[campo].map((item, idx) => (
                  <View key={idx} style={styles.mediaCard}>
                    <Image source={{ uri: item.poster || item.foto }} style={styles.mediaImage} />
                  </View>
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* Música: Artistas y Canción */}
        {perfil.cancion && (
          <View style={styles.section}>
            {renderSectionTitle('Mi Himno Musical')}
            <View style={styles.songCard}>
              <Image source={{ uri: perfil.cancion.foto }} style={styles.songImage} />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{perfil.cancion.nombre}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{perfil.cancion.artista}</Text>
              </View>
            </View>
          </View>
        )}

        {perfil.artistasSpotify && perfil.artistasSpotify.length > 0 && (
          <View style={styles.section}>
            {renderSectionTitle('Mis Artistas Favoritos')}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SPACING[4] }} contentContainerStyle={{ paddingHorizontal: SPACING[4], gap: SPACING[3] }}>
              {perfil.artistasSpotify.map((artista, idx) => (
                <View key={idx} style={styles.artistCard}>
                  <Image source={{ uri: artista.foto }} style={styles.artistImage} />
                  <Text style={styles.artistName} numberOfLines={1}>{artista.nombre}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {children}

        {/* Espacio final para que los botones flotantes no tapen nada */}
        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  photoContainer: { width: '100%', backgroundColor: '#000' },
  pagination: { flexDirection: 'row', position: 'absolute', top: 15, alignSelf: 'center', gap: 6, zIndex: 10 },
  dot: { width: width / 6, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFF' },
  compatBadge: { position: 'absolute', bottom: 30, right: 20, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  compatText: { color: '#FFF', fontFamily: FONTS.bodyBold, fontSize: 14 },
  verificadoBadge: { position: 'absolute', bottom: 30, left: 20, backgroundColor: COLORS.like, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  verificadoText: { color: '#FFF', fontFamily: FONTS.bodyBold, fontSize: 12 },
  
  content: { padding: SPACING[4], backgroundColor: COLORS.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  basicInfo: { marginBottom: SPACING[3] },
  nameAge: { fontFamily: FONTS.display, fontSize: 32, color: COLORS.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.textMuted, marginLeft: 4 },
  bio: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.textPrimary, marginBottom: SPACING[5], lineHeight: 24 },
  
  section: { marginBottom: SPACING[5] },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 20, color: COLORS.textPrimary, marginBottom: SPACING[3] },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tarjeta, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  tagIcon: { marginRight: 6, fontSize: 14 },
  tagText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textPrimary },
  
  promptCard: { backgroundColor: COLORS.tarjeta, padding: SPACING[4], borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING[3], ...SHADOWS.small },
  promptQuestion: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.textMuted, marginBottom: 8 },
  promptAnswer: { fontFamily: FONTS.display, fontSize: 22, color: COLORS.textPrimary },
  
  audioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primario, padding: SPACING[4], borderRadius: RADIUS.lg, gap: 8 },
  audioText: { fontFamily: FONTS.bodyBold, fontSize: 16, color: '#FFF' },
  
  mediaCard: { width: 100, height: 140, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.border },
  mediaImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  artistCard: { width: 80, alignItems: 'center', gap: 4 },
  artistImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.border },
  artistName: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.textPrimary, textAlign: 'center' },
  
  songCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tarjeta, padding: SPACING[3], borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  songImage: { width: 60, height: 60, borderRadius: RADIUS.md, marginRight: SPACING[3] },
  songInfo: { flex: 1 },
  songTitle: { fontFamily: FONTS.bodyBold, fontSize: 16, color: COLORS.textPrimary },
  songArtist: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
});
