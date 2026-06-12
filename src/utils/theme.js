const COLORS = {
  // ── Core ──
  primario: '#F0444F',
  secundario: '#111827',
  acento: '#FF7A68',
  fondo: '#FFFCFA',
  bg: '#FFFCFA',
  tarjeta: '#FFFFFF',
  texto: '#101828',
  textPrimary: '#101828',
  textMuted: '#667085',
  gris: '#98A2B3',
  border: '#EEF0F4',

  // ── Soft backgrounds ──
  softRed: '#FFF0F1',
  softPurple: '#F4ECFF',
  softGreen: '#EFFAEF',
  softAmber: '#FFF5E6',
  navy: '#121A2A',
  rojoBandera: '#D52B1E',

  // ── Actions ──
  like: '#34A853',
  nope: '#F44336',
  superlike: '#00BCD4',
  doradoPremium: '#FFD166',
  blanco: '#FFFFFF',
  negro: '#000000',

  // ── Surface hierarchy (new) ──
  surface: '#F7F7F8',
  surfaceElevated: '#FFFFFF',
  surfaceCard: '#FFFFFF',

  // ── Chips (new) ──
  chipBg: 'rgba(0,0,0,0.05)',
  chipText: '#3F3F46',
  chipBorder: 'rgba(0,0,0,0.08)',

  // ── Input (new) ──
  inputBg: '#F4F4F5',

  // ── Compatibility (new) ──
  compatHigh: '#22C55E',
  compatMedium: '#F59E0B',
  compatLow: '#EF4444',

  // ── Status (new) ──
  online: '#22C55E',

  // ── Gradients (new) ──
  gradientStart: '#F0444F',
  gradientEnd: '#FF715F',
};

const FONTS = {
  regular: 'System',
  bold: 'System',
  display: 'System',
  body: 'System',
  bodyBold: 'System',
};

const SPACING = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32,
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 40,
};

const SIZES = {
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  xs: 10,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

const SHADOWS = {
  light: { shadowColor: '#344054', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3 },
  medium: { shadowColor: '#344054', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.10, shadowRadius: 28, elevation: 7 },
  dark: { shadowColor: '#101828', shadowOffset: { width: 0, height: 22 }, shadowOpacity: 0.16, shadowRadius: 36, elevation: 14 },
  '2xl': { shadowColor: '#101828', shadowOffset: { width: 0, height: 28 }, shadowOpacity: 0.18, shadowRadius: 44, elevation: 20 },
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
};

export { COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS };

export const colors = COLORS;
export const fonts = FONTS;
export const spacing = SPACING;
export const sizes = SIZES;
export const shadows = SHADOWS;
export const radius = RADIUS;

export default {
  COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS,
  colors, fonts, spacing, sizes, shadows, radius,
};
