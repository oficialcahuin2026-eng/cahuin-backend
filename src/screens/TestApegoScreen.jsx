import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const PREGUNTAS_APEGO = [
  { p: "¿Te preocupa constantemente que tu pareja deje de quererte o te abandone?", ansioso: true },
  { p: "Cuando alguien se acerca demasiado afectivamente, ¿sientes la necesidad de alejarte o proteger tu espacio?", evitativo: true },
  { p: "Te resulta fácil confiar en los demás y depender de ellos de manera sana.", seguro: true },
  { p: "¿Tiendes a analizar en exceso los mensajes de texto o silencios de la otra persona?", ansioso: true },
  { p: "Prefieres solucionar tus problemas solo/a y te incomoda pedir apoyo emocional.", evitativo: true },
  { p: "Expresas tus necesidades y límites con claridad sin temor al rechazo inmediato.", seguro: true }
];

export default function TestApegoScreen({ navigation }) {
  const { COLORS } = useTheme();
  const { actualizarUsuario } = useAuth();
  const styles = getStyles(COLORS);

  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({ Ansioso: 0, Evitativo: 0, Seguro: 0 });
  const [cargando, setCargando] = useState(false);

  const responder = async (afirmacion) => {
    let nuevosPuntajes = { ...scores };
    const q = PREGUNTAS_APEGO[index];

    if (afirmacion) {
      if (q.ansioso) nuevosPuntajes.Ansioso += 2;
      if (q.evitativo) nuevosPuntajes.Evitativo += 2;
      if (q.seguro) nuevosPuntajes.Seguro += 2;
    } else {
      if (q.ansioso) nuevosPuntajes.Seguro += 1;
      if (q.evitativo) nuevosPuntajes.Seguro += 1;
      if (q.seguro) {
        nuevosPuntajes.Ansioso += 1;
        nuevosPuntajes.Evitativo += 1;
      }
    }

    setScores(nuevosPuntajes);

    if (index < PREGUNTAS_APEGO.length - 1) {
      setIndex(index + 1);
    } else {
      setCargando(true);
      let ganador = 'Seguro';
      if (nuevosPuntajes.Ansioso > nuevosPuntajes.Seguro && nuevosPuntajes.Ansioso > nuevosPuntajes.Evitativo) ganador = 'Ansioso';
      if (nuevosPuntajes.Evitativo > nuevosPuntajes.Seguro && nuevosPuntajes.Evitativo > nuevosPuntajes.Ansioso) ganador = 'Evitativo';

      try {
        const res = await userService.actualizar({ tipoApego: ganador });
        
        // 🌟 PREGUNTAMOS SI QUIERE MOSTRARLO AL PÚBLICO
        Alert.alert(
          'Test Completado 🧠', 
          `Tu estilo de apego predominante es: ${ganador}.\n\n¿Quieres que este resultado sea visible en tu perfil para tus futuros matches?`, 
          [
            { text: 'No, ocultarlo', onPress: async () => {
                await userService.actualizar({ mostrarApego: false });
                if(actualizarUsuario) actualizarUsuario({ ...res.usuario, mostrarApego: false });
                navigation.goBack();
            }},
            { text: 'Sí, mostrarlo', onPress: async () => {
                await userService.actualizar({ mostrarApego: true });
                if(actualizarUsuario) actualizarUsuario({ ...res.usuario, mostrarApego: true });
                navigation.goBack();
            }}
          ]
        );
      } catch (e) { Alert.alert('Error', 'No guardó.'); } finally { setCargando(false); }
    }
  };

  if (cargando) return <View style={styles.centro}><ActivityIndicator size="large" color={COLORS.primario} /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.contador}>Pregunta {index + 1} de {PREGUNTAS_APEGO.length}</Text>
      <View style={styles.card}>
        <Text style={styles.pregunta}>{PREGUNTAS_APEGO[index].p}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => responder(true)}><Text style={styles.btnTxt}>Sí, totalmente de acuerdo</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { borderColor: COLORS.border }]} onPress={() => responder(false)}><Text style={styles.btnTxt}>No, no me identifica</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg, padding: 20, justifyContent: 'center' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  contador: { textAlign: 'center', fontSize: 14, color: COLORS.textMuted, marginBottom: 10 },
  card: { backgroundColor: COLORS.tarjeta, padding: 25, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border },
  pregunta: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 30 },
  btn: { borderWidth: 2, borderColor: COLORS.primario, padding: 15, borderRadius: RADIUS.lg, marginBottom: 15, alignItems: 'center' },
  btnTxt: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }
});