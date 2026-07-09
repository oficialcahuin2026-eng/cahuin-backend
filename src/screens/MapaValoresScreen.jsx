import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const PREGUNTAS_VALORES = [
  { p: "¿Qué cualidad valoras más en una pareja?", opciones: ["Lealtad incondicional", "Honestidad brutal"] },
  { p: "¿Cuál es tu postura sobre tener hijos en el futuro?", opciones: ["Sí, me encantaría", "No está en mis planes", "Quizás, depende de la vida"] },
  { p: "¿Cuál es tu mayor 'Red Flag' (motivo de término inmediato)?", opciones: ["Mentiras/Infidelidad", "Falta de ambición", "Mala comunicación"] },
  { p: "En cuanto al manejo del dinero, tú eres más de...", opciones: ["Ahorrar e invertir", "Disfrutar el presente"] },
  { p: "Para resolver un conflicto, tú prefieres...", opciones: ["Hablarlo al instante", "Tomar espacio y luego hablar"] }
];

export default function MapaValoresScreen({ navigation }) {
  const { COLORS } = useTheme();
  const { actualizarUsuario } = useAuth();
  const styles = getStyles(COLORS);

  const [index, setIndex] = useState(0);
  const [respuestas, setRespuestas] = useState({ prioridadLealtad: false, planesHijos: '', dealBreaker: '' });
  const [cargando, setCargando] = useState(false);

  const responder = async (opcionElegida) => {
    let nuevasRespuestas = { ...respuestas };

    // Mapear respuestas a la base de datos
    if (index === 0) nuevasRespuestas.prioridadLealtad = opcionElegida === "Lealtad incondicional";
    if (index === 1) nuevasRespuestas.planesHijos = opcionElegida;
    if (index === 2) nuevasRespuestas.dealBreaker = opcionElegida;

    setRespuestas(nuevasRespuestas);

    if (index < PREGUNTAS_VALORES.length - 1) {
      setIndex(index + 1);
    } else {
      setCargando(true);
      try {
        const res = await userService.actualizar({ mapaValores: nuevasRespuestas });
        actualizarUsuario(res.usuario);
        const resumen = nuevasRespuestas.prioridadLealtad ? 'Valoras profundamente la lealtad incondicional.' : 'Eres una persona que prefiere la honestidad brutal.';
        Alert.alert('¡Mapa Completado! 🗺️', `${resumen}\n\nTu algoritmo ahora te conectará con personas que comparten tus mismos valores de vida.`, [
          { text: 'Excelente', onPress: () => navigation.goBack() }
        ]);
      } catch (e) { 
        Alert.alert('Error', 'No pudimos guardar tus respuestas.'); 
      } finally { 
        setCargando(false); 
      }
    }
  };

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={{ marginTop: 15, color: COLORS.textPrimary, fontWeight: 'bold' }}>Alineando tus valores con el universo...</Text>
      </View>
    );
  }

  const pregunta = PREGUNTAS_VALORES[index];

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.contador}>Pregunta de Valor {index + 1} de {PREGUNTAS_VALORES.length}</Text>
      <View style={styles.card}>
        <Text style={styles.pregunta}>{pregunta.p}</Text>
        
        {pregunta.opciones.map((opcion, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => responder(opcion)}>
            <Text style={styles.btnTxt}>{opcion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: 'center' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  contador: { textAlign: 'center', fontSize: 14, color: COLORS.textMuted, marginBottom: 15, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.tarjeta, padding: 25, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.md },
  pregunta: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 30 },
  btn: { borderWidth: 2, borderColor: COLORS.primario, padding: 18, borderRadius: RADIUS.lg, marginBottom: 15, alignItems: 'center', backgroundColor: COLORS.fondo },
  btnTxt: { color: COLORS.primario, fontWeight: 'bold', fontSize: 16 }
});