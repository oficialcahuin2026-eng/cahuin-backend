const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['mercadopago', 'webpay'], required: true },
  productId: { type: String, required: true },
  productType: { type: String, enum: ['premium', 'cahuines'], required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'CLP' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  buyOrder: { type: String, index: true },
  sessionId: { type: String },
  providerReference: { type: String, index: true },
  checkoutUrl: { type: String },
  metadata: { type: Object, default: {} },
  appliedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
