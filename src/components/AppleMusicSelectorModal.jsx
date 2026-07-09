import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';
import CahuinTextField from './CahuinTextField';

export default function AppleMusicSelectorModal({ visible, onClose, onSave, COLORS }) {
  const styles = getStyles(COLORS);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchMusic = async (text) => {
    setQuery(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(text)}&entity=song&limit=15`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.log('Error searching music:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectSong = (item) => {
    onSave({
      nombre: `${item.artistName} - ${item.trackName}`,
      foto: item.artworkUrl100
    });
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
          <Text style={styles.title}>Mi canción (Apple Music)</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.topSection}>
          <CahuinTextField 
            icon="musical-notes-outline" 
            placeholder="Artista o canción..." 
            value={query} 
            onChangeText={searchMusic} 
            autoFocus 
          />
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primario} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.listWrap}>
            {results.map(item => (
              <TouchableOpacity
                key={item.trackId}
                style={styles.trackRow}
                onPress={() => selectSong(item)}
              >
                <Image source={{ uri: item.artworkUrl100 }} style={styles.album} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{item.trackName}</Text>
                  <Text style={styles.trackArtist}>{item.artistName}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listWrap: {
    flex: 1,
    backgroundColor: COLORS.tarjeta,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  album: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trackArtist: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  }
});
