import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function TerminosScreen({ navigation }) {
  const { COLORS } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Términos y Privacidad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>Nuestras Reglas Claras</Text>
        <Text style={[styles.subtitle, { color: COLORS.textMuted }]}>
          En Cahuín nos tomamos en serio tu seguridad. Lee con atención.
        </Text>

        <View style={[styles.section, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
          <Text style={[styles.text, { color: COLORS.textSecondary }]}>
            Bienvenido a Cahuín, la app de citas hecha por y para chilenos. Al usar nuestra aplicación, aceptas portarte bien y seguir estas reglas básicas. Si no estás de acuerdo, lamentablemente tendrás que buscar el amor a la antigua.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>1. Requisitos para entrar</Text>
        <Text style={[styles.text, { color: COLORS.textSecondary, marginBottom: 15 }]}>
          Debes tener al menos 18 años cumplidos para crearte una cuenta. Si te pillamos mintiendo con la edad, tu cuenta será eliminada al instante. Cahuín es un espacio para adultos.
        </Text>

        <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>2. Respeto ante todo (Cero toxicidad)</Text>
        <Text style={[styles.text, { color: COLORS.textSecondary, marginBottom: 15 }]}>
          Aquí vinimos a pasarlo bien. No toleramos el acoso, los insultos, el lenguaje de odio ni el envío de fotos no solicitadas. Si otro usuario te reporta por mala conducta, nuestro equipo revisará el caso y podrá banearte permanentemente.
        </Text>

        <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>3. Privacidad y Seguridad</Text>
        <Text style={[styles.text, { color: COLORS.textSecondary, marginBottom: 15 }]}>
          Nos tomamos tus datos en serio. Tu ubicación exacta nunca será revelada a otros usuarios, solo la distancia aproximada. Los chats están encriptados y tus fotos solo serán usadas dentro de la plataforma para buscarte matches.
        </Text>

        <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>4. Suscripciones</Text>
        <Text style={[styles.text, { color: COLORS.textSecondary, marginBottom: 25 }]}>
          Cahuin ofrece suscripciones dentro de la app para desbloquear funciones adicionales. Estas compras son definitivas y no reembolsables, salvo que la ley chilena (SERNAC) exija lo contrario por fallos del servicio.
        </Text>

        <View style={[styles.section, { backgroundColor: COLORS.surfaceCard, borderColor: COLORS.border }]}>
          <Text style={[styles.text, { color: COLORS.textPrimary, fontWeight: '600' }]}>
            Al hacer clic en "Aceptar" durante el registro, confirmas que has leído y entendido estas reglas. ¡Pásalo increíble y que viva el Cahuín!
          </Text>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(128,128,128,0.1)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', marginLeft: 15 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 24, marginBottom: 30 },
  section: { padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  text: { fontSize: 15, lineHeight: 22 },
});