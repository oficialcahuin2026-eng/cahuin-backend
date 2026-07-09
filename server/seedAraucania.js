const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Panorama = require('./models/Panorama');

const parseFile = () => {
  const content = fs.readFileSync('parsed_araucania.txt', 'utf8');
  const lines = content.split('\n').filter(Boolean);
  
  const eventos = [];
  
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    
    let diaStr = parts[0].trim();
    let titleLoc = parts[1].trim();
    let categoria = parts[2].trim();
    let descripcion = parts[3].trim();
    
    // Split title and location using camelcase detection
    // Match lowercase, number, or closing parenthesis followed by Uppercase
    let regex = /([a-záéíóúñ0-9\)])([A-Z])/;
    let title = titleLoc;
    let ubicacion = "La Araucanía";
    let ciudad = "Temuco";
    
    const match = regex.exec(titleLoc);
    if (match) {
        title = titleLoc.substring(0, match.index + 1);
        ubicacion = titleLoc.substring(match.index + 1);
    }
    
    // Extract city from location if possible
    const cities = ['Temuco', 'Villarrica', 'Pucón', 'Lautaro', 'Nueva Imperial', 'Lumaco', 'Lonquimay', 'Angol', 'Melipeuco', 'Padre Las Casas', 'Victoria', 'Pitrufquén', 'Lota', 'Tomé', 'Concepción', 'Cañete'];
    for (let c of cities) {
        if (ubicacion.includes(c)) {
            ciudad = c;
            break;
        }
    }

    // Default image based on category
    let imagenUrl = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';
    if (categoria === 'Cultura') imagenUrl = 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80';
    if (categoria === 'Música') imagenUrl = 'https://images.unsplash.com/photo-1540039155732-68473668f430?w=800&q=80';
    if (categoria === 'Ferias u otro') imagenUrl = 'https://images.unsplash.com/photo-1533174000255-161433ed3c17?w=800&q=80';
    if (categoria === 'Comedia') imagenUrl = 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80';
    if (categoria === 'Deporte') imagenUrl = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80';
    if (categoria === 'Gastronomía') imagenUrl = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80';

    // Dates
    let dayNum = 1;
    let dateStrMatch = diaStr.match(/\d{2}/);
    if (dateStrMatch) {
      dayNum = parseInt(dateStrMatch[0], 10);
    }
    let fecha = new Date(2026, 6, dayNum, 20, 0, 0); // July is 6

    // Emojis based on category
    const EMOJIS = {
      'Fiestas': '🎉',
      'Música': '🎵',
      'Gastronomía': '🍔',
      'Cultura': '🎨',
      'Deporte': '⚽',
      'Comedia': '😂',
      'Ferias u otro': '🎪',
      'Feria': '🎪',
    };
    let catF = categoria;
    if (categoria.includes('Ferias')) catF = 'Feria';
    let emoji = EMOJIS[catF] || '✨';

    if (!title) title = "Evento en Araucanía";

    eventos.push({
      titulo: title,
      descripcion,
      fecha,
      lugar: ubicacion,
      region: "La Araucanía",
      categoria: catF,
      emoji: emoji,
      esOficial: true,
      activo: true
    });
  }
  
  return eventos;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT || process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB Araucania');

    const eventos = parseFile();
    console.log(`📌 Encontrados ${eventos.length} eventos para La Araucanía. Insertando...`);

    const result = await Panorama.insertMany(eventos);
    console.log(`🎉 ¡Éxito! Se insertaron ${result.length} eventos en La Araucanía.`);

  } catch (error) {
    console.error('❌ Error sembrando la BD:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

run();
