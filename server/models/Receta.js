const mongoose = require('mongoose');

const RecetaSchema = new mongoose.Schema({
  titulo:       { type: String, required: true },
  descripcion:  { type: String, required: true },
  ingredientes: [{ type: String }],
  pasos:        [{ orden: Number, texto: String }],
  foto:         { type: String, default: '' },
  region:       { type: String, default: '' },
  autor:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  categoria:    { type: String, enum: ['Entrada', 'Plato de fondo', 'Postre', 'Bebestible', 'Otro'], default: 'Plato de fondo' },
}, { timestamps: true });

module.exports = mongoose.model('Receta', RecetaSchema);