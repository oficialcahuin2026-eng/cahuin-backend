require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB!");

  try {
    let systemUser = await User.findOne({ email: "bot@cahuin.cl" });
    if (!systemUser) {
      console.log("Creating user...");
      systemUser = await User.create({
        nombre: "Cahuin Bot",
        email: "bot@cahuin.cl",
        password: "secret_bot_password",
        genero: "Prefiero no decirlo",
        fechaNacimiento: new Date(1990, 1, 1),
        foto: "https://ui-avatars.com/api/?name=Cahuin+Bot&background=0D8ABC&color=fff"
      });
      console.log("User created:", systemUser._id);
    } else {
      console.log("User already exists:", systemUser._id);
    }
  } catch(e) {
    console.error("Error creating user:", e);
  }

  process.exit(0);
};

run().catch(console.error);
