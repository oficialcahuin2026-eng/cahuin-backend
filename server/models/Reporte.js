const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema({
  denunciante: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportado:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  motivo:      { type: String, default: 'Comportamiento inapropiado' },
  detalle:     { type: String, default: '', trim: true, maxlength: 1000 },
  origen:      { type: String, enum: ['perfil', 'chat'], default: 'perfil' },
  estado:      { type: String, enum: ['pendiente', 'revisado', 'resuelto', 'descartado'], default: 'pendiente' },
  resolucion:  { type: String, default: '', trim: true, maxlength: 1000 },
  revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  revisadoEn:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Reporte', reporteSchema);
