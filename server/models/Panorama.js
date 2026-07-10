const mongoose = require('mongoose');

const panoramaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  lugar: { type: String, required: true },
  direccion: { type: String }, // 🌟 NUEVO: Para abrir Google Maps/Waze exacto
  region: { type: String, required: true },
  fecha: { type: Date, required: true },
  fechaFin: { type: Date }, // 🌟 NUEVO: Para eventos que duran varios días

  creador: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  categoria: { type: String, default: 'Otro' },
  emoji: { type: String, default: '📍' },
  imagen: { type: String }, // 🌟 NUEVO: Para el afiche del concierto

  maxPersonas: { type: Number, default: 100 },
  privacidad: { type: String, enum: ['Público', 'Amigos', 'Solo invitación'], default: 'Público' },
  participantes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  solicitudes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mensajesGrupo: [{
    remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    texto: { type: String, required: true },
    tipo: { type: String, enum: ['sistema', 'texto'], default: 'sistema' },
    fecha: { type: Date, default: Date.now }
  }],

  esOficial: { type: Boolean, default: false },
  activo: { type: Boolean, default: true },
  externalUrl: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Panorama', panoramaSchema);
