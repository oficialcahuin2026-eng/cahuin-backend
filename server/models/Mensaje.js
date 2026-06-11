const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  matchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  // 🌟 NUEVO: Remitente ya NO es required, para que la IA pueda enviar mensajes sola
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  texto:     { type: String, required: true, maxlength: 1000 },
  leido:     { type: Boolean, default: false },
  // 🌟 NUEVO: Se agrega 'ia_wingman' a los tipos
  tipo:      { type: String, enum: ['texto', 'imagen', 'regalo', 'ia_wingman'], default: 'texto' }, 
  regalo:    { tipo: String, emoji: String },
  esDemo: { type: Boolean, default: false },
  demoKey: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Mensaje', MensajeSchema);
