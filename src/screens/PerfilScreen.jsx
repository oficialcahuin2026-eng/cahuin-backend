import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/api';
import { ScreenScaffold, SoftCard, SoftIcon, SectionTitle } from '../components/CahuinUI';
import CahuinTextField from '../components/CahuinTextField';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const { width } = Dimensions.get('window');

const ARTICULOS_RECUPERACION = [
  {
    id: '1',
    titulo: 'Los nervios son buena señal',
    emoji: '🦋',
    lectura: '4 min',
    contenido: 'Sentir nervios antes de conocer a alguien no significa que estes retrocediendo. Muchas veces es tu sistema intentando protegerte mientras otra parte tuya quiere volver a abrir la puerta.\n\nPrueba nombrar lo que pasa sin pelearte con eso: "estoy nervioso y aun asi puedo ir despacio". No necesitas actuar perfecto. Necesitas sentirte suficientemente seguro para estar presente.\n\nUna buena cita no se mide por si hubo chispa inmediata. Tambien cuenta si pudiste respirar, poner un limite, reirte un poco o irte a casa sin castigarte.',
  },
  {
    id: '2',
    titulo: 'Cuanto tiempo esperar?',
    emoji: '⏳',
    lectura: '5 min',
    contenido: 'No hay un numero magico de semanas o meses. Estar listo no es no sentir nada por lo anterior; es poder salir sin usar a otra persona como anestesia.\n\nTres señales utiles: tienes curiosidad por alguien nuevo, puedes aceptar un "no" sin derrumbarte, y no sientes urgencia por demostrar que ya estas bien.\n\nSi dudas, elige una cita corta y de bajo riesgo: cafe, paseo, algo con hora de salida. Volver no tiene que ser un salto. Puede ser una prueba amable.',
  },
  {
    id: '3',
    titulo: 'Miedo al rechazo',
    emoji: '🛡️',
    lectura: '5 min',
    contenido: 'El rechazo duele porque toca pertenencia, deseo y autoestima al mismo tiempo. Pero no es una auditoría completa de tu valor.\n\nAntes de mandar un mensaje o aceptar una cita, separa dos ideas: "quiero que resulte" y "si no resulta, voy a seguir siendo yo". Esa segunda frase es la que te devuelve el piso.\n\nCahuín tip: no conviertas cada match en una final. Habla para descubrir, no para rendir una prueba.',
  },
  {
    id: '4',
    titulo: 'Volver a confiar sin apurarse',
    emoji: '🌱',
    lectura: '6 min',
    contenido: 'Confiar no significa entregar todo de una. Significa observar consistencia: lo que dice, lo que hace y cómo repara cuando algo incomoda.\n\nPuedes avanzar por capas. Primero conversación, después un plan simple, después compartir algo más personal. Si alguien exige acceso total de inmediato, eso también es información.\n\nTu ritmo no es un problema a solucionar. Es parte de tu cuidado.',
  },
  {
    id: '5',
    titulo: 'Como decir lo que necesitas',
    emoji: '💬',
    lectura: '4 min',
    contenido: 'Pedir claridad no te hace intenso. Pedir respeto no te hace complicado. La forma ayuda: usa frases simples, concretas y sin acusar.\n\nEjemplo: "Me gusta hablar contigo, pero prefiero que si vas a desaparecer me lo digas". O: "Voy lento, pero si hay interes me gusta que se note".\n\nLa gente correcta no siempre va a hacerlo perfecto, pero no te va a castigar por tener necesidades.',
  },
  {
    id: '6',
    titulo: 'Primera cita despues de un periodo dificil',
    emoji: '☕',
    lectura: '5 min',
    contenido: 'Elige un lugar donde puedas irte fácil, con luz, ruido moderado y algo que hacer si aparece silencio. No llenes la agenda con una cita maratónica.\n\nAntes de salir, define una micro meta: escuchar, reírte, practicar estar presente, o simplemente notar cómo te sientes. La meta no tiene que ser enamorarte.\n\nDespués, no te evalúes como si fueras producto. Pregúntate: "¿Cómo me sentí con esta persona?" Esa respuesta vale más que impresionar.',
  },
];

export default function PerfilScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const [modalArticuloVisible, setModalArticuloVisible] = useState(false);
  const [articuloActivo, setArticuloActivo] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [preguntaActiva, setPreguntaActiva] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);
  const [likesData, setLikesData] = useState({ likes: [], topPicks: [], puedeRevelar: false, plan: 'free' });
  const [cargandoLikes, setCargandoLikes] = useState(false);

  const cargarPreguntas = async () => {
    try {
      setCargandoPreguntas(true);
      const data = await userService.getMisPreguntasAnonimas();
      setPreguntas(data.preguntas || []);
    } catch (error) {
      console.log('Preguntas anónimas:', error);
    } finally {
      setCargandoPreguntas(false);
    }
  };

  const cargarLikes = async () => {
    try {
      setCargandoLikes(true);
      const data = await userService.getLikesRecibidos();
      setLikesData({
        likes: data.likes || [],
        topPicks: data.topPicks || [],
        puedeRevelar: Boolean(data.puedeRevelar),
        plan: data.plan || 'free',
      });
    } catch (error) {
      console.log('Likes recibidos:', error);
    } finally {
      setCargandoLikes(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarPreguntas();
      cargarLikes();
    }, [])
  );

  const abrirArticulo = (articulo) => {
    setArticuloActivo(articulo);
    setModalArticuloVisible(true);
  };

  const abrirResponder = (pregunta) => {
    setPreguntaActiva(pregunta);
    setRespuesta(pregunta.respuesta || '');
  };

  const responderPregunta = async () => {
    if (!respuesta.trim() || !preguntaActiva) return;
    setGuardandoRespuesta(true);
    try {
      await userService.responderPreguntaAnonima(preguntaActiva._id, respuesta, true);
      setPreguntaActiva(null);
      setRespuesta('');
      await cargarPreguntas();
      Alert.alert('Publicado', 'Tu respuesta quedo visible en tu perfil.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No pudimos guardar la respuesta.');
    } finally {
      setGuardandoRespuesta(false);
    }
  };

  const verificarConSelfie = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (permiso.status !== 'granted') {
      Alert.alert('Camara', 'Necesitamos permiso de camara para verificar tu perfil.');
      return;
    }

    const selfie = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (selfie.canceled) return;

    try {
      const data = await userService.verificar();
      if (data.usuario) actualizarUsuario(data.usuario);
      Alert.alert('Perfil verificado', 'Listo. Tu selfie se reviso y ahora tienes insignia.');
    } catch (error) {
      Alert.alert('Verificacion', error.message || 'No pudimos verificar ahora.');
    }
  };

  // Calcular completitud del perfil
  const calcularCompletitud = () => {
    const campos = [
      usuario?.nombre, usuario?.descripcion, usuario?.foto,
      usuario?.fotos?.length > 0, usuario?.fechaNacimiento,
      usuario?.ciudad && usuario.ciudad !== 'Por definir',
      usuario?.intereses?.length > 0, usuario?.queBuscas,
      usuario?.estiloComunicacion, usuario?.altura,
    ];
    return Math.round((campos.filter(Boolean).length / campos.length) * 100);
  };

  const completitud = calcularCompletitud();

  const lifestyleTags = [
    usuario?.queBuscas || 'Pololeo serio',
    usuario?.habitos?.beber || 'Cero alcohol',
    usuario?.habitos?.fumar || 'No le hago',
    usuario?.habitos?.mascotas || 'Dog Lover',
  ].filter(Boolean);

  const intereses = usuario?.intereses?.length ? usuario.intereses : ['Videojuegos', 'Naturaleza', 'Astrología', 'Fotografía', 'Cine y Series'];
  const preguntasPendientes = preguntas.filter((p) => !p.respondida);
  const preguntasRespondidas = preguntas.filter((p) => p.respondida);
  const valoresCompletos = Boolean(
    usuario?.mapaValores?.planesHijos &&
    usuario.mapaValores.planesHijos !== 'Por definir' &&
    usuario?.mapaValores?.dealBreaker
  );
  const testsPendientes = [
    !usuario?.tipoApego ? { key: 'apego', label: 'Apego', icon: 'heart-half-outline', route: 'TestApego' } : null,
    !usuario?.arquetipoCahuinero ? { key: 'cahuinero', label: 'Cahuínero', icon: 'flame-outline', route: 'TestCahuinero' } : null,
    !valoresCompletos ? { key: 'valores', label: 'Valores', icon: 'compass-outline', route: 'MapaValores' } : null,
  ].filter(Boolean);
  const mostrarResultadoApego = usuario?.mostrarApego && usuario?.tipoApego;
  const mostrarResultadoArquetipo = usuario?.mostrarArquetipo !== false && usuario?.arquetipoCahuinero;
  const likesPreview = likesData.likes;
  const hayLikesReales = likesData.likes.length > 0;

  // 🌟 FIX DEL AVATAR: Prioridad a usuario.fotos[0] sobre usuario.foto de Clerk
  const fotoMostrar = (usuario?.fotos && usuario.fotos.length > 0) 
    ? usuario.fotos[0] 
    : (usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300');

  return (
    <ScreenScaffold COLORS={COLORS}>
      {/* ── Header con settings ── */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Ajustes')}>
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Hero Centrado (Rediseñado) ── */}
      <View style={styles.heroCenter}>
        <View style={styles.avatarRingContainer}>
          <LinearGradient
            colors={completitud >= 80 ? [COLORS.primario, '#FFD166'] : [COLORS.border, COLORS.border]}
            style={styles.avatarRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInnerRing}>
              <Image source={{ uri: fotoMostrar }} style={styles.avatarCentered} />
            </View>
          </LinearGradient>
          <TouchableOpacity style={styles.editBubbleCentered} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.nameRowCentered}>
          <Text style={styles.nameCentered} numberOfLines={1}>{usuario?.nombre || 'Cahuinero'}, {usuario?.edad || '??'}</Text>
          {usuario?.verificado && <MaterialCommunityIcons name="check-decagram" size={24} color="#3B82F6" />}
        </View>
        <Text style={styles.locationCentered}>📍 {usuario?.ciudad || 'Por definir'}</Text>

        {/* Progress bar integrada */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>
              {completitud >= 80 ? '¡Perfil listo para el Cahuín!' : 'Completa tu perfil'}
            </Text>
            <Text style={[styles.progressPercent, { color: completitud >= 80 ? COLORS.compatHigh : COLORS.textMuted }]}>{completitud}%</Text>
          </View>
          <View style={styles.progressBarThin}>
            <LinearGradient
              colors={completitud >= 80 ? [COLORS.compatHigh, '#34A853'] : [COLORS.primario, '#FF758F']}
              style={[styles.progressFillThin, { width: `${completitud}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          {completitud < 80 && (
            <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}>
              <Text style={styles.progressActionText}>Añadir más detalles para tener más match ➔</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.btnEditarPerfil} onPress={() => navigation.navigate('EditarPerfil')}>
          <Text style={styles.btnEditarPerfilText}>Editar Información</Text>
        </TouchableOpacity>

        {!usuario?.verificado && (
          <TouchableOpacity onPress={verificarConSelfie} style={styles.btnVerificar}>
            <MaterialCommunityIcons name="shield-check-outline" size={18} color={COLORS.primario} />
            <Text style={[styles.btnVerificarText, { color: COLORS.primario }]}>Verificar perfil con selfie</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Cahuín a Fondo Banner (Rediseñado FULL WIDTH) ── */}
      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Premium')} style={styles.premiumBannerWrap}>
        <LinearGradient colors={['#07111F', '#1A233A']} style={styles.premiumBanner} start={{x: 0, y: 0}} end={{x: 1, y: 1}}>
          <View style={styles.premiumBannerContent}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Text style={styles.premiumBannerTitle}>Cahuín a Fondo</Text>
                <Ionicons name="diamond" size={16} color="#60A5FA" />
              </View>
              <Text style={styles.premiumBannerSub}>Revela likes, modo destacado y más.</Text>
            </View>
            <View style={styles.premiumBannerBtn}>
              <Text style={styles.premiumBannerBtnText}>Mejorar</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Stats: Racha + Plan (Rediseñado) ── */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: COLORS.tarjeta }]}>
          <Ionicons name="flame" size={28} color="#EF4444" />
          <View>
            <Text style={styles.statPillValue}>{usuario?.rachaDias || 1} día</Text>
            <Text style={styles.statPillLabel}>De racha</Text>
          </View>
        </View>
        <View style={[styles.statPill, { backgroundColor: COLORS.tarjeta }]}>
          <Ionicons name="star" size={26} color="#EAB308" />
          <View>
            <Text style={styles.statPillValue}>{usuario?.isPremium ? 'Activo' : 'Gratis'}</Text>
            <Text style={styles.statPillLabel}>Plan Actual</Text>
          </View>
        </View>
      </View>

      {/* ── Estilo de Vida + Gustos (Rediseñado con Chips) ── */}
      <View style={styles.chipsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.infoTitle}>Estilo de Vida</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}><Ionicons name="add-circle" size={24} color={COLORS.primario} /></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {lifestyleTags.map((tag, idx) => (
            <View key={`life-${idx}`} style={[styles.chip, { backgroundColor: 'rgba(240,68,79,0.1)', borderColor: 'rgba(240,68,79,0.2)' }]}>
              <Text style={[styles.chipText, { color: COLORS.textPrimary }]}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.chipsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.infoTitle}>Mis Gustos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}><Ionicons name="add-circle" size={24} color={COLORS.primario} /></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {intereses.map((interes, idx) => (
            <View key={`int-${idx}`} style={[styles.chip, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)' }]}>
              <Text style={[styles.chipText, { color: '#A78BFA' }]}>{interes}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Likes recibidos ── */}
      {(cargandoLikes || hayLikesReales) ? (
        <>
          <View style={styles.cardTitleRow}>
            <Ionicons name="heart" size={24} color="#A855F7" />
            <Text style={styles.infoTitle}>Me tincaron</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LikesCahuin')}>
              <Text style={{ color: COLORS.primario, fontWeight: '700', fontSize: 13 }}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <SoftCard COLORS={COLORS} style={styles.likesCard}>
            {likesPreview.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.likesStrip}>
                {likesPreview.map((item, index) => (
                  <View key={`${item._id || index}`} style={styles.likeTile}>
                    <Image
                      source={{ uri: item.foto || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=500' }}
                      style={styles.likePhoto}
                      blurRadius={likesData.puedeRevelar ? 0 : 18}
                    />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.likeOverlay} />
                    <View style={styles.likeInfo}>
                      <Text style={styles.likeName}>{likesData.puedeRevelar ? `${item.nombre || 'Cahuin'}, ${item.edad || ''}` : `Alguien, ${item.edad || '??'}`}</Text>
                    </View>
                    {!likesData.puedeRevelar && hayLikesReales ? (
                      <View style={styles.lockBubble}>
                        <Ionicons name="lock-closed" size={13} color="#FFF" />
                      </View>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            ) : null}
            {!likesData.puedeRevelar && hayLikesReales ? (
              <TouchableOpacity style={styles.unlockLikesButton} onPress={() => navigation.navigate('LikesCahuin')}>
                <Text style={styles.unlockLikesText}>Sapear quien te tinca</Text>
              </TouchableOpacity>
            ) : null}
          </SoftCard>
        </>
      ) : null}

      {/* ── Preguntas anónimas ── */}
      <SoftCard COLORS={COLORS} style={styles.questionsCard}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="chatbubbles-outline" size={28} color={COLORS.textPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Preguntas anónimas</Text>
            <Text style={styles.infoSub}>Lo que te mandan desde otros perfiles.</Text>
          </View>
          {cargandoPreguntas ? <ActivityIndicator color={COLORS.primario} /> : <Text style={styles.counterPill}>{preguntasPendientes.length}</Text>}
        </View>

        {preguntas.length === 0 ? (
          <View style={styles.emptyQuestionBox}>
            <Text style={styles.emptyQuestionTitle}>Todavía no hay preguntas.</Text>
            <Text style={styles.emptyQuestionText}>Cuando alguien te mande una, podras responderla.</Text>
          </View>
        ) : (
          <>
            {preguntasPendientes.slice(0, 3).map((item) => (
              <TouchableOpacity key={item._id} style={styles.questionRow} onPress={() => abrirResponder(item)} activeOpacity={0.9}>
                <Text style={styles.questionMark}>?</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionText}>{item.pregunta}</Text>
                  <Text style={styles.questionHint}>Toca para responder</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
            {preguntasRespondidas.slice(0, 2).map((item) => (
              <View key={item._id} style={styles.answeredBox}>
                <Text style={styles.answeredQuestion}>{item.pregunta}</Text>
                <Text style={styles.answeredText}>{item.respuesta}</Text>
              </View>
            ))}
          </>
        )}
      </SoftCard>

      {/* ── Tests de personalidad ── */}
      {testsPendientes.length > 0 ? (
        <SoftCard COLORS={COLORS} style={styles.testsCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="flask-outline" size={28} color={COLORS.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Tests de personalidad</Text>
              <Text style={styles.infoSub}>Descubre tu apego y arquetipo.</Text>
            </View>
          </View>
          <View style={styles.testActions}>
            {testsPendientes.map((test) => (
              <TouchableOpacity key={test.key} style={styles.testButton} onPress={() => navigation.navigate(test.route)}>
                <Ionicons name={test.icon} size={26} color={COLORS.primario} style={{ marginBottom: 6 }} />
                <Text style={styles.testText}>{test.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SoftCard>
      ) : null}

      {/* ── Insignias visibles ── */}
      {(mostrarResultadoApego || mostrarResultadoArquetipo) ? (
        <SoftCard COLORS={COLORS} style={styles.testsCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="ribbon-outline" size={28} color={COLORS.textPrimary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Insignias visibles</Text>
              <Text style={styles.infoSub}>Solo mostramos lo que aceptaste publicar.</Text>
            </View>
          </View>
          <View style={styles.testResults}>
            {mostrarResultadoApego ? <Text style={styles.testResultText}>Apego: {usuario.tipoApego}</Text> : null}
            {mostrarResultadoArquetipo ? <Text style={styles.testResultText}>Arquetipo: {usuario.arquetipoCahuinero}</Text> : null}
          </View>
        </SoftCard>
      ) : null}

      {/* ── Modals ── */}
      <Modal visible={modalArticuloVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={styles.articleModalHeader}>
            <TouchableOpacity onPress={() => setModalArticuloVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>{articuloActivo?.lectura}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.articleModalBody}>
            <Text style={styles.articleModalEmoji}>{articuloActivo?.emoji}</Text>
            <Text style={styles.articleModalTitle}>{articuloActivo?.titulo}</Text>
            <Text style={styles.articleModalText}>{articuloActivo?.contenido}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!preguntaActiva} transparent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={styles.answerModal}>
            <Text style={styles.answerTitle}>Responder pregunta</Text>
            <Text style={styles.answerQuestion}>{preguntaActiva?.pregunta}</Text>
            <CahuinTextField
              value={respuesta}
              onChangeText={setRespuesta}
              placeholder="Escribe con tu estilo..."
              multiline
              variant="textarea"
            />
            <View style={styles.answerActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPreguntaActiva(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.publishButton} onPress={responderPregunta} disabled={guardandoRespuesta}>
                {guardandoRespuesta ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishButtonText}>Publicar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScaffold>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  // ── Header ──
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900', fontFamily: FONTS.display },
  settingsButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border,
  },

  // ── Hero Centered ──
  heroCenter: {
    alignItems: 'center',
    marginBottom: SPACING[5],
    paddingTop: SPACING[3],
  },
  avatarRingContainer: {
    position: 'relative',
    marginBottom: SPACING[3],
  },
  avatarRing: {
    width: 140, height: 140,
    borderRadius: 70,
    padding: 4, // Grosor del borde gradiente
  },
  avatarInnerRing: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 70,
    padding: 3,
  },
  avatarCentered: {
    width: '100%', height: '100%',
    borderRadius: 70,
    backgroundColor: COLORS.softRed,
  },
  editBubbleCentered: {
    position: 'absolute', right: 5, bottom: 5,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.bg,
  },
  nameRowCentered: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  nameCentered: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display },
  locationCentered: { color: COLORS.textMuted, fontSize: 15, marginBottom: SPACING[3] },
  
  progressContainer: { width: '100%', paddingHorizontal: SPACING[3], marginBottom: SPACING[4] },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800' },
  progressPercent: { fontSize: 13, fontWeight: '900' },
  progressBarThin: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFillThin: { height: '100%', borderRadius: 3 },
  progressActionText: { color: COLORS.primario, fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },

  btnEditarPerfil: {
    backgroundColor: COLORS.tarjeta,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 10, paddingHorizontal: 30,
    borderRadius: 99,
    marginBottom: SPACING[2],
  },
  btnEditarPerfilText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '800' },
  btnVerificar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  btnVerificarText: { fontSize: 13, fontWeight: '700' },

  // ── Premium Banner ──
  premiumBannerWrap: { marginBottom: SPACING[4] },
  premiumBanner: { borderRadius: 20, padding: 18, ...SHADOWS.dark },
  premiumBannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  premiumBannerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: FONTS.display, marginBottom: 2 },
  premiumBannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  premiumBannerBtn: { backgroundColor: '#FFD166', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  premiumBannerBtnText: { color: '#111827', fontSize: 13, fontWeight: '900' },

  // ── Stats Row ──
  statsRow: { flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[4] },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: SPACING[3], borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  statPillEmoji: { fontSize: 28 },
  statPillValue: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  statPillLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },

  // ── Chips Section ──
  chipsSection: { marginBottom: SPACING[4] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[2] },
  chipsScroll: { gap: 8, paddingRight: SPACING[4] },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '700' },

  // ── Likes ──
  likesCard: { marginBottom: SPACING[4] },
  likesStrip: { gap: SPACING[2], paddingRight: SPACING[2] },
  likeTile: { width: 130, height: 180, borderRadius: 18, overflow: 'hidden', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  likePhoto: { width: '100%', height: '100%', position: 'absolute' },
  likeOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  likeInfo: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  likeName: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: FONTS.display },
  lockBubble: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(17,24,39,0.8)', alignItems: 'center', justifyContent: 'center' },
  unlockLikesButton: { minHeight: 44, borderRadius: 14, backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center', marginTop: SPACING[2] },
  unlockLikesText: { color: COLORS.bg, fontWeight: '900', fontSize: 14 },

  // ── Questions ──
  questionsCard: { marginBottom: SPACING[4] },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING[3] },
  infoTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', flex: 1 },
  infoSub: { color: COLORS.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 },
  counterPill: { minWidth: 28, textAlign: 'center', color: '#FFF', backgroundColor: COLORS.primario, borderRadius: 14, paddingVertical: 4, overflow: 'hidden', fontWeight: '900', fontSize: 12 },
  emptyQuestionBox: { backgroundColor: COLORS.fondo, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[3] },
  emptyQuestionTitle: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 14 },
  emptyQuestionText: { color: COLORS.textMuted, marginTop: 4, lineHeight: 18, fontSize: 13 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2], backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: SPACING[2], marginTop: SPACING[2] },
  questionMark: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.softPurple, color: COLORS.primario, textAlign: 'center', textAlignVertical: 'center', fontSize: 18, fontWeight: '900' },
  questionText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  questionHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  answeredBox: { backgroundColor: COLORS.softGreen, borderWidth: 1, borderColor: 'rgba(52,168,83,0.22)', borderRadius: 14, padding: SPACING[2], marginTop: SPACING[2] },
  answeredQuestion: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  answeredText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 19, marginTop: 4, fontWeight: '700' },

  // ── Tests ──
  testsCard: { marginBottom: SPACING[4] },
  testActions: { flexDirection: 'row', gap: SPACING[2] },
  testButton: { flex: 1, minHeight: 72, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: SPACING[2], justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  testEmoji: { fontSize: 22, marginBottom: 4 },
  testText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  testResults: { marginTop: SPACING[2], backgroundColor: COLORS.softPurple, borderRadius: 14, padding: SPACING[2], gap: 3 },
  testResultText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },

  // ── Modals ──
  articleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  articleModalBody: { padding: 25, paddingBottom: 100 },
  articleModalEmoji: { fontSize: 52, marginBottom: 15 },
  articleModalTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display, marginBottom: 25 },
  articleModalText: { fontSize: 17, color: COLORS.textPrimary, lineHeight: 28 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(17,24,39,0.58)', justifyContent: 'flex-end' },
  answerModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING[5] },
  answerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  answerQuestion: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 12, marginBottom: 14 },
  answerActions: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[4] },
  cancelButton: { flex: 1, minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: COLORS.textPrimary, fontWeight: '900' },
  publishButton: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center' },
  publishButtonText: { color: '#FFF', fontWeight: '900' },
});
