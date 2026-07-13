const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre:      { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  telefono:    { type: String, default: '' },
  password:    { type: String, required: true },
  foto:        { type: String, default: '' },
  fotos:       { type: [String], default: [] },
  fotoSocialBloqueada: { type: Boolean, default: false },
  ciudad:      { type: String, default: 'Por definir' },
  region:      { type: String, default: 'Por definir' },

  genero:             { type: String, default: 'Por definir' },
  pronombres:         { type: String, default: '' },
  mostrarGenero:      { type: Boolean, default: false },
  orientacionSexual:  { type: String, default: 'Por definir' },
  mostrarOrientacion: { type: Boolean, default: false },
  preferencia:        { type: String, default: 'Todxs' },
  queBuscas:          { type: String, default: 'Lo sigo pensando' },
  distanciaMax:       { type: Number, default: 50 },
  distanciaFlexible:  { type: Boolean, default: true },
  edadMin:            { type: Number, default: 18 },
  edadMax:            { type: Number, default: 60 },
  edadFlexible:       { type: Boolean, default: true },

  isPremium:   { type: Boolean, default: false },
  premiumPlan: { type: String, enum: ['free', 'piola', 'a_fondo', 'plus', 'gold', 'platinum'], default: 'free' },
  ultimaEntregaPremium: { type: Date, default: null },
  premiumHasta:{ type: Date, default: null },
  ultimoCumpleCeleb: { type: Number, default: 0 },
  verificado:  { type: Boolean, default: false },

  fechaNacimiento: { type: Date, default: null },
  zodiaco:         { type: String, default: '' },
  edad:            { type: Number, required: true, default: 18 },
  aceptaTerminos:  { type: Boolean, default: true },

  latitud:     { type: Number, default: null },
  longitud:    { type: Number, default: null },
  descripcion: { type: String, default: '' },
  prompts:     { type: [mongoose.Schema.Types.Mixed], default: [] },
  altura:      { type: String, default: '' },
  peso:        { type: String, default: '' },

  universidad:        { type: String, default: '' },
  centroEstudios:     { type: String, default: '' },
  nivelEscolaridad:   { type: String, default: '' },
  estiloComunicacion: { type: String, default: '' },
  recibirAmor:        { type: String, default: '' },
  trabajo:            { type: String, default: '' },
  profesion:          { type: String, default: '' },
  personalidad:       { type: String, default: '' },
  idiomas:            { type: [String], default: [] },

  habitos: {
    beber:         { type: String, default: '' },
    fumar:         { type: String, default: '' },
    ejercicio:     { type: String, default: '' },
    mascotas:      { type: String, default: '' },
    alimentacion:  { type: String, default: '' },
    redesSociales: { type: String, default: '' },
    habitosSueno:  { type: String, default: '' },
    carrete:       { type: String, default: '' },
    vacaciones:    { type: String, default: '' },
    transporte:    { type: String, default: '' }
  },

  // 🌟 FIX: EL CAMPO QUE FALTABA PARA QUE TE DEJE GUARDAR
  intereses: { type: [String], default: [] },
  hobbies: { type: [mongoose.Schema.Types.Mixed], default: [] },
  peliculasFavoritas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  seriesFavoritas: { type: [mongoose.Schema.Types.Mixed], default: [] },
  juegosFavoritos: { type: [mongoose.Schema.Types.Mixed], default: [] },
  artistasSpotify: { type: [mongoose.Schema.Types.Mixed], default: [] },
  
  categoriasExplorar: { type: [String], default: [] },
  fechasDisponibles: { type: [String], default: [] }, 

  musica:      { type: String, default: '' },
  peliculas:   { type: String, default: '' },
  deportes:    { type: String, default: '' },
  cancion:     { nombre: { type: String, default: '' }, foto: { type: String, default: '' } },
  bloqueados:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pushToken:   { type: String, default: null },

  reputacion: { type: Number, default: 5.0 },
  numCalificaciones: { type: Number, default: 0 },
  cahuines:       { type: Number, default: 100 },
  rachaDias:      { type: Number, default: 1 },
  rachaSwipesDias: { type: Number, default: 0 },
  ultimoSwipeRachaFecha: { type: Date, default: null },
  boostGratisDisponibles: { type: Number, default: 0 },
  ultimaConexion: { type: Date, default: Date.now },
  boostActivoHasta: { type: Date, default: null },
  vistasPerfil: [{ espectador: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, fecha: { type: Date, default: Date.now } }],

  arquetipoCahuinero: { type: String, default: null },
  mostrarArquetipo: { type: Boolean, default: true },
  audioRompehielos: { type: String, default: null },
  cuentaPausada: { type: Boolean, default: false },
  cuentaEliminadaEn: { type: Date, default: null },
  motivoEliminacion: { type: String, default: null },

  filtrosAvanzados: {
    alturaMin: { type: Number, default: 140 },
    alturaMax: { type: Number, default: 220 },
    fumar: { type: String, default: '' },
    zodiaco: { type: String, default: '' }
  },

  likesRecibidos: { type: Number, default: 0 },
  likesSemana: { type: Number, default: 0 },
  viaje: { ciudadDestino: { type: String, default: '' }, fechaInicio: { type: Date, default: null }, fechaFin: { type: Date, default: null } },
  cuentaPausada: { type: Boolean, default: false },

  diarioCitas: [{
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    texto: { type: String },
    fecha: { type: Date, default: Date.now }
  }],

  tipoApego: { type: String, enum: ['Ansioso', 'Evitativo', 'Seguro', null], default: null },
  mostrarApego: { type: Boolean, default: false },

  mapaValores: {
    prioridadLealtad: { type: Boolean, default: false },
    planesHijos: { type: String, default: 'Por definir' },
    dealBreaker: { type: String, default: '' }
  },
  modoRecuperacion: { type: Boolean, default: false },
  swipesHoy: { type: Number, default: 0 },
  ultimoSwipeFecha: { type: Date, default: Date.now },
  esDemo: { type: Boolean, default: false },
  demoKey: { type: String, default: '' },

  // Nuevos campos de Ajustes
  notifMatches: { type: Boolean, default: true },
  notifMensajes: { type: Boolean, default: true },
  notifPromos: { type: Boolean, default: true },
  confirmacionLectura: { type: Boolean, default: true },
  modoIncognito: { type: Boolean, default: false },
  mostrarEdad: { type: Boolean, default: true },
  mostrarDistancia: { type: Boolean, default: true },
  
  // Recompensas Premium
  superLikes: { type: Number, default: 0 },
  boosts: { type: Number, default: 0 }

}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function(passwordIngresado) { return await bcrypt.compare(passwordIngresado, this.password); };
module.exports = mongoose.model('User', userSchema);
