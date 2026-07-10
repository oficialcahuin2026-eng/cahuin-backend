const mongoose = require('mongoose');
require('dotenv').config();



mongoose.connect(process.env.MONGO_URI_DIRECT).then(async () => {
  const User = require('./models/User');

  const nombresMujeres = [
    'Camila', 'Fernanda', 'Javiera', 'Martina', 'Isidora',
    'Antonia', 'Valentina', 'Catalina', 'Francisca', 'Daniela',
    'Constanza', 'Paz', 'Romina', 'Macarena', 'Ignacia'
  ];

  const profiles = [];
  for (let i = 0; i < 15; i++) {
    const nombre = nombresMujeres[i];
    profiles.push({
      nombre,
      email: `${nombre.toLowerCase()}@cahuin.com`,
      password: 'password123',
      edad: 20 + Math.floor(Math.random() * 8),
      genero: 'Mujer',
      preferencia: 'Hombres',
      ciudad: 'Temuco',
      region: 'Araucanía',
      fotos: [`https://i.pravatar.cc/800?img=${10 + i}`],
      biografia: 'Buscando a alguien para ir por unas chelas al centro.',
      queBuscas: 'Algo piola',
      intereses: ['Música', 'Cerveza', 'Series'],
      rachaSwipesDias: 0,
      swipesHoy: 0
    });
  }

  for (const p of profiles) {
    const exists = await User.findOne({ email: p.email });
    if (!exists) {
      await User.create(p);
    } else {
      await User.updateOne({ email: p.email }, { $set: p });
    }
  }

  console.log('Agregados 15 perfiles de prueba en Temuco');
  process.exit(0);
});
