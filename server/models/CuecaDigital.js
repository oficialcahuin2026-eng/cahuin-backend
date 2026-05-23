const mongoose = require('mongoose');

const CuecaSchema = new mongoose.Schema({
  iniciador:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receptor:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rondaActual: { type: Number, default: 1, min: 1, max: 4 },
  completada:  { type: Boolean, default: false },
  esMatch:     { type: Boolean, default: false },
  respuestas: [{
    ronda:     { type: Number },
    usuario:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respuesta: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  turnoActual:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  esperandoRespuesta: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('CuecaDigital', CuecaSchema);