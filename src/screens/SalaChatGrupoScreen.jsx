import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, Alert, Modal, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import CahuinModal from '../components/CahuinModal';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { panoramaService } from '../services/api';

export default function SalaChatGrupoScreen({ route, navigation }) {
  const { panorama: initialPanorama } = route.params;
  const [panorama, setPanorama] = useState(initialPanorama);
  const [mensajes, setMensajes] = useState(initialPanorama.mensajesGrupo || []);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [showGestion, setShowGestion] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [grabacionUri, setGrabacionUri] = useState(null);
  const [soundToPlay, setSoundToPlay] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const flatListRef = useRef(null);
  
  const { usuario } = useAuth();
  const { COLORS } = useTheme();
  const [modalInfo, setModalInfo] = useState(null);
  const avisar = (title, message, extra = {}) => setModalInfo({ title, message, ...extra });
  const styles = getStyles(COLORS);
  
  const isCreador = panorama.creador?._id === usuario?._id;

  useEffect(() => {
    cargarPanorama();
    const interval = setInterval(cargarPanorama, 3000);
    return () => clearInterval(interval);
  }, []);

  const cargarPanorama = async () => {
    try {
      const res = await panoramaService.obtener(panorama._id);
      setPanorama(res.panorama);
      setMensajes(res.panorama.mensajesGrupo || []);
    } catch (error) {
      console.log('Error recargando chat de grupo', error);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
        Vibration.vibrate(50);
      } else { Alert.alert('Permisos', 'Necesitamos acceso al micrófono.'); }
    } catch (err) {}
  };
  
  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setGrabacionUri(uri);
    } catch (err) {}
  };
  
  const playAudio = async (uri, id) => {
    try {
      if (soundToPlay) await soundToPlay.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSoundToPlay(sound);
      setCurrentPlayingId(id);
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) { setIsPlaying(false); setCurrentPlayingId(null); }
      });
    } catch (err) {}
  };
  
  const stopAudio = async () => {
    if (soundToPlay) {
      await soundToPlay.stopAsync();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  };

  const handleGestion = async (usuarioId, accion) => {
    try {
      const res = await panoramaService.gestionarSolicitud(panorama._id, usuarioId, accion);
      setPanorama(res.panorama);
      setMensajes(res.panorama.mensajesGrupo || []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
    }
  };

  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() && !grabacionUri) return;
    const txt = nuevoMensaje;
    setNuevoMensaje('');
    const uriAudio = grabacionUri;
    setGrabacionUri(null);
    
    // Optimistic update
    const tempMsg = {
      _id: Date.now().toString(),
      remitente: { _id: usuario._id, nombre: usuario.nombre },
      texto: txt || '🎤 Nota de voz',
      audioUrl: uriAudio,
      tipo: 'texto'
    };
    setMensajes(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await panoramaService.enviarMensaje(panorama._id, txt || '🎤 Nota de voz', uriAudio);
      const res = await panoramaService.obtener(panorama._id);
      setMensajes(res.panorama.mensajesGrupo || []);
    } catch (error) {
      console.log('Error enviando:', error);
    }
  };

  const abandonar = async () => {
    avisar('¿Seguro?', isCreador ? '¿Eliminar este panorama?' : '¿Abandonar este panorama?', {
      emoji: '🗑️',
      tone: 'danger',
      actions: [
        { label: 'Cancelar', variant: 'secondary', color: COLORS.primario, onPress: () => {} },
        { 
          label: isCreador ? 'Eliminar' : 'Abandonar', 
          color: '#F0444F', 
          onPress: async () => {
            await panoramaService.abandonar(panorama._id);
            navigation.goBack();
          }
        }
      ]
    });
  };

  const renderMensaje = ({ item, index }) => {
    const isMe = item.remitente?._id === usuario?._id || item.remitente === usuario?._id;
    const isSistema = item.tipo === 'sistema';
    
    if (item.audioUrl) {
      const isThisPlaying = isPlaying && currentPlayingId === item._id;
      return (
        <View style={[styles.msgWrapper, isMe ? styles.msgWrapperRight : styles.msgWrapperLeft, { marginTop: 12 }]}>
          {!isMe && <Text style={styles.senderName}>{item.remitente?.nombre || 'Usuario'}</Text>}
          <View style={[styles.msgBurbuja, isMe ? styles.msgPropio : styles.msgOtro]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 120 }}>
              <TouchableOpacity onPress={() => isThisPlaying ? stopAudio() : playAudio(item.audioUrl, item._id)} style={styles.btnPlay}>
                <Ionicons name={isThisPlaying ? "pause" : "play"} size={20} color={isMe ? '#FFF' : COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={{ marginLeft: 10, flex: 1, height: 4, backgroundColor: isMe ? 'rgba(255,255,255,0.3)' : COLORS.border, borderRadius: 2 }}>
                {isThisPlaying && <View style={{ width: '50%', height: '100%', backgroundColor: isMe ? '#FFF' : COLORS.primario, borderRadius: 2 }} />}
              </View>
            </View>
          </View>
        </View>
      );
    }
    
    if (isSistema) {
      return (
        <View style={styles.sistemaCont}>
          <Text style={styles.sistemaText}>{item.texto}</Text>
        </View>
      );
    }

    const prev = index > 0 ? mensajes[index - 1] : null;
    const isSameSender = prev && prev.remitente?._id === item.remitente?._id;

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperRight : styles.msgWrapperLeft, { marginTop: isSameSender ? 4 : 12 }]}>
        {!isMe && !isSameSender && (
          <Text style={styles.senderName}>{item.remitente?.nombre || 'Usuario'}</Text>
        )}
        <View style={[styles.msgBurbuja, isMe ? styles.msgPropio : styles.msgOtro]}>
          <Text style={[styles.msgTexto, isMe && { color: '#FFF' }]}>{item.texto}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Image source={{ uri: panorama.imagen || panorama.creador?.foto || 'https://via.placeholder.com/150' }} style={styles.avatarHeader} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{panorama.titulo}</Text>
            <Text style={styles.headerSubtitle}>{panorama.participantes?.length || 0} personas</Text>
          </View>
        </View>
        
        {isCreador && panorama.solicitudes?.length > 0 && (
          <TouchableOpacity style={styles.gestionBtn} onPress={() => setShowGestion(true)}>
            <Ionicons name="people" size={20} color="#FFF" />
            <View style={styles.badge}><Text style={styles.badgeText}>{panorama.solicitudes.length}</Text></View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.menuBtn} onPress={abandonar}>
          <Ionicons name={isCreador ? "trash-outline" : "exit-outline"} size={24} color="#F0444F" />
        </TouchableOpacity>
      </View>

      {/* Modal Gestion */}
      <Modal visible={showGestion} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Solicitudes</Text>
              <TouchableOpacity onPress={() => setShowGestion(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={panorama.solicitudes}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <View style={styles.solicitudRow}>
                  <Image source={{ uri: item.foto || 'https://via.placeholder.com/150' }} style={styles.solicitudFoto} />
                  <Text style={[styles.solicitudNombre, { color: COLORS.textPrimary }]}>{item.nombre}</Text>
                  <View style={styles.accionesRow}>
                    <TouchableOpacity style={styles.btnRechazar} onPress={() => handleGestion(item._id, 'rechazar')}>
                      <Ionicons name="close" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnAceptar} onPress={() => handleGestion(item._id, 'aceptar')}>
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: 20 }}>No hay solicitudes pendientes.</Text>}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}>
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={item => item._id?.toString() || Math.random().toString()}
          renderItem={renderMensaje}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputArea}>
          {grabacionUri ? (
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6', borderWidth: 1 }]}>
              <Ionicons name="mic" size={24} color="#3B82F6" style={{ marginRight: 10 }} />
              <Text style={{ flex: 1, color: '#3B82F6', fontWeight: 'bold' }}>Nota de voz grabada</Text>
              <TouchableOpacity onPress={() => setGrabacionUri(null)}><Ionicons name="trash" size={24} color="#EF4444" /></TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Escribe al grupo..."
              placeholderTextColor={COLORS.textMuted}
              value={nuevoMensaje}
              onChangeText={setNuevoMensaje}
              multiline
            />
          )}
          <TouchableOpacity
            style={styles.btnVoice}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Ionicons name="mic" size={24} color={isRecording ? "#F0444F" : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendBtn, (!nuevoMensaje.trim() && !grabacionUri) && { opacity: 0.5 }]} 
            onPress={handleEnviar}
            disabled={!nuevoMensaje.trim() && !grabacionUri}
          >
            <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <CahuinModal visible={!!modalInfo} {...modalInfo} onClose={() => setModalInfo(null)} />
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? 40 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: { marginRight: 12 },
  avatarHeader: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, fontFamily: FONTS.display },
  headerSubtitle: { fontSize: 14, color: COLORS.textMuted },
  menuBtn: { padding: 8 },
  
  lista: { padding: SPACING[4], paddingBottom: 20 },
  
  sistemaCont: {
    alignSelf: 'center',
    backgroundColor: COLORS.chipBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 12
  },
  sistemaText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
    textAlign: 'center'
  },
  
  msgWrapper: { maxWidth: '80%' },
  msgWrapperLeft: { alignSelf: 'flex-start' },
  msgWrapperRight: { alignSelf: 'flex-end' },
  senderName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 8,
    marginBottom: 4,
    fontFamily: FONTS.medium
  },
  msgBurbuja: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  msgOtro: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  msgPropio: {
    backgroundColor: COLORS.primario,
    borderBottomRightRadius: 4,
  },
  msgTexto: { fontSize: 16, color: COLORS.textPrimary },
  btnPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(150,150,150,0.2)', alignItems: 'center', justifyContent: 'center' },
  btnVoice: { padding: 8, justifyContent: 'center' },
  
  inputArea: {
    flexDirection: 'row',
    padding: SPACING[3],
    paddingBottom: Platform.OS === 'ios' ? 30 : SPACING[3],
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  gestionBtn: { marginRight: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#F0444F', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  solicitudRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  solicitudFoto: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  solicitudNombre: { flex: 1, fontSize: 16, fontWeight: '500' },
  accionesRow: { flexDirection: 'row', gap: 8 },
  btnRechazar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' },
  btnAceptar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' }
});
