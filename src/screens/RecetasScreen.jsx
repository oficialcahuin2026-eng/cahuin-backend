import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS } from '../utils/theme';
import { recetaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CahuinTextField from '../components/CahuinTextField';

export default function RecetasScreen() {
  const { usuario } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  
  // Estados para el Modal de Crear Receta
  const [modalVisible, setModalVisible] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    cargarRecetas();
  }, []);

  const cargarRecetas = async () => {
    try {
      const data = await recetaService.listar();
      setRecetas(data.recetas || []);
    } catch (error) {
      console.log("Error cargando recetas:", error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const handleRefresh = () => {
    setRefrescando(true);
    cargarRecetas();
  };

  const handleCrearReceta = async () => {
    if (!titulo || !descripcion) {
      Alert.alert("Oye ✋", "Tienes que ponerle título y cómo se prepara po'.");
      return;
    }

    setCreando(true);
    try {
      await recetaService.crear({
        titulo,
        descripcion,
        categoria: 'Plato de fondo'
      });

      Alert.alert("¡Exquisito! 🍳", "Tu receta ya está en el recetario.");
      setModalVisible(false);
      setTitulo('');
      setDescripcion('');
      cargarRecetas(); // Recargamos para ver la nueva receta
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo subir la receta.");
    } finally {
      setCreando(false);
    }
  };

  const renderReceta = ({ item }) => {
    return (
      <View style={[styles.card, SHADOWS.medium]}>
        <View style={styles.cardHeader}>
          {item.autor?.foto ? (
            <Image source={{ uri: item.autor.foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarVacio}>
              <Ionicons name="person" size={24} color={COLORS.gris} />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.autorText}>Por {item.autor?.nombre || 'Alguien'} • {item.region || 'Chile'}</Text>
          </View>
        </View>

        <Text style={styles.cardDesc}>{item.descripcion}</Text>

        <TouchableOpacity style={styles.btnReaccionar} onPress={() => Alert.alert("¡Qué rico!", "En el futuro podrás invitar a esta persona a cocinar esto.")}>
          <Ionicons name="restaurant" size={18} color="white" />
          <Text style={styles.btnReaccionarText}>¡Qué rico! Romper el hielo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cahuines de Cocina 🥘</Text>
        <Text style={styles.headerSubtitle}>Conquista por el estómago</Text>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primario} />
          <Text style={styles.cargandoText}>Prendiendo la olla...</Text>
        </View>
      ) : recetas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>La despensa está vacía</Text>
          <Text style={styles.emptyText}>Anímate y sé el primero en compartir la receta de la abuela.</Text>
        </View>
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item._id}
          renderItem={renderReceta}
          contentContainerStyle={styles.lista}
          refreshing={refrescando}
          onRefresh={handleRefresh}
        />
      )}

      {/* Botón Flotante para Crear Receta */}
      <TouchableOpacity style={[styles.fab, SHADOWS.dark]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal / Formulario para Crear Receta */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalCard, SHADOWS['2xl']]}>
            <Text style={styles.modalTitle}>Compartir Receta 📝</Text>
            
            <CahuinTextField
              icon="restaurant-outline"
              placeholder="Nombre del plato (Ej: Charquicán)"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={40}
            />
            
            <CahuinTextField
              icon="reader-outline"
              placeholder="Ingredientes y preparación..."
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              variant="textarea"
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)} disabled={creando}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnGuardar} onPress={handleCrearReceta} disabled={creando}>
                {creando ? <ActivityIndicator color="white" /> : <Text style={styles.btnGuardarText}>Servir plato</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING[5], backgroundColor: COLORS.tarjeta, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 26, fontFamily: FONTS.display, color: COLORS.primario, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 16, color: COLORS.textMuted, marginTop: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[6] },
  cargandoText: { marginTop: SPACING[3], color: COLORS.gris, fontSize: 16 },
  lista: { padding: SPACING[4], paddingBottom: 100 },
  
  // Tarjeta de la Receta
  card: { backgroundColor: COLORS.tarjeta, borderRadius: RADIUS.xl, padding: SPACING[5], marginBottom: SPACING[4] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[4] },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarVacio: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { marginLeft: SPACING[3], flex: 1 },
  cardTitle: { fontSize: 18, fontFamily: FONTS.display, color: COLORS.textPrimary, fontWeight: 'bold' },
  autorText: { fontSize: 13, color: COLORS.acento, marginTop: 2 },
  cardDesc: { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING[4], lineHeight: 22 },
  
  // Botón reaccionar
  btnReaccionar: { backgroundColor: '#FF9800', flexDirection: 'row', paddingVertical: SPACING[3], borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  btnReaccionarText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: SPACING[2] },

  // Empty State (Vacío)
  emptyEmoji: { fontSize: 60, marginBottom: SPACING[2] },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[2] },
  emptyText: { fontSize: 16, color: COLORS.textMuted, textAlign: 'center' },

  // Botón Flotante (FAB)
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: COLORS.primario, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },

  // Modal
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING[4] },
  modalCard: { backgroundColor: COLORS.tarjeta, width: '100%', borderRadius: RADIUS.xl, padding: SPACING[5] },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING[5] },
  input: { backgroundColor: COLORS.fondo, borderWidth: 1, borderColor: '#ddd', borderRadius: RADIUS.md, padding: SPACING[3], fontSize: 16, marginBottom: SPACING[4] },
  modalBotones: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: SPACING[2] },
  btnCancelar: { paddingVertical: SPACING[3], paddingHorizontal: SPACING[4] },
  btnCancelarText: { color: COLORS.gris, fontSize: 16, fontWeight: 'bold' },
  btnGuardar: { backgroundColor: COLORS.primario, paddingVertical: SPACING[3], paddingHorizontal: SPACING[5], borderRadius: RADIUS.lg, marginLeft: SPACING[2] },
  btnGuardarText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
