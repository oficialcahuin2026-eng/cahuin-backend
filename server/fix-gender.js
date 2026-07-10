const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI_DIRECT).then(async () => {
  const User = require('./models/User');
  await User.updateMany(
    { email: { $in: ['valeria@cahuin.com', 'sofia@cahuin.com'] } },
    { $set: { genero: 'Mujer' } }
  );
  console.log('Updated test users to Mujer');
  process.exit(0);
});
