import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import CahuinTextField from './CahuinTextField';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export default function MovieSelectorModal({ visible, onClose, selectedMovies = [], onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedMovies);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMovies = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(text)}`);
      const data = await res.json();
      
      const mappedMovies = (data.results || [])
        .filter(m => m.poster_path) // Only movies with posters
        .map(m => ({
          id: m.id.toString(),
          titulo: m.title,
          poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`
        }));
        
      setResults(mappedMovies);
    } catch (error) {
      console.log('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMovie = (movie) => {
    if (localSelection.find(m => m.id === movie.id)) {
      setLocalSelection(localSelection.filter(m => m.id !== movie.id));
    } else {
      if (localSelection.length < 6) {
        setLocalSelection([...localSelection, movie]);
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
          <Text style={styles.title}>Películas que me gustan</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <Text style={styles.counter}>{localSelection.length} de 6</Text>
          <View style={styles.selectedSlots}>
            {[0, 1, 2, 3, 4, 5].map(i => {
              const movie = localSelection[i];
              return (
                <View key={i} style={styles.slot}>
                  {movie ? (
                    <>
                      <Image source={{ uri: movie.poster }} style={styles.slotImage} />
                      <TouchableOpacity style={styles.removeBadge} onPress={() => toggleMovie(movie)}>
                        <Ionicons name="close" size={14} color="#FFF" />
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>

          <CahuinTextField 
            icon="search" 
            placeholder="Buscar películas..." 
            value={query} 
            onChangeText={searchMovies} 
            autoFocus 
          />
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primario} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.gridWrap} contentContainerStyle={styles.grid}>
            {results.map(movie => {
              const isSelected = !!localSelection.find(m => m.id === movie.id);
              return (
                <TouchableOpacity
                  key={movie.id}
                  style={[styles.movieCard, isSelected && { opacity: 0.5 }]}
                  onPress={() => toggleMovie(movie)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: movie.poster }} style={styles.moviePoster} />
                  <View style={styles.addBadge}>
                    <Ionicons name={isSelected ? "checkmark" : "add"} size={16} color="#FFF" />
                  </View>
                  <Text style={styles.movieTitle} numberOfLines={2}>{movie.titulo}</Text>
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
    color: COLORS.textPrimary, // Tinder uses neutral color for Listo in this screen
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  counter: {
    textAlign: 'right',
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedSlots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  slot: {
    width: '15%',
    aspectRatio: 0.7,
    backgroundColor: COLORS.tarjeta,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotImage: {
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
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tarjeta,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
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
    marginBottom: 8,
  },
  moviePoster: {
    width: '100%',
    aspectRatio: 0.7,
    borderRadius: 12,
    marginBottom: 8,
  },
  addBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  }
});
