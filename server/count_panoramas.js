require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const panoramas = await Panorama.find({});

  let countTomorrow = 0;
  let countFuture = 0;
  let countPast = 0;

  for (let p of panoramas) {
    if (!p.fecha) continue;
    const d = new Date(p.fecha);
    d.setHours(0,0,0,0); 

    if (d.getTime() === tomorrow.getTime()) {
      countTomorrow++;
    } else if (d.getTime() >= dayAfterTomorrow.getTime()) {
      countFuture++;
    } else {
      countPast++;
    }
  }

  console.log(`\n=== REPORTE DE PANORAMAS ===`);
  console.log(`Para mañana (${tomorrow.toLocaleDateString()}): ${countTomorrow} eventos.`);
  console.log(`Para el futuro (después de mañana): ${countFuture} eventos.`);
  console.log(`Eventos pasados/hoy: ${countPast} eventos.`);
  console.log(`Total en DB: ${panoramas.length} eventos.\n`);

  process.exit(0);
};

run().catch(console.error);
