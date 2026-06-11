import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { socialService } from '../services/api';
import CahuinTextField from '../components/CahuinTextField';
import CahuinModal from '../components/CahuinModal';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

const fallbackStory = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000';

export default function HistoriasCulturalesScreen({ navigation }) {
  const { COLORS } = useTheme();
  const { usuario } = useAuth();
  const styles = getStyles(COLORS);
  const [historias, setHistorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [modal, setModal] = useState(false);
  const [comentando, setComentando] = useState(null);
  const [textoComentario, setTextoComentario] = useState('');
  const [texto, setTexto] = useState('');
  const [lugar, setLugar] = useState('');
  const [imagen, setImagen] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await socialService.listarHistorias();
      setHistorias(data.historias || []);
    } catch (error) {
      setHistorias([]);
    } finally {
      setCargando(false);
    }
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      setModalInfo({
        title: 'Fotos',
        message: 'Necesitamos permiso para elegir una foto.',
        emoji: '📸',
        accent: COLORS.primario,
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImagen({
        uri: asset.uri,
        name: asset.fileName || 'historia.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
    }
  };

  const publicar = async () => {
    if (!texto.trim()) {
      setModalInfo({
        title: 'Historia',
        message: 'Escribe algo para publicar.',
        emoji: '📸',
        accent: COLORS.primario,
      });
      return;
    }
    try {
      setPublicando(true);
      await socialService.crearHistoria({ texto, lugar, emoji: '📸', imagen });
      setTexto('');
      setLugar('');
      setImagen(null);
      setModal(false);
      cargar();
    } catch (error) {
      const historiaLocal = {
        _id: `local-${Date.now()}`,
        texto: texto.trim(),
        lugar,
        imagen: imagen?.uri || '',
        region: usuario?.region || 'Chile',
        ciudad: usuario?.ciudad || '',
        autor: { nombre: usuario?.nombre || 'Tu historia', foto: usuario?.foto, ciudad: usuario?.ciudad, region: usuario?.region },
        reacciones: [],
        comentarios: [],
        sumados: [],
        meGusta: false,
      };
      setHistorias((prev) => [historiaLocal, ...prev]);
      setTexto('');
      setLugar('');
      setImagen(null);
      setModal(false);
      setModalInfo({
        title: 'Historia en pruebas',
        message: 'La dejamos visible en esta sesión, pero el servidor no respondió.',
        emoji: '📸',
        accent: COLORS.primario,
      });
    } finally {
      setPublicando(false);
    }
  };

  const reaccionar = async (id) => {
    setHistorias((prev) => prev.map((item) => {
      if (item._id !== id) return item;
      const meGusta = !item.meGusta;
      const reacciones = meGusta ? [...(item.reacciones || []), 'yo'] : (item.reacciones || []).slice(0, -1);
      return { ...item, meGusta, reacciones };
    }));
    if (String(id).startsWith('local-')) return;
    try {
      await socialService.reaccionarHistoria(id);
    } catch (error) {
      console.log('No se pudo sincronizar reaccion:', error.message);
    }
  };

  const comentar = async () => {
    if (!comentando || !textoComentario.trim()) return;
    const comentarioLocal = {
      _id: `comment-${Date.now()}`,
      texto: textoComentario.trim(),
      autor: { nombre: usuario?.nombre || 'Tu' },
      fecha: new Date().toISOString(),
    };
    setHistorias((prev) => prev.map((item) => (
      item._id === comentando._id
        ? { ...item, comentarios: [...(item.comentarios || []), comentarioLocal] }
        : item
    )));
    setTextoComentario('');
    setComentando(null);
    if (String(comentando._id).startsWith('local-')) return;
    try {
      await socialService.comentarHistoria(comentando._id, comentarioLocal.texto);
      cargar();
    } catch (error) {
      console.log('No se pudo sincronizar comentario:', error.message);
    }
  };

  const sumarse = async (id) => {
    try {
      await socialService.sumarseHistoria(id);
      cargar();
      setModalInfo({
        title: 'Listo',
        message: 'Te sumaste. Si se arma algo, ya quedaste en la lista.',
        emoji: '✨',
        accent: COLORS.primario,
      });
    } catch (error) {
      setModalInfo({
        title: 'Historia',
        message: error.message || 'No pudimos sumarte.',
        emoji: '🌶️',
        tone: 'danger',
      });
    }
  };

  const renderHistoria = ({ item }) => {
    const foto = item.imagen || fallbackStory;
    const likes = item.reacciones?.length || 0;
    const comentarios = item.comentarios || [];

    return (
      <View style={styles.storyShell}>
        <ImageBackground source={{ uri: foto }} style={styles.storyImage} imageStyle={styles.storyImageRadius}>
          <LinearGradient colors={['rgba(8,13,26,0.10)', 'rgba(8,13,26,0.72)']} style={styles.storyOverlay}>
            <View style={styles.storyTop}>
              <Image source={{ uri: item.autor?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.storyAuthor}>{item.autor?.nombre || 'Cahuinero'}</Text>
                <Text style={styles.storyPlace}>{item.lugar || item.autor?.ciudad || item.ciudad || 'Cerca tuyo'} · 24h</Text>
              </View>
              <View style={styles.regionPill}>
                <Text style={styles.regionPillText}>{item.region || item.autor?.region || 'Chile'}</Text>
              </View>
            </View>
            <Text style={styles.storyText}>{item.texto}</Text>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.storyAction} onPress={() => reaccionar(item._id)}>
            <Ionicons name={item.meGusta ? 'heart' : 'heart-outline'} size={24} color={item.meGusta ? COLORS.primario : COLORS.textPrimary} />
            <Text style={styles.actionText}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.storyAction} onPress={() => setComentando(item)}>
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.textPrimary} />
            <Text style={styles.actionText}>{comentarios.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinButton} onPress={() => sumarse(item._id)}>
            <Ionicons name="sparkles" size={17} color={COLORS.primario} />
            <Text style={styles.joinText}>Me sumo</Text>
          </TouchableOpacity>
        </View>

        {comentarios.slice(-2).map((comentario) => (
          <Text key={comentario._id || `${comentario.autor?._id}-${comentario.fecha}`} style={styles.commentPreview}>
            <Text style={styles.commentName}>{comentario.autor?.nombre || 'Alguien'}: </Text>
            {comentario.texto}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#FFF5F1', COLORS.bg]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Historias culturales</Text>
        <Text style={styles.subtitle}>Sube una foto o momento de tu región. Dura 24 horas, se puede reaccionar y comentar.</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setModal(true)}>
          <Ionicons name="camera" size={21} color="#FFF" />
          <Text style={styles.createText}>Subir historia</Text>
        </TouchableOpacity>
      </LinearGradient>

      {cargando ? <ActivityIndicator color={COLORS.primario} style={{ marginTop: 30 }} /> : (
        <FlatList
          data={historias}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={renderHistoria}
          ListEmptyComponent={<Text style={styles.empty}>Todavía no hay historias cerca. Publica la primera.</Text>}
        />
      )}

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva historia</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoPicker} onPress={elegirFoto}>
              {imagen ? (
                <Image source={{ uri: imagen.uri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Ionicons name="image" size={30} color={COLORS.primario} />
                  <Text style={styles.photoText}>Agregar foto</Text>
                </>
              )}
            </TouchableOpacity>

            <CahuinTextField
              icon="camera-outline"
              value={texto}
              onChangeText={setTexto}
              placeholder="Ej: Estoy en la feria, ¿quién apaña?"
              multiline
              variant="textarea"
            />
            <CahuinTextField
              icon="location-outline"
              containerStyle={{ marginTop: SPACING[3] }}
              value={lugar}
              onChangeText={setLugar}
              placeholder="Lugar o panorama"
            />
            <TouchableOpacity style={styles.publish} onPress={publicar} disabled={publicando}>
              {publicando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishText}>Publicar por 24h</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!comentando} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comentarios</Text>
              <TouchableOpacity onPress={() => setComentando(null)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            {(comentando?.comentarios || []).map((comentario) => (
              <View key={comentario._id || comentario.fecha} style={styles.commentRow}>
                <Text style={styles.commentName}>{comentario.autor?.nombre || 'Alguien'}</Text>
                <Text style={styles.commentText}>{comentario.texto}</Text>
              </View>
            ))}
            {(comentando?.comentarios || []).length === 0 ? <Text style={styles.emptyComments}>Sé el primer comentario.</Text> : null}
            <View style={styles.commentInputRow}>
              <CahuinTextField
                icon="chatbubble-outline"
                containerStyle={{ flex: 1 }}
                value={textoComentario}
                onChangeText={setTextoComentario}
                placeholder="Comentar..."
              />
              <TouchableOpacity style={styles.commentSend} onPress={comentar}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CahuinModal
        visible={!!modalInfo}
        title={modalInfo?.title}
        message={modalInfo?.message}
        emoji={modalInfo?.emoji}
        accent={modalInfo?.accent}
        tone={modalInfo?.tone}
        onClose={() => setModalInfo(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING[5], borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...SHADOWS.light },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.tarjeta, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[4] },
  title: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '900', fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 8 },
  createButton: { marginTop: SPACING[4], alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primario, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 24 },
  createText: { color: '#FFF', fontWeight: '900' },
  list: { padding: SPACING[4], paddingBottom: 120 },
  storyShell: { backgroundColor: COLORS.tarjeta, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING[5], overflow: 'hidden', ...SHADOWS.light },
  storyImage: { minHeight: 420 },
  storyImageRadius: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  storyOverlay: { flex: 1, justifyContent: 'space-between', padding: SPACING[4] },
  storyTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#FFF' },
  storyAuthor: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  storyPlace: { color: 'rgba(255,255,255,0.84)', marginTop: 2, fontSize: 12, fontWeight: '700' },
  regionPill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  regionPillText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  storyText: { color: '#FFF', fontSize: 24, lineHeight: 31, fontWeight: '900', fontFamily: FONTS.display },
  actionBar: { flexDirection: 'row', alignItems: 'center', padding: SPACING[3], gap: SPACING[3] },
  storyAction: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 42, paddingHorizontal: 10 },
  actionText: { color: COLORS.textPrimary, fontWeight: '900' },
  joinButton: { marginLeft: 'auto', minHeight: 42, borderRadius: 21, borderWidth: 1, borderColor: COLORS.primario, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  joinText: { color: COLORS.primario, fontWeight: '900' },
  commentPreview: { color: COLORS.textMuted, paddingHorizontal: SPACING[4], paddingBottom: SPACING[2], fontSize: 13, lineHeight: 19 },
  commentName: { color: COLORS.textPrimary, fontWeight: '900' },
  empty: { color: COLORS.textMuted, textAlign: 'center', marginTop: 50, fontSize: 16 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.58)' },
  modalCard: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING[5], maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[4] },
  modalTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  photoPicker: { height: 180, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.fondo, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[3], overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%' },
  photoText: { color: COLORS.primario, fontWeight: '900', marginTop: 8 },
  input: { minHeight: 110, borderRadius: 20, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, padding: SPACING[4], textAlignVertical: 'top', fontSize: 16 },
  inputSmall: { marginTop: SPACING[3], minHeight: 54, borderRadius: 18, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, color: COLORS.textPrimary, paddingHorizontal: SPACING[4], fontSize: 16 },
  publish: { minHeight: 54, borderRadius: 20, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center', marginTop: SPACING[4] },
  publishText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  commentRow: { borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[3], backgroundColor: COLORS.fondo, marginBottom: SPACING[2] },
  commentText: { color: COLORS.textMuted, marginTop: 3, lineHeight: 20 },
  emptyComments: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING[5] },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2], marginTop: SPACING[3] },
  commentInput: { flex: 1, minHeight: 50, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.fondo, color: COLORS.textPrimary, paddingHorizontal: SPACING[4] },
  commentSend: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center' },
});
