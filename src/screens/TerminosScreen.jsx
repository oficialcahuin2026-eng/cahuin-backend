import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function TerminosScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>TÃ©rminos y Condiciones</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>Las reglas del CahuÃ­n ðŸŒ¶ï¸</Text>
        <Text style={styles.ultimaActualizacion}>Ãšltima actualizaciÃ³n: Mayo 2026</Text>

        <Text style={styles.parrafo}>
          Bienvenido a CahuÃ­n, la app de citas hecha por y para chilenos. Al usar nuestra aplicaciÃ³n, aceptas portarte bien y seguir estas reglas bÃ¡sicas. Si no estÃ¡s de acuerdo, lamentablemente tendrÃ¡s que buscar el amor a la antigua.
        </Text>

        <Text style={styles.subtitulo}>1. Requisitos para entrar</Text>
        <Text style={styles.parrafo}>
          Debes tener al menos 18 aÃ±os cumplidos para crearte una cuenta. Si te pillamos mintiendo con la edad, tu cuenta serÃ¡ eliminada al instante. CahuÃ­n es un espacio para adultos.
        </Text>

        <Text style={styles.subtitulo}>2. Respeto ante todo (Cero toxicidad)</Text>
        <Text style={styles.parrafo}>
          AquÃ­ vinimos a pasarlo bien. No toleramos el acoso, los insultos, el lenguaje de odio ni el envÃ­o de fotos no solicitadas (tÃº sabes a quÃ© nos referimos). Si otro usuario te reporta por mala conducta, nuestro equipo revisarÃ¡ el caso y podrÃ¡ banearte permanentemente.
        </Text>

        <Text style={styles.subtitulo}>3. Privacidad y Seguridad</Text>
        <Text style={styles.parrafo}>
          Nos tomamos tus datos en serio. Tu ubicaciÃ³n exacta nunca serÃ¡ revelada a otros usuarios, solo la distancia aproximada. Los chats estÃ¡n encriptados y tus fotos solo serÃ¡n usadas dentro de la plataforma para buscarte matches.
        </Text>

        <Text style={styles.subtitulo}>4. Suscripciones</Text>
        <Text style={styles.parrafo}>
          Cahuin ofrece suscripciones dentro de la app para desbloquear funciones adicionales. Estas compras son definitivas y no reembolsables, salvo que la ley chilena (SERNAC) exija lo contrario por fallos del servicio.
        </Text>

        <Text style={styles.parrafoDestacado}>
          Al hacer clic en "Aceptar" durante el registro, confirmas que has leÃ­do y entendido estas reglas. Â¡PÃ¡salo increÃ­ble y que viva el CahuÃ­n!
        </Text>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#2A2A2A' },
  headerTitulo: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  scroll: { padding: 20 },
  titulo: { fontSize: 26, fontWeight: 'bold', color: '#E53935', marginBottom: 5 },
  ultimaActualizacion: { fontSize: 13, color: '#888', marginBottom: 20 },
  subtitulo: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginTop: 20, marginBottom: 10 },
  parrafo: { fontSize: 15, color: '#CCC', lineHeight: 24, textAlign: 'justify' },
  parrafoDestacado: { fontSize: 15, color: '#FFF', lineHeight: 24, textAlign: 'justify', marginTop: 30, backgroundColor: '#1A1A1A', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#333' }
});