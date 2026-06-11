const mongoose = require('mongoose');

const botellaSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receptorActual: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  texto: { type: String, required: true, trim: true },
  audio: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['flotando', 'leida', 'respondida'],
    default: 'flotando',
  },
  regionOrigen: { type: String, default: '' },
  historial: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accion: { type: String, default: 'recibida' },
    fecha: { type: Date, default: Date.now },
  }],
  respuestas: [{
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    texto: { type: String, trim: true },
    fecha: { type: Date, default: Date.now },
  }],
  expiraEn: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Botella', botellaSchema);
