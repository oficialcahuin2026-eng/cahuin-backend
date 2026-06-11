const mongoose = require('mongoose');

const historiaSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  texto: { type: String, required: true, maxlength: 500 },
  lugar: { type: String, default: '' },
  ciudad: { type: String, default: '' },
  region: { type: String, default: '' },
  emoji: { type: String, default: '📸' },
  imagen: { type: String, default: '' },
  reacciones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comentarios: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    texto: { type: String, required: true, maxlength: 220 },
    fecha: { type: Date, default: Date.now },
  }],
  sumados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiraEn: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Historia', historiaSchema);
