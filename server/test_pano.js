require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const panoramas = await Panorama.find({ fecha: { $gte: tomorrow } }).sort({ fecha: 1 }).limit(3);

  console.log(`\n=== EVENTOS DEL BOT PARA MAÑANA ===`);
  for (let p of panoramas) {
    console.log(`\nTITULO: ${p.titulo}`);
    console.log(`FECHA: ${p.fecha.toISOString().split('T')[0]}`);
    console.log(`DESCRIPCION EXTRA:\n${p.descripcionExtra}`);
  }

  process.exit(0);
};

run().catch(console.error);
