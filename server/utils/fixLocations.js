require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { inferirRegionPorCiudad, normalizarCiudadChile } = require('./chileLocations');

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({ ciudad: { $nin: ['', 'Por definir', null] } }).select('nombre ciudad region');
  let updated = 0;

  for (const user of users) {
    const ciudad = normalizarCiudadChile(user.ciudad);
    const region = inferirRegionPorCiudad(ciudad);
    if (region && (user.region !== region || user.ciudad !== ciudad)) {
      user.ciudad = ciudad;
      user.region = region;
      await user.save();
      updated += 1;
      console.log(`updated ${user.nombre}: ${ciudad} / ${region}`);
    }
  }

  console.log(`location_updates ${updated}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
