// server/controllers/matchController.js
const Match = require('../models/Match');

exports.darLike = async (req, res) => {
  try {
    const receptorId = req.params.id;
    const remitenteId = req.user._id;

    if (!req.user.isPremium) {
      const inicioHoy = new Date();
      inicioHoy.setHours(0, 0, 0, 0);
      const likesEnviadosHoy = await Match.countDocuments({
        remitente: remitenteId, tipo: 'like', createdAt: { $gte: inicioHoy }
      });
      if (likesEnviadosHoy >= 5) {
        return res.status(403).json({ message: '¡Párale el carro! Ya gastaste tus 5 likes diarios. Pásate a Premium para tener chipe libre. 🇨🇱' });
      }
    }

    const nuevaAccion = new Match({ remitente: remitenteId, receptor: receptorId, tipo: 'like' });
    await nuevaAccion.save();

    const hayLikeDeVuelta = await Match.findOne({ remitente: receptorId, receptor: remitenteId, tipo: { $in: ['like', 'superlike'] } });
    
    if (hayLikeDeVuelta) {
      return res.json({ esMatch: true, message: '¡Se armó el cahuín! Tienen un Match' });
    }
    res.json({ message: 'Like enviado con éxito' });
  } catch (error) { res.status(500).json({ message: 'Error interno al dar like' }); }
};

exports.darSuperLike = async (req, res) => {
  try {
    const nuevaAccion = new Match({ remitente: req.user._id, receptor: req.params.id, tipo: 'superlike' });
    await nuevaAccion.save();
    res.json({ message: '¡SuperLike enviado!' });
  } catch (error) { res.status(500).json({ message: 'Error al enviar SuperLike' }); }
};

exports.pasar = async (req, res) => {
  try {
    const nuevaAccion = new Match({ remitente: req.user._id, receptor: req.params.id, tipo: 'dislike' });
    await nuevaAccion.save();
    res.json({ message: 'Deslizado a la izquierda' });
  } catch (error) { res.status(500).json({ message: 'Error al pasar' }); }
};

// 🌟 LA NUEVA MAGIA: Busca los likes mutuos y crea una sala
exports.listarMisMatches = async (req, res) => {
  try {
    const miId = req.user._id;

    // 1. A quiénes les di like
    const misLikesDocs = await Match.find({ remitente: miId, tipo: { $in: ['like', 'superlike'] } });
    const misLikesIds = misLikesDocs.map(m => m.receptor.toString());

    // 2. Quiénes de ellos me dieron like de vuelta
    const meDieronLikeDocs = await Match.find({
      remitente: { $in: misLikesIds },
      receptor: miId,
      tipo: { $in: ['like', 'superlike'] }
    }).populate('remitente', 'nombre foto ciudad');

    // 3. Armar la lista final con un ID de sala único
    const matches = meDieronLikeDocs.map(m => {
      const miLikeHaciaEl = misLikesDocs.find(l => l.receptor.toString() === m.remitente._id.toString());
      // Usamos el ID del Match más antiguo como la "llave" de la sala de chat
      const roomId = (miLikeHaciaEl.createdAt < m.createdAt) ? miLikeHaciaEl._id : m._id;
      
      return {
        roomId: roomId,
        usuario: m.remitente,
        fecha: m.createdAt
      };
    });

    res.json({ matches });
  } catch (error) {
    console.error("Error cargando matches:", error);
    res.status(500).json({ message: 'Error al cargar matches' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Match eliminado' });
  } catch (error) { res.status(500).json({ message: 'Error al eliminar match' }); }
};

exports.darLikeODislike = exports.darLike;