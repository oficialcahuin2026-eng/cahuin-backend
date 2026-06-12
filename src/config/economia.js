export const PLANES_CAHUIN = [
  {
    id: 'cahuin_piola_monthly',
    tier: 'piola',
    nombre: 'Cahuin Piola',
    tagline: 'Para moverte tranquilo sin quedarte corto.',
    precioReferencial: 'CLP3.990/mes',
    storeProductId: 'cahuin_piola',
    basePlanId: 'mensual',
    googleProductId: 'cahuin_piola:mensual',
    productAliases: ['cahuin_piola', 'cahuin_piola_mensual', 'cahuin_piola:mensual'],
    revenueCatEntitlement: 'cahuin_premium',
    color: '#7A1518',
    accent: '#FF6B5E',
    beneficios: [
      'Likes diarios sin limite',
      'Retroceder cuando pasaste a alguien sin querer',
      'Ruleta a Ciegas',
      'Salvar racha de swipes',
      'Modo Chile: cambia ciudad dentro del pais',
      'Sin anuncios',
    ],
    bloqueados: [
      'Sapear quien te tinca',
      'Entrar a La Pica',
      'Modo Destacado',
    ],
  },
  {
    id: 'cahuin_a_fondo_monthly',
    tier: 'a_fondo',
    nombre: 'Cahuin a Fondo',
    tagline: 'Para entrar fuerte al cahuin y ver mas claro.',
    precioReferencial: 'CLP6.990/mes',
    storeProductId: 'cahuin_a_fondo',
    basePlanId: 'mensual',
    googleProductId: 'cahuin_a_fondo:mensual',
    productAliases: ['cahuin_a_fondo', 'cahuin_a_fondo_mensual', 'cahuin_a_fondo:mensual'],
    revenueCatEntitlement: 'cahuin_premium',
    color: '#9B6A00',
    accent: '#FFD166',
    destacado: true,
    beneficios: [
      'Todo lo de Cahuin Piola',
      'Ver quien te tiro like',
      'La Pica: seleccion diaria de perfiles con mas onda',
      'Tus likes aparecen antes',
      'Modo Destacado',
      'Salvar Match Relampago',
      'Estrellas incluidas',
    ],
    bloqueados: [],
  },
];

export const PLAN_REVELA_LIKES = ['a_fondo', 'gold', 'platinum'];
export const PLAN_PIOLA_O_SUPERIOR = ['piola', 'a_fondo', 'plus', 'gold', 'platinum'];
export const PLAN_A_FONDO_O_SUPERIOR = ['a_fondo', 'gold', 'platinum'];
