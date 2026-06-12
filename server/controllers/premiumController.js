const User = require('../models/User');

const PLANES = [
  {
    id: 'cahuin_piola_monthly',
    tier: 'piola',
    nombre: 'Cahuin Piola',
    precio: 'CLP3.990/mes',
    storeProductId: 'cahuin_piola',
    basePlanId: 'mensual',
    googleProductId: 'cahuin_piola:mensual',
    productAliases: ['cahuin_piola', 'cahuin_piola_mensual', 'cahuin_piola:mensual'],
    revenueCatEntitlement: 'cahuin_premium',
    descripcion: 'Likes sin limite, retroceder, Ruleta a Ciegas, Modo Chile y sin anuncios.',
    beneficios: [
      'Likes diarios sin limite',
      'Retroceder cuando pasaste a alguien sin querer',
      'Ruleta a Ciegas',
      'Salvar racha de swipes',
      'Modo Chile para cambiar ciudad dentro del pais',
      'Sin anuncios',
    ],
  },
  {
    id: 'cahuin_a_fondo_monthly',
    tier: 'a_fondo',
    nombre: 'Cahuin a Fondo',
    precio: 'CLP6.990/mes',
    storeProductId: 'cahuin_a_fondo',
    basePlanId: 'mensual',
    googleProductId: 'cahuin_a_fondo:mensual',
    productAliases: ['cahuin_a_fondo', 'cahuin_a_fondo_mensual', 'cahuin_a_fondo:mensual'],
    revenueCatEntitlement: 'cahuin_premium',
    descripcion: 'Todo Piola, ver quien te tinca, La Pica, prioridad, Modo Destacado y Relampago.',
    beneficios: [
      'Todo lo de Cahuin Piola',
      'Ver quien te tiro like',
      'La Pica: seleccion diaria de perfiles con mas onda',
      'Tus likes aparecen antes',
      'Modo Destacado',
      'Salvar Match Relampago',
      'Estrellas incluidas',
    ],
  },
];

const REGALOS = [];

exports.getPlanes = (req, res) => res.json({ planes: PLANES });
exports.getRegalos = (req, res) => res.json({ regalos: REGALOS });

exports.getEstado = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id).select('isPremium premiumPlan premiumHasta');
    res.json({
      isPremium: usuario.isPremium,
      premiumPlan: usuario.premiumPlan || 'free',
      premiumHasta: usuario.premiumHasta,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
};

exports.suscribir = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANES.find((p) => (
      p.id === planId ||
      p.tier === planId ||
      p.googleProductId === planId ||
      p.storeProductId === planId ||
      p.basePlanId === planId ||
      p.productAliases?.includes(planId)
    ));
    if (!plan) return res.status(400).json({ message: 'Ese plan no existe.' });

    const premiumHasta = new Date();
    premiumHasta.setDate(premiumHasta.getDate() + 30);

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumPlan: plan.tier,
        premiumHasta,
      },
      { new: true }
    ).select('-password');

    res.json({
      message: `Listo. Ahora tienes ${plan.nombre}.`,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error al procesar suscripcion:', error);
    res.status(500).json({ message: 'Error al procesar la suscripcion' });
  }
};

exports.comprarMonedas = async (req, res) => {
  res.status(410).json({ message: 'Las monedas estan desactivadas por ahora. Usa un plan Cahuin.' });
};
