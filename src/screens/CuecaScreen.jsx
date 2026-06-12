import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cuecaService } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

// Preguntas predefinidas para el juego
const PREGUNTAS = [
  { 
    ronda: 1, 
    titulo: 'Primera Patita: La Comida ðŸŒ­', 
    pregunta: 'Â¿Para tu cumpleaÃ±os, quÃ© prefieres invitar?', 
    opciones: ['Asado con los amigos', 'Completada italiana', 'Sushi piola'] 
  },
  { 
    ronda: 2, 
    titulo: 'Segunda Patita: El Panorama ðŸ”ï¸', 
    pregunta: 'Fin de semana largo, Â¿para dÃ³nde agarramos rumbo?', 
    opciones: ['Playa y solcito', 'Sur, cabaÃ±a y lluvia', 'Me quedo durmiendo'] 
  },
  { 
    ronda: 3, 
    titulo: 'Tercera Patita (Zapateo): La Fiesta ðŸ•º', 
    pregunta: 'En un mambo, tÃº eres el que...', 
    opciones: ['Baila hasta abajo', 'Se queda conversando', 'Controla la mÃºsica (DJ)'] 
  }
];

export default function CuecaScreen({ route, navigation }) {
  const { matchId, nombre } = route.params || { matchId: '123', nombre: 'tu Match' };
  
  const [rondaActual, setRondaActual] = useState(1);
  const [terminado, setTerminado] = useState(false);

  const preguntaActual = PREGUNTAS[rondaActual - 1];

  const handleResponder = async (respuesta) => {
    try {
      const data = await cuecaService.responder(matchId, rondaActual, respuesta);
      
      if (data.terminado) {
        setTerminado(true);
        Alert.alert("Â¡Aro, aro, aro! ðŸ‡¨ðŸ‡±", data.message);
      } else {
        setRondaActual(data.rondaActual);
      }
    } catch (error) {
      console.log("Error en La Cueca:", error);
      Alert.alert("Ups", "Alguien pisÃ³ mal en el baile. Intenta de nuevo.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnBack}>
          <Ionicons name="close" size={32} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>La Cueca ðŸŒ¶ï¸</Text>
      </View>

      <View style={styles.content}>
        {terminado ? (
          <View style={[styles.card, SHADOWS.medium, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 60, marginBottom: 20 }}>ðŸ†</Text>
            <Text style={styles.tituloJuego}>Â¡Juego Terminado!</Text>
            <Text style={styles.textoJuego}>Ya respondiste tus 3 patitas. Ahora espera a que {nombre} responda para ver su compatibilidad.</Text>
            
            <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
              <Text style={styles.btnVolverTexto}>Volver al Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, SHADOWS.medium]}>
            <Text style={styles.rondaBadge}>{preguntaActual.titulo}</Text>
            <Text style={styles.preguntaPrincipal}>{preguntaActual.pregunta}</Text>
            
            <View style={styles.opcionesContenedor}>
              {preguntaActual.opciones.map((opcion, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.btnOpcion, SHADOWS.light]} 
                  onPress={() => handleResponder(opcion)}
                >
                  <Text style={styles.btnOpcionTexto}>{opcion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING[5], paddingBottom: SPACING[2] },
  btnBack: { marginRight: SPACING[4] },
  headerTitle: { fontSize: 24, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  content: { flex: 1, padding: SPACING[5], justifyContent: 'center' },
  
  card: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: SPACING[6] },
  rondaBadge: { backgroundColor: '#FFEBEE', color: COLORS.primario, paddingVertical: SPACING[2], paddingHorizontal: SPACING[4], borderRadius: RADIUS.full, alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: SPACING[4] },
  preguntaPrincipal: { fontSize: 22, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: SPACING[6], lineHeight: 30 },
  
  opcionesContenedor: { gap: SPACING[4] },
  btnOpcion: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#eee', padding: SPACING[4], borderRadius: RADIUS.lg, alignItems: 'center' },
  btnOpcionTexto: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
  
  tituloJuego: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[3] },
  textoJuego: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING[6], lineHeight: 24 },
  btnVolver: { backgroundColor: COLORS.primario, paddingVertical: SPACING[3], paddingHorizontal: SPACING[6], borderRadius: RADIUS.lg },
  btnVolverTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});