import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CahuinBottomSheet from './CahuinBottomSheet';

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
    <CahuinBottomSheet visible={visible} onClose={onClose} snapPoints={['60%', '90%']}>
      <View style={{ backgroundColor: COLORS.bg, flexShrink: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <FlatList
          data={options}
          keyExtractor={(_, index) => String(index)}
          style={[styles.listWrap, { flexShrink: 1 }]}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={({ item }) => {
            const isObject = typeof item === 'object';
            const label = isObject ? item.label : item;
            const icon = isObject ? item.icon : null;
            const isSelected = selectedValue === label;

            return (
              <TouchableOpacity
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
          }}
        />
      </View>
    </CahuinBottomSheet>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
