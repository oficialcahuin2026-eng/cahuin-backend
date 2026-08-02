require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  
  // Find everything that has a hallucinated year (2024, 2025) 
  // because today is 2026.
  const badDatePanoramas = await Panorama.deleteMany({
    fecha: { $lt: new Date('2026-08-01T00:00:00Z') }
  });

  const undefinedDescPanoramas = await Panorama.deleteMany({
    descripcionExtra: /undefined/
  });

  console.log(`Borrados por fecha antigua: ${badDatePanoramas.deletedCount}`);
  console.log(`Borrados por descripcion undefined: ${undefinedDescPanoramas.deletedCount}`);

  process.exit(0);
};

run().catch(console.error);
