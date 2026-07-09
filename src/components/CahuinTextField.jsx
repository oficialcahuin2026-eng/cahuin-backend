import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SPACING } from '../utils/theme';

export default function CahuinTextField({
  label,
  icon,
  right,
  style,
  inputStyle,
  containerStyle,
  multiline = false,
  variant = 'default',
  ...props
}) {
  const { COLORS, isDarkMode } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = getStyles(COLORS, isDarkMode);
  const tall = multiline || variant === 'textarea';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          tall && styles.fieldTall,
          focused && styles.focusedField,
          style
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={focused ? COLORS.primario : COLORS.textMuted} style={styles.icon} /> : null}
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
          selectionColor={COLORS.primario}
          cursorColor={COLORS.primario}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, tall && styles.inputTall, inputStyle]}
        />
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  container: { width: '100%', marginBottom: SPACING[3] },
  label: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.display,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 2,
  },
  field: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  focusedField: {
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  fieldTall: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: SPACING[4],
    paddingBottom: SPACING[4],
    borderRadius: 20,
  },
  icon: { marginRight: 10, marginTop: 1 },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  inputTall: {
    minHeight: 88,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  right: { marginLeft: SPACING[2] },
});
