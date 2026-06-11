const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

const conectarDB = require('../config/db');
const User = require('../models/User');
const Match = require('../models/Match');
const Mensaje = require('../models/Mensaje');
const Historia = require('../models/Historia');
const Panorama = require('../models/Panorama');
const PanoramaSwipe = require('../models/PanoramaSwipe');
const CahuinDiario = require('../models/CahuinDiario');
const PreguntaAnonima = require('../models/PreguntaAnonima');
const eventosOficiales = require('./seedEventos');

const TEST_KEY = 'cahuin-test-account-temuco-v1';
const TEST_EMAIL = process.env.TEST_ACCOUNT_EMAIL || 'pruebas.temuco@cahuin.test';
const TEST_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || 'CahuinDemo123!';
const REGION = 'Araucanía';
const CITY = 'Temuco';
const BASE_COORDS = { latitud: -38.7359, longitud: -72.5904 };

const profiles = [
  ['antonia', 'Antonia', 25, 'Mujer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85', 'Cafés largos, conciertos chicos y conversaciónes que se van sin mirar la hora.', 'Relación seria', ['Música en vivo', 'Café', 'Fotografia', 'Citas tranquilas'], ['relacion-seria', 'musica-en-vivo', 'cafecito']],
  ['matias', 'Matias', 26, 'Hombre', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=900&q=85', 'Cafétero, caminatas por Temuco y buenos datos para salir sin gastar tanto.', 'Cita tranquila', ['Café', 'Universidad', 'Caminatas', 'Conversaciones reales'], ['cafecito', 'modo-estudio', 'solo-cahuines']],
  ['valentina', 'Valentina', 28, 'Mujer', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85', 'Planner de panoramas, fan de probar lugares nuevos y mandar memes específicos.', 'Algo espontáneo', ['Panoramas', 'Humor', 'Juntas', 'Música en vivo'], ['salir-hoy', 'hacer-yuntas', 'musica-en-vivo']],
  ['diego', 'Diego', 30, 'Hombre', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85', 'Cocino rico, armo buenos asados y me entusiasmo con cualquier plan al aire libre.', 'Relación seria', ['Cocina', 'Naturaleza', 'Juntas', 'Panoramas'], ['relacion-seria', 'hacer-yuntas', 'salir-hoy']],
  ['camila', 'Camila', 24, 'Mujer', 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=900&q=85', 'Entre libros, cocina y escapadas de fin de semana. Planes simples con buena energia.', 'Amistad', ['Lectura', 'Cocina', 'Naturaleza', 'Citas tranquilas'], ['hacer-yuntas', 'cafecito', 'volviendo-a-florecer']],
  ['nicolas', 'Nicolas', 24, 'Hombre', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=85', 'Estudiante, baterista de pieza y siempre listo para salir a sacar fotos.', 'Algo espontáneo', ['Fotografia', 'Música en vivo', 'Universidad', 'Humor'], ['salir-hoy', 'modo-estudio', 'musica-en-vivo']],
  ['sofia', 'Sofia', 27, 'Mujer', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85', 'UX, karaoke malo con confianza y una lista infinita de picadas.', 'Relación seria', ['Karaoke', 'Cine y series', 'Café', 'Humor'], ['relacion-seria', 'solo-cahuines', 'cafecito']],
  ['benjamin', 'Benjamin', 27, 'Hombre', 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=900&q=85', 'Chef amateur, buena conversa y busqueda seria de la mejor pizza del barrio.', 'Relación seria', ['Cocina', 'Cine y series', 'Café', 'Conversaciones reales'], ['relacion-seria', 'cafecito', 'solo-cahuines']],
  ['isidora', 'Isidora', 26, 'Mujer', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85', 'Periodista, buena para caminar y hacer preguntas que no parecen entrevista.', 'Conversar', ['Lectura', 'Café', 'Panoramas', 'Conversaciones reales'], ['solo-cahuines', 'cafecito', 'salir-hoy']],
  ['felipe', 'Felipe', 25, 'Hombre', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85', 'Diseño, bici y cafe. Busco salir sin guion y reirme harto.', 'Amistad', ['Café', 'Humor', 'Fotografia', 'Juntas'], ['hacer-yuntas', 'solo-cahuines', 'cafecito']],
  ['trinidad', 'Trinidad', 24, 'Mujer', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85', 'Ilustradora, fan de librerias y paseos con final dulce.', 'Sin presion', ['Lectura', 'Fotografia', 'Bienestar', 'Citas tranquilas'], ['volviendo-a-florecer', 'cafecito', 'solo-cahuines']],
  ['rodrigo', 'Rodrigo', 32, 'Hombre', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=85', 'Profesor, melómano y muy pro de las sobremesas largas.', 'Relación seria', ['Música en vivo', 'Lectura', 'Cine y series', 'Conversaciones reales'], ['relacion-seria', 'musica-en-vivo', 'solo-cahuines']],
];

const offsets = [
  [0.006, -0.004],
  [-0.008, 0.005],
  [0.011, 0.006],
  [-0.013, -0.007],
  [0.018, 0.002],
  [-0.019, 0.014],
  [0.022, -0.011],
  [-0.025, -0.016],
  [0.031, 0.018],
  [-0.034, 0.009],
  [0.014, -0.023],
  [-0.016, 0.026],
];

const addDays = (days, hour = 20) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const birthDateForAge = (age) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age, 4, 18);
  date.setHours(0, 0, 0, 0);
  return date;
};

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const resetPreviousDemo = async () => {
  const oldUsers = await User.find({
    $or: [
      { demoKey: TEST_KEY },
      { email: TEST_EMAIL },
      { email: /@cahuin\.test$/i },
    ],
  }).select('_id');
  const oldIds = oldUsers.map((user) => user._id);
  const oldMatches = await Match.find({
    $or: [
      { demoKey: TEST_KEY },
      { remitente: { $in: oldIds } },
      { receptor: { $in: oldIds } },
    ],
  }).select('_id');
  const oldMatchIds = oldMatches.map((match) => match._id);

  await Mensaje.deleteMany({ $or: [{ demoKey: TEST_KEY }, { matchId: { $in: oldMatchIds } }] });
  await Match.deleteMany({ $or: [{ demoKey: TEST_KEY }, { _id: { $in: oldMatchIds } }] });
  await Historia.deleteMany({ autor: { $in: oldIds } });
  await PreguntaAnonima.deleteMany({ $or: [{ receptor: { $in: oldIds } }, { remitente: { $in: oldIds } }] });
  await PanoramaSwipe.deleteMany({ usuario: { $in: oldIds } });
  await Panorama.deleteMany({ creador: { $in: oldIds } });
  await User.deleteMany({ _id: { $in: oldIds } });
};

const createUser = async (data) => {
  const user = new User({ ...data, password: TEST_PASSWORD, aceptaTerminos: true });
  await user.save();
  return user;
};

const createOwner = () => createUser({
  nombre: 'Gonzalo Demo',
  email: TEST_EMAIL,
  telefono: '+56900000000',
  foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
  fotos: [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=85',
  ],
  ciudad: CITY,
  region: REGION,
  genero: 'Hombre',
  mostrarGenero: true,
  preferencia: 'Todxs',
  queBuscas: 'Relación seria',
  distanciaMax: 100,
  fechaNacimiento: birthDateForAge(28),
  edad: 28,
  descripcion: 'Cuenta demo completa para probar radar, chats, panoramas, historias y comunidades de Cahuín.',
  altura: '1.75',
  intereses: ['Música en vivo', 'Café', 'Panoramas', 'Humor', 'Conversaciones reales', 'Citas tranquilas'],
  categoriasExplorar: ['relacion-seria', 'salir-hoy', 'solo-cahuines', 'hacer-yuntas', 'musica-en-vivo', 'cafecito', 'modo-estudio', 'volviendo-a-florecer'],
  fechasDisponibles: [addDays(1, 19).toISOString(), addDays(4, 20).toISOString(), addDays(8, 18).toISOString()],
  latitud: BASE_COORDS.latitud,
  longitud: BASE_COORDS.longitud,
  cahuines: 2500,
  rachaDias: 14,
  rachaSwipesDias: 7,
  boostGratisDisponibles: 1,
  verificado: true,
  tipoApego: 'Seguro',
  mostrarApego: true,
  arquetipoCahuinero: 'Cahuín cálido',
  mostrarArquetipo: true,
  modoRecuperacion: false,
  ultimaConexion: new Date(),
  esDemo: true,
  demoKey: TEST_KEY,
});

const createProfiles = async () => {
  const users = [];
  for (let index = 0; index < profiles.length; index += 1) {
    const [key, nombre, edad, genero, foto, descripcion, queBuscas, intereses, categoriasExplorar] = profiles[index];
    const [latOffset, lngOffset] = offsets[index];
    users.push(await createUser({
      nombre,
      email: `demo.${key}@cahuin.test`,
      telefono: `+56900000${String(index + 1).padStart(3, '0')}`,
      foto,
      fotos: [foto],
      ciudad: index % 4 === 0 ? 'Villarrica' : CITY,
      region: REGION,
      genero,
      mostrarGenero: true,
      preferencia: 'Todxs',
      queBuscas,
      distanciaMax: 100,
      fechaNacimiento: birthDateForAge(edad),
      edad,
      descripcion: `${descripcion} Perfil demo para pruebas de Cahuín.`,
      altura: `${1.60 + (index % 9) * 0.03}`.slice(0, 4),
      intereses,
      categoriasExplorar,
      fechasDisponibles: [addDays(index + 1, 19).toISOString(), addDays(index + 5, 20).toISOString()],
      latitud: Number((BASE_COORDS.latitud + latOffset).toFixed(7)),
      longitud: Number((BASE_COORDS.longitud + lngOffset).toFixed(7)),
      cahuines: 300 + index * 40,
      rachaDias: 2 + index,
      ultimaConexion: new Date(Date.now() - index * 16 * 60 * 1000),
      likesRecibidos: 25 - index,
      verificado: index % 3 !== 1,
      tipoApego: index % 4 === 0 ? 'Ansioso' : 'Seguro',
      mostrarApego: true,
      esDemo: true,
      demoKey: TEST_KEY,
    }));
  }
  return users;
};

const createMatches = async (owner, users) => {
  const starters = [
    ['Vi que te gusta la musica en vivo. Hay un panorama esta semana que se ve buenisimo.', 'Me tinca. Si es con buena conversa, apano feliz.'],
    ['Pregunta seria: cafe piola o bar con musica?', 'Café primero, bar despues si la conversa prende.'],
    ['Podemos invitar a un evento desde la app y ver quién más se suma.', 'Dale, mándame el plan y lo armamos sin tanto trámite.'],
    ['Tu perfil tiene energía de panorama improvisado pero bien pensado.', 'Jaja, acepto esa lectura. Que plan propones?'],
    ['Si armamos una junta, voto por algo tranqui y buena comida.', 'Ese plan nunca falla. Yo llevo el dato bueno.'],
    ['Team karaoke o mirar desde la mesa?', 'Cantar una y esconderme con dignidad.'],
  ];

  for (let index = 0; index < 8; index += 1) {
    const user = users[index];
    const createdAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000);
    const ownerLike = await Match.create({
      remitente: owner._id,
      receptor: user._id,
      tipo: index === 1 ? 'superlike' : 'like',
      respuestasRemitente: ['Café sin apuro', 'Humor rapido', 'Planes simples'],
      respuestasReceptor: ['Música en vivo', 'Buena comida', 'Cero ghosting'],
      esDemo: true,
      demoKey: TEST_KEY,
      createdAt,
      updatedAt: createdAt,
    });
    await Match.create({
      remitente: user._id,
      receptor: owner._id,
      tipo: 'like',
      respuestasRemitente: ['Música en vivo', 'Buena comida', 'Cero ghosting'],
      respuestasReceptor: ['Café sin apuro', 'Humor rapido', 'Planes simples'],
      esDemo: true,
      demoKey: TEST_KEY,
      createdAt: new Date(createdAt.getTime() + 4 * 60 * 1000),
      updatedAt: new Date(createdAt.getTime() + 4 * 60 * 1000),
    });

    const pair = starters[index % starters.length];
    await Mensaje.insertMany([
      { matchId: ownerLike._id, remitente: owner._id, texto: `${user.nombre}, ${pair[0]}`, tipo: 'texto', leido: true, esDemo: true, demoKey: TEST_KEY, createdAt },
      { matchId: ownerLike._id, remitente: user._id, texto: pair[1], tipo: 'texto', leido: index % 2 === 0, esDemo: true, demoKey: TEST_KEY, createdAt: new Date(createdAt.getTime() + 8 * 60 * 1000) },
      { matchId: ownerLike._id, remitente: owner._id, texto: 'Te invito a este panorama desde Cahuín y probamos si prende.', tipo: 'texto', leido: true, esDemo: true, demoKey: TEST_KEY, createdAt: new Date(createdAt.getTime() + 15 * 60 * 1000) },
    ]);
  }
};

const createStories = async (users) => {
  const stories = [
    ['Estoy en la feria Pinto buscando algo rico para cocinar. Si alguien anda cerca, tire dato.', 'Feria Pinto', '🍲'],
    ['Tarde de cafecito en Avenida Alemania. Buen lugar para conversar sin apuro.', 'Avenida Alemania', '☕'],
    ['Hoy hay ganas de karaoke aunque salga medio desafinado.', 'Centro Temuco', '🎤'],
    ['Caminata por la costanera de Villarrica. El sur se luce cuando quiere.', 'Villarrica', '🏞️'],
    ['Buscando partner para una tocata chica esta semana.', 'Temuco', '🎸'],
    ['Domingo de museo, sopaipillas y cahuín tranquilo.', 'Museo Regional', '✨'],
  ];
  for (let index = 0; index < stories.length; index += 1) {
    const [texto, lugar, emoji] = stories[index];
    const author = users[index % users.length];
    await Historia.create({
      autor: author._id,
      texto,
      lugar,
      ciudad: author.ciudad,
      region: REGION,
      emoji,
      imagen: author.foto,
      reacciones: users.slice(0, 3).map((u) => u._id),
      comentarios: [
        { autor: users[(index + 1) % users.length]._id, texto: 'Me sumo feliz a ese plan.' },
        { autor: users[(index + 2) % users.length]._id, texto: 'Ese dato está para guardarlo.' },
      ],
      sumados: users.slice(3, 5).map((u) => u._id),
      expiraEn: addDays(1, 23),
    });
  }
};

const createCommunityPanoramas = async (owner, users) => {
  const panoramas = [
    ['Cafécito con lluvia', 'Café, conversación larga y cero entrevista laboral.', 'Café del Centro', 'Centro, Temuco', 1, '☕'],
    ['Tocata chica en vivo', 'Vamos a escuchar bandas locales y comentar como críticos sin credencial.', 'Bar Lemon', 'Avenida Alemania, Temuco', 2, '🎸'],
    ['Paseo a Villarrica', 'Plan simple: caminar, foto bonita y algo dulce.', 'Costanera Villarrica', 'Villarrica', 3, '🏞️'],
    ['Noche de completos', 'Cita de baja presión con alto potencial de cahuín.', 'Fuente Alemana Temuco', 'Temuco', 4, '🌭'],
  ];

  for (let index = 0; index < panoramas.length; index += 1) {
    const [titulo, descripcion, lugar, direccion, dias, emoji] = panoramas[index];
    await Panorama.create({
      titulo,
      descripcion,
      lugar,
      direccion,
      region: REGION,
      fecha: addDays(dias, 20),
      creador: index === 0 ? owner._id : users[index]._id,
      categoria: 'Comunidad',
      emoji,
      maxPersonas: 12,
      participantes: [owner._id, users[index]._id, users[index + 1]._id],
      mensajesGrupo: [
        { remitente: owner._id, texto: 'Panorama demo creado para probar grupo e inscritos.', tipo: 'sistema' },
        { remitente: users[index]._id, texto: 'Me anoto, suena bacan.', tipo: 'texto' },
      ],
      activo: true,
      esOficial: false,
    });
  }
};

const createOfficialEvents = async () => {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const oficiales = eventosOficiales
    .filter((evento) => evento.region === REGION || /Arauc/i.test(evento.region))
    .filter((evento) => new Date(evento.fecha) >= inicio);

  for (const evento of oficiales) {
    await Panorama.findOneAndUpdate(
      { esOficial: true, titulo: evento.titulo, region: REGION },
      {
        $set: {
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          lugar: evento.lugar,
          direccion: evento.direccion || evento.lugar,
          region: REGION,
          fecha: evento.fecha,
          categoria: 'Evento Oficial',
          emoji: evento.emoji || '🎟️',
          maxPersonas: 9999,
          participantes: [],
          esOficial: true,
          activo: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const createSwipeAndDaily = async (owner, users) => {
  const official = await Panorama.find({ esOficial: true, region: REGION, fecha: { $gte: new Date() } }).sort({ fecha: 1 }).limit(4);
  for (const panorama of official) {
    for (const user of users.slice(0, 4)) {
      await PanoramaSwipe.findOneAndUpdate(
        { usuario: user._id, panorama: panorama._id },
        { $set: { decision: 'like' } },
        { upsert: true, new: true }
      );
    }
  }

  await CahuinDiario.findOneAndUpdate(
    { fecha: todayKey() },
    {
      $set: {
        texto: 'Confieso que si alguien propone papas fritas despues de una cita, sube 40 puntos de compatibilidad.',
        autorAnonimo: 'Anonimo de Temuco',
      },
      $setOnInsert: { votos: [] },
    },
    { upsert: true, new: true }
  );

  const cahuin = await CahuinDiario.findOne({ fecha: todayKey() });
  cahuin.votos = users.slice(0, 8).map((user, index) => ({
    usuario: user._id,
    opcion: index % 3 === 0 ? 'ni_cagando' : 'de_acuerdo',
  }));
  cahuin.votos.push({ usuario: owner._id, opcion: 'de_acuerdo' });
  await cahuin.save();
};

const createQuestions = async (owner, users) => {
  const preguntas = [
    'Que panorama te hace decir que si altiro?',
    'Cual es tu red flag personal que ya aprendiste a cuidar?',
    'Que cancion te deja de buen humor aunque el dia venga pesado?',
    'Qué cosa chica te conquista más de lo que debería?',
  ];
  await PreguntaAnonima.insertMany(preguntas.map((pregunta, index) => ({
    receptor: owner._id,
    remitente: users[index]._id,
    pregunta,
  })));
};

const run = async () => {
  await conectarDB();
  await resetPreviousDemo();

  const owner = await createOwner();
  const users = await createProfiles();
  await createMatches(owner, users);
  await createStories(users);
  await createCommunityPanoramas(owner, users);
  await createOfficialEvents();
  await createSwipeAndDaily(owner, users);
  await createQuestions(owner, users);

  console.log('Cuenta demo lista.');
  console.log(`Correo: ${TEST_EMAIL}`);
  console.log(`Contraseña: ${TEST_PASSWORD}`);
  console.log(`Region: ${REGION} / ${CITY}`);
  console.log(`Radar: ${users.length} perfiles falsos`);
  console.log('Chat: 8 conversaciónes con mensajes');
  console.log('Historias culturales: 6 historias activas');
  console.log('Panoramas: comunidad + eventos oficiales futuros');
};

run()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creando cuenta demo:', error);
    mongoose.connection.close().finally(() => process.exit(1));
  });
