require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Required for populate
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB!");

  const panoramas = await Panorama.find({}).populate('creador');
  const botPanoramas = panoramas.filter(p => p.creador && p.creador.email === 'bot@cahuin.cl');
  
  const dateCounts = {};
  botPanoramas.forEach(p => {
    const d = p.fecha.toISOString().split('T')[0];
    if (!dateCounts[d]) dateCounts[d] = {};
    if (!dateCounts[d][p.region]) dateCounts[d][p.region] = 0;
    dateCounts[d][p.region]++;
  });

  console.log("Panoramas by Date and Region:");
  console.log(JSON.stringify(dateCounts, null, 2));

  process.exit(0);
};

run().catch(console.error);
