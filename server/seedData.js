const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Panorama = require('./models/Panorama');
const Match = require('./models/Match');

dotenv.config();

const usersData = [
  { nombre: 'Camila', edad: 23, genero: 'Femenino', orientacion: 'Bisexual', ciudad: 'Temuco', region: 'Araucanía', latitud: -38.7359, longitud: -72.5904 },
  { nombre: 'Josefa', edad: 21, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Pucón', region: 'Araucanía', latitud: -39.2778, longitud: -71.9758 },
  { nombre: 'Martina', edad: 25, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Villarrica', region: 'Araucanía', latitud: -39.2817, longitud: -72.2272 },
  { nombre: 'Javiera', edad: 24, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Temuco', region: 'Araucanía', latitud: -38.74, longitud: -72.6 },
  { nombre: 'Isidora', edad: 22, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Valdivia', region: 'Los Ríos', latitud: -39.8142, longitud: -73.2459 },
  { nombre: 'Catalina', edad: 26, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Osorno', region: 'Los Lagos', latitud: -40.5739, longitud: -73.1336 },
  { nombre: 'Valentina', edad: 20, genero: 'Femenino', orientacion: 'Bisexual', ciudad: 'Puerto Montt', region: 'Los Lagos', latitud: -41.4693, longitud: -72.9424 },
  { nombre: 'Renata', edad: 23, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Castro', region: 'Los Lagos', latitud: -42.4823, longitud: -73.7644 },
  { nombre: 'Florencia', edad: 24, genero: 'Femenino', orientacion: 'Bisexual', ciudad: 'Concepción', region: 'Bío Bío', latitud: -36.8201, longitud: -73.0444 },
  { nombre: 'Antonia', edad: 21, genero: 'Femenino', orientacion: 'Heterosexual', ciudad: 'Talcahuano', region: 'Bío Bío', latitud: -36.7167, longitud: -73.1167 },
  
  { nombre: 'Matías', edad: 24, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Temuco', region: 'Araucanía', latitud: -38.745, longitud: -72.61 },
  { nombre: 'Benjamín', edad: 22, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Santiago', region: 'Metropolitana', latitud: -33.4489, longitud: -70.6693 },
  { nombre: 'Tomás', edad: 25, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Viña del Mar', region: 'Valparaíso', latitud: -33.0246, longitud: -71.5518 },
  { nombre: 'Joaquín', edad: 26, genero: 'Masculino', orientacion: 'Bisexual', ciudad: 'Valparaíso', region: 'Valparaíso', latitud: -33.0393, longitud: -71.6273 },
  { nombre: 'Nicolás', edad: 23, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Temuco', region: 'Araucanía', latitud: -38.75, longitud: -72.62 },
  { nombre: 'Sebastián', edad: 21, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Pucón', region: 'Araucanía', latitud: -39.28, longitud: -71.98 },
  { nombre: 'Agustín', edad: 27, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Valdivia', region: 'Los Ríos', latitud: -39.82, longitud: -73.25 },
  { nombre: 'Diego', edad: 24, genero: 'Masculino', orientacion: 'Bisexual', ciudad: 'Puerto Montt', region: 'Los Lagos', latitud: -41.47, longitud: -72.95 },
  { nombre: 'Felipe', edad: 22, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Concepción', region: 'Bío Bío', latitud: -36.83, longitud: -73.05 },
  { nombre: 'Lucas', edad: 25, genero: 'Masculino', orientacion: 'Heterosexual', ciudad: 'Chillán', region: 'Ñuble', latitud: -36.6066, longitud: -72.1034 }
];

const fotosChicas = [
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=900',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=900'
];

const fotosChicos = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=900',
  'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=900',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=900'
];

const panoramasData = [
  { titulo: 'Lollapalooza Chile 2026', descripcion: 'El festival más grande llega con todo el power.', fecha: new Date(Date.now() + 86400000*30), lugar: 'Parque Bicentenario de Cerrillos', region: 'Metropolitana', esOficial: true, categoria: 'Música', imagen: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=900', latitud: -33.4912, longitud: -70.7188, emoji: '🎸' },
  { titulo: 'Fonda Parque O\'Higgins', descripcion: 'Celebrando el 18 con las mejores fondas y terremotos.', fecha: new Date(Date.now() + 86400000*60), lugar: 'Parque O\'Higgins', region: 'Metropolitana', esOficial: true, categoria: 'Cultura', imagen: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=900', latitud: -33.464, longitud: -70.658, emoji: '🇨🇱' },
  { titulo: 'Feria Gastronómica Ñam', descripcion: 'Lo mejor de la cocina chilena e internacional.', fecha: new Date(Date.now() + 86400000*15), lugar: 'Cerro Santa Lucía', region: 'Metropolitana', esOficial: true, categoria: 'Gastronomía', imagen: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=900', latitud: -33.44, longitud: -70.643, emoji: '🍔' },
  
  { titulo: 'REC - Rock en Conce', descripcion: 'El festival de música gratuito más grande de Chile.', fecha: new Date(Date.now() + 86400000*20), lugar: 'Parque Bicentenario', region: 'Bío Bío', esOficial: true, categoria: 'Música', imagen: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=900', latitud: -36.82, longitud: -73.05, emoji: '🎸' },
  { titulo: 'Fiesta de la Cerveza Valdivia', descripcion: 'Degustación de cervezas artesanales, comida y música.', fecha: new Date(Date.now() + 86400000*10), lugar: 'Parque Saval', region: 'Los Ríos', esOficial: true, categoria: 'Gastronomía', imagen: 'https://images.unsplash.com/photo-1538481199042-48a04f2f4514?q=80&w=900', latitud: -39.8, longitud: -73.25, emoji: '🍻' },
  { titulo: 'Ironman 70.3 Pucón', descripcion: 'La carrera más linda del mundo en los alrededores del volcán.', fecha: new Date(Date.now() + 86400000*45), lugar: 'Pucón', region: 'Araucanía', esOficial: true, categoria: 'Deporte', imagen: 'https://images.unsplash.com/photo-1551817958-c9c0ab6a8497?q=80&w=900', latitud: -39.277, longitud: -71.975, emoji: '🏃‍♂️' },
  { titulo: 'Festival de Cine de Valdivia', descripcion: 'Ficvaldivia con estrenos nacionales e internacionales.', fecha: new Date(Date.now() + 86400000*90), lugar: 'Universidad Austral', region: 'Los Ríos', esOficial: true, categoria: 'Cultura', imagen: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=900', latitud: -39.81, longitud: -73.25, emoji: '🎬' },
  
  { titulo: 'Festival de Viña del Mar', descripcion: 'El festival de los festivales.', fecha: new Date(Date.now() + 86400000*120), lugar: 'Quinta Vergara', region: 'Valparaíso', esOficial: true, categoria: 'Música', imagen: 'https://images.unsplash.com/photo-1470229722913-7c092bce99f5?q=80&w=900', latitud: -33.03, longitud: -71.55, emoji: '🎶' },
  { titulo: 'Valparaíso Cerro Abajo', descripcion: 'Descenso urbano extremo.', fecha: new Date(Date.now() + 86400000*50), lugar: 'Cerros de Valparaíso', region: 'Valparaíso', esOficial: true, categoria: 'Deporte', imagen: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=900', latitud: -33.04, longitud: -71.62, emoji: '🚵' },
  
  { titulo: 'Carnaval Andino con la Fuerza del Sol', descripcion: 'Uno de los carnavales más grandes de Sudamérica.', fecha: new Date(Date.now() + 86400000*40), lugar: 'Arica', region: 'Arica y Parinacota', esOficial: true, categoria: 'Cultura', imagen: 'https://images.unsplash.com/photo-1533174000255-73017ecd33aa?q=80&w=900', latitud: -18.47, longitud: -70.31, emoji: '💃' }
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_DIRECT);
    console.log('Conectado a DB. Comenzando seeding...');

    // Limpiar usuarios de prueba anteriores que tengan email @cahuin.com
    await User.deleteMany({ email: { $regex: '@cahuin.com$' } });
    await Panorama.deleteMany({}); // Borramos los panoramas viejos

    let id = 100;
    const usuariosNuevos = usersData.map(u => {
      id++;
      return {
        ...u,
        email: `prueba${id}@cahuin.com`,
        password: 'password123',
        foto: u.genero === 'Femenino' ? fotosChicas[id % fotosChicas.length] : fotosChicos[id % fotosChicos.length],
        fotos: [u.genero === 'Femenino' ? fotosChicas[id % fotosChicas.length] : fotosChicos[id % fotosChicos.length]],
        descripcion: `Soy ${u.nombre} y vivo en ${u.ciudad}. Busco conocer gente buena onda y apañadora.`,
        habitos: { beber: 'Socialmente', fumar: 'No', ejercicio: 'A veces', carrete: 'Los findes' },
        verificado: true
      };
    });

    await User.insertMany(usuariosNuevos);
    console.log(`Insertados ${usuariosNuevos.length} perfiles de prueba.`);

    await Panorama.insertMany(panoramasData);
    console.log(`Insertados ${panoramasData.length} panoramas oficiales en distintas regiones.`);

    console.log('¡Seeding completado con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedData();
