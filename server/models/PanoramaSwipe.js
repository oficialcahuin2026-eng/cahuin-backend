const mongoose = require('mongoose');

const panoramaSwipeSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  panorama: { type: mongoose.Schema.Types.ObjectId, ref: 'Panorama', required: true },
  decision: { type: String, enum: ['like', 'pass'], required: true },
}, { timestamps: true });

panoramaSwipeSchema.index({ usuario: 1, panorama: 1 }, { unique: true });

module.exports = mongoose.model('PanoramaSwipe', panoramaSwipeSchema);
