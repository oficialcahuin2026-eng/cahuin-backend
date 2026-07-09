import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const PREGUNTAS = [
  { p: "¿Qué significa 'al tiro'?", opciones: [{t: "Al instante", a: "Cuico"}, {t: "En un rato", a: "Flaite"}, {t: "Mañana", a: "Roto"}, {t: "Nunca", a: "Señora"}] },
  { p: "Si alguien te dice que 'se le echó la yegua'...", opciones: [{t: "Le dio sueño/flojera", a: "Señora"}, {t: "Se le echó a perder el auto", a: "Cuico"}, {t: "Se enojó", a: "Flaite"}, {t: "Tiene hambre", a: "Roto"}] },
  { p: "El mejor panorama de domingo es...", opciones: [{t: "Brunch en un café", a: "Cuico"}, {t: "Persa Biobío", a: "Flaite"}, {t: "Completos en familia", a: "Roto"}, {t: "Limpiar la casa temprano", a: "Señora"}] },
  { p: "¿Qué es un 'cahuín'?", opciones: [{t: "Un chisme jugoso", a: "Roto"}, {t: "Un problema grave", a: "Cuico"}, {t: "Una fiesta", a: "Flaite"}, {t: "Un postre", a: "Señora"}] },
  { p: "'Andar pato' es...", opciones: [{t: "No tener plata", a: "Roto"}, {t: "Caminar raro", a: "Señora"}, {t: "Tener mala suerte", a: "Flaite"}, {t: "Andar sin abrigo", a: "Cuico"}] },
  { p: "Tu trago ideal...", opciones: [{t: "Piscola cabezona", a: "Flaite"}, {t: "Ramazzotti", a: "Cuico"}, {t: "Terremoto", a: "Roto"}, {t: "Técito con malicia", a: "Señora"}] },
  { p: "Si alguien es 'mano de guagua'...", opciones: [{t: "Es tacaño", a: "Roto"}, {t: "Es cariñoso", a: "Señora"}, {t: "Tiene manos chicas", a: "Cuico"}, {t: "Es torpe", a: "Flaite"}] },
  { p: "¿Dónde sería tu primera cita ideal?", opciones: [{t: "Cuneta con choripán", a: "Flaite"}, {t: "Restaurante caro", a: "Cuico"}, {t: "Parque Bicentenario", a: "Roto"}, {t: "En mi casa, más seguro", a: "Señora"}] },
  { p: "¿Qué música pones para hacer el aseo?", opciones: [{t: "Cumbia y Reggaetón old", a: "Flaite"}, {t: "Pop en inglés", a: "Cuico"}, {t: "Juan Gabriel / Chayanne", a: "Señora"}, {t: "Los Prisioneros", a: "Roto"}] },
  { p: "'Hacer una vaca' significa...", opciones: [{t: "Juntar plata entre varios", a: "Roto"}, {t: "Hacer un asado", a: "Cuico"}, {t: "Dormir siesta", a: "Señora"}, {t: "Robar algo", a: "Flaite"}] }
];

const ARQUETIPOS = {
  "Flaite": "Flaite Romántico 🌹",
  "Cuico": "Cuico de Providencia 🥑",
  "Roto": "Roto con Corazón de Oro 💛",
  "Señora": "Alma de Señora ☕"
};

export default function TestCahuineroScreen({ navigation }) {
  const { COLORS } = useTheme();
  const { actualizarUsuario } = useAuth();
  const styles = getStyles(COLORS);

  const [indiceActual, setIndiceActual] = useState(0);
  const [puntajes, setPuntajes] = useState({ "Flaite": 0, "Cuico": 0, "Roto": 0, "Señora": 0 });
  const [resultado, setResultado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const responder = async (arquetipo) => {
    const nuevosPuntajes = { ...puntajes, [arquetipo]: puntajes[arquetipo] + 1 };
    setPuntajes(nuevosPuntajes);

    if (indiceActual < PREGUNTAS.length - 1) {
      setIndiceActual(indiceActual + 1);
    } else {
      setGuardando(true);
      const maxPuntos = Math.max(...Object.values(nuevosPuntajes));
      const posiblesGanadores = Object.keys(nuevosPuntajes).filter(k => nuevosPuntajes[k] === maxPuntos);
      const ganador = posiblesGanadores[Math.floor(Math.random() * posiblesGanadores.length)];
      const arquetipoFinal = ARQUETIPOS[ganador];
      
      try {
        const res = await userService.guardarArquetipo(arquetipoFinal);
        
        // 🌟 PREGUNTAMOS SI QUIERE MOSTRARLO
        Alert.alert(
          '¡Test Completado! 🇨🇱', 
          `Eres un/a: ${arquetipoFinal}.\n\n¿Quieres lucir esta insignia en tu perfil público?`, 
          [
            { text: 'No, gracias', onPress: async () => {
                await userService.actualizar({ mostrarArquetipo: false });
                if(actualizarUsuario) actualizarUsuario({ ...res.usuario, mostrarArquetipo: false, arquetipoCahuinero: arquetipoFinal });
                setResultado(arquetipoFinal);
            }},
            { text: 'Sí, mostrar', onPress: async () => {
                await userService.actualizar({ mostrarArquetipo: true });
                if(actualizarUsuario) actualizarUsuario({ ...res.usuario, mostrarArquetipo: true, arquetipoCahuinero: arquetipoFinal });
                setResultado(arquetipoFinal);
            }}
          ]
        );
      } catch (error) {
        console.log(error);
      } finally {
        setGuardando(false);
      }
    }
  };

  const compartirResultado = async () => {
    try {
      await Share.share({ message: `Hice el Test de Cahuín y soy un/a ${resultado}. ¡Descarga Cahuín y descubre qué eres tú! 🇨🇱🌶️` });
    } catch (error) { console.log(error); }
  };

  if (guardando) {
    return (
      <SafeAreaView style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={{ marginTop: 15, color: COLORS.textPrimary, fontWeight: 'bold' }}>Analizando tu chilenidad...</Text>
      </SafeAreaView>
    );
  }

  if (resultado) {
    return (
      <SafeAreaView style={styles.centro}>
        <Text style={styles.tituloResultado}>¡Eres un/a!</Text>
        <View style={styles.cajaResultado}>
          <Text style={styles.textoResultado}>{resultado}</Text>
        </View>
        <Text style={styles.subtituloResultado}>Este título te ayudará a conseguir mejores matches alineados contigo.</Text>
        
        <TouchableOpacity style={styles.btnCompartir} onPress={compartirResultado}>
          <Text style={styles.textoCompartir}>Compartir en Redes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
          <Text style={styles.textoVolver}>Volver al Perfil</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const pregunta = PREGUNTAS[indiceActual];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progresoContenedor}>
        <View style={[styles.barraProgreso, { width: `${((indiceActual + 1) / PREGUNTAS.length) * 100}%` }]} />
      </View>

      <View style={styles.contenedorCentral}>
        <Text style={styles.contador}>Pregunta {indiceActual + 1} de 10</Text>
        <View style={styles.tarjetaPregunta}>
          <Text style={styles.preguntaTexto}>{pregunta.p}</Text>
          {pregunta.opciones.map((opcion, i) => (
            <TouchableOpacity key={i} style={styles.botonOpcion} onPress={() => responder(opcion.a)}>
              <Text style={styles.textoOpcion}>{opcion.t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: SPACING[6] },
  progresoContenedor: { height: 8, backgroundColor: COLORS.border, width: '100%' },
  barraProgreso: { height: '100%', backgroundColor: COLORS.primario },
  contenedorCentral: { flex: 1, padding: SPACING[5], justifyContent: 'center' },
  contador: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  tarjetaPregunta: { backgroundColor: COLORS.tarjeta, padding: SPACING[5], borderRadius: RADIUS.xl, ...SHADOWS.md, borderWidth: 1, borderColor: COLORS.border },
  preguntaTexto: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 30 },
  botonOpcion: { backgroundColor: COLORS.fondo, borderWidth: 2, borderColor: COLORS.border, paddingVertical: 15, borderRadius: RADIUS.lg, marginBottom: 12, alignItems: 'center' },
  textoOpcion: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  
  tituloResultado: { fontSize: 24, color: COLORS.textMuted, fontFamily: FONTS.display, marginBottom: 10 },
  cajaResultado: { backgroundColor: COLORS.tarjeta, padding: 30, borderRadius: RADIUS.xl, borderWidth: 2, borderColor: COLORS.primario, marginBottom: 20, ...SHADOWS.lg },
  textoResultado: { fontSize: 32, fontWeight: 'bold', color: COLORS.primario, textAlign: 'center' },
  subtituloResultado: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  
  btnCompartir: { backgroundColor: '#1877F2', paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.lg, width: '100%', alignItems: 'center', marginBottom: 15 },
  textoCompartir: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  btnVolver: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 15, paddingHorizontal: 30, borderRadius: RADIUS.lg, width: '100%', alignItems: 'center' },
  textoVolver: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 }
});