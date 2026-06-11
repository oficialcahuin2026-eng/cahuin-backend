const User = require('../models/User');

const PLANES = [
  {
    id: 'premium_plus_month',
    tier: 'plus',
    nombre: 'Cahuín Plus',
    precio: '$4.590',
    cahuines: 700,
    descripcion: 'Likes ilimitados, rewind, modo viajero nacional y 700 Cahuines.',
  },
  {
    id: 'premium_gold_month',
    tier: 'gold',
    nombre: 'Cahuín Gold',
    precio: '$7.490',
    cahuines: 1500,
    descripcion: 'Todo Plus, ver quién te dio like, top picks, 1 boost mensual y 1500 Cahuines.',
  },
  {
    id: 'premium_platinum_month',
    tier: 'platinum',
    nombre: 'Cahuín Platinum',
    precio: '$11.450',
    cahuines: 3000,
    descripcion: 'Todo Gold, likes prioritarios, modo incógnito, 3 super likes semanales y 3000 Cahuines.',
  },
];

const REGALOS = [
  { id: 'empanada', nombre: 'Empanada', emoji: '🥟', precio: '100 Cahuines' },
  { id: 'copihue', nombre: 'Copihue', emoji: '🌺', precio: '200 Cahuines' },
  { id: 'vino', nombre: 'Vino Tinto', emoji: '🍷', precio: '300 Cahuines' },
  { id: 'terremoto', nombre: 'Terremoto', emoji: '🍹', precio: '500 Cahuines' },
  { id: 'completo', nombre: 'Completo', emoji: '🌭', precio: '150 Cahuines' },
];

exports.getPlanes = (req, res) => res.json({ planes: PLANES });
exports.getRegalos = (req, res) => res.json({ regalos: REGALOS });

exports.getEstado = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id).select('isPremium premiumPlan premiumHasta cahuines');
    res.json({
      isPremium: usuario.isPremium,
      premiumPlan: usuario.premiumPlan || 'free',
      premiumHasta: usuario.premiumHasta,
      cahuines: usuario.cahuines,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
};

exports.suscribir = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANES.find((p) => p.id === planId || p.tier === planId);
    if (!plan) return res.status(400).json({ message: 'Ese plan no existe.' });

    const premiumHasta = new Date();
    premiumHasta.setDate(premiumHasta.getDate() + 30);

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user._id,
      {
        isPremium: true,
        premiumPlan: plan.tier,
        premiumHasta,
        $inc: { cahuines: plan.cahuines || 0 },
      },
      { new: true }
    ).select('-password');

    res.json({
      message: `Felicidades. Ahora eres ${plan.nombre}.`,
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error al procesar suscripcion:', error);
    res.status(500).json({ message: 'Error al procesar la suscripcion' });
  }
};

exports.comprarMonedas = async (req, res) => {
  try {
    const cantidad = Math.max(0, Number(req.body.cantidad || 0));
    if (!cantidad) return res.status(400).json({ message: 'Cantidad invalida' });

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { cahuines: cantidad } },
      { new: true }
    ).select('-password');

    res.json({ usuario: usuarioActualizado, message: `${cantidad} Cahuines agregados.` });
  } catch (error) {
    res.status(500).json({ message: 'Error agregando Cahuines' });
  }
};
