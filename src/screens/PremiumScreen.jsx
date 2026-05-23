import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS } from '../utils/theme';
import { premiumService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PremiumScreen({ navigation }) {
  const { usuario, actualizarUsuario } = useAuth();
  const [planes, setPlanes] = useState([]);
  const [regalos, setRegalos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resPlanes, resRegalos] = await Promise.all([
        premiumService.getPlanes(),
        premiumService.getRegalos()
      ]);
      setPlanes(resPlanes.planes || []);
      setRegalos(resRegalos.regalos || []);
    } catch (error) {
      console.log("Error cargando premium:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleSuscribir = async (plan) => {
    if (usuario?.isPremium) {
      Alert.alert("¡Tranquilo!", "Ya eres un usuario VIP de Cahuín. 😎");
      return;
    }

    setProcesando(true);
    try {
      const data = await premiumService.suscribir(plan.id);
      
      // Actualizamos el contexto global para que el candado VIP se abra en toda la app
      if (actualizarUsuario && data.usuario) {
        actualizarUsuario({ isPremium: true });
      }
      
      Alert.alert("¡Aprobado! 🥂", data.message);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo realizar el pago.");
    } finally {
      setProcesando(false);
    }
  };

  const handleComprarRegalo = (regalo) => {
    Alert.alert(
      "Canjear Regalo", 
      `¿Quieres gastar ${regalo.precio} por un ${regalo.nombre} ${regalo.emoji} para enviarlo en tus chats?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Canjear", 
          onPress: () => Alert.alert("¡Bacán!", "El regalo se ha añadido a tu inventario. (Pronto podrás enviarlo en los chats 💬)") 
        }
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primario} />
        <Text style={styles.cargandoText}>Cargando beneficios VIP...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Botón para volver atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Ionicons name="diamond" size={50} color={COLORS.primario} style={styles.iconCenter} />
          <Text style={styles.headerTitle}>Cahuín Premium 💎</Text>
          <Text style={styles.headerSubtitle}>
            {usuario?.isPremium 
              ? "¡Ya eres VIP! Disfruta de tus likes ilimitados." 
              : "Destaca tu perfil y encuentra a tu media naranja más rápido."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Planes VIP</Text>
        {planes.map((plan) => (
          <View key={plan.id} style={[styles.planCard, SHADOWS.medium]}>
            <View style={styles.planHeader}>
              <Text style={styles.planNombre}>{plan.nombre}</Text>
              <Text style={styles.planPrecio}>{plan.precio}/mes</Text>
            </View>
            <Text style={styles.planDesc}>{plan.descripcion}</Text>
            <TouchableOpacity 
              style={[styles.btnSuscribir, usuario?.isPremium && styles.btnDesactivado]} 
              onPress={() => handleSuscribir(plan)}
              disabled={procesando || usuario?.isPremium}
            >
              {procesando ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnSuscribirText}>
                  {usuario?.isPremium ? 'Plan Activo' : 'Elegir este plan'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Regalos Virtuales 🎁</Text>
        <Text style={styles.sectionDesc}>Gana "Cahuines" usando la app todos los días y canjéalos por regalos chilenos para enviar en el chat.</Text>
        
        <View style={styles.regalosGrid}>
          {regalos.map((regalo) => (
            <TouchableOpacity key={regalo.id} style={[styles.regaloCard, SHADOWS.light]} onPress={() => handleComprarRegalo(regalo)}>
              <Text style={styles.regaloEmoji}>{regalo.emoji}</Text>
              <Text style={styles.regaloNombre}>{regalo.nombre}</Text>
              <View style={styles.precioBadge}>
                <Text style={styles.regaloPrecio}>{regalo.precio}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cargandoText: { marginTop: SPACING[3], color: COLORS.gris, fontSize: 16 },
  backButton: { padding: SPACING[4], position: 'absolute', zIndex: 10 },
  scroll: { padding: SPACING[5], paddingTop: SPACING[8], paddingBottom: 50 },
  
  header: { alignItems: 'center', marginBottom: SPACING[6], marginTop: SPACING[4] },
  iconCenter: { marginBottom: SPACING[2] },
  headerTitle: { fontSize: 28, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING[2], paddingHorizontal: SPACING[4] },
  
  sectionTitle: { fontSize: 22, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: SPACING[3] },
  sectionDesc: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING[4], lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: SPACING[6] },

  planCard: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: SPACING[5], marginBottom: SPACING[4], borderWidth: 1, borderColor: '#FFE0E0' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING[3] },
  planNombre: { fontSize: 20, fontWeight: 'bold', color: COLORS.primario },
  planPrecio: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  planDesc: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING[4], lineHeight: 22 },
  btnSuscribir: { backgroundColor: COLORS.primario, paddingVertical: SPACING[3], borderRadius: RADIUS.lg, alignItems: 'center' },
  btnDesactivado: { backgroundColor: COLORS.gris },
  btnSuscribirText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  regalosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  regaloCard: { backgroundColor: COLORS.tarjeta, width: '48%', borderRadius: RADIUS.lg, padding: SPACING[4], alignItems: 'center', marginBottom: SPACING[3] },
  regaloEmoji: { fontSize: 40, marginBottom: SPACING[2] },
  regaloNombre: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[2] },
  precioBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: SPACING[3], paddingVertical: 4, borderRadius: RADIUS.xl },
  regaloPrecio: { fontSize: 12, color: '#E65100', fontWeight: 'bold' }
});