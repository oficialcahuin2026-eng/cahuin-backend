import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

export default function SpotifySelectorModal({ visible, onClose, selectedArtists = [], onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [localSelection, setLocalSelection] = useState(selectedArtists);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchArtists = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(text)}&entity=musicArtist&limit=20`);
      const data = await res.json();
      const mapped = (data.results || []).map(a => ({
        id: a.artistId.toString(),
        nombre: a.artistName,
        foto: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.artistName)}&size=200&background=1DB954&color=fff&bold=true`
      }));
      setResults(mapped);
    } catch (error) {
      console.log('Error searching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArtist = (artist) => {
    if (localSelection.find(a => a.id === artist.id)) {
      setLocalSelection(localSelection.filter(a => a.id !== artist.id));
    } else {
      if (localSelection.length < 5) {
        setLocalSelection([...localSelection, artist]);
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
          <Text style={styles.title}>Mis artistas favoritos</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Listo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artista..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={searchArtists}
              autoFocus
            />
          </View>
          <Text style={styles.counter}>{localSelection.length} de 5 seleccionados</Text>

          {localSelection.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
              {localSelection.map(artist => (
                <View key={artist.id} style={styles.selectedArtistWrap}>
                  <Image source={{ uri: artist.foto }} style={styles.selectedImage} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => toggleArtist(artist)}>
                    <Ionicons name="close" size={12} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.selectedName} numberOfLines={1}>{artist.nombre}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color="#1DB954" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.listWrap}>
            {results.map(artist => {
              const isSelected = !!localSelection.find(a => a.id === artist.id);
              return (
                <TouchableOpacity
                  key={artist.id}
                  style={styles.artistRow}
                  onPress={() => toggleArtist(artist)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: artist.foto }} style={styles.artistImage} />
                  <Text style={styles.artistName}>{artist.nombre}</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
            {query.length > 0 && results.length === 0 && !loading && (
              <Text style={styles.emptyText}>Escribe al menos 3 letras para buscar artistas</Text>
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
    color: '#1DB954',
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  counter: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedRow: {
    gap: 12,
    marginTop: 12,
  },
  selectedArtistWrap: {
    width: 60,
    alignItems: 'center',
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  selectedName: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  listWrap: {
    flex: 1,
    backgroundColor: COLORS.tarjeta,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  artistImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  artistName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    padding: 20,
    fontSize: 14,
  }
});
