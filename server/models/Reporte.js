const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  denunciante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportado:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  motivo:      { type: String, default: 'Comportamiento inapropiado' },
  estado:      { type: String, enum: ['pendiente', 'revisado', 'resuelto'], default: 'pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Reporte', reporteSchema);