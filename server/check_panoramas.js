require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT);
    const panoramas = await Panorama.find().sort({ createdAt: -1 }).limit(5);
    console.log(panoramas.map(p => ({ titulo: p.titulo, descripcion: p.descripcion, fecha: p.fecha })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkDB();
