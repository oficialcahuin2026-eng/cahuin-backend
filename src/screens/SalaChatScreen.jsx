import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image, Vibration, Modal, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import io from 'socket.io-client';

import CitaSeguraModal from '../components/CitaSeguraModal'; 
import CahuinModal from '../components/CahuinModal';
import CahuinTextField from '../components/CahuinTextField';
import { mensajeService, userService, iaService, matchService } from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const KARAOKE_SONGS = [
  { artista: 'Los Prisioneros', cancion: 'Tren al sur', parte: 'uno canta la estrofa y el otro responde el coro' },
  { artista: 'Mon Laferte', cancion: 'Tu falta de querer', parte: 'uno parte suave y el otro remata con drama bonito' },
  { artista: 'Chico Trujillo', cancion: 'Loca', parte: 'ambos hacen el coro, sin vergüenza' },
  { artista: 'Los Bunkers', cancion: 'Bailando solo', parte: 'uno pregunta y el otro contesta con el coro' },
];

const PREGUNTAS_MADRUGADA = [
  '¿Qué cosa te da calma cuando todo está raro?',
  '¿Cuál fue la última decisión que te cambió un poquito?',
  '¿Qué canción te pega distinto de noche?',
  '¿Qué miedo te gustaría que alguien entendiera sin juzgarte?',
  '¿Qué parte de ti aparece solo cuando hay confianza?',
];

export default function SalaChatScreen({ route, navigation }) {
  const { matchId, usuario: otroUsuario, compatibilidad, elYaRespondio } = route.params;
  const { usuario: miUsuario } = useAuth();
  
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS);
  const esMadrugada = new Date().getHours() >= 0 && new Date().getHours() < 5;

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [modalCahuin, setModalCahuin] = useState(null);
  
  const [modalSeguridadVisible, setModalSeguridadVisible] = useState(false); 
  const [modalCalificarVisible, setModalCalificarVisible] = useState(false);
  const [ratingSeleccionado, setRatingSeleccionado] = useState(0);
  const [enviandoRating, setEnviandoRating] = useState(false);

  const [energiaChat, setEnergiaChat] = useState({ emoji: '❄️', estado: 'fría', nivel: 0 });
  const [modalWingmanVisible, setModalWingmanVisible] = useState(false);
  const [consejoWingman, setConsejoWingman] = useState(null);
  const [cargandoWingman, setCargandoWingman] = useState(false);

  const [modalDiarioVisible, setModalDiarioVisible] = useState(false);
  const [notasDiario, setNotasDiario] = useState([]);
  const [textoNota, setTextoNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);

  // 🌟 NUEVO ESTADO PARA EL CALENDARIO
  const [modalFechasVisible, setModalFechasVisible] = useState(false);

  const flatListRef = useRef();
  const socketRef = useRef(null);
  const piezasPuzzle = Math.min(9, Math.max(1, Math.floor((mensajes?.length || 0) / 10) + 1));

  const avisar = (title, message, emoji = '🌶️', actions = []) => setModalCahuin({ title, message, emoji, actions });

  useEffect(() => {
    cargarMensajesHistorial();

    // 🌟 RECUERDA: Si pruebas en casa, cambia esto por tu IP de render o local
    socketRef.current = io('http://192.168.1.13:5000');
    
    socketRef.current.emit('entrarSala', matchId);

    socketRef.current.on('recibirMensaje', (mensajeNuevo) => {
      setMensajes(prevMensajes => {
        if (prevMensajes.some(m => m._id === mensajeNuevo._id)) return prevMensajes;
        return [...prevMensajes, mensajeNuevo];
      });
      Vibration.vibrate([0, 100, 100]); 
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleRevelarse = async () => {
    try {
      const data = await matchService.revelarse(matchId);
      avisar('Ruleta Ciega 🎭', data.message, '🎭');
    } catch (error) { avisar('Error', 'No se pudo revelar la identidad.'); }
  };
  
  const cargarMensajesHistorial = async () => {
    try {
      const data = await mensajeService.listar(matchId);
      const mensajesNuevos = data.mensajes || [];
      setMensajes(mensajesNuevos);

      if (mensajesNuevos.length > 0) {
        const energiaData = await iaService.getEnergia(mensajesNuevos.slice(-10)); 
        setEnergiaChat(energiaData);
      }
    } catch (error) { console.log('Error:', error); }
  };

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    
    const textoMensaje = texto;
    setTexto(''); // Limpiamos la cajita al instante

    try { 
      const data = await mensajeService.enviar(matchId, textoMensaje); 
      
      setMensajes(prev => [...prev, data.mensaje]);

      if (socketRef.current) {
        socketRef.current.emit('enviarMensaje', {
          matchId,
          mensaje: data.mensaje
        });
      }
    } catch (error) { console.log(error); }
  };

  const ejecutarAccionSeguridad = async (accion, mensajeExito) => {
    try {
      if (accion === 'bloquear') await userService.bloquear(otroUsuario._id);
      else await userService.reportar(otroUsuario._id);
      avisar('Listo 🛡️', mensajeExito, '🛡️');
      navigation.goBack();
    } catch (error) { avisar('Error', 'No se pudo completar la acción'); }
  };

  const mostrarMenuSeguridad = () => {
    avisar('Opciones de cuidado', '¿Qué quieres hacer con este chat?', '🛡️', [
      { label: 'Reportar', variant: 'danger', onPress: () => { setModalCahuin(null); ejecutarAccionSeguridad('reportar', 'Usuario reportado.'); } },
      { label: 'Bloquear', variant: 'danger', onPress: () => { setModalCahuin(null); ejecutarAccionSeguridad('bloquear', 'Usuario bloqueado.'); } },
      { label: 'Cancelar', variant: 'secondary', onPress: () => setModalCahuin(null) },
    ]);
  };

  const textoActividad = () => {
    if (!otroUsuario?.ultimaConexion) return '';
    const minutos = Math.floor((Date.now() - new Date(otroUsuario.ultimaConexion).getTime()) / 60000);
    if (minutos < 5) return 'En linea';
    if (minutos < 120) return `Activo hace ${minutos} min`;
    if (minutos < 60 * 24) return 'Activo hoy';
    return 'Activo hace mas de 24h';
  };

  const invocarWingman = async () => {
    setModalWingmanVisible(true);
    setCargandoWingman(true);
    try {
      const contexto = mensajes.slice(-5).map(m => m.texto);
      const data = await iaService.getWingman(otroUsuario._id, contexto);
      setConsejoWingman(data);
    } catch (error) { avisar('Error', 'El Wingman está descansando.'); setModalWingmanVisible(false); } 
    finally { setCargandoWingman(false); }
  };

  const usarOpenerWingman = () => {
    if (consejoWingman?.opener) { setTexto(consejoWingman.opener); setModalWingmanVisible(false); }
  };

  const enviarCalificacion = async () => {
    if (ratingSeleccionado === 0) return avisar('Ey', 'Selecciona al menos una estrella', '⭐');
    setEnviandoRating(true);
    try {
      await userService.calificar(otroUsuario._id, ratingSeleccionado);
      setModalCalificarVisible(false);
      avisar('¡Gracias!', 'Evaluación anónima enviada.', '⭐');
    } catch (error) { avisar('Error', 'No pudimos enviar la calificación.'); } finally { setEnviandoRating(false); }
  };

  const abrirDiario = async () => {
    setModalDiarioVisible(true);
    try {
      const data = await userService.getDiario(otroUsuario._id);
      setNotasDiario(data.notas || []);
    } catch (e) { console.log(e); }
  };

  const guardarNotaDiario = async () => {
    if (!textoNota.trim()) return;
    setGuardandoNota(true);
    try {
      await userService.escribirDiario(otroUsuario._id, textoNota);
      setNotasDiario([{ texto: textoNota, fecha: new Date() }, ...notasDiario]);
      setTextoNota('');
    } catch (e) { avisar('Error', 'No se guardó la nota'); } finally { setGuardandoNota(false); }
  };

  const proponerKaraoke = async (song) => {
    const mensaje = `🎤 Cahuín Karaoke: te propongo "${song.cancion}" de ${song.artista}. La dinámica: ${song.parte}. ¿Te tinca grabarlo juntos?`;
    try {
      const data = await mensajeService.enviar(matchId, mensaje);
      setMensajes(prev => [...prev, data.mensaje]);
      if (socketRef.current) socketRef.current.emit('enviarMensaje', { matchId, mensaje: data.mensaje });
      setModalCahuin(null);
    } catch (error) {
      avisar('Karaoke', 'No pudimos proponer la canción ahora.');
    }
  };

  const abrirKaraoke = () => {
    const song = KARAOKE_SONGS[Math.floor(Math.random() * KARAOKE_SONGS.length)];
    avisar(
      'Cahuín Karaoke',
      `"${song.cancion}" de ${song.artista}. ${song.parte}.`,
      '🎤',
      [
        { label: 'Proponer', onPress: () => proponerKaraoke(song) },
        { label: 'Otra canción', variant: 'secondary', onPress: abrirKaraoke },
      ]
    );
  };

  const insertarPreguntaMadrugada = () => {
    const pregunta = PREGUNTAS_MADRUGADA[Math.floor(Math.random() * PREGUNTAS_MADRUGADA.length)];
    setTexto(pregunta);
  };

  const renderCasiNosCruzamos = () => {
    if (miUsuario.region === otroUsuario.region && mensajes.length < 5) {
      return (
        <View style={styles.bannerDestino}>
          <MaterialCommunityIcons name="map-marker-distance" size={24} color="#E91E63" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.destinoTitulo}>¡Casi se cruzan!</Text>
            <Text style={styles.destinoTexto}>Estuvieron a menos de 500m de distancia la semana pasada. ¿El destino?</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderChatHeader = () => (
    <View>
      <View style={styles.puzzleCard}>
        <View style={styles.puzzleTop}>
          <Text style={styles.puzzleTitle}>🧩 Puzzle del match</Text>
          <Text style={styles.puzzleCount}>{piezasPuzzle}/9</Text>
        </View>
        <View style={styles.puzzleGrid}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={index} style={[styles.puzzlePiece, index < piezasPuzzle && styles.puzzlePieceActive]} />
          ))}
        </View>
        <Text style={styles.puzzleHint}>Cada 10 mensajes desbloquean una pieza nueva de su historia.</Text>
      </View>
      {esMadrugada ? (
        <TouchableOpacity style={styles.midnightCard} onPress={insertarPreguntaMadrugada}>
          <Text style={styles.midnightTitle}>Modo Madrugada</Text>
          <Text style={styles.midnightText}>Preguntas honestas para cuando el chat se pone más real. Toca para insertar una.</Text>
        </TouchableOpacity>
      ) : null}
      {renderCasiNosCruzamos()}
    </View>
  );

  const renderMensaje = ({ item }) => {
    const esMio = item.remitente?._id === miUsuario._id || item.remitente === miUsuario._id;
    const esInvitacion = item.texto?.startsWith('Te invito a este panorama:');
    const esKaraoke = item.texto?.startsWith('🎤 Cahuín Karaoke:');
    if (esKaraoke) {
      return (
        <View style={[styles.karaokeMessage, esMio ? styles.inviteMine : styles.inviteOther]}>
          <View style={styles.inviteHeader}>
            <Ionicons name="mic" size={18} color="#A855F7" />
            <Text style={[styles.inviteLabel, { color: '#A855F7' }]}>Karaoke</Text>
          </View>
          <Text style={styles.inviteText}>{item.texto}</Text>
        </View>
      );
    }
    if (esInvitacion) {
      return (
        <View style={[styles.inviteMessage, esMio ? styles.inviteMine : styles.inviteOther]}>
          <View style={styles.inviteHeader}>
            <Ionicons name="ticket" size={18} color={COLORS.primario} />
            <Text style={styles.inviteLabel}>Cahuin Panorama</Text>
          </View>
          <Text style={styles.inviteText}>{item.texto}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.burbuja, esMio ? styles.burbujaPropia : styles.burbujaAjena]}>
        <Text style={[styles.textoMensaje, esMio ? styles.textoPropio : styles.textoAjeno]}>{item.texto}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, esMadrugada && styles.safeMidnight]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} /></TouchableOpacity>
        
        {/* 🌟 SI ES RULETA Y AÚN NO SE REVELAN, OCULTAR IDENTIDAD */}
        <TouchableOpacity style={styles.headerInfo} disabled={route.params?.esRuletaCiega && !route.params?.ambosRevelaron} onPress={() => navigation.navigate('OtroPerfil', { usuario: otroUsuario })}>
          <Image source={{ uri: otroUsuario?.foto || 'https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=150' }} style={styles.avatar} />
          <View>
            <Text style={styles.headerNombre}>{otroUsuario?.nombre || 'Anónimo'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {route.params?.esRuletaCiega ? (
                <Text style={{ fontSize: 12, color: '#9C27B0', fontWeight: 'bold' }}>🎭 Cita a Ciegas</Text>
              ) : (
                <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{textoActividad() || `${energiaChat.emoji} Energia ${energiaChat.estado}`}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 🌟 BOTÓN PARA REVELARSE EN RULETA CIEGA */}
        {route.params?.esRuletaCiega && !route.params?.ambosRevelaron && (
           <TouchableOpacity 
             onPress={handleRevelarse} 
             disabled={route.params?.yoRevelé}
             style={{ backgroundColor: route.params?.yoRevelé ? COLORS.border : '#9C27B0', padding: 8, borderRadius: 15, marginLeft: 10 }}>
             <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
               {route.params?.yoRevelé ? 'Esperando...' : '¡Revelarme! 👀'}
             </Text>
           </TouchableOpacity>
        )}

        {!route.params?.esRuletaCiega && (
          <>
            <TouchableOpacity onPress={() => setModalFechasVisible(true)} style={styles.btnIcono}><Ionicons name="calendar" size={26} color="#2196F3" /></TouchableOpacity>
            <TouchableOpacity onPress={abrirDiario} style={styles.btnIcono}><Ionicons name="book" size={24} color="#8E24AA" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalCalificarVisible(true)} style={styles.btnIcono}><Ionicons name="star" size={26} color="#FFD700" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalSeguridadVisible(true)} style={styles.btnIcono}><MaterialCommunityIcons name="shield-account" size={28} color="#4CAF50" /></TouchableOpacity>
            <TouchableOpacity onPress={mostrarMenuSeguridad} style={styles.btnIcono}><Ionicons name="flag" size={24} color={COLORS.primario} /></TouchableOpacity>
          </>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderMensaje}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderChatHeader()} 
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <TouchableOpacity style={styles.btnKaraoke} onPress={abrirKaraoke}>
          <Ionicons name="mic" size={23} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnWingman} onPress={invocarWingman}>
          <MaterialCommunityIcons name="robot-outline" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.inputRow}>
          <CahuinTextField 
            icon="chatbubble-ellipses-outline"
            containerStyle={{ flex: 1 }}
            value={texto} 
            onChangeText={setTexto} 
            placeholder="Escribe un mensaje..." 
            returnKeyType="send"
            onSubmitEditing={handleEnviar}
            blurOnSubmit={false} 
          />
          <TouchableOpacity style={styles.btnEnviar} onPress={handleEnviar}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CitaSeguraModal visible={modalSeguridadVisible} onClose={() => setModalSeguridadVisible(false)} matchNombre={otroUsuario?.nombre} ciudad={otroUsuario?.ciudad} />
      <CahuinModal visible={!!modalCahuin} title={modalCahuin?.title} message={modalCahuin?.message} emoji={modalCahuin?.emoji} actions={modalCahuin?.actions || []} onClose={() => setModalCahuin(null)} />

      <Modal visible={modalDiarioVisible} animationType="slide" transparent>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { height: '85%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.modalTitulo}>📖 Diario Privado</Text>
              <TouchableOpacity onPress={() => setModalDiarioVisible(false)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitulo}>Nadie más verá estas notas. Úsalas para recordar cosas importantes sobre {otroUsuario?.nombre} tras sus citas.</Text>
            
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <CahuinTextField icon="book-outline" containerStyle={{ flex: 1 }} value={textoNota} onChangeText={setTextoNota} placeholder="Escribe una nota..." multiline variant="textarea" />
              <TouchableOpacity style={[styles.btnGuardar, { flex: 0, paddingHorizontal: 20, justifyContent: 'center' }]} onPress={guardarNotaDiario} disabled={guardandoNota}>
                {guardandoNota ? <ActivityIndicator color="#FFF" /> : <Ionicons name="save" size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>

            <FlatList
              data={notasDiario}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: COLORS.fondo, padding: 15, borderRadius: RADIUS.lg, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 5 }}>{new Date(item.fecha).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 15, color: COLORS.textPrimary }}>{item.texto}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: COLORS.gris, marginTop: 20 }}>Tu diario está vacío.</Text>}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={modalWingmanVisible} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { borderColor: '#9C27B0', borderWidth: 2 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <MaterialCommunityIcons name="robot-excited" size={40} color="#9C27B0" />
              <Text style={[styles.modalTitulo, { color: '#9C27B0', marginLeft: 10, marginBottom: 0 }]}>Wingman IA</Text>
            </View>
            {cargandoWingman ? (
              <View style={{ padding: 20, alignItems: 'center' }}><ActivityIndicator size="large" color="#9C27B0" /><Text style={{ color: COLORS.textPrimary, marginTop: 10 }}>Analizando perfil de {otroUsuario?.nombre}...</Text></View>
            ) : (
              <>
                <Text style={styles.modalSubtitulo}>Tu asistente personal te sugiere lo siguiente:</Text>
                <View style={styles.cajaConsejo}><Text style={styles.labelWingman}>💡 CONSEJO TÁCTICO:</Text><Text style={styles.textoWingman}>{consejoWingman?.consejo}</Text></View>
                <View style={styles.cajaOpener}><Text style={styles.labelWingman}>✨ ABRIDOR SUGERIDO:</Text><Text style={[styles.textoWingman, { fontStyle: 'italic' }]}>"{consejoWingman?.opener}"</Text></View>
                <View style={styles.modalBotones}>
                  <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalWingmanVisible(false)}><Text style={styles.btnCancelarTexto}>Cerrar</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.btnGuardar, { backgroundColor: '#9C27B0' }]} onPress={usarOpenerWingman}><Text style={styles.btnGuardarTexto}>Usar texto</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modalCalificarVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Calificar a {otroUsuario?.nombre}</Text>
            <Text style={styles.modalSubtitulo}>Tu evaluación es 100% anónima.</Text>
            <View style={styles.estrellasContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity key={num} onPress={() => setRatingSeleccionado(num)}>
                  <Ionicons name={num <= ratingSeleccionado ? "star" : "star-outline"} size={45} color="#FFD700" style={{ marginHorizontal: 5 }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalCalificarVisible(false)}><Text style={styles.btnCancelarTexto}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={enviarCalificacion} disabled={enviandoRating}><Text style={styles.btnGuardarTexto}>Enviar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🌟 MODAL DE DISPONIBILIDAD DEL MATCH */}
      <Modal visible={modalFechasVisible} transparent animationType="fade">
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, { height: 'auto', paddingBottom: 40 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={styles.modalTitulo}>📅 Disponibilidad</Text>
              <TouchableOpacity onPress={() => setModalFechasVisible(false)}><Ionicons name="close" size={28} color={COLORS.textPrimary} /></TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitulo}>Estos son los días que {otroUsuario?.nombre} tiene libres para salir de Citas este mes:</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {otroUsuario?.fechasDisponibles && otroUsuario.fechasDisponibles.length > 0 ? (
                otroUsuario.fechasDisponibles.map((fechaIso, idx) => {
                  const f = new Date(fechaIso);
                  return (
                    <View key={idx} style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(33, 150, 243, 0.4)' }}>
                      <Text style={{ color: '#2196F3', fontWeight: 'bold', fontSize: 16 }}>{f.getDate()} de {f.toLocaleString('es-ES', { month: 'short' })}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={{ color: COLORS.textMuted, fontStyle: 'italic', marginTop: 10 }}>Aún no ha marcado sus días libres. ¡Pregúntale por chat!</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  safeMidnight: { backgroundColor: '#050816' },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING[4], backgroundColor: COLORS.tarjeta, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOWS.sm },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginLeft: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  headerNombre: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, fontFamily: FONTS.display },
  btnIcono: { marginLeft: 10, padding: 5 },
  
  bannerDestino: { flexDirection: 'row', backgroundColor: 'rgba(233, 30, 99, 0.1)', padding: 15, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(233, 30, 99, 0.3)', marginBottom: 15, alignItems: 'center' },
  destinoTitulo: { fontSize: 16, fontWeight: 'bold', color: '#E91E63' },
  destinoTexto: { fontSize: 13, color: COLORS.textPrimary, marginTop: 2, lineHeight: 18 },

  listContent: { padding: SPACING[4], gap: 10, paddingBottom: 96 }, 
  puzzleCard: { backgroundColor: COLORS.tarjeta, borderRadius: 22, padding: SPACING[4], borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, ...SHADOWS.light },
  puzzleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  puzzleTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', fontFamily: FONTS.display },
  puzzleCount: { color: COLORS.primario, fontWeight: '900' },
  puzzleGrid: { flexDirection: 'row', gap: 6 },
  puzzlePiece: { flex: 1, height: 18, borderRadius: 6, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  puzzlePieceActive: { backgroundColor: COLORS.primario, borderColor: COLORS.primario },
  puzzleHint: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  midnightCard: { backgroundColor: '#10172A', borderRadius: 22, padding: SPACING[4], borderWidth: 1, borderColor: 'rgba(168,85,247,0.45)', marginBottom: 12 },
  midnightTitle: { color: '#C4B5FD', fontSize: 17, fontWeight: '900', fontFamily: FONTS.display },
  midnightText: { color: '#E5E7EB', fontSize: 13, lineHeight: 19, marginTop: 6 },
  burbuja: { maxWidth: '78%', borderRadius: 20, padding: SPACING[3], paddingHorizontal: SPACING[4], ...SHADOWS.light },
  burbujaPropia: { alignSelf: 'flex-end', backgroundColor: COLORS.primario, borderBottomRightRadius: 7 },
  burbujaAjena: { alignSelf: 'flex-start', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 7 },
  textoMensaje: { fontSize: 16, lineHeight: 22 },
  textoPropio: { color: '#FFF' },
  textoAjeno: { color: COLORS.textPrimary },
  
  btnWingman: { position: 'absolute', bottom: 85, right: 15, backgroundColor: '#9C27B0', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg, borderWidth: 2, borderColor: '#FFF' },
  btnKaraoke: { position: 'absolute', bottom: 145, right: 15, backgroundColor: '#F0444F', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg, borderWidth: 2, borderColor: '#FFF' },
  cajaConsejo: { backgroundColor: COLORS.fondo, padding: 15, borderRadius: RADIUS.md, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  cajaOpener: { backgroundColor: 'rgba(156, 39, 176, 0.1)', padding: 15, borderRadius: RADIUS.md, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(156, 39, 176, 0.3)' },
  labelWingman: { fontSize: 12, fontWeight: 'bold', color: '#9C27B0', marginBottom: 5 },
  textoWingman: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },

  inviteMessage: { maxWidth: '82%', borderRadius: 22, padding: SPACING[4], borderWidth: 1, marginVertical: 2, ...SHADOWS.light },
  inviteMine: { alignSelf: 'flex-end', backgroundColor: COLORS.softRed, borderColor: 'rgba(240,68,79,0.25)' },
  inviteOther: { alignSelf: 'flex-start', backgroundColor: COLORS.tarjeta, borderColor: COLORS.border },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inviteLabel: { color: COLORS.primario, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  inviteText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  karaokeMessage: { maxWidth: '86%', borderRadius: 22, padding: SPACING[4], borderWidth: 1, marginVertical: 2, ...SHADOWS.light },

  inputRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING[3], gap: 10, backgroundColor: COLORS.tarjeta, borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3], color: COLORS.textPrimary, maxHeight: 100, fontSize: 16, ...SHADOWS.light },
  btnEnviar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primario, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: 25, ...SHADOWS.lg },
  modalTitulo: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  modalSubtitulo: { fontSize: 15, color: COLORS.textMuted, marginBottom: 25, lineHeight: 22 },
  estrellasContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  modalBotones: { flexDirection: 'row', gap: 15 },
  btnCancelar: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: COLORS.fondo, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  btnCancelarTexto: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  btnGuardar: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: COLORS.primario, borderRadius: RADIUS.lg },
  btnGuardarTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
