import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

const AVAILABLE_PROMPTS = [
  "Mi finde siempre es para...",
  "A los carretes suelo llegar...",
  "Un sábado por la noche apañaría a...",
  "El domingo pa' mi es pa'...",
  "Mi técnica pa' irme piola es...",
  "Soy de los que siempre...",
  "Si me dan a elegir, prefiero...",
  "Mi celular siempre está lleno de...",
  "Un finde me podí encontrar en...",
  "Me visto más bien...",
  "Me ganái el corazón si...",
  "Un cahuín o dato freak sobre mí es...",
  "No podría vivir sin..."
];

export default function ProfilePrompts({ prompts = [], onChange, COLORS }) {
  const styles = getStyles(COLORS);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);

  const openAdd = () => {
    setEditingIndex(-1);
    setSelectedPrompt(null);
    setRespuesta('');
    setModalVisible(true);
  };

  const openEdit = (index) => {
    setEditingIndex(index);
    setSelectedPrompt(prompts[index].pregunta);
    setRespuesta(prompts[index].respuesta);
    setModalVisible(true);
  };

  const removePrompt = (index) => {
    const newPrompts = [...prompts];
    newPrompts.splice(index, 1);
    onChange(newPrompts);
  };

  const savePrompt = () => {
    if (!selectedPrompt || !respuesta.trim()) return;
    const newPrompts = [...prompts];
    if (editingIndex >= 0) {
      newPrompts[editingIndex] = { pregunta: selectedPrompt, respuesta: respuesta.trim() };
    } else {
      newPrompts.push({ pregunta: selectedPrompt, respuesta: respuesta.trim() });
    }
    onChange(newPrompts);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {prompts.map((p, index) => (
        <View key={index} style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.textPrimary} />
              <Text style={styles.promptPregunta}>{p.pregunta}</Text>
            </View>
            <TouchableOpacity onPress={() => removePrompt(index)} style={styles.removeBtn}>
              <Ionicons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => openEdit(index)} activeOpacity={0.7}>
            <Text style={styles.promptRespuesta}>{p.respuesta}</Text>
          </TouchableOpacity>
        </View>
      ))}

      {prompts.length < 3 && (
        <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={COLORS.primario} />
          <Text style={styles.addButtonText}>Añadir pregunta de perfil</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedPrompt ? 'Tu respuesta' : 'Elige una pregunta'}</Text>
            <TouchableOpacity onPress={savePrompt} disabled={!selectedPrompt || !respuesta.trim()}>
              <Text style={[styles.modalSave, (!selectedPrompt || !respuesta.trim()) && { color: COLORS.textMuted }]}>
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          {!selectedPrompt ? (
            <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
              {AVAILABLE_PROMPTS.filter(p => !prompts.find(existing => existing.pregunta === p) || editingIndex >= 0).map((p, idx) => (
                <TouchableOpacity key={idx} style={styles.promptOption} onPress={() => setSelectedPrompt(p)}>
                  <Text style={styles.promptOptionText}>{p}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.answerContainer}>
              <View style={styles.promptCardModal}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.textPrimary} />
                  <Text style={styles.promptPregunta}>{selectedPrompt}</Text>
                </View>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Escribe tu respuesta aquí..."
                  placeholderTextColor={COLORS.textMuted}
                  value={respuesta}
                  onChangeText={setRespuesta}
                  multiline
                  autoFocus
                  maxLength={150}
                />
              </View>
              <TouchableOpacity onPress={() => { setSelectedPrompt(null); setRespuesta(''); }} style={{ marginTop: 20, alignSelf: 'center' }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>Cambiar pregunta</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    gap: 12,
  },
  promptCard: {
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptPregunta: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flexShrink: 1,
  },
  promptRespuesta: {
    fontSize: 22,
    fontFamily: FONTS.display,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  removeBtn: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primario,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    color: COLORS.primario,
    fontWeight: '800',
    fontSize: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSave: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primario,
  },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  promptOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  answerContainer: {
    flex: 1,
    padding: 20,
  },
  promptCardModal: {
    backgroundColor: COLORS.tarjeta,
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  answerInput: {
    fontSize: 24,
    fontFamily: FONTS.display,
    fontWeight: '900',
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  }
});
