const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a MongoDB');

    const perfiles = [
      {
        celular: '+56999999991',
        email: 'valeria@cahuin.com',
        password: 'password123',
        nombre: 'Valeria',
        edad: 24,
        genero: 'Femenino',
        orientacion: 'Heterosexual',
        ciudad: 'Santiago',
        region: 'Metropolitana de Santiago',
        foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900',
        fotos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900'],
        descripcion: 'Amante de los gatos y el sushi 🍣',
        trabajo: 'Diseñadora',
        universidad: 'UAndes',
        arquetipoCahuinero: 'La Artista',
        arquetipo: { nombre: 'La Artista', emoji: '🎨', color: '#F472B6' },
        likesRecibidos: 5,
        hobbies: ['Fotografía', 'Arte', 'Sushi']
      },
      {
        celular: '+56999999992',
        email: 'sofia@cahuin.com',
        password: 'password123',
        nombre: 'Sofía',
        edad: 22,
        genero: 'Femenino',
        orientacion: 'Bisexual',
        ciudad: 'Santiago',
        region: 'Metropolitana de Santiago',
        foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900',
        fotos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900'],
        descripcion: 'Busco alguien para ir a conciertos 🎸',
        trabajo: 'Estudiante',
        universidad: 'UCh',
        arquetipoCahuinero: 'La Melómana',
        arquetipo: { nombre: 'La Melómana', emoji: '🎧', color: '#8B5CF6' },
        likesRecibidos: 8,
        hobbies: ['Música', 'Conciertos', 'Festivales']
      }
    ];

    for (const perfil of perfiles) {
      const existe = await User.findOne({ celular: perfil.celular });
      if (!existe) {
        await User.create(perfil);
        console.log(`Usuario ${perfil.nombre} creado.`);
      } else {
        console.log(`Usuario ${perfil.nombre} ya existía.`);
      }
    }

    console.log('Seed completado.');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar perfiles:', error);
    process.exit(1);
  }
};

seedUsers();
