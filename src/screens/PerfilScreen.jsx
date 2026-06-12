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
  TextInput,
  TouchableOpacity,
  View,
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

const ARTICULOS_RECUPERACION = [
  {
    id: '1',
    titulo: 'Los nervios son buena seÃ±al',
    emoji: 'ðŸ¦‹',
    lectura: '4 min',
    contenido: 'Sentir nervios antes de conocer a alguien no significa que estes retrocediendo. Muchas veces es tu sistema intentando protegerte mientras otra parte tuya quiere volver a abrir la puerta.\n\nPrueba nombrar lo que pasa sin pelearte con eso: "estoy nervioso y aun asi puedo ir despacio". No necesitas actuar perfecto. Necesitas sentirte suficientemente seguro para estar presente.\n\nUna buena cita no se mide por si hubo chispa inmediata. Tambien cuenta si pudiste respirar, poner un limite, reirte un poco o irte a casa sin castigarte.',
  },
  {
    id: '2',
    titulo: 'Cuanto tiempo esperar?',
    emoji: 'â±ï¸',
    lectura: '5 min',
    contenido: 'No hay un numero magico de semanas o meses. Estar listo no es no sentir nada por lo anterior; es poder salir sin usar a otra persona como anestesia.\n\nTres seÃ±ales utiles: tienes curiosidad por alguien nuevo, puedes aceptar un "no" sin derrumbarte, y no sientes urgencia por demostrar que ya estas bien.\n\nSi dudas, elige una cita corta y de bajo riesgo: cafe, paseo, algo con hora de salida. Volver no tiene que ser un salto. Puede ser una prueba amable.',
  },
  {
    id: '3',
    titulo: 'Miedo al rechazo',
    emoji: 'ðŸ›¡ï¸',
    lectura: '5 min',
    contenido: 'El rechazo duele porque toca pertenencia, deseo y autoestima al mismo tiempo. Pero no es una auditorÃ­a completa de tu valor.\n\nAntes de mandar un mensaje o aceptar una cita, separa dos ideas: "quiero que resulte" y "si no resulta, voy a seguir siendo yo". Esa segunda frase es la que te devuelve el piso.\n\nCahuÃ­n tip: no conviertas cada match en una final. Habla para descubrir, no para rendir una prueba.',
  },
  {
    id: '4',
    titulo: 'Volver a confiar sin apurarse',
    emoji: 'ðŸŒ±',
    lectura: '6 min',
    contenido: 'Confiar no significa entregar todo de una. Significa observar consistencia: lo que dice, lo que hace y cÃ³mo repara cuando algo incomoda.\n\nPuedes avanzar por capas. Primero conversaciÃ³n, despuÃ©s un plan simple, despuÃ©s compartir algo mÃ¡s personal. Si alguien exige acceso total de inmediato, eso tambiÃ©n es informaciÃ³n.\n\nTu ritmo no es un problema a solucionar. Es parte de tu cuidado.',
  },
  {
    id: '5',
    titulo: 'Como decir lo que necesitas',
    emoji: 'ðŸ’¬',
    lectura: '4 min',
    contenido: 'Pedir claridad no te hace intenso. Pedir respeto no te hace complicado. La forma ayuda: usa frases simples, concretas y sin acusar.\n\nEjemplo: "Me gusta hablar contigo, pero prefiero que si vas a desaparecer me lo digas". O: "Voy lento, pero si hay interes me gusta que se note".\n\nLa gente correcta no siempre va a hacerlo perfecto, pero no te va a castigar por tener necesidades.',
  },
  {
    id: '6',
    titulo: 'Primera cita despues de un periodo dificil',
    emoji: 'â˜•',
    lectura: '5 min',
    contenido: 'Elige un lugar donde puedas irte fÃ¡cil, con luz, ruido moderado y algo que hacer si aparece silencio. No llenes la agenda con una cita maratÃ³nica.\n\nAntes de salir, define una micro meta: escuchar, reÃ­rte, practicar estar presente, o simplemente notar cÃ³mo te sientes. La meta no tiene que ser enamorarte.\n\nDespuÃ©s, no te evalÃºes como si fueras producto. PregÃºntate: "Â¿CÃ³mo me sentÃ­ con esta persona?" Esa respuesta vale mÃ¡s que impresionar.',
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
      console.log('Preguntas anÃ³nimas:', error);
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
    usuario?.queBuscas || 'Pololeo serio ðŸ’–',
    usuario?.habitos?.beber || 'Cero alcohol ðŸ’§',
    usuario?.habitos?.fumar || 'No le hago ðŸš­',
    usuario?.habitos?.mascotas || 'Dog Lover ðŸ¶',
  ].filter(Boolean);

  const intereses = usuario?.intereses?.length ? usuario.intereses : ['Videojuegos ðŸŽ®', 'Naturaleza ðŸŒ²', 'Astrologia âœ¨', 'Fotografia ðŸ“¸', 'Cine y Series ðŸ¿'];
  const preguntasPendientes = preguntas.filter((p) => !p.respondida);
  const preguntasRespondidas = preguntas.filter((p) => p.respondida);
  const valoresCompletos = Boolean(
    usuario?.mapaValores?.planesHijos &&
    usuario.mapaValores.planesHijos !== 'Por definir' &&
    usuario?.mapaValores?.dealBreaker
  );
  const testsPendientes = [
    !usuario?.tipoApego ? { key: 'apego', label: 'Apego', emoji: 'ðŸ§ ', route: 'TestApego' } : null,
    !usuario?.arquetipoCahuinero ? { key: 'cahuinero', label: 'CahuÃ­nero', emoji: 'ðŸŒ¶ï¸', route: 'TestCahuinero' } : null,
    !valoresCompletos ? { key: 'valores', label: 'Valores', emoji: 'ðŸ§­', route: 'MapaValores' } : null,
  ].filter(Boolean);
  const mostrarResultadoApego = usuario?.mostrarApego && usuario?.tipoApego;
  const mostrarResultadoArquetipo = usuario?.mostrarArquetipo !== false && usuario?.arquetipoCahuinero;
  const likesPreview = likesData.likes;
  const hayLikesReales = likesData.likes.length > 0;

  return (
    <ScreenScaffold COLORS={COLORS}>
      {/* â”€â”€ Header con settings â”€â”€ */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Ajustes')}>
          <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* â”€â”€ Hero horizontal: foto + info â”€â”€ */}
      <View style={styles.heroRow}>
        <View style={styles.avatarOuter}>
          <Image source={{ uri: usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300' }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBubble} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="pencil" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.heroInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{usuario?.nombre || 'Cahuinero'}, {usuario?.edad || '??'}</Text>
            {usuario?.verificado && <MaterialCommunityIcons name="check-decagram" size={20} color="#3B82F6" />}
          </View>
          <Text style={styles.location}>ðŸ“ {usuario?.ciudad || 'Por definir'}</Text>
          <TouchableOpacity style={styles.editPill} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="pencil" size={14} color={COLORS.textPrimary} />
            <Text style={styles.editPillText}>Editar perfil</Text>
          </TouchableOpacity>
          {usuario?.verificado ? (
            <Text style={styles.verifiedText}>âœ… Verificado con selfie</Text>
          ) : (
            <TouchableOpacity onPress={verificarConSelfie}>
              <Text style={[styles.verifiedText, { color: COLORS.primario }]}>ðŸ“· Verificar con selfie</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* â”€â”€ Barra de completitud â”€â”€ */}
      <SoftCard COLORS={COLORS} style={styles.completitudCard}>
        <View style={styles.completitudRow}>
          <View style={styles.completitudCircle}>
            <Text style={[styles.completitudPercent, { color: completitud >= 80 ? COLORS.compatHigh : COLORS.compatMedium }]}>{completitud}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completitudTitle}>
              {completitud >= 80 ? 'Tu perfil va muy bien' : completitud >= 50 ? 'Tu perfil va bien' : 'Completa tu perfil'}
            </Text>
            <Text style={styles.completitudSub}>Completa tu perfil para tener mÃ¡s match.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}>
              <Text style={[styles.completitudAction, { color: COLORS.primario }]}>Ver sugerencias &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completitud}%`, backgroundColor: completitud >= 80 ? COLORS.compatHigh : COLORS.compatMedium }]} />
        </View>
      </SoftCard>

      {/* â”€â”€ Stats: Racha + Plan â”€â”€ */}
      <SoftCard COLORS={COLORS} style={styles.statsCard}>
        <View style={styles.statBox}>
          <SoftIcon emoji="ðŸ”¥" bg={COLORS.softRed} size={52} rounded={18} iconSize={26} />
          <View>
            <Text style={styles.statValue}>{usuario?.rachaDias || 1} dÃ­a</Text>
            <Text style={styles.statLabel}>Â¡Sigue asÃ­!</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <SoftIcon emoji="✨" bg={COLORS.softAmber} size={52} rounded={18} iconSize={26} />
          <View>
            <Text style={styles.statValue}>{usuario?.isPremium ? 'Activo' : 'Gratis'}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
              <Text style={[styles.statAction, { color: COLORS.primario }]}>Ver planes &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SoftCard>

      {/* â”€â”€ Likes recibidos â”€â”€ */}
      {(cargandoLikes || hayLikesReales) ? (
        <>
          <SectionTitle title="Me tincaron" icon="ðŸ’œ" COLORS={COLORS} actionText="Ver todos" onAction={() => navigation.navigate('LikesCahuin')} />
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

      {/* â”€â”€ Estilo de Vida + Gustos (side by side) â”€â”€ */}
      <View style={styles.twoCol}>
        <SoftCard COLORS={COLORS} style={[styles.halfCard]}>
          <View style={styles.miniHeader}>
            <Text style={styles.miniTitle} numberOfLines={1}>Estilo de Vida</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')} style={styles.editMiniBtn}>
              <Ionicons name="pencil" size={14} color={COLORS.primario} />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {lifestyleTags.map((tag, idx) => (
              <View key={`${tag}-${idx}`} style={[styles.tag, { borderColor: 'rgba(240,68,79,0.22)' }]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </SoftCard>

        <SoftCard COLORS={COLORS} style={[styles.halfCard]}>
          <View style={styles.miniHeader}>
            <Text style={styles.miniTitle} numberOfLines={1}>Mis Gustos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')} style={styles.editMiniBtn}>
              <Ionicons name="pencil" size={14} color={COLORS.primario} />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {intereses.slice(0, 4).map((interes, idx) => (
              <View key={`${interes}-${idx}`} style={[styles.tag, { borderColor: 'rgba(139,92,246,0.28)' }]}>
                <Text style={[styles.tagText, { color: '#7C3AED' }]} numberOfLines={1}>âœ¨ {interes}</Text>
              </View>
            ))}
          </View>
        </SoftCard>
      </View>

      {/* â”€â”€ RecuperaciÃ³n COMPACTA + Premium CTA (side by side if both) â”€â”€ */}
      <View style={styles.twoCol}>
        {usuario?.modoRecuperacion ? (
          <SoftCard COLORS={COLORS} style={[styles.halfCard, { backgroundColor: COLORS.softGreen, borderColor: 'rgba(52,168,83,0.3)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 16 }}>ðŸŒ±</Text>
              <Text style={[styles.miniTitle, { color: '#2F9E4D' }]} numberOfLines={1}>Volver a florecer</Text>
            </View>
            <TouchableOpacity onPress={() => abrirArticulo(ARTICULOS_RECUPERACION[0])} style={styles.recoveryPreview}>
              <Text style={{ fontSize: 12 }}>{ARTICULOS_RECUPERACION[0].emoji}</Text>
              <Text style={[styles.recoveryPreviewTitle, { color: COLORS.textPrimary }]} numberOfLines={1}>{ARTICULOS_RECUPERACION[0].titulo}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => abrirArticulo(ARTICULOS_RECUPERACION[0])}>
              <Text style={[styles.miniAction, { color: '#2F9E4D', marginTop: 8 }]}>Ver todo &gt;</Text>
            </TouchableOpacity>
          </SoftCard>
        ) : null}

        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Premium')} style={[styles.halfCard, { flex: usuario?.modoRecuperacion ? 1 : undefined, width: usuario?.modoRecuperacion ? undefined : '100%' }]}>
          <LinearGradient colors={['#07111F', '#121A2A']} style={styles.premiumMini}>
            <Text style={{ fontSize: 20 }}>ðŸ’Ž</Text>
            <Text style={styles.premiumMiniTitle} numberOfLines={1}>Cahuin a Fondo</Text>
            <Text style={styles.premiumMiniSub} numberOfLines={2}>Revela likes, La Pica y Modo Destacado.</Text>
            <View style={styles.premiumMiniButton}>
              <Text style={styles.premiumMiniButtonText}>Mejorar &gt;</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* â”€â”€ Preguntas anÃ³nimas â”€â”€ */}
      <SoftCard COLORS={COLORS} style={styles.questionsCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon name="chatbubble-ellipses" color={COLORS.primario} bg={COLORS.softRed} size={42} rounded={21} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Preguntas anÃ³nimas</Text>
            <Text style={styles.infoSub}>Lo que te mandan desde otros perfiles.</Text>
          </View>
          {cargandoPreguntas ? <ActivityIndicator color={COLORS.primario} /> : <Text style={styles.counterPill}>{preguntasPendientes.length}</Text>}
        </View>

        {preguntas.length === 0 ? (
          <View style={styles.emptyQuestionBox}>
            <Text style={styles.emptyQuestionTitle}>TodavÃ­a no hay preguntas.</Text>
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

      {/* â”€â”€ Tests de personalidad â”€â”€ */}
      {testsPendientes.length > 0 ? (
        <SoftCard COLORS={COLORS} style={styles.testsCard}>
          <View style={styles.cardTitleRow}>
            <SoftIcon name="sparkles" color="#8B5CF6" bg={COLORS.softPurple} size={42} rounded={21} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Tests de personalidad</Text>
              <Text style={styles.infoSub}>Descubre tu apego y arquetipo.</Text>
            </View>
          </View>
          <View style={styles.testActions}>
            {testsPendientes.map((test) => (
              <TouchableOpacity key={test.key} style={styles.testButton} onPress={() => navigation.navigate(test.route)}>
                <Text style={styles.testEmoji}>{test.emoji}</Text>
                <Text style={styles.testText}>{test.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SoftCard>
      ) : null}

      {/* â”€â”€ Insignias visibles â”€â”€ */}
      {(mostrarResultadoApego || mostrarResultadoArquetipo) ? (
        <SoftCard COLORS={COLORS} style={styles.testsCard}>
          <View style={styles.cardTitleRow}>
            <SoftIcon name="checkmark-done" color="#34A853" bg={COLORS.softGreen} size={42} rounded={21} />
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

      {/* â”€â”€ Modals â”€â”€ */}
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
  // â”€â”€ Header â”€â”€
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', fontFamily: FONTS.display },
  settingsButton: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light,
  },

  // â”€â”€ Hero horizontal â”€â”€
  heroRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: SPACING[5],
  },
  avatarOuter: { width: 110, height: 110 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: COLORS.primario, backgroundColor: COLORS.softRed },
  editBubble: {
    position: 'absolute', right: -2, bottom: 2,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.light,
  },
  heroInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display, flexShrink: 1 },
  location: { color: COLORS.textMuted, fontSize: 14, marginBottom: 8 },
  editPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    backgroundColor: COLORS.surfaceCard, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 4,
  },
  editPillText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  verifiedText: { fontSize: 12, fontWeight: '700', color: COLORS.compatHigh, marginTop: 2 },

  // â”€â”€ Completitud â”€â”€
  completitudCard: { marginBottom: SPACING[4] },
  completitudRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  completitudCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: COLORS.compatHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  completitudPercent: { fontSize: 16, fontWeight: '900', fontFamily: FONTS.display },
  completitudTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800' },
  completitudSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  completitudAction: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // â”€â”€ Stats â”€â”€
  statsCard: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[4] },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[2] },
  statDivider: { width: 1, height: 48, backgroundColor: COLORS.border },
  statValue: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  statLabel: { color: COLORS.textMuted, fontSize: 13, marginTop: 1 },
  statAction: { fontSize: 12, fontWeight: '700', marginTop: 1 },

  // â”€â”€ Likes â”€â”€
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

  // â”€â”€ Two columns â”€â”€
  twoCol: { flexDirection: 'row', gap: SPACING[2], marginBottom: SPACING[4] },
  halfCard: { flex: 1, padding: SPACING[3] },
  miniHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 4 },
  miniTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '800', flexShrink: 1 },
  miniAction: { fontSize: 12, fontWeight: '700' },
  editMiniBtn: { padding: 4, backgroundColor: 'rgba(240,68,79,0.1)', borderRadius: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: COLORS.tarjeta },
  tagText: { color: COLORS.textPrimary, fontSize: 11, fontWeight: '700' },

  // â”€â”€ Recovery compact â”€â”€
  recoveryPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, backgroundColor: COLORS.tarjeta, borderRadius: 12 },
  recoveryPreviewTitle: { fontSize: 11, fontWeight: '700', flex: 1 },

  // â”€â”€ Premium mini â”€â”€
  premiumMini: { borderRadius: 16, padding: 12, ...SHADOWS.dark },
  premiumMiniTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', fontFamily: FONTS.display, marginTop: 4 },
  premiumMiniSub: { color: '#CBD5E1', fontSize: 11, lineHeight: 14, marginTop: 2 },
  premiumMiniButton: { backgroundColor: '#FFD166', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8 },
  premiumMiniButtonText: { color: '#111827', fontSize: 11, fontWeight: '900' },

  // â”€â”€ Questions â”€â”€
  questionsCard: { marginBottom: SPACING[4] },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING[3] },
  infoTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '900', flex: 1 },
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

  // â”€â”€ Tests â”€â”€
  testsCard: { marginBottom: SPACING[4] },
  testActions: { flexDirection: 'row', gap: SPACING[2] },
  testButton: { flex: 1, minHeight: 72, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: SPACING[2], justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  testEmoji: { fontSize: 22, marginBottom: 4 },
  testText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  testResults: { marginTop: SPACING[2], backgroundColor: COLORS.softPurple, borderRadius: 14, padding: SPACING[2], gap: 3 },
  testResultText: { color: '#7C3AED', fontWeight: '800', fontSize: 13 },

  // â”€â”€ Modals â”€â”€
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
