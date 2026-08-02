require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');
const User = require('./models/User');

const cleanAndScrape = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT);
    console.log("Conectado a MongoDB Atlas.");

    // Buscar al usuario bot
    const botUser = await User.findOne({ email: "bot@cahuin.cl" });
    if (botUser) {
      console.log(`Borrando panoramas antiguos generados por el bot (${botUser._id})...`);
      const result = await Panorama.deleteMany({ creador: botUser._id });
      console.log(`Se eliminaron ${result.deletedCount} panoramas antiguos.`);
    } else {
      console.log("No se encontró al usuario bot. Borrando todos los panoramas marcados como esOficial: true...");
      const result = await Panorama.deleteMany({ esOficial: true });
      console.log(`Se eliminaron ${result.deletedCount} panoramas oficiales antiguos.`);
    }

    console.log("Limpieza completada. Listo para correr el scraper.");
    process.exit(0);
  } catch (err) {
    console.error("Error durante la limpieza:", err);
    process.exit(1);
  }
};

cleanAndScrape();
