// server/controllers/mensajeController.js
const Mensaje = require('../models/Mensaje');
const Match = require('../models/Match');
const User = require('../models/User'); // Necesitamos buscar al usuario
const axios = require('axios'); // Herramienta para enviar la notificación a Expo

exports.enviar = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { texto } = req.body;
    const miId = req.user._id;

    // 1. Verificamos que el match existe
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: 'Match no encontrado' });

    // 2. Guardamos el mensaje en la base de datos
    const nuevoMensaje = await Mensaje.create({
      matchId,
      remitente: miId,
      texto
    });

    // 3. 🌟 LA MAGIA DE LAS NOTIFICACIONES PUSH 🌟
    // Averiguamos quién es la otra persona (el receptor)
    const receptorId = match.remitente.toString() === miId.toString() ? match.receptor : match.remitente;
    const receptor = await User.findById(receptorId);
    const miUsuario = await User.findById(miId);

    // Si el receptor tiene guardado su Push Token de Expo, le mandamos el "timbre"
    if (receptor && receptor.pushToken) {
      const mensajePush = {
        to: receptor.pushToken,
        sound: 'default',
        title: `Nuevo Cahuín de ${miUsuario.nombre} 🌶️`,
        body: texto,
        data: { matchId: matchId }, // Para que al tocar la notificación, la app sepa a qué chat ir
      };

      // Disparamos la alerta a los servidores de Expo (ellos se encargan de Firebase/Apple)
      await axios.post('https://exp.host/--/api/v2/push/send', mensajePush);
    }

    res.json({ mensaje: nuevoMensaje });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ message: 'Error enviando mensaje' });
  }
};

exports.listar = async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ matchId: req.params.matchId })
      .populate('remitente', 'nombre foto')
      .sort('createdAt');
    res.json({ mensajes });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo mensajes' });
  }
};