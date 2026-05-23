const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  match:     { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  texto:     { type: String, required: true, maxlength: 1000 },
  leido:     { type: Boolean, default: false },
  tipo:      { type: String, enum: ['texto', 'imagen', 'regalo'], default: 'texto' },
  regalo:    { tipo: String, emoji: String },
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', MensajeSchema);