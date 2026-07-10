import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS } from '../utils/theme';
import CahuinTextField from './CahuinTextField';

const RAWG_API_KEY = 'a5a6e2f7bd944ba6877743fc2635a707';

export default function JuegosSelectorModal({ visible, onClose, selectedJuegos = [], onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedJuegos);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchJuegos = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(text)}&page_size=20`);
      const data = await res.json();
      if (data && data.results) {
        const games = data.results.map(g => ({
          id: g.id.toString(),
          titulo: g.name,
          poster: g.background_image || 'https://via.placeholder.com/300x400.png?text=Sin+Imagen'
        }));
        setResults(games);
      }
    } catch (e) {
      console.log('Error fetching RAWG API', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleJuego = (juego) => {
    if (localSelection.find(m => m.id === juego.id)) {
      setLocalSelection(localSelection.filter(m => m.id !== juego.id));
    } else {
      if (localSelection.length < 5) {
        setLocalSelection([...localSelection, juego]);
      }
    }
  };

  const handleSave = () => {
    onSave(localSelection);
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Juegos que me gustan</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <Text style={styles.counter}>{localSelection.length} de 5 seleccionados</Text>

          {localSelection.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
              {localSelection.map(juego => (
                <View key={juego.id} style={styles.selectedMovie}>
                  <Image source={{ uri: juego.poster }} style={styles.selectedImage} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => toggleJuego(juego)}>
                    <Ionicons name="remove" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <CahuinTextField 
            icon="search" 
            placeholder="Buscar videojuegos..." 
            value={query} 
            onChangeText={searchJuegos} 
          />
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primario} />
            <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Buscando juegos...</Text>
          </View>
        ) : (
          <ScrollView style={styles.gridWrap} contentContainerStyle={styles.grid}>
            {results.map(juego => {
            const isSelected = !!localSelection.find(m => m.id === juego.id);
            return (
              <TouchableOpacity
                key={juego.id}
                style={[styles.movieCard, isSelected && { opacity: 0.5 }]}
                onPress={() => toggleJuego(juego)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: juego.poster }} style={styles.moviePoster} />
                <View style={isSelected ? styles.selectedBadge : styles.addBadge}>
                  <Ionicons name={isSelected ? "remove" : "add"} size={16} color={isSelected ? "#6B7280" : "#FFF"} />
                </View>
                <Text style={styles.movieTitle} numberOfLines={2}>{juego.titulo}</Text>
              </TouchableOpacity>
            );
          })}
          {!loading && query.length >= 3 && results.length === 0 && (
            <Text style={{ color: COLORS.textMuted, width: '100%', textAlign: 'center', marginTop: 20 }}>
              No se encontraron juegos
            </Text>
          )}
          {!loading && query.length < 3 && results.length === 0 && (
            <Text style={{ color: COLORS.textMuted, width: '100%', textAlign: 'center', marginTop: 20 }}>
              Escribe al menos 3 letras para buscar videojuegos en la base de datos mundial.
            </Text>
          )}
        </ScrollView>
      )}
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
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedRow: {
    gap: 12,
    marginBottom: 16,
  },
  selectedMovie: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.light,
  },
  gridWrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  movieCard: {
    width: '30%',
    marginBottom: 16,
  },
  moviePoster: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  movieTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  addBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.light,
  }
});
