const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receptor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tipo: { type: String, enum: ['like', 'dislike', 'superlike', 'relampago'], required: true },

  respuestasRemitente: { type: [String], default: [] },
  respuestasReceptor:  { type: [String], default: [] },

  esRelampago: { type: Boolean, default: false },
  expiraEn:    { type: Date,    default: null  },
  salvado:     { type: Boolean, default: false },

  // Ruleta Ciega
  esRuletaCiega:   { type: Boolean, default: false },
  revelóRemitente: { type: Boolean, default: false },
  revelóReceptor:  { type: Boolean, default: false },

  // 🌟 IA SALVA-CHATS (¡No olvides este!)
  iaIntervino: { type: Boolean, default: false },
  esDemo: { type: Boolean, default: false },
  demoKey: { type: String, default: '' }

}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
