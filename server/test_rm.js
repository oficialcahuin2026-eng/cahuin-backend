require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Required for populate
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB!");

  const panoramas = await Panorama.find({}).populate('creador');

  const botPanoramas = panoramas.filter(p => p.creador && p.creador.email === 'bot@cahuin.cl');
  
  const metropolitana = botPanoramas.filter(p => p.region === 'Metropolitana');
  console.log(`Found ${metropolitana.length} panoramas in Metropolitana.`);
  
  if (metropolitana.length > 0) {
    metropolitana.slice(-3).forEach(p => {
       console.log("Date:", p.fecha, "Region:", p.region, "Title:", p.titulo);
    });
  }

  process.exit(0);
};

run().catch(console.error);
