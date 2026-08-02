require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB");
  
  const panoramas = await Panorama.find({});
  let updated = 0;

  for (let p of panoramas) {
    let newCat = p.categoria;
    let newEmoji = p.emoji;
    const norm = (p.categoria || "").toLowerCase();
    
    if (norm.includes('música') || norm.includes('musica')) { newCat = 'Música'; newEmoji = '🎵'; }
    else if (norm.includes('comedia')) { newCat = 'Comedia'; newEmoji = '😂'; }
    else if (norm.includes('cultura') || norm.includes('arte') || norm.includes('geek') || norm.includes('anime')) { newCat = 'Cultura'; newEmoji = '🎨'; }
    else if (norm.includes('deporte') || norm.includes('skate') || norm.includes('trekking')) { newCat = 'Deporte'; newEmoji = '⚽'; }
    else if (norm.includes('gastronom') || norm.includes('comida') || norm.includes('food') || norm.includes('economía')) { newCat = 'Gastronomía'; newEmoji = '🍔'; }
    else if (norm.includes('feria')) { newCat = 'Feria'; newEmoji = '🎪'; }
    else { newCat = 'Otros'; newEmoji = '✨'; }

    if (p.categoria !== newCat || p.emoji !== newEmoji) {
      p.categoria = newCat;
      p.emoji = newEmoji;
      await p.save();
      updated++;
    }
  }

  console.log(`Terminado. Actualizados ${updated} panoramas con las nuevas categorías.`);
  process.exit(0);
};

run().catch(console.error);
