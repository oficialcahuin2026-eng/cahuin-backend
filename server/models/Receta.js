const mongoose = require('mongoose');

const recetaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  ingredientes: [{ type: String }],
  instrucciones: { type: String },
  imagen: { type: String },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Receta', recetaSchema);