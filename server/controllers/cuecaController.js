// server/controllers/cuecaController.js

exports.getEstado = async (req, res) => {
  try {
    // Aquí a futuro buscaremos en MongoDB si ya jugaron.
    // Por ahora, le decimos a la app que el juego está nuevo y listo para empezar.
    res.json({ estado: 'disponible', rondaActual: 1, puntaje: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error al cargar La Cueca' });
  }
};

exports.iniciar = async (req, res) => {
  try {
    res.json({ message: '¡Adentro con la primera patita!', rondaActual: 1 });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar el juego' });
  }
};

exports.responder = async (req, res) => {
  try {
    const { ronda, respuesta } = req.body;
    const siguienteRonda = ronda + 1;
    const terminado = siguienteRonda > 3;

    if (terminado) {
      return res.json({
        message: '¡Vuelta y zapateo! Han terminado La Cueca. 🇨🇱',
        rondaActual: 3,
        terminado: true,
        ganoPremio: true
      });
    }

    res.json({
      message: `¡Buena elección! Vamos a la patita número ${siguienteRonda}`,
      rondaActual: siguienteRonda,
      terminado: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al procesar la respuesta' });
  }
};