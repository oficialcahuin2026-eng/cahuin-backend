require('dotenv').config();
const mongoose = require('mongoose');
const { fetchPanoramasParaRegion } = require('./services/geminiBotService');
const User = require('./models/User');
const regiones = require('./utils/regiones');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB!");

  for (const region of regiones) {
    console.log(`\n--- Fetching for ${region.nombre} ---`);
    try {
      await fetchPanoramasParaRegion(region);
    } catch (err) {
      console.error(`Error in ${region.nombre}:`, err.message);
    }
    // wait 10s
    await new Promise(resolve => setTimeout(resolve, 10000));
  }


  console.log("\nFinished force scraping!");
  process.exit(0);
};

run().catch(console.error);
