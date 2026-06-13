import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { matchService } from '../services/api';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const POOL_PREGUNTAS = [
  { p: "¿Qué prefieres comer en una primera cita?", a: "Asado o Parrillada 🥩", b: "Sushi o Comida Fina 🍣" },
  { p: "Fin de semana ideal...", a: "Playa o Río 🏖️", b: "Montaña o Bosque 🏕️" },
  { p: "Viernes por la noche...", a: "Carrete intenso 🕺", b: "Netflix & Chill 🍿" },
  { p: "Si pudieras viajar ahora mismo...", a: "Mochilero por Asia 🎒", b: "Resort en el Caribe 🍹" },
  { p: "Para escuchar todo el día...", a: "Reggaeton Old School 📻", b: "Indie / Pop 🎸" },
  { p: "Si ganaras la lotería...", a: "Compro casa frente al mar 🌊", b: "Viajo por el mundo ✈️" },
  { p: "¿Qué te hace reír más?", a: "Memes absurdos 🐸", b: "Humor negro 💀" },
  { p: "¿Qué valoras más en alguien?", a: "Su sentido del humor 😂", b: "Su honestidad 🤝" },
  { p: "Para el desayuno...", a: "Huevos y tostadas 🍳", b: "Avena y fruta 🍓" },
  { p: "En un parque de diversiones...", a: "Montaña rusa al revés 🎢", b: "Juegos tranquilitos 🎡" },
  { p: "¿Qué talento inútil tienes?", a: "Mover las orejas 👂", b: "Acordarme de cumpleaños 🎂" },
  { p: "Si fueras un animal...", a: "Un gato mimado 🐱", b: "Un perro feliz 🐶" },
  { p: "En una película de terror...", a: "El que muere primero 🔪", b: "El que sobrevive 🏃‍♂️" },
  { p: "Para beber...", a: "Cerveza artesanal 🍺", b: "Vino tinto 🍷" },
  { p: "¿Qué súper poder tendrías?", a: "Volar alto 🦅", b: "Leer mentes 🧠" }
];

export default function RompehieloScreen({ route, navigation }) {
  const { matchId, usuario } = route.params;
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [preguntas, setPreguntas] = React.useState([]);

  React.useEffect(() => {
    const shuffled = [...POOL_PREGUNTAS].sort(() => 0.5 - Math.random());
    setPreguntas(shuffled.slice(0, 3));
  }, []);

  const seleccionarOpcion = async (respuestaText) => {
    const nuevasRespuestas = [...respuestas, respuestaText];
    setRespuestas(nuevasRespuestas);

    if (indiceActual < preguntas.length - 1) {
      setIndiceActual(indiceActual + 1);
    } else {
      setGuardando(true);
      try {
        await matchService.responderRompehielo(matchId, nuevasRespuestas);
        // Entrar directo a SalaChat
        navigation.replace('SalaChat', { matchId, usuario, elYaRespondio: false, compatibilidad: 85 });
      } catch (error) {
        console.log(error);
        navigation.replace('SalaChat', { matchId, usuario, elYaRespondio: false, compatibilidad: 85 });
      }
    }
  };

  if (guardando) {
    return (
      <View style={styles.centroAbsoluto}>
        <LinearGradient colors={isDarkMode ? ['#0F172A', '#1E1B4B'] : ['#E0E7FF', '#FCE7F3']} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={styles.calculandoTexto}>Calculando compatibilidad secreta...</Text>
      </View>
    );
  }

  if (preguntas.length === 0) return null;
  const pregunta = preguntas[indiceActual];

  return (
    <View style={styles.root}>
      <LinearGradient 
        colors={isDarkMode ? ['#1e1b4b', '#020617'] : ['#FCE7F3', '#E0E7FF']} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <SafeAreaView style={styles.safe}>
        <View style={styles.progresoContenedor}>
          <View style={[styles.barraProgreso, { width: `${((indiceActual + 1) / preguntas.length) * 100}%`, backgroundColor: COLORS.primario }]} />
        </View>

        <View style={styles.contenedorCentral}>
          <View style={styles.iconWrap}>
            <Text style={styles.emojiDecoracion}>🧊</Text>
          </View>
          <Text style={styles.titulo}>Rompehielos</Text>
          <Text style={styles.subtitulo}>Responde {preguntas.length} preguntas rápidas antes de hablar con {usuario?.nombre}. Esto afinará su conexión.</Text>
          
          <View style={styles.tarjetaPregunta}>
            <Text style={styles.preguntaTexto}>{pregunta.p}</Text>
            
            <TouchableOpacity activeOpacity={0.8} style={styles.botonOpcion} onPress={() => seleccionarOpcion(pregunta.a)}>
              <LinearGradient colors={isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8FAFC']} style={styles.botonGradient}>
                <Text style={styles.textoOpcion}>{pregunta.a}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primario} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.8} style={styles.botonOpcion} onPress={() => seleccionarOpcion(pregunta.b)}>
              <LinearGradient colors={isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] : ['#FFFFFF', '#F8FAFC']} style={styles.botonGradient}>
                <Text style={styles.textoOpcion}>{pregunta.b}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primario} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  centroAbsoluto: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  calculandoTexto: { marginTop: 24, color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, zIndex: 2 },
  progresoContenedor: { height: 6, backgroundColor: 'rgba(0,0,0,0.1)', width: '100%' },
  barraProgreso: { height: '100%', borderRadius: 3 },
  
  contenedorCentral: { flex: 1, padding: SPACING[5], justifyContent: 'center', alignItems: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emojiDecoracion: { fontSize: 44 },
  titulo: { fontSize: 36, fontWeight: '900', color: COLORS.textPrimary, fontFamily: FONTS.display, marginBottom: 12 },
  subtitulo: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 40, lineHeight: 24, opacity: 0.8 },
  
  tarjetaPregunta: { width: '100%' },
  preguntaTexto: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 30, fontFamily: FONTS.display },
  
  botonOpcion: { marginBottom: 16, borderRadius: 20, ...SHADOWS.md },
  botonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 22, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  textoOpcion: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
});