import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS } from '../utils/theme';
import CahuinTextField from './CahuinTextField';

const HOBBIES_DB = [
  {
    categoria: 'En casa',
    hobbies: [
      { id: 'h1', nombre: 'Leer', icon: 'book' },
      { id: 'h2', nombre: 'Ejercicios en casa', icon: 'barbell' },
      { id: 'h3', nombre: 'Maratonear series', icon: 'tv' },
      { id: 'h4', nombre: 'Cocinar', icon: 'restaurant' },
      { id: 'h5', nombre: 'Jardinería', icon: 'leaf' },
      { id: 'h6', nombre: 'Jugar videojuegos', icon: 'game-controller' },
      { id: 'h24', nombre: 'Manualidades', icon: 'color-palette' },
      { id: 'h25', nombre: 'Tejer', icon: 'cut' },
      { id: 'h26', nombre: 'Horneado', icon: 'pizza' },
      { id: 'h27', nombre: 'Rompecabezas', icon: 'extension-puzzle' },
    ]
  },
  {
    categoria: 'Redes y creación',
    hobbies: [
      { id: 'h7', nombre: 'Instagram', icon: 'logo-instagram' },
      { id: 'h8', nombre: 'TikTok', icon: 'logo-tiktok' },
      { id: 'h9', nombre: 'Fotografía', icon: 'camera' },
      { id: 'h10', nombre: 'Spotify', icon: 'musical-notes' },
      { id: 'h11', nombre: 'Redes sociales', icon: 'phone-portrait' },
      { id: 'h28', nombre: 'YouTube', icon: 'logo-youtube' },
      { id: 'h29', nombre: 'Podcasts', icon: 'mic' },
      { id: 'h30', nombre: 'Diseño Gráfico', icon: 'brush' },
      { id: 'h31', nombre: 'Blogging', icon: 'document-text' },
    ]
  },
  {
    categoria: 'Vida social (Salir)',
    hobbies: [
      { id: 'h12', nombre: 'Bares', icon: 'beer' },
      { id: 'h13', nombre: 'Museos', icon: 'color-palette' },
      { id: 'h14', nombre: 'Cafeterías', icon: 'cafe' },
      { id: 'h15', nombre: 'Clubes nocturnos', icon: 'moon' },
      { id: 'h16', nombre: 'Ir de compras', icon: 'bag-handle' },
      { id: 'h17', nombre: 'Cine', icon: 'film' },
      { id: 'h32', nombre: 'Festivales', icon: 'ticket' },
      { id: 'h33', nombre: 'Conciertos', icon: 'musical-notes' },
      { id: 'h34', nombre: 'Restaurantes', icon: 'restaurant' },
      { id: 'h35', nombre: 'Teatro', icon: 'happy' },
    ]
  },
  {
    categoria: 'Deportes y actividades',
    hobbies: [
      { id: 'h18', nombre: 'Fútbol', icon: 'football' },
      { id: 'h19', nombre: 'Senderismo', icon: 'walk' },
      { id: 'h20', nombre: 'Gimnasio', icon: 'fitness' },
      { id: 'h21', nombre: 'Nadar', icon: 'water' },
      { id: 'h22', nombre: 'Correr', icon: 'stopwatch' },
      { id: 'h23', nombre: 'Yoga', icon: 'body' },
      { id: 'h36', nombre: 'Ciclismo', icon: 'bicycle' },
      { id: 'h37', nombre: 'Tenis', icon: 'tennisball' },
      { id: 'h38', nombre: 'Básquetbol', icon: 'basketball' },
      { id: 'h39', nombre: 'Surf', icon: 'water' },
      { id: 'h40', nombre: 'Artes Marciales', icon: 'hand-right' },
      { id: 'h41', nombre: 'Escalada', icon: 'map' },
      { id: 'h42', nombre: 'Bailar', icon: 'musical-note' },
    ]
  },
  {
    categoria: 'Espiritualidad y mente',
    hobbies: [
      { id: 'h43', nombre: 'Meditación', icon: 'leaf' },
      { id: 'h44', nombre: 'Astrología', icon: 'moon' },
      { id: 'h45', nombre: 'Tarot', icon: 'star' },
      { id: 'h46', nombre: 'Voluntariado', icon: 'heart' },
    ]
  },
  {
    categoria: 'Música',
    hobbies: [
      { id: 'h47', nombre: 'Tocar Guitarra', icon: 'musical-notes' },
      { id: 'h48', nombre: 'Cantar', icon: 'mic' },
      { id: 'h49', nombre: 'Tocar Piano', icon: 'musical-note' },
      { id: 'h50', nombre: 'Vinilos', icon: 'disc' },
      { id: 'h51', nombre: 'Producir Música', icon: 'headset' },
    ]
  },
  {
    categoria: 'Viajes',
    hobbies: [
      { id: 'h52', nombre: 'Mochilear', icon: 'map' },
      { id: 'h53', nombre: 'Camping', icon: 'bonfire' },
      { id: 'h54', nombre: 'Playas', icon: 'sunny' },
      { id: 'h55', nombre: 'Montañas', icon: 'image' },
      { id: 'h56', nombre: 'Roadtrips', icon: 'car' },
    ]
  },
  {
    categoria: 'Cultura Pop y Geek',
    hobbies: [
      { id: 'h57', nombre: 'Anime', icon: 'star' },
      { id: 'h58', nombre: 'K-Pop', icon: 'musical-notes' },
      { id: 'h59', nombre: 'Cómics / Manga', icon: 'book' },
      { id: 'h60', nombre: 'Juegos de Mesa', icon: 'dice' },
      { id: 'h61', nombre: 'Cosplay', icon: 'shirt' },
      { id: 'h62', nombre: 'E-Sports', icon: 'game-controller' },
    ]
  },
  {
    categoria: 'Comida y Bebida',
    hobbies: [
      { id: 'h63', nombre: 'Foodie', icon: 'pizza' },
      { id: 'h64', nombre: 'Cerveza Artesanal', icon: 'beer' },
      { id: 'h65', nombre: 'Amante del Café', icon: 'cafe' },
      { id: 'h66', nombre: 'Cata de Vinos', icon: 'wine' },
      { id: 'h67', nombre: 'Comida Callejera', icon: 'fast-food' },
    ]
  }
];

export default function HobbiesSelectorModal({ visible, onClose, selectedHobbies = [], onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedHobbies);

  const toggleHobby = (hobby) => {
    if (localSelection.find(h => h.id === hobby.id)) {
      setLocalSelection(localSelection.filter(h => h.id !== hobby.id));
    } else {
      if (localSelection.length < 10) {
        setLocalSelection([...localSelection, hobby]);
      }
    }
  };

  const handleSave = () => {
    onSave(localSelection);
    setQuery('');
    onClose();
  };

  const isSelected = (hobby) => !!localSelection.find(h => h.id === hobby.id);

  const renderCategorias = () => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      const todos = HOBBIES_DB.flatMap(c => c.hobbies).filter(h => h.nombre.toLowerCase().includes(q));
      
      return (
        <View style={styles.categoriaSection}>
          <Text style={styles.categoriaTitle}>Resultados</Text>
          <View style={styles.pillsContainer}>
            {todos.map(h => (
              <TouchableOpacity
                key={h.id}
                style={[styles.pill, isSelected(h) && styles.pillSelected]}
                onPress={() => toggleHobby(h)}
                activeOpacity={0.7}
              >
                <Ionicons name={h.icon} size={16} color={isSelected(h) ? '#FFF' : COLORS.textPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.pillText, isSelected(h) && styles.pillTextSelected]}>{h.nombre}</Text>
              </TouchableOpacity>
            ))}
            {todos.length === 0 && <Text style={{ color: COLORS.textMuted }}>No se encontraron hobbies</Text>}
          </View>
        </View>
      );
    }

    return HOBBIES_DB.map((cat, idx) => (
      <View key={idx} style={styles.categoriaSection}>
        <Text style={styles.categoriaTitle}>{cat.categoria}</Text>
        <View style={styles.pillsContainer}>
          {cat.hobbies.map(h => (
            <TouchableOpacity
              key={h.id}
              style={[styles.pill, isSelected(h) && styles.pillSelected]}
              onPress={() => toggleHobby(h)}
              activeOpacity={0.7}
            >
              <Ionicons name={h.icon} size={16} color={isSelected(h) ? '#FFF' : COLORS.textPrimary} style={{ marginRight: 6 }} />
              <Text style={[styles.pillText, isSelected(h) && styles.pillTextSelected]}>{h.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Mis hobbies</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <Text style={styles.counter}>Agrega hasta 10 hobbies a tu perfil.</Text>
          <Text style={styles.counterSelected}>{localSelection.length} de 10</Text>
          
          <CahuinTextField 
            icon="search" 
            placeholder="Buscar hobbies..." 
            value={query} 
            onChangeText={setQuery} 
          />
        </View>

        <ScrollView style={styles.scrollWrap} contentContainerStyle={{ padding: 16 }}>
          {renderCategorias()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primario,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  counter: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  counterSelected: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 16,
  },
  scrollWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  categoriaSection: {
    marginBottom: 24,
  },
  categoriaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tarjeta,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.primario,
    borderColor: COLORS.primario,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pillTextSelected: {
    color: '#FFF',
  }
});
