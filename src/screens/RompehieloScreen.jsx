import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { matchService } from '../services/api';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const PREGUNTAS = [
  { p: "¿Qué prefieres comer en una primera cita?", a: "Asado o Parrillada 🥩", b: "Sushi o Comida Fina 🍣" },
  { p: "Fin de semana ideal...", a: "Playa o Río 🏖️", b: "Montaña o Bosque 🏕️" },
  { p: "Viernes por la noche...", a: "Carrete intenso 🕺", b: "Netflix & Chill 🍿" }
];

export default function RompehieloScreen({ route, navigation }) {
  const { matchId, usuario } = route.params;
  const { COLORS } = useTheme();
  const styles = getStyles(COLORS);

  const [indiceActual, setIndiceActual] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const seleccionarOpcion = async (respuestaText) => {
    const nuevasRespuestas = [...respuestas, respuestaText];
    setRespuestas(nuevasRespuestas);

    if (indiceActual < PREGUNTAS.length - 1) {
      setIndiceActual(indiceActual + 1);
    } else {
      setGuardando(true);
      try {
        await matchService.responderRompehielo(matchId, nuevasRespuestas);
        // 🌟 NAVEGACIÓN CORREGIDA: Agregamos la compatibilidad por defecto
        navigation.replace('SalaChat', { matchId, usuario, elYaRespondio: false, compatibilidad: 85 });
      } catch (error) {
        console.log(error);
        setGuardando(false);
      }
    }
  };

  if (guardando) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={{ marginTop: 15, color: COLORS.textPrimary, fontWeight: 'bold' }}>Calculando compatibilidad secreta...</Text>
      </SafeAreaView>
    );
  }

  const pregunta = PREGUNTAS[indiceActual];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progresoContenedor}>
        <View style={[styles.barraProgreso, { width: `${((indiceActual + 1) / 3) * 100}%` }]} />
      </View>

      <View style={styles.contenedorCentral}>
        <Text style={styles.titulo}>Rompehielos 🧊</Text>
        <Text style={styles.subtitulo}>Responde 3 preguntas rápidas antes de hablar con {usuario?.nombre}. Cuando ambos respondan, verán su % de compatibilidad.</Text>
        
        <View style={styles.tarjetaPregunta}>
          <Text style={styles.preguntaTexto}>{pregunta.p}</Text>
          
          <TouchableOpacity style={styles.botonOpcion} onPress={() => seleccionarOpcion(pregunta.a)}>
            <Text style={styles.textoOpcion}>{pregunta.a}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.botonOpcion} onPress={() => seleccionarOpcion(pregunta.b)}>
            <Text style={styles.textoOpcion}>{pregunta.b}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  progresoContenedor: { height: 6, backgroundColor: COLORS.border, width: '100%' },
  barraProgreso: { height: '100%', backgroundColor: COLORS.primario },
  contenedorCentral: { flex: 1, padding: SPACING[6], justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 32, fontWeight: 'bold', color: COLORS.primario, fontFamily: FONTS.display, marginBottom: 10 },
  subtitulo: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  tarjetaPregunta: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl, width: '100%', ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.border },
  preguntaTexto: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 25 },
  botonOpcion: { backgroundColor: COLORS.fondo, borderWidth: 2, borderColor: COLORS.primario, paddingVertical: 18, borderRadius: RADIUS.lg, marginBottom: 15, alignItems: 'center' },
  textoOpcion: { fontSize: 16, fontWeight: 'bold', color: COLORS.primario }
});