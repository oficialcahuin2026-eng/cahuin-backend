const mongoose = require('mongoose');

const cartaSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reacciones: {
    fuego: { type: Number, default: 0 },
    risa: { type: Number, default: 0 },
    triste: { type: Number, default: 0 }
  },
  comentarios: [{ texto: String, fecha: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Carta', cartaSchema);
