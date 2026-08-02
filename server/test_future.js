require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const panoramas = await Panorama.find({ fecha: { $gte: dayAfterTomorrow } }).sort({ fecha: 1 });

  console.log(`\n=== EVENTOS FUTUROS (después de mañana) ===`);
  for (let p of panoramas) {
    console.log(`- ${p.fecha ? p.fecha.toISOString().split('T')[0] : 'Sin fecha'}: ${p.titulo} (${p.region})`);
  }

  process.exit(0);
};

run().catch(console.error);
