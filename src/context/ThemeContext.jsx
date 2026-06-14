import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

// ─────────────────────────────────────────────
// 🎨 PALETAS BASE (dark / light)
// ─────────────────────────────────────────────
const base = {
  doradoLight:   '#FFF8E1',
  doradoPremium: '#FFD700',
  like:          '#4CAF50',
  nope:          '#F44336',
  superlike:     '#00BCD4',
  blanco:        '#FFFFFF',
  negro:         '#000000',
};

export const lightBase = {
  ...base,
  bg:          '#FFFCFA',
  fondo:       '#FFFCFA',
  tarjeta:     '#FFFFFF',
  textPrimary: '#101828',
  textMuted:   '#667085',
  gris:        '#98A2B3',
  border:      '#EEF0F4',
  primario:    '#F0444F',
  acento:      '#FF7A68',
  softRed:     '#FFF0F1',
  softPurple:  '#F4ECFF',
  softGreen:   '#EFFAEF',
  softAmber:   '#FFF5E6',
  navy:        '#121A2A',
  // ── New tokens ──
  surface:         '#F7F7F8',
  surfaceElevated: '#FFFFFF',
  surfaceCard:     '#FFFFFF',
  chipBg:          'rgba(0,0,0,0.05)',
  chipText:        '#3F3F46',
  chipBorder:      'rgba(0,0,0,0.08)',
  inputBg:         '#F4F4F5',
  compatHigh:      '#22C55E',
  compatMedium:    '#F59E0B',
  compatLow:       '#EF4444',
  online:          '#22C55E',
  gradientStart:   '#F0444F',
  gradientEnd:     '#FF715F',
};

export const darkBase = {
  ...base,
  bg:          '#0A0A0A',
  fondo:       '#000000',
  tarjeta:     '#1A1A1A',
  textPrimary: '#F9FAFB',
  textMuted:   '#9CA3AF',
  gris:        '#4B5563',
  border:      '#374151',
  primario:    '#F0444F',
  acento:      '#FF7A68',
  softRed:     '#31191D',
  softPurple:  '#241B34',
  softGreen:   '#15271B',
  softAmber:   '#332716',
  navy:        '#182033',
  // ── New tokens ──
  surface:         '#111113',
  surfaceElevated: '#1A1A1E',
  surfaceCard:     '#1E1E22',
  chipBg:          'rgba(255,255,255,0.08)',
  chipText:        '#D4D4D8',
  chipBorder:      'rgba(255,255,255,0.12)',
  inputBg:         '#1A1A1E',
  compatHigh:      '#22C55E',
  compatMedium:    '#F59E0B',
  compatLow:       '#EF4444',
  online:          '#22C55E',
  gradientStart:   '#F0444F',
  gradientEnd:     '#FF715F',
};

// ─────────────────────────────────────────────
// 🗺️ PALETAS POR REGIÓN DE CHILE
// primario: color principal de la región
// acento:   color secundario / highlights
// ─────────────────────────────────────────────
export const PALETAS_REGION = {
  // Norte Grande
  'Arica y Parinacota': {
    primario:     '#D4530A', // Naranja andino — textiles aimaras, altiplano
    acento:       '#F5A623',
    nombreCorto:  'Arica',
    emoji:        '🏔️',
  },
  'Tarapacá': {
    primario:     '#C8860A', // Ocre desierto — salitreras, arena dorada
    acento:       '#E8C547',
    nombreCorto:  'Tarapacá',
    emoji:        '🌵',
  },
  'Antofagasta': {
    primario:     '#B5470A', // Cobre oxidado — minería, desierto rojo
    acento:       '#E8892A',
    nombreCorto:  'Antofagasta',
    emoji:        '⛏️',
  },
  'Atacama': {
    primario:     '#A83215', // Terracota — flores del desierto, Valle de la Luna
    acento:       '#F2994A',
    nombreCorto:  'Atacama',
    emoji:        '🌺',
  },

  // Norte Chico
  'Coquimbo': {
    primario:     '#1A6B8A', // Azul pisco — mar del norte, cielos Valle de Elqui
    acento:       '#56CCF2',
    nombreCorto:  'Coquimbo',
    emoji:        '🔭',
  },

  // Zona Central
  'Valparaíso': {
    primario:     '#E63946', // Rojo cerro — cerros pintados, ascensores, arte
    acento:       '#F4A261',
    nombreCorto:  'Valparaíso',
    emoji:        '🎨',
  },
  'Metropolitana de Santiago': {
    primario:     '#2D3748', // Gris urbano — ciudad, modernidad
    acento:       '#E53E3E',
    nombreCorto:  'Santiago',
    emoji:        '🏙️',
  },
  "Libertador General Bernardo O'Higgins": {
    primario:     '#1B5E20', // Verde viña — viñedos, huasos, campo chileno
    acento:       '#F9A825',
    nombreCorto:  "O'Higgins",
    emoji:        '🍇',
  },
  'Maule': {
    primario:     '#6A1E5E', // Ciruela — vino tinto, tierra colorada del sur
    acento:       '#C62A88',
    nombreCorto:  'Maule',
    emoji:        '🍷',
  },
  'Ñuble': {
    primario:     '#6D4C41', // Café trigo — campos de trigo, Chillán
    acento:       '#F9A825',
    nombreCorto:  'Ñuble',
    emoji:        '🌾',
  },

  // Sur
  'Biobío': {
    primario:     '#1565C0', // Azul océano — mar, industria, Concepción
    acento:       '#00ACC1',
    nombreCorto:  'Biobío',
    emoji:        '🌊',
  },
  'La Araucanía': {
    primario:     '#1B5E20', // Verde nativo — bosque nativo, wenufoye mapuche
    acento:       '#C62828', // Rojo bandera mapuche
    nombreCorto:  'Araucanía',
    emoji:        '🌿',
  },
  'Los Ríos': {
    primario:     '#00695C', // Verde río — selva valdiviana, lluvia
    acento:       '#4CAF50',
    nombreCorto:  'Los Ríos',
    emoji:        '🌧️',
  },
  'Los Lagos': {
    primario:     '#0D47A1', // Azul lago — lagos, volcanes, Chiloé
    acento:       '#26A69A',
    nombreCorto:  'Los Lagos',
    emoji:        '🌋',
  },

  // Zona Austral
  'Aysén del General Carlos Ibáñez del Campo': {
    primario:     '#004D40', // Verde patagónico — bosques, glaciares turquesa
    acento:       '#00BCD4',
    nombreCorto:  'Aysén',
    emoji:        '🏔️',
  },
  'Magallanes y de la Antártica Chilena': {
    primario:     '#1A237E', // Azul glaciar — Torres del Paine, hielo eterno
    acento:       '#B0BEC5', // Gris glaciar
    nombreCorto:  'Magallanes',
    emoji:        '🧊',
  },

  // Fallback (sin región / Por definir)
  'default': {
    primario:     '#E53935',
    acento:       '#FF6B6B',
    nombreCorto:  'Chile',
    emoji:        '🇨🇱',
  },
};

// ─────────────────────────────────────────────
// 🔧 HELPER: normaliza el nombre de región
// (maneja variantes de escritura del campo en DB)
// ─────────────────────────────────────────────
const normalizarRegion = (region) => {
  if (!region || region === 'Por definir') return 'default';

  // Mapa de aliases para lo que puede venir de la BD
  const aliases = {
    'arica':          'Arica y Parinacota',
    'tarapaca':       'Tarapacá',
    'tarapacá':       'Tarapacá',
    'antofagasta':    'Antofagasta',
    'atacama':        'Atacama',
    'coquimbo':       'Coquimbo',
    'valparaiso':     'Valparaíso',
    'valparaíso':     'Valparaíso',
    'metropolitana':  'Metropolitana de Santiago',
    'santiago':       'Metropolitana de Santiago',
    'rm':             'Metropolitana de Santiago',
    "o'higgins":      "Libertador General Bernardo O'Higgins",
    'ohiggins':       "Libertador General Bernardo O'Higgins",
    'libertador':     "Libertador General Bernardo O'Higgins",
    'maule':          'Maule',
    'nuble':          'Ñuble',
    'ñuble':          'Ñuble',
    'biobio':         'Biobío',
    'biobío':         'Biobío',
    'bio-bío':        'Biobío',
    'araucania':      'La Araucanía',
    'araucanía':      'La Araucanía',
    'la araucanía':   'La Araucanía',
    'los rios':       'Los Ríos',
    'los ríos':       'Los Ríos',
    'losrios':        'Los Ríos',
    'los lagos':      'Los Lagos',
    'loslagos':       'Los Lagos',
    'aysen':          'Aysén del General Carlos Ibáñez del Campo',
    'aysén':          'Aysén del General Carlos Ibáñez del Campo',
    'magallanes':     'Magallanes y de la Antártica Chilena',
  };

  const clave = region.toLowerCase().trim();
  // Busca alias exacto
  if (aliases[clave]) return aliases[clave];
  // Busca si el nombre ya está en la paleta
  if (PALETAS_REGION[region]) return region;
  // Busca por inclusión parcial
  const match = Object.keys(PALETAS_REGION).find(k =>
    k.toLowerCase().includes(clave) || clave.includes(k.toLowerCase())
  );
  return match || 'default';
};

// ─────────────────────────────────────────────
// 🎨 GENERA LOS COLORES FINALES
// (combina base dark/light + paleta de región)
// ─────────────────────────────────────────────
const generarColores = (isDarkMode, region) => {
  const baseColors  = isDarkMode ? darkBase : lightBase;
  const regionKey   = normalizarRegion(region);
  const paleta      = PALETAS_REGION[regionKey] || PALETAS_REGION['default'];

  return {
    ...baseColors,
    primario: baseColors.primario,
    acento:   baseColors.acento,
    regionPrimario: paleta.primario,
    regionAcento: paleta.acento,
    // Guardamos la info de región para poder usarla en componentes
    _region:  regionKey,
    _emoji:   paleta.emoji,
    _nombreCorto: paleta.nombreCorto,
  };
};

// ─────────────────────────────────────────────
// 🌍 PROVIDER
// ─────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const deviceTheme = useColorScheme();
  const [isDarkMode,   setIsDarkMode]   = useState(deviceTheme === 'dark');
  const [regionActual, setRegionActual] = useState('default');

  useEffect(() => {
    if (deviceTheme) {
      setIsDarkMode(deviceTheme === 'dark');
    }
  }, [deviceTheme]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Función para que AuthContext actualice la región al cargar el usuario
  const setRegion = (region) => {
    if (region) setRegionActual(region);
  };

  // Memoizamos para no recalcular en cada render
  const COLORS = useMemo(
    () => generarColores(isDarkMode, regionActual),
    [isDarkMode, regionActual]
  );

  // Info de la paleta de la región actual (para mostrar nombre, emoji, etc.)
  const infoPaleta = PALETAS_REGION[normalizarRegion(regionActual)] || PALETAS_REGION['default'];

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, COLORS, setRegion, infoPaleta }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
