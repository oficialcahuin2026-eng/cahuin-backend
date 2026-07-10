const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    await User.updateOne({ celular: '+56999999991' }, { $set: { genero: 'Mujer' } });
    await User.updateOne({ celular: '+56999999992' }, { $set: { genero: 'Mujer' } });
    
    console.log('Perfiles actualizados a Mujer');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateSeed();
