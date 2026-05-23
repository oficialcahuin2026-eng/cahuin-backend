// server/models/Panorama.js
const mongoose = require('mongoose');

const panoramaSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  lugar: { 
    type: String, 
    required: true 
  },
  region: { 
    type: String, 
    required: true // Ahora la región es obligatoria para el filtro
  },
  fecha: { 
    type: Date, 
    required: true 
  },
  // 🌟 CAMBIO 1: El creador ya no es 'required: true' para que el Robot pueda crear eventos
  creador: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  // 🌟 CAMBIO 2: Quitamos la lista estricta (enum) para permitir "Oficial", "Comunidad", "Rock", etc.
  categoria: { 
    type: String, 
    default: 'Otro'
  },
  emoji: { 
    type: String, 
    default: '📍' 
  },
  maxPersonas: { 
    type: Number, 
    default: 100 
  },
  participantes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  // 🌟 CAMBIO 3: Campos especiales para los eventos raspados de internet
  esOficial: { 
    type: Boolean, 
    default: false 
  },
  externalUrl: { 
    type: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Panorama', panoramaSchema);