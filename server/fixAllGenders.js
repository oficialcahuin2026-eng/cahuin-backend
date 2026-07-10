const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI_DIRECT).then(async () => {
  const User = require('./models/User');
  await User.updateMany({ email: { $regex: '@cahuin.com$' }, genero: 'Femenino' }, { $set: { genero: 'Mujer' } });
  await User.updateMany({ email: { $regex: '@cahuin.com$' }, genero: 'Masculino' }, { $set: { genero: 'Hombre' } });
  console.log('Fixed gender for all test profiles');
  process.exit();
});
