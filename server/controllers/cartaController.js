const Carta = require('../models/Carta');

exports.listar = async (req, res) => {
  try {
    const cartas = await Carta.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ cartas });
  } catch (error) {
    res.status(500).json({ message: 'Error al cargar las cartas' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length < 10) {
      return res.status(400).json({ message: 'La carta debe tener al menos 10 caracteres po\'' });
    }
    if (texto.length > 280) {
      return res.status(400).json({ message: 'La carta no puede tener más de 280 caracteres' });
    }
    
    // 🌟 FIX: Guardamos silenciosamente que tú eres el creador
    const carta = await Carta.create({ texto: texto.trim(), creador: req.user._id });
    res.status(201).json({ carta, message: '¡Carta enviada al universo! ✉️' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la carta' });
  }
};

// 🌟 NUEVA FUNCIÓN PARA ELIMINAR CARTA
exports.eliminar = async (req, res) => {
  try {
    const carta = await Carta.findById(req.params.id);
    if (!carta) return res.status(404).json({ message: 'Carta no existe' });

    if (carta.creador.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No eres el autor de este cahuín' });
    }

    await carta.deleteOne();
    res.json({ message: 'Carta borrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al borrar' });
  }
};

exports.reaccionar = async (req, res) => {
  try {
    const { tipo } = req.body;
    const tiposValidos = ['fuego', 'risa', 'triste'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ message: 'Tipo de reacción inválido' });
    }
    const carta = await Carta.findByIdAndUpdate(
      req.params.id,
      { $inc: { [`reacciones.${tipo}`]: 1 } },
      { new: true }
    );
    if (!carta) return res.status(404).json({ message: 'Carta no encontrada' });
    res.json({ carta });
  } catch (error) {
    res.status(500).json({ message: 'Error al reaccionar' });
  }
};