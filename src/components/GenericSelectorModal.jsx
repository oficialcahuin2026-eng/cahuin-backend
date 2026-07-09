import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GenericSelectorModal({ visible, onClose, onSave, options, selectedValue, title, COLORS }) {
  const styles = getStyles(COLORS);
  
  const handleSelect = (item) => {
    // Check if the item is an object (like { label: 'Aries', icon: '♈' }) or just a string
    const valueToSave = typeof item === 'object' ? item.label : item;
    
    if (selectedValue === valueToSave) {
      onSave(''); 
    } else {
      onSave(valueToSave);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.listWrap}>
          {options.map((item, index) => {
            const isObject = typeof item === 'object';
            const label = isObject ? item.label : item;
            const icon = isObject ? item.icon : null;
            const isSelected = selectedValue === label;

            return (
              <TouchableOpacity
                key={index}
                style={styles.optionRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {icon && <Text style={styles.optionIcon}>{icon}</Text>}
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark" size={24} color={COLORS.primario} />}
              </TouchableOpacity>
            );
          })}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  listWrap: {
    flex: 1,
    backgroundColor: COLORS.tarjeta,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
    color: COLORS.textPrimary,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '800',
    color: COLORS.primario,
  }
});
