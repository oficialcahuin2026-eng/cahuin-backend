require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Match = require('./models/Match');
const Mensaje = require('./models/Mensaje');
const Panorama = require('./models/Panorama');
const Historia = require('./models/Historia');

const Botella = require('./models/Botella');
const Carta = require('./models/Carta');
const CuecaDigital = require('./models/CuecaDigital');
const HistoriaExito = require('./models/HistoriaExito');
const PanoramaSwipe = require('./models/PanoramaSwipe');
const PreguntaAnonima = require('./models/PreguntaAnonima');
const Receta = require('./models/Receta');
const Reporte = require('./models/Reporte');
const CahuinDiario = require('./models/CahuinDiario');

async function wipeDatabase() {
  try {
    console.log('⏳ Conectando a MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI_DIRECT);
    console.log('✅ Conectado con éxito. Iniciando limpieza total...');

    await User.deleteMany({});
    console.log('🗑️  Usuarios eliminados.');

    await Match.deleteMany({});
    console.log('🗑️  Matches eliminados.');

    await Mensaje.deleteMany({});
    console.log('🗑️  Mensajes eliminados.');

    await Panorama.deleteMany({});
    console.log('🗑️  Panoramas eliminados.');

    await Historia.deleteMany({});
    console.log('🗑️  Historias eliminadas.');

    await Botella.deleteMany({});
    await Carta.deleteMany({});
    await CuecaDigital.deleteMany({});
    await HistoriaExito.deleteMany({});
    await PanoramaSwipe.deleteMany({});
    await PreguntaAnonima.deleteMany({});
    await Receta.deleteMany({});
    await Reporte.deleteMany({});
    await CahuinDiario.deleteMany({});
    console.log('🗑️  Demás colecciones eliminadas.');

    console.log('✨ Base de datos reseteada a 0. ¡Cahuín está como nuevo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  }
}

wipeDatabase();
