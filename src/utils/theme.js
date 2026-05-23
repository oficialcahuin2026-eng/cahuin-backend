// src/utils/theme.js

const COLORS = {
  primario: '#E63946',    
  secundario: '#1D3557',  
  acento: '#457B9D',      
  fondo: '#F8F9FA',       
  bg: '#F8F9FA',          
  tarjeta: '#FFFFFF',     
  texto: '#2B2D42',       
  textPrimary: '#2B2D42', 
  textMuted: '#8D99AE',   
  gris: '#8D99AE',        
  rojoBandera: '#D52B1E', 
  like: '#4CAF50',        
  nope: '#F44336',        
  superlike: '#00BCD4',
  blanco: '#FFFFFF',
  negro: '#000000',
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
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 40
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
  '2xl': 32, // 👈 El culpable de SIZES
  '3xl': 40,
};

const SHADOWS = {
  light: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 },
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.29, shadowRadius: 4.65, elevation: 7 },
  dark: { shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.41, shadowRadius: 9.11, elevation: 14 },
  '2xl': { shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.5, shadowRadius: 35, elevation: 20 }, // 👈 El culpable de SHADOWS
};

const RADIUS = {
  sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24 // 👈 Por si acaso usó "radius"
};

// 1. Exportamos en MAYÚSCULAS (Nuestro estándar)
export { COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS };

// 2. Exportamos en minúsculas (El estándar de la otra IA)
export const colors = COLORS;
export const fonts = FONTS;
export const spacing = SPACING;
export const sizes = SIZES;
export const shadows = SHADOWS;
export const radius = RADIUS;

// 3. Exportamos por defecto envolviendo absolutamente todo
export default { 
  COLORS, FONTS, SPACING, SIZES, SHADOWS, RADIUS,
  colors, fonts, spacing, sizes, shadows, radius 
};