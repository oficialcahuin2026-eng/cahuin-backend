const mongoose = require('mongoose');
require('dotenv').config();
const Panorama = require('./models/Panorama');
mongoose.connect(process.env.MONGO_URI_DIRECT || process.env.MONGO_URI).then(async () => {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  const docs = await Panorama.find({ region: /Maule/i });
  console.log('Events count:', docs.length);
  if(docs.length > 0) {
    console.log('Sample dates:');
    docs.slice(0,5).forEach(d => console.log(d.fecha));
  }
  process.exit(0);
});
