import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import CahuinTextField from './CahuinTextField';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export default function TvSeriesSelectorModal({ visible, onClose, selectedSeries = [], onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedSeries);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchSeries = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(text)}`);
      const data = await res.json();
      
      const mappedSeries = (data.results || [])
        .filter(m => m.poster_path) // Solo series con poster
        .map(m => ({
          id: m.id.toString(),
          titulo: m.name, // TMDB uses 'name' for TV series, 'title' for movies
          poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`
        }));
        
      setResults(mappedSeries);
    } catch (error) {
      console.log('Error searching tv series:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeries = (serie) => {
    if (localSelection.find(m => m.id === serie.id)) {
      setLocalSelection(localSelection.filter(m => m.id !== serie.id));
    } else {
      if (localSelection.length < 5) {
        setLocalSelection([...localSelection, serie]);
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
          <Text style={styles.title}>Series que me gustan</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <Text style={styles.counter}>{localSelection.length} de 5 seleccionadas</Text>

          {localSelection.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
              {localSelection.map(serie => (
                <View key={serie.id} style={styles.selectedMovie}>
                  <Image source={{ uri: serie.poster }} style={styles.selectedImage} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => toggleSeries(serie)}>
                    <Ionicons name="remove" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <CahuinTextField 
            icon="search" 
            placeholder="Buscar series..." 
            value={query} 
            onChangeText={searchSeries} 
            autoFocus 
          />
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primario} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.gridWrap} contentContainerStyle={styles.grid}>
            {results.map(serie => {
              const isSelected = !!localSelection.find(m => m.id === serie.id);
              return (
                <TouchableOpacity
                  key={serie.id}
                  style={[styles.movieCard, isSelected && { opacity: 0.5 }]}
                  onPress={() => toggleSeries(serie)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: serie.poster }} style={styles.moviePoster} />
                  <View style={isSelected ? styles.selectedBadge : styles.addBadge}>
                    <Ionicons name={isSelected ? "remove" : "add"} size={16} color={isSelected ? "#6B7280" : "#FFF"} />
                  </View>
                  <Text style={styles.movieTitle} numberOfLines={2}>{serie.titulo}</Text>
                </TouchableOpacity>
              );
            })}
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
