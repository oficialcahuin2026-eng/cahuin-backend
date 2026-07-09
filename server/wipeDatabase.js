require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Match = require('./models/Match');
const Mensaje = require('./models/Mensaje');
const Panorama = require('./models/Panorama');
const Historia = require('./models/Historia');

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

    console.log('✨ Base de datos reseteada a 0. ¡Cahuín está como nuevo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  }
}

wipeDatabase();
