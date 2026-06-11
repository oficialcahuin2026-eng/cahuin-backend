import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

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
      <LinearGradient
        colors={focused
          ? ['rgba(240,68,79,0.24)', 'rgba(255,122,104,0.12)']
          : [COLORS.tarjeta, isDarkMode ? '#151923' : '#FFFFFF']}
        style={[styles.gradientBorder, focused && styles.focusedBorder, style]}
      >
        <View style={[styles.field, tall && styles.fieldTall]}>
          {icon ? <Ionicons name={icon} size={20} color={focused ? COLORS.primario : COLORS.textMuted} style={styles.icon} /> : null}
          <TextInput
            {...props}
            multiline={multiline}
            placeholderTextColor={isDarkMode ? '#8B95A7' : '#98A2B3'}
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
      </LinearGradient>
    </View>
  );
}

const getStyles = (COLORS, isDarkMode) => StyleSheet.create({
  container: { width: '100%' },
  label: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.display,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
    marginLeft: 4,
  },
  gradientBorder: {
    borderRadius: RADIUS.xl,
    padding: 1.5,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(148,163,184,0.22)' : 'rgba(240,68,79,0.12)',
    ...SHADOWS.light,
  },
  focusedBorder: {
    borderColor: 'rgba(240,68,79,0.36)',
    shadowColor: '#F0444F',
    shadowOpacity: 0.16,
  },
  field: {
    minHeight: 58,
    borderRadius: RADIUS.xl - 1,
    backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  fieldTall: {
    minHeight: 124,
    alignItems: 'flex-start',
    paddingTop: SPACING[4],
    paddingBottom: SPACING[4],
  },
  icon: { marginRight: 10, marginTop: 1 },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
  },
  inputTall: {
    minHeight: 88,
    lineHeight: 23,
    textAlignVertical: 'top',
  },
  right: { marginLeft: SPACING[2] },
});
