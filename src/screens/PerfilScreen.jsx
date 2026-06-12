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
import { ScreenHeader, ScreenScaffold, SoftCard, SoftIcon } from '../components/CahuinUI';
import CahuinTextField from '../components/CahuinTextField';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

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
    emoji: '⏱️',
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

  const lifestyleTags = [
    usuario?.queBuscas || 'Pololeo serio 💖',
    usuario?.habitos?.beber || 'Cero alcohol 💧',
    usuario?.habitos?.fumar || 'No le hago 🚭',
    usuario?.habitos?.mascotas || 'Dog Lover 🐶',
  ].filter(Boolean);

  const intereses = usuario?.intereses?.length ? usuario.intereses : ['Videojuegos 🎮', 'Naturaleza 🌲', 'Astrologia ✨', 'Fotografia 📸', 'Cine y Series 🍿'];
  const preguntasPendientes = preguntas.filter((p) => !p.respondida);
  const preguntasRespondidas = preguntas.filter((p) => p.respondida);
  const valoresCompletos = Boolean(
    usuario?.mapaValores?.planesHijos &&
    usuario.mapaValores.planesHijos !== 'Por definir' &&
    usuario?.mapaValores?.dealBreaker
  );
  const testsPendientes = [
    !usuario?.tipoApego ? { key: 'apego', label: 'Test de Apego', emoji: '🧠', route: 'TestApego' } : null,
    !usuario?.arquetipoCahuinero ? { key: 'cahuinero', label: 'Test Cahuínero', emoji: '🌶️', route: 'TestCahuinero' } : null,
    !valoresCompletos ? { key: 'valores', label: 'Mapa de Valores', emoji: '🧭', route: 'MapaValores' } : null,
  ].filter(Boolean);
  const mostrarResultadoApego = usuario?.mostrarApego && usuario?.tipoApego;
  const mostrarResultadoArquetipo = usuario?.mostrarArquetipo !== false && usuario?.arquetipoCahuinero;
  const likesPreview = likesData.likes;
  const hayLikesReales = likesData.likes.length > 0;

  return (
    <ScreenScaffold COLORS={COLORS}>
      <ScreenHeader
        title="Mi Perfil"
        centered
        right={(
          <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('Ajustes')}>
            <Ionicons name="settings-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      />

      <View style={styles.profileHero}>
        <View style={styles.avatarOuter}>
          <Image source={{ uri: usuario?.foto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300' }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBubble} onPress={() => navigation.navigate('EditarPerfil')}>
            <Ionicons name="pencil" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{usuario?.nombre || 'Cahuinero'}, {usuario?.edad || '??'}</Text>
          {usuario?.verificado ? <MaterialCommunityIcons name="check-decagram" size={28} color="#3B82F6" /> : null}
        </View>
        <Text style={styles.location}>📍 {usuario?.ciudad || 'Por definir'}</Text>
        <TouchableOpacity style={styles.editInfoButton} onPress={() => navigation.navigate('EditarPerfil')}>
          <Ionicons name="pencil" size={18} color="#FFF" />
          <Text style={styles.editInfoText}>Editar Informacion</Text>
        </TouchableOpacity>
        {!usuario?.verificado ? (
          <TouchableOpacity style={styles.verifyButton} onPress={verificarConSelfie}>
            <Ionicons name="camera" size={18} color={COLORS.primario} />
            <Text style={styles.verifyText}>Verificar con selfie</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <SoftCard COLORS={COLORS} style={styles.statsCard}>
        <View style={styles.statBox}>
          <SoftIcon emoji="🔥" bg={COLORS.softRed} size={70} rounded={22} iconSize={34} />
          <View>
            <Text style={styles.statValue}>{usuario?.rachaDias || 1} día</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <SoftIcon emoji="🪙" bg={COLORS.softAmber} size={70} rounded={22} iconSize={34} />
          <View>
            <Text style={styles.statValue}>{usuario?.cahuines || 0}</Text>
            <Text style={styles.statLabel}>Cahuines</Text>
          </View>
        </View>
      </SoftCard>

      {(cargandoLikes || hayLikesReales) ? (
      <SoftCard COLORS={COLORS} style={styles.likesCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon name="heart" color={COLORS.primario} bg={COLORS.softRed} size={46} rounded={23} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Quien te dio like</Text>
            <Text style={styles.infoSub}>
              {likesData.puedeRevelar
                ? 'Gold y Platinum desbloquean estos perfiles.'
                : 'Desbloquéalo con Gold o Platinum desde Cahuín Web.'}
            </Text>
          </View>
          {cargandoLikes ? <ActivityIndicator color={COLORS.primario} /> : <Text style={styles.counterPill}>{likesData.likes.length}</Text>}
        </View>

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
                  <Text style={styles.likeName}>{likesData.puedeRevelar ? `${item.nombre || 'Cahuín'}, ${item.edad || ''}` : `Alguien, ${item.edad || '??'}`}</Text>
                  <Text style={styles.likeMeta}>{likesData.puedeRevelar ? (item.ciudad || 'Cerca tuyo') : (item.activoReciente ? 'Activo recientemente' : 'Te dio like')}</Text>
                </View>
                {!likesData.puedeRevelar && hayLikesReales ? (
                  <View style={styles.lockBubble}>
                    <Ionicons name="lock-closed" size={15} color="#FFF" />
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        ) : null}

        {!likesData.puedeRevelar && hayLikesReales ? (
          <TouchableOpacity style={styles.unlockLikesButton} onPress={() => navigation.navigate('Premium')}>
            <Text style={styles.unlockLikesText}>Descubrir a quién le gustó</Text>
          </TouchableOpacity>
        ) : null}
      </SoftCard>
      ) : null}

      {false ? (
      <>
      <SoftCard COLORS={COLORS} style={styles.analyticsCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon emoji="🔥" bg={COLORS.softRed} size={46} rounded={23} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Racha diaria de swipes</Text>
            <Text style={styles.infoSub}>Si completas 7 dias seguidos, ganas un Boost gratis de 30 minutos.</Text>
          </View>
          <Text style={styles.counterPill}>{usuario?.rachaSwipesDias || 0}</Text>
        </View>
        <View style={styles.streakBoostRow}>
          <Text style={styles.testResultText}>Boosts gratis: {usuario?.boostGratisDisponibles || 0}</Text>
          <TouchableOpacity style={styles.saveStreakButton} onPress={salvarRachaSwipes}>
            <Text style={styles.saveStreakText}>Salvar por 1 Cahuín</Text>
          </TouchableOpacity>
        </View>
      </SoftCard>

      <SoftCard COLORS={COLORS} style={styles.analyticsCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon name="analytics" color="#8B5CF6" bg={COLORS.softPurple} size={46} rounded={23} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Analytics de perfil</Text>
            <Text style={styles.infoSub}>{usuario?.isPremium ? 'Tu rendimiento esta semana.' : 'Vista previa Premium para mejorar tu perfil.'}</Text>
          </View>
          <Text style={styles.counterPill}>{analytics?.vistasSemana || 0}</Text>
        </View>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsValue}>{analytics?.vistasSemana || 0}</Text>
            <Text style={styles.analyticsLabel}>vistas esta semana</Text>
          </View>
          <View style={styles.analyticsBox}>
            <Text style={styles.analyticsValue}>{analytics?.segundosFotoTop || 0}s</Text>
            <Text style={styles.analyticsLabel}>en tu foto principal</Text>
          </View>
        </View>
        {(analytics?.interesesTop || []).length ? (
          <View style={styles.analyticsTags}>
            {analytics.interesesTop.map((item) => (
              <View key={item.nombre} style={styles.analyticsTag}>
                <Text style={styles.analyticsTagText}>{item.nombre} · {item.likes} likes</Text>
              </View>
            ))}
          </View>
        ) : null}
      </SoftCard>

      </>
      ) : null}

      {testsPendientes.length > 0 ? (
      <SoftCard COLORS={COLORS} style={styles.testsCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon name="sparkles" color="#8B5CF6" bg={COLORS.softPurple} size={46} rounded={23} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Tests de personalidad</Text>
            <Text style={styles.infoSub}>Descubre tu apego y tu arquetipo cahuínero. Tú decides si se ve en el perfil.</Text>
          </View>
        </View>
        <View style={styles.testActions}>
          <TouchableOpacity style={styles.testButton} onPress={() => navigation.navigate('TestApego')}>
            <Text style={styles.testEmoji}>🧠</Text>
            <Text style={styles.testText}>Test de Apego</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => navigation.navigate('TestCahuinero')}>
            <Text style={styles.testEmoji}>🌶️</Text>
            <Text style={styles.testText}>Test Cahuínero</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => navigation.navigate('MapaValores')}>
            <Text style={styles.testEmoji}>🧭</Text>
            <Text style={styles.testText}>Mapa de Valores</Text>
          </TouchableOpacity>
        </View>
        {(usuario?.tipoApego || usuario?.arquetipoCahuinero) ? (
          <View style={styles.testResults}>
            {usuario?.tipoApego ? <Text style={styles.testResultText}>Apego: {usuario.tipoApego}</Text> : null}
            {usuario?.arquetipoCahuinero ? <Text style={styles.testResultText}>Arquetipo: {usuario.arquetipoCahuinero}</Text> : null}
          </View>
        ) : null}
      </SoftCard>
      ) : null}

      {(mostrarResultadoApego || mostrarResultadoArquetipo) ? (
        <SoftCard COLORS={COLORS} style={styles.testsCard}>
          <View style={styles.cardTitleRow}>
            <SoftIcon name="checkmark-done" color="#34A853" bg={COLORS.softGreen} size={46} rounded={23} />
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

      {usuario?.modoRecuperacion ? (
        <View style={styles.recoveryCard}>
          <View style={styles.recoveryHeader}>
            <SoftIcon name="leaf" color="#34A853" bg="#DFF6E5" size={58} rounded={29} />
            <View style={{ flex: 1 }}>
              <Text style={styles.recoveryTitle}>Volviendo a florecer</Text>
              <Text style={styles.recoverySub}>Lecturas para volver a conocer gente con calma.</Text>
            </View>
          </View>
          {ARTICULOS_RECUPERACION.map((art) => (
            <TouchableOpacity key={art.id} style={styles.articleRow} onPress={() => abrirArticulo(art)} activeOpacity={0.9}>
              <Text style={styles.articleEmoji}>{art.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleTitle}>{art.titulo}</Text>
                <Text style={styles.articleTime}>{art.lectura}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <SoftCard COLORS={COLORS} style={styles.questionsCard}>
        <View style={styles.cardTitleRow}>
          <SoftIcon name="chatbubble-ellipses" color={COLORS.primario} bg={COLORS.softRed} size={46} rounded={23} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Preguntas anónimas</Text>
            <Text style={styles.infoSub}>Lo que te mandan desde otros perfiles llega aqui.</Text>
          </View>
          {cargandoPreguntas ? <ActivityIndicator color={COLORS.primario} /> : <Text style={styles.counterPill}>{preguntasPendientes.length}</Text>}
        </View>

        {preguntas.length === 0 ? (
          <View style={styles.emptyQuestionBox}>
            <Text style={styles.emptyQuestionTitle}>Todavía no hay preguntas.</Text>
            <Text style={styles.emptyQuestionText}>Cuando alguien te mande una, podras responderla y decidir publicarla en tu perfil.</Text>
          </View>
        ) : (
          <>
            {preguntasPendientes.slice(0, 4).map((item) => (
              <TouchableOpacity key={item._id} style={styles.questionRow} onPress={() => abrirResponder(item)} activeOpacity={0.9}>
                <Text style={styles.questionMark}>?</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.questionText}>{item.pregunta}</Text>
                  <Text style={styles.questionHint}>Toca para responder</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.textMuted} />
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

      <View style={styles.twoCol}>
        <SoftCard COLORS={COLORS} style={[styles.infoCard, styles.halfCard]}>
          <View style={styles.cardTitleRow}>
            <SoftIcon name="heart" color={COLORS.primario} bg={COLORS.softRed} size={42} rounded={21} />
            <Text style={styles.infoTitle}>Mi Estilo de Vida</Text>
          </View>
          <View style={styles.tagsContainer}>
            {lifestyleTags.map((tag, idx) => (
              <View key={`${tag}-${idx}`} style={[styles.tag, { borderColor: 'rgba(240,68,79,0.22)' }]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </SoftCard>

        <SoftCard COLORS={COLORS} style={[styles.infoCard, styles.halfCard]}>
          <View style={styles.cardTitleRow}>
            <SoftIcon name="star" color="#8B5CF6" bg={COLORS.softPurple} size={42} rounded={21} />
            <Text style={styles.infoTitle}>Mis Gustos y Pasatiempos</Text>
          </View>
          <View style={styles.tagsContainer}>
            {intereses.map((interes, idx) => (
              <View key={`${interes}-${idx}`} style={[styles.tag, { borderColor: 'rgba(139,92,246,0.28)' }]}>
                <Text style={[styles.tagText, { color: '#7C3AED' }]}>✨ {interes}</Text>
              </View>
            ))}
          </View>
        </SoftCard>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('Premium')} style={styles.premiumWrap}>
        <LinearGradient colors={['#07111F', '#121A2A']} style={styles.premiumCard}>
          <Text style={styles.diamond}>💎</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Cahuín Premium</Text>
            <Text style={styles.premiumSub}>Desbloquea funciones exclusivas y consigue más visibilidad.</Text>
          </View>
          <View style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Mejorar ahora</Text>
            <Ionicons name="chevron-forward" size={18} color="#111827" />
          </View>
        </LinearGradient>
      </TouchableOpacity>

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
  settingsButton: { position: 'absolute', right: 0, top: -16, width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tarjeta, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.light },
  profileHero: { alignItems: 'center', marginTop: SPACING[2], marginBottom: SPACING[6] },
  avatarOuter: { width: 150, height: 150 },
  avatar: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, borderColor: '#192234', backgroundColor: COLORS.softRed },
  editBubble: { position: 'absolute', right: 0, bottom: 8, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING[4] },
  name: { color: COLORS.textPrimary, fontSize: 34, fontWeight: '900', fontFamily: FONTS.display, textAlign: 'center' },
  location: { color: COLORS.textMuted, fontSize: 17, marginTop: 5 },
  editInfoButton: { marginTop: SPACING[4], flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#182033', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, ...SHADOWS.light },
  editInfoText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  verifyButton: { marginTop: SPACING[3], flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.softRed, borderWidth: 1, borderColor: 'rgba(240,68,79,0.25)', paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24 },
  verifyText: { color: COLORS.primario, fontWeight: '900', fontSize: 14 },
  statsCard: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[5] },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING[3] },
  statDivider: { width: 1, height: 58, backgroundColor: COLORS.border },
  statValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  statLabel: { color: COLORS.textMuted, fontSize: 15, marginTop: 2 },
  likesCard: { marginBottom: SPACING[5] },
  likesStrip: { gap: SPACING[3], paddingRight: SPACING[2] },
  likeTile: { width: 150, height: 210, borderRadius: 22, overflow: 'hidden', backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border },
  likePhoto: { width: '100%', height: '100%', position: 'absolute' },
  likeOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 108 },
  likeInfo: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  likeName: { color: '#FFF', fontSize: 17, fontWeight: '900', fontFamily: FONTS.display },
  likeMeta: { color: '#FDE68A', fontSize: 12, fontWeight: '900', marginTop: 3 },
  lockBubble: { position: 'absolute', right: 10, top: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(17,24,39,0.8)', alignItems: 'center', justifyContent: 'center' },
  unlockLikesButton: { minHeight: 52, borderRadius: 18, backgroundColor: COLORS.textPrimary, alignItems: 'center', justifyContent: 'center', marginTop: SPACING[3] },
  unlockLikesText: { color: COLORS.bg, fontWeight: '900', fontSize: 15 },
  recoveryCard: { backgroundColor: '#F0FAF2', borderWidth: 1, borderColor: '#BDE8C6', borderRadius: RADIUS.xl, padding: SPACING[4], marginBottom: SPACING[5], ...SHADOWS.light },
  recoveryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], marginBottom: SPACING[4] },
  recoveryTitle: { color: '#2F9E4D', fontSize: 22, fontWeight: '900', fontFamily: FONTS.display },
  recoverySub: { color: COLORS.textMuted, fontSize: 15, lineHeight: 21, marginTop: 2 },
  articleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.tarjeta, borderRadius: 18, padding: SPACING[3], marginTop: SPACING[3], ...SHADOWS.light },
  articleEmoji: { fontSize: 28, width: 44 },
  articleTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900' },
  articleTime: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  questionsCard: { marginBottom: SPACING[5] },
  testsCard: { marginBottom: SPACING[5] },
  testActions: { flexDirection: 'row', gap: SPACING[3] },
  testButton: { flex: 1, minHeight: 92, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: SPACING[3], justifyContent: 'center', ...SHADOWS.light },
  testEmoji: { fontSize: 25, marginBottom: 8 },
  testText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  testResults: { marginTop: SPACING[3], backgroundColor: COLORS.softPurple, borderRadius: 18, padding: SPACING[3], gap: 4 },
  testResultText: { color: '#7C3AED', fontWeight: '900' },
  streakBoostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING[3], backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: SPACING[3] },
  saveStreakButton: { borderRadius: 99, borderWidth: 1, borderColor: COLORS.primario, paddingHorizontal: 12, paddingVertical: 9 },
  saveStreakText: { color: COLORS.primario, fontSize: 12, fontWeight: '900' },
  analyticsCard: { marginBottom: SPACING[5] },
  analyticsGrid: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[2] },
  analyticsBox: { flex: 1, backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: SPACING[3] },
  analyticsValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  analyticsLabel: { color: COLORS.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  analyticsTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING[3] },
  analyticsTag: { backgroundColor: COLORS.softPurple, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  analyticsTagText: { color: '#7C3AED', fontSize: 12, fontWeight: '900' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING[3] },
  infoTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '900', flex: 1 },
  infoSub: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  counterPill: { minWidth: 32, textAlign: 'center', color: '#FFF', backgroundColor: COLORS.primario, borderRadius: 16, paddingVertical: 5, overflow: 'hidden', fontWeight: '900' },
  emptyQuestionBox: { backgroundColor: COLORS.fondo, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: SPACING[4] },
  emptyQuestionTitle: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 15 },
  emptyQuestionText: { color: COLORS.textMuted, marginTop: 5, lineHeight: 20 },
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[3], backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: SPACING[3], marginTop: SPACING[2] },
  questionMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.softPurple, color: COLORS.primario, textAlign: 'center', textAlignVertical: 'center', fontSize: 20, fontWeight: '900' },
  questionText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  questionHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  answeredBox: { backgroundColor: COLORS.softGreen, borderWidth: 1, borderColor: 'rgba(52,168,83,0.22)', borderRadius: 18, padding: SPACING[3], marginTop: SPACING[2] },
  answeredQuestion: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  answeredText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 21, marginTop: 5, fontWeight: '800' },
  twoCol: { flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[5] },
  halfCard: { flex: 1, padding: SPACING[3] },
  infoCard: { minHeight: 210 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: COLORS.tarjeta },
  tagText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '800' },
  premiumWrap: { marginBottom: SPACING[6] },
  premiumCard: { borderRadius: 24, padding: SPACING[4], flexDirection: 'row', alignItems: 'center', gap: SPACING[3], overflow: 'hidden', ...SHADOWS.dark },
  diamond: { fontSize: 34 },
  premiumTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', fontFamily: FONTS.display },
  premiumSub: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginTop: 3 },
  premiumButton: { backgroundColor: '#FFD166', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 4 },
  premiumButtonText: { color: '#111827', fontSize: 13, fontWeight: '900' },
  articleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  articleModalBody: { padding: 25, paddingBottom: 100 },
  articleModalEmoji: { fontSize: 52, marginBottom: 15 },
  articleModalTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display, marginBottom: 25 },
  articleModalText: { fontSize: 17, color: COLORS.textPrimary, lineHeight: 28 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(17,24,39,0.58)', justifyContent: 'flex-end' },
  answerModal: { backgroundColor: COLORS.tarjeta, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: SPACING[5] },
  answerTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: FONTS.display },
  answerQuestion: { color: COLORS.textMuted, fontSize: 16, lineHeight: 23, marginTop: 12, marginBottom: 14 },
  answerInput: { minHeight: 130, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.fondo, color: COLORS.textPrimary, padding: SPACING[4], textAlignVertical: 'top', fontSize: 16 },
  answerActions: { flexDirection: 'row', gap: SPACING[3], marginTop: SPACING[4] },
  cancelButton: { flex: 1, minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: COLORS.textPrimary, fontWeight: '900' },
  publishButton: { flex: 1, minHeight: 54, borderRadius: 18, backgroundColor: COLORS.primario, alignItems: 'center', justifyContent: 'center' },
  publishButtonText: { color: '#FFF', fontWeight: '900' },
});
