const mongoose = require('mongoose');

const historiaExitoSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nombres: { type: String, required: true, trim: true, maxlength: 120 },
  ciudad: { type: String, default: '', trim: true, maxlength: 80 },
  historia: { type: String, required: true, trim: true, maxlength: 1200 },
  contacto: { type: String, default: '', trim: true, maxlength: 120 },
  imagen: { type: String, required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  },
  motivoRechazo: { type: String, default: '', trim: true, maxlength: 600 },
  revisadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  revisadoEn: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('HistoriaExito', historiaExitoSchema);
