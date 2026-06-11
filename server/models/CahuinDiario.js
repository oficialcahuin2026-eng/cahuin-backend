const mongoose = require('mongoose');

const votoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opcion: { type: String, enum: ['de_acuerdo', 'ni_cagando'], required: true },
}, { _id: false, timestamps: true });

const cahuinDiarioSchema = new mongoose.Schema({
  fecha: { type: String, required: true, unique: true },
  texto: { type: String, required: true },
  autorAnonimo: { type: String, default: 'Anonimo de la mesa del fondo' },
  votos: [votoSchema],
}, { timestamps: true });

module.exports = mongoose.model('CahuinDiario', cahuinDiarioSchema);
