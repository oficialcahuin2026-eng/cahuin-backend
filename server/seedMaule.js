const mongoose = require('mongoose');
require('dotenv').config();
const Panorama = require('./models/Panorama');
const fs = require('fs');

const EMOJIS = {
  'Música': '🎸',
  'Cultura': '🎭',
  'Deporte': '⚽',
  'Comedia': '😂',
  'Feria': '🎪',
  'Gastronomía': '🍷'
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT || process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear previous maule events if any
    await Panorama.deleteMany({ region: "Maule" });
    console.log('Deleted old Maule events');
    
    const rawData = fs.readFileSync('maule_raw.txt', 'utf8');
    const lines = rawData.split('\n');
    
    const eventos = [];
    
    for(const line of lines) {
      if(!line.trim()) continue;
      const parts = line.split('\t');
      if(parts.length < 5) continue;
      
      let diaStr = parts[0].trim();
      let titulo = parts[1].trim();
      let lugar = parts[2].trim();
      let cat = parts[3].trim();
      let desc = parts[4].trim();
      
      let d = 1;
      const match = diaStr.match(/(\d+)/);
      if(match) d = parseInt(match[1]);
      
      let dStr = d < 10 ? '0' + d : d;
      let dateStr = '2026-07-' + dStr + 'T20:00:00Z';
      
      // Categorias oficiales de la app
      let catF = 'Feria';
      if (cat.includes('Música')) catF = 'Música';
      if (cat.includes('Cultura')) catF = 'Cultura';
      if (cat.includes('Deporte')) catF = 'Deporte';
      if (cat.includes('Comedia')) catF = 'Comedia';
      if (cat.includes('Gastronomía')) catF = 'Gastronomía';
      
      let emoji = EMOJIS[catF] || '✨';
      
      eventos.push({
        region: 'Maule',
        lugar: lugar,
        titulo: titulo,
        descripcion: desc || 'Panorama en el Maule',
        fecha: new Date(dateStr),
        categoria: catF,
        emoji: emoji,
        esOficial: true,
        activo: true
      });
    }
    
    await Panorama.insertMany(eventos);
    console.log("Inserted " + eventos.length + " events for Maule");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
