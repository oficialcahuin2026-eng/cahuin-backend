// server/models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  remitente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tipo: {
    type: String,
    enum: ['like', 'dislike', 'superlike'], // 🌟 AHORA SÍ ESTÁ PERMITIDO EL SUPERLIKE
    required: true
  }
}, {
  timestamps: true 
});

module.exports = mongoose.model('Match', matchSchema);