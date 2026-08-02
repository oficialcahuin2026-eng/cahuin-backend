require('dotenv').config();
const { fetchPanoramasParaRegion } = require('./services/geminiBotService');
const mongoose = require('mongoose');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  const region = { nombre: "Magallanes y de la Antártica Chilena", nombreCorto: "Magallanes y de la Antártica Chilena", comunas: ["Punta Arenas"] };
  console.log("Fetching...");
  await fetchPanoramasParaRegion(region);
  console.log("Done");
  process.exit(0);
};
run();
