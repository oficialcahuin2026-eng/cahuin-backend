const mongoose = require('mongoose');

const preguntaAnonimaSchema = new mongoose.Schema({
  receptor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pregunta: { type: String, required: true, maxlength: 220 },
  respuesta: { type: String, default: '', maxlength: 500 },
  respondida: { type: Boolean, default: false },
  visibleEnPerfil: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('PreguntaAnonima', preguntaAnonimaSchema);
