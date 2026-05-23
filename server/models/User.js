// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const userSchema = new mongoose.Schema({
  nombre:      { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  foto:        { type: String, default: '' },
  ciudad:      { type: String, default: 'Por definir' }, 
  region:      { type: String, default: 'Por definir' },
  genero:      { type: String, enum: ['Hombre', 'Mujer', 'Otro'], default: 'Otro' },
  preferencia: { type: String, enum: ['Hombres', 'Mujeres', 'Todos'], default: 'Todos' },
  isPremium:   { type: Boolean, default: false },
  
  // 🌟 NUEVO: Edad y Legalidad
  edad:           { type: Number, required: true, default: 18 },
  aceptaTerminos: { type: Boolean, default: true },

  latitud:     { type: Number, default: null },
  longitud:    { type: Number, default: null },
  descripcion: { type: String, default: '' },
  altura:      { type: String, default: '' }, 
  peso:        { type: String, default: '' }, 
  musica:      { type: String, default: '' }, 
  peliculas:   { type: String, default: '' }, 
  deportes:    { type: String, default: '' },
  bloqueados:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true 
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('User', userSchema);