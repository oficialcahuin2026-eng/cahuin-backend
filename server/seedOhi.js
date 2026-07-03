const mongoose = require('mongoose');
require('dotenv').config();
const Panorama = require('./models/Panorama');
const fs = require('fs');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear previous ohiggins events if any
    await Panorama.deleteMany({ region: "O'Higgins" });
    console.log("Deleted old O'Higgins events");
    
    const ohigginsData = fs.readFileSync('../ohiggins.txt', 'utf8');
    
    // Evaluate the array data from ohiggins.txt
    // ohiggins.txt has comments and object lines. We can evaluate it inside an array bracket
    const eventos = eval('[' + ohigginsData + ']');
    
    const toInsert = eventos.map(e => ({
      ...e,
      esOficial: true,
      activo: true,
      descripcion: e.descripcion || "Panorama en O'Higgins"
    }));
    
    await Panorama.insertMany(toInsert);
    console.log("Inserted " + toInsert.length + " events for O'Higgins");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
