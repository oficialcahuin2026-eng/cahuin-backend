import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RADIUS, SPACING } from '../utils/theme';

export default function PreferenciasModal({ visible, onClose, onSave }) {
  const navigation = useNavigation();
  const { usuario, actualizarUsuario } = useAuth();
  const { COLORS, isDarkMode } = useTheme();
  const styles = getStyles(COLORS, isDarkMode);

  const [distanciaMax, setDistanciaMax] = useState(usuario?.distanciaMax || 50);
  const [distanciaFlexible, setDistanciaFlexible] = useState(usuario?.distanciaFlexible !== false);
  const [edadMin, setEdadMin] = useState(usuario?.edadMin || 18);
  const [edadMax, setEdadMax] = useState(usuario?.edadMax || 60);
  const [edadFlexible, setEdadFlexible] = useState(usuario?.edadFlexible !== false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible && usuario) {
      setDistanciaMax(usuario.distanciaMax || 50);
      setDistanciaFlexible(usuario.distanciaFlexible !== false);
      setEdadMin(usuario.edadMin || 18);
      setEdadMax(usuario.edadMax || 60);
      setEdadFlexible(usuario.edadFlexible !== false);
    }
  }, [visible, usuario]);

  const guardarPreferencias = async () => {
    setGuardando(true);
    try {
      const data = {
        distanciaMax,
        distanciaFlexible,
        edadMin,
        edadMax,
        edadFlexible
      };
      const res = await userService.actualizar(data);
      if (res?.usuario) {
        actualizarUsuario(res.usuario);
      }
      onSave(); // Refrescar perfiles
    } catch (error) {
      console.log('Error guardando preferencias:', error);
    } finally {
      setGuardando(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Preferencias</Text>
          <TouchableOpacity onPress={guardarPreferencias} disabled={guardando}>
            <Text style={styles.doneText}>Listo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll}>
          {/* Distancia */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Distancia máxima</Text>
              <Text style={styles.value}>{distanciaMax} km.</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40, marginTop: 10 }}
              minimumValue={5}
              maximumValue={200}
              step={1}
              value={distanciaMax}
              onValueChange={setDistanciaMax}
              minimumTrackTintColor={COLORS.primario}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primario}
            />
            <View style={[styles.rowBetween, styles.toggleRow]}>
              <Text style={styles.toggleText}>Mostrar personas más lejos si me quedo sin perfiles</Text>
              <Switch
                value={distanciaFlexible}
                onValueChange={setDistanciaFlexible}
                trackColor={{ false: COLORS.border, true: COLORS.primario }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Rango de Edad */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Rango de edad</Text>
              <Text style={styles.value}>{edadMin} - {edadMax}</Text>
            </View>
            <Text style={styles.subLabel}>Mínima: {edadMin}</Text>
            <Slider
              style={{ width: '100%', height: 30 }}
              minimumValue={18}
              maximumValue={Math.max(18, edadMax - 1)}
              step={1}
              value={edadMin}
              onValueChange={setEdadMin}
              minimumTrackTintColor={COLORS.primario}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primario}
            />
            <Text style={styles.subLabel}>Máxima: {edadMax}</Text>
            <Slider
              style={{ width: '100%', height: 30 }}
              minimumValue={Math.min(100, edadMin + 1)}
              maximumValue={100}
              step={1}
              value={edadMax}
              onValueChange={setEdadMax}
              minimumTrackTintColor={COLORS.primario}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primario}
            />
            <View style={[styles.rowBetween, styles.toggleRow]}>
              <Text style={styles.toggleText}>Mostrar personas un poco fuera de mi rango preferido si me quedo sin perfiles</Text>
              <Switch
                value={edadFlexible}
                onValueChange={setEdadFlexible}
                trackColor={{ false: COLORS.border, true: COLORS.primario }}
                thumbColor="#FFF"
              />
            </View>
          </View>

          {/* Banner Unlock (Premium) */}
          <View style={styles.premiumCard}>
            <Text style={styles.premiumTitle}>Desbloquea más preferencias...</Text>
            <Text style={styles.premiumSub}>Elige tus Preferencias Premium para ver perfiles con los mismos intereses, signos y más.</Text>
            <TouchableOpacity style={styles.premiumBtn} onPress={() => { onClose(); navigation.navigate('Premium'); }}>
              <Text style={styles.premiumBtnText}>Desbloquear</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDarkMode ? '#000' : '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING[4], backgroundColor: COLORS.bg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  doneText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primario },
  scroll: { flex: 1, padding: SPACING[4] },
  card: { backgroundColor: COLORS.bg, padding: SPACING[4], borderRadius: RADIUS.lg, marginBottom: SPACING[4] },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  value: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  subLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 10 },
  toggleRow: { marginTop: 15, paddingTop: 15 },
  toggleText: { flex: 1, fontSize: 14, color: COLORS.textMuted, marginRight: 15, lineHeight: 20 },
  premiumCard: { backgroundColor: '#111', padding: SPACING[4], borderRadius: RADIUS.lg, marginBottom: SPACING[6] },
  premiumTitle: { color: '#FFD700', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  premiumSub: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  premiumBtn: { alignSelf: 'flex-start', backgroundColor: '#FFD700', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  premiumBtnText: { color: '#000', fontWeight: 'bold' }
});
