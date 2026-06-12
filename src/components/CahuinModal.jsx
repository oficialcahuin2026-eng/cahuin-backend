import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { FONTS, SHADOWS, SPACING } from '../utils/theme';

export default function CahuinModal({
  visible,
  icon = 'sparkles',
  emoji,
  title,
  message,
  actions = [],
  accent,
  tone = 'default',
  details,
  onClose,
}) {
  const { COLORS, isDarkMode } = useTheme();
  const accentColor = accent || getToneColor(tone, COLORS);
  const forceDark = tone === 'premium' || tone === 'dark';
  const styles = getStyles(COLORS, isDarkMode, accentColor, forceDark);
  const finalActions = actions.length > 0
    ? actions
    : [{ label: 'Listo', variant: 'primary', onPress: onClose }];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.sheetHandle} />
          <View style={styles.sparkleOne}><Text style={styles.sparkleText}>*</Text></View>
          <View style={styles.sparkleTwo}><Text style={styles.sparkleText}>*</Text></View>
          <View style={styles.sparkleDot} />

          <LinearGradient colors={[hexToRgba(accentColor, 0.16), hexToRgba(accentColor, 0.04)]} style={styles.iconHalo}>
            <View style={styles.iconWrap}>
              {emoji ? (
                <Text style={styles.emoji}>{emoji}</Text>
              ) : (
                <Ionicons name={icon} size={42} color={accentColor} />
              )}
            </View>
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {details ? <Text style={styles.details}>{details}</Text> : null}

          <View style={[
            styles.actions, 
            finalActions.length === 1 && styles.actionsSingle,
            finalActions.length > 2 && { flexDirection: 'column' }
          ]}>
            {finalActions.map((action) => {
              const primary = action.variant !== 'secondary';
              const danger = action.variant === 'danger';
              const actionColor = action.color || (danger ? '#F0444F' : accentColor);
              return (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.9}
                  style={[
                    styles.button,
                    action.variant === 'secondary' && styles.secondaryButton,
                  ]}
                  onPress={action.onPress || onClose}
                >
                  {primary ? (
                    <LinearGradient colors={[actionColor, lighten(actionColor)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.buttonGradient}>
                      {action.icon ? <Ionicons name={action.icon} size={18} color="#FFF" style={{ marginRight: 8 }} /> : null}
                      <Text style={[styles.buttonText, styles.primaryText]}>{action.label}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={[styles.buttonText, styles.secondaryText, { color: action.color || accentColor }]}>
                      {action.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getToneColor = (tone, COLORS) => {
  const map = {
    success: '#22C55E',
    warning: '#F59E0B',
    purple: '#7C3AED',
    premium: '#F0444F',
    dark: '#F0444F',
    danger: '#F0444F',
    default: COLORS.primario,
  };
  return map[tone] || COLORS.primario;
};

const lighten = (color) => {
  const clean = color.replace('#', '');
  if (clean.length !== 6) return '#FF715F';
  const r = Math.min(255, parseInt(clean.slice(0, 2), 16) + 28);
  const g = Math.min(255, parseInt(clean.slice(2, 4), 16) + 28);
  const b = Math.min(255, parseInt(clean.slice(4, 6), 16) + 28);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToRgba = (color, alpha) => {
  const clean = String(color || '').replace('#', '');
  if (clean.length !== 6) return `rgba(240,68,79,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const getStyles = (COLORS, isDarkMode, accentColor, forceDark) => {
  const darkPanel = isDarkMode || forceDark;
  return StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.76)' : 'rgba(9, 12, 20, 0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[5],
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 34,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[7],
    paddingBottom: SPACING[6],
    backgroundColor: forceDark ? '#151923' : (isDarkMode ? '#121722' : '#FFFFFF'),
    borderWidth: 1,
    borderColor: darkPanel ? 'rgba(255,255,255,0.16)' : 'rgba(16,24,40,0.08)',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.dark,
  },
  sheetHandle: {
    position: 'absolute',
    top: 18,
    width: 62,
    height: 7,
    borderRadius: 99,
    backgroundColor: darkPanel ? 'rgba(255,255,255,0.22)' : '#D0D5DD',
  },
  sparkleOne: { position: 'absolute', top: 88, left: 82 },
  sparkleTwo: { position: 'absolute', top: 73, right: 84 },
  sparkleText: { color: accentColor, fontSize: 23, fontWeight: '900' },
  sparkleDot: { position: 'absolute', top: 114, right: 126, width: 7, height: 7, borderRadius: 4, backgroundColor: accentColor, opacity: 0.55 },
  iconHalo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: darkPanel ? 'rgba(255,255,255,0.06)' : '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: hexToRgba(accentColor, 0.26),
    shadowColor: accentColor,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: darkPanel ? 0.32 : 0.18,
    shadowRadius: 22,
    elevation: 8,
  },
  emoji: { fontSize: 46 },
  title: {
    color: darkPanel ? '#FFFFFF' : COLORS.textPrimary,
    fontFamily: FONTS.display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  message: {
    color: darkPanel ? '#D1D5DB' : COLORS.textMuted,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: SPACING[3],
    maxWidth: 330,
  },
  details: {
    color: darkPanel ? '#AAB2C0' : '#667085',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: SPACING[4],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: darkPanel ? 'rgba(255,255,255,0.12)' : hexToRgba(accentColor, 0.14),
    maxWidth: 320,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING[3],
    width: '100%',
    marginTop: SPACING[6],
  },
  actionsSingle: { maxWidth: 330 },
  button: {
    flex: 1,
    minHeight: 58,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    backgroundColor: darkPanel ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
    borderWidth: 1,
    borderColor: darkPanel ? 'rgba(255,255,255,0.18)' : hexToRgba(accentColor, 0.2),
  },
  buttonGradient: {
    minHeight: 58,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING[4],
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    fontFamily: FONTS.display,
  },
  primaryText: { color: '#FFF' },
  secondaryText: { color: accentColor },
  });
};

