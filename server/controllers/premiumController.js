// server/controllers/premiumController.js
const User = require('../models/User');

const PLANES = [
  { id: 'premium', nombre: 'Premium', precio: '$4.990', descripcion: 'Likes ilimitados, súper likes diarios y saber a quién le gustas.' },
  { id: 'premium_plus', nombre: 'Premium+', precio: '$8.990', descripcion: 'Todo lo anterior + 5 regalos virtuales a la semana y modo incógnito.' },
];

const REGALOS = [
  { id: 'empanada', nombre: 'Empanada', emoji: '🫓', precio: '100 Cahuines' },
  { id: 'copihue', nombre: 'Copihue', emoji: '🌺', precio: '200 Cahuines' },
  { id: 'vino', nombre: 'Vino Tinto', emoji: '🍷', precio: '300 Cahuines' },
  { id: 'terremoto', nombre: 'Terremoto', emoji: '🍹', precio: '500 Cahuines' },
  { id: 'completo', nombre: 'Completo', emoji: '🌭', precio: '150 Cahuines' }
];

exports.getPlanes = (req, res) => res.json({ planes: PLANES });
exports.getRegalos = (req, res) => res.json({ regalos: REGALOS });

exports.getEstado = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id);
    res.json({ isPremium: usuario.isPremium });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estado' });
  }
};

exports.suscribir = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANES.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ message: 'Ese plan no existe po\'' });

    // Activamos el campo "isPremium" en el usuario
    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true },
      { new: true } // Devuelve el usuario con el cambio ya aplicado
    ).select('-password');

    res.json({ 
      message: `¡Felicidades! Ahora eres ${plan.nombre} 💎`, 
      usuario: usuarioActualizado 
    });
  } catch (error) {
    console.error("❌ Error al procesar suscripción:", error);
    res.status(500).json({ message: 'Error al procesar la suscripción' });
  }
};