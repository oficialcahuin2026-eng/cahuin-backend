const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("¡Oye! No encuentro el MONGO_URI en el archivo .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`☁️ MongoDB Conectado a la base de datos local: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = conectarDB;