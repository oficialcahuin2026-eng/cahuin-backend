const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

const conectarDB = require('../config/db');
const User = require('../models/User');
const Match = require('../models/Match');
const Mensaje = require('../models/Mensaje');
const PreguntaAnonima = require('../models/PreguntaAnonima');

const DEMO_KEY = 'cahuin-demo-radar-chat-v1';
const DEMO_DOMAIN = 'cahuin.test';
const DEMO_PASSWORD = 'CahuinDemo123!';
const DEFAULT_COORDS = { latitud: -33.4489, longitud: -70.6693 };

const femaleProfiles = [
  ['antonia', 'Antonia', 25, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85', 'Cafés largos, conciertos chicos y conversaciónes que se van sin mirar la hora.', 'Pololeo serio', ['Música en vivo', 'Caféterias', 'Fotografia', 'Trekking'], 'Seguro'],
  ['valentina', 'Valentina', 28, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85', 'Planner de panoramas, fan de probar lugares nuevos y mandar memes muy específicos.', 'Algo tranquilo', ['Restobares', 'Viajes', 'Diseño', 'Stand up'], 'Seguro'],
  ['camila', 'Camila', 24, 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=900&q=85', 'Entre libros, cocina y escapadas de fin de semana. Planes simples con buena energia.', 'Conocer gente bacán', ['Libros', 'Cocina', 'Naturaleza', 'Museos'], 'Ansioso'],
  ['sofia', 'Sofia', 27, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=85', 'Trabajo en UX, canto mal pero con confianza y siempre tengo una lista de picadas.', 'Pololeo serio', ['UX', 'Karaoke', 'Picadas', 'Cine'], 'Seguro'],
  ['javiera', 'Javiera', 29, 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=85', 'Arquitecta, team sobremesa y fan de caminar la ciudad buscando detalles raros.', 'Algo con calma', ['Arquitectura', 'Vino', 'Ciudad', 'Jazz'], 'Seguro'],
  ['emilia', 'Emilia', 23, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85', 'Entre playlists nuevas, ferias bonitas y ganas de cocinar algo rico.', 'Conocer gente bacán', ['Ferias', 'Cocina', 'Playlists', 'Arte'], 'Ansioso'],
  ['isidora', 'Isidora', 26, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85', 'Periodista, buena para caminar y hacer preguntas que no parecen entrevista.', 'Algo tranquilo', ['Cronicas', 'Café', 'Teatro', 'Perros'], 'Seguro'],
  ['francisca', 'Francisca', 30, 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=900&q=85', 'Me gustan las terrazas, la musica en vivo y los planes que salen medio improvisados.', 'Pololeo serio', ['Terrazas', 'Música', 'Viajes', 'Cine'], 'Seguro'],
  ['trinidad', 'Trinidad', 24, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85', 'Ilustradora, fan de las librerias y de los paseos con final dulce.', 'Algo espontáneo', ['Ilustracion', 'Librerias', 'Postres', 'Museos'], 'Ansioso'],
  ['renata', 'Renata', 31, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85', 'Abogada de dia, buscadora de ramen de noche. Buena conversación o nada.', 'Algo con calma', ['Ramen', 'Series', 'Jazz', 'Gatos'], 'Seguro'],
];

const maleProfiles = [
  ['diego', 'Diego', 30, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85', 'Cocino rico, armo buenos asados y me entusiasmo con cualquier panorama al aire libre.', 'Pololeo serio', ['Asados', 'Trekking', 'Cine', 'Cervezas'], 'Seguro'],
  ['matias', 'Matias', 26, 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=900&q=85', 'Programador, cafetero y fan de las caminatas sin destino. Tengo recomendaciones para todo.', 'Algo tranquilo', ['Café', 'Tecnologia', 'Juegos', 'Caminatas'], 'Seguro'],
  ['tomas', 'Tomas', 31, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85', 'Publicista, melómano de bajo presupuesto y creyente del completo salvador.', 'Conocer gente bacán', ['Música', 'Completos', 'Diseño', 'Humor'], 'Ansioso'],
  ['nicolas', 'Nicolas', 24, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=85', 'Estudiante, baterista de pieza y siempre listo para salir a sacar fotos.', 'Algo espontáneo', ['Fotografia', 'Música', 'Skate', 'Cine'], 'Seguro'],
  ['benjamin', 'Benjamin', 27, 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=900&q=85', 'Chef amateur, bueno para conversar y buscar la mejor pizza del barrio.', 'Pololeo serio', ['Pizza', 'Cocina', 'Series', 'Museos'], 'Seguro'],
  ['sebastian', 'Sebastian', 29, 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=85', 'Psicólogo, lector nocturno y fan de panoramas que terminan en buena conversación.', 'Algo con calma', ['Libros', 'Psicologia', 'Teatro', 'Café'], 'Seguro'],
  ['andres', 'Andres', 28, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85', 'Ingeniero, intento tocar guitarra y casi siempre digo que si a un buen plan.', 'Algo tranquilo', ['Guitarra', 'Terrazas', 'Futbol', 'Podcasts'], 'Seguro'],
  ['felipe', 'Felipe', 25, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=85', 'Diseño, bici y cafe. Busco alguien para salir sin guion y reirse harto.', 'Conocer gente bacán', ['Bici', 'Café', 'Diseño', 'Humor'], 'Ansioso'],
  ['rodrigo', 'Rodrigo', 32, 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=85', 'Profesor, melómano y muy pro de las sobremesas largas.', 'Pololeo serio', ['Vinilos', 'Historia', 'Cine', 'Vino'], 'Seguro'],
  ['ignacio', 'Ignacio', 27, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=85', 'Fotografo, caminante de ciudad y fan de descubrir lugares chicos.', 'Algo espontáneo', ['Fotografia', 'Ciudad', 'Jazz', 'Museos'], 'Seguro'],
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
];

const toProfile = ([key, nombre, edad, foto, descripcion, queBuscas, intereses, tipoApego], genero) => ({
  key,
  nombre,
  edad,
  foto,
  descripcion,
  queBuscas,
  intereses,
  tipoApego,
  genero,
});

const birthDateForAge = (age) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age, 5, 15);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateDaysFromNow = (days, hour = 20) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const categoriasForProfile = (profile) => {
  const texto = `${profile.queBuscas} ${(profile.intereses || []).join(' ')}`.toLowerCase();
  const categorias = ['solo-cahuines'];
  if (texto.includes('pololeo') || texto.includes('serio')) categorias.push('relacion-seria');
  if (texto.includes('espontaneo') || texto.includes('panorama')) categorias.push('salir-hoy');
  if (texto.includes('musica') || texto.includes('karaoke') || texto.includes('jazz')) categorias.push('musica-en-vivo');
  if (texto.includes('cafe') || texto.includes('cafeter')) categorias.push('cafecito');
  if (texto.includes('tranquilo') || texto.includes('calma')) categorias.push('volviendo-a-florecer');
  if (texto.includes('conocer') || texto.includes('bacan')) categorias.push('hacer-yuntas');
  return [...new Set(categorias)];
};

const chooseProfiles = (owner) => {
  const women = femaleProfiles.map((item) => toProfile(item, 'Mujer'));
  const men = maleProfiles.map((item) => toProfile(item, 'Hombre'));
  if (owner.preferencia === 'Mujeres') return women;
  if (owner.preferencia === 'Hombres') return men;
  return [women[0], men[0], women[1], men[1], women[2], men[2], women[3], men[3], women[4], men[4]];
};

const normalizeLocation = (owner) => {
  const now = new Date();
  const viajeActivo = owner.viaje?.ciudadDestino
    && owner.viaje?.fechaFin
    && now < new Date(owner.viaje.fechaFin);

  if (viajeActivo) {
    return {
      region: owner.region && owner.region !== 'Por definir' ? owner.region : 'Metropolitana',
      ciudad: owner.viaje.ciudadDestino,
      latitud: typeof owner.latitud === 'number' ? owner.latitud : DEFAULT_COORDS.latitud,
      longitud: typeof owner.longitud === 'number' ? owner.longitud : DEFAULT_COORDS.longitud,
    };
  }

  const region = owner.region && owner.region !== 'Por definir' ? owner.region : 'Metropolitana';
  const ciudad = owner.ciudad && owner.ciudad !== 'Por definir'
    ? owner.ciudad
    : (region === 'Metropolitana' ? 'Santiago' : region);
  const latitud = typeof owner.latitud === 'number' ? owner.latitud : DEFAULT_COORDS.latitud;
  const longitud = typeof owner.longitud === 'number' ? owner.longitud : DEFAULT_COORDS.longitud;
  return { region, ciudad, latitud, longitud };
};

const updateOwnerForDemo = async (owner) => {
  const patch = {};
  if (!owner.region || owner.region === 'Por definir') patch.region = 'Metropolitana';
  if (!owner.ciudad || owner.ciudad === 'Por definir') patch.ciudad = 'Santiago';
  if (typeof owner.latitud !== 'number') patch.latitud = DEFAULT_COORDS.latitud;
  if (typeof owner.longitud !== 'number') patch.longitud = DEFAULT_COORDS.longitud;
  if (!owner.distanciaMax || owner.distanciaMax < 80) patch.distanciaMax = 80;
  if (owner.cuentaPausada) patch.cuentaPausada = false;
  if (Object.keys(patch).length === 0) return owner;
  return User.findByIdAndUpdate(owner._id, { $set: patch }, { new: true });
};

const resolveOwner = async () => {
  if (process.env.DEMO_OWNER_ID && mongoose.isValidObjectId(process.env.DEMO_OWNER_ID)) {
    const byId = await User.findById(process.env.DEMO_OWNER_ID);
    if (byId) return byId;
  }

  if (process.env.DEMO_OWNER_EMAIL) {
    const byEmail = await User.findOne({ email: process.env.DEMO_OWNER_EMAIL.toLowerCase() });
    if (byEmail) return byEmail;
  }

  return User.findOne({
    email: { $not: new RegExp(`@${DEMO_DOMAIN.replace('.', '\\.')}$`, 'i') },
    esDemo: { $ne: true },
  }).sort({ updatedAt: -1, ultimaConexion: -1, createdAt: -1 });
};

const upsertDemoUser = async (profile, index, location) => {
  const [latOffset, lngOffset] = offsets[index];
  const email = `demo.${profile.key}.${index + 1}@${DEMO_DOMAIN}`;
  const payload = {
    nombre: profile.nombre,
    email,
    foto: profile.foto,
    fotos: [profile.foto],
    ciudad: location.ciudad,
    region: location.region,
    genero: profile.genero,
    mostrarGenero: true,
    preferencia: 'Todxs',
    queBuscas: profile.queBuscas,
    distanciaMax: 100,
    fechaNacimiento: birthDateForAge(profile.edad),
    edad: profile.edad,
    descripcion: `${profile.descripcion} Perfil demo para pruebas de Cahuín.`,
    altura: `${160 + (index % 8) * 3} cm`,
    universidad: ['Universidad de Chile', 'PUC', 'USACH', 'UDP', 'UAI'][index % 5],
    nivelEscolaridad: 'Universitaria',
    estiloComunicacion: ['Directa', 'Con humor', 'Con calma', 'Audios cortos'][index % 4],
    recibirAmor: ['Tiempo de calidad', 'Detalles', 'Palabras bonitas', 'Planes pensados'][index % 4],
    habitos: {
      beber: index % 3 === 0 ? 'Cero alcohol' : 'Social',
      fumar: 'No',
      ejercicio: index % 2 === 0 ? 'Caminatas' : 'A veces',
      mascotas: index % 2 === 0 ? 'Dog lover' : 'Cat lover',
    },
    intereses: profile.intereses,
    categoriasExplorar: categoriasForProfile(profile),
    fechasDisponibles: [dateDaysFromNow(index + 2, 19), dateDaysFromNow(index + 6, 20), dateDaysFromNow(index + 11, 18)],
    musica: profile.intereses[0],
    peliculas: 'Cine con buena conversa',
    deportes: index % 2 === 0 ? 'Trekking' : 'Bici urbana',
    latitud: Number((location.latitud + latOffset).toFixed(7)),
    longitud: Number((location.longitud + lngOffset).toFixed(7)),
    reputacion: 4.8,
    numCalificaciones: 12 + index,
    cahuines: 100 + index * 25,
    rachaDias: 2 + index,
    ultimaConexion: new Date(Date.now() - index * 25 * 60 * 1000),
    likesRecibidos: 20 - index,
    verificado: index % 3 !== 1,
    cuentaPausada: false,
    tipoApego: profile.tipoApego,
    mostrarApego: true,
    mapaValores: {
      prioridadLealtad: index % 2 === 0,
      planesHijos: index % 3 === 0 ? 'Mas adelante' : 'Por definir',
      dealBreaker: 'Ghosting eterno',
    },
    esDemo: true,
    demoKey: DEMO_KEY,
  };

  const existing = await User.findOne({ email });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }

  const created = new User({ ...payload, password: DEMO_PASSWORD, aceptaTerminos: true });
  await created.save();
  return created;
};

const buildChatMessages = (owner, demoUser, index) => {
  const threads = [
    [
      [`${demoUser.nombre}, vi que te gusta la musica en vivo. Hay un panorama esta semana que se ve buenisimo.`, owner._id],
      ['Me tinca. Si es con buena conversa, apano feliz.', demoUser._id],
      ['Podemos invitar a un evento desde la app y ver quién más se suma.', owner._id],
      ['Dale, mándame el plan y lo armamos sin tanto trámite.', demoUser._id],
    ],
    [
      ['Pregunta seria: cafe piola o bar con musica?', demoUser._id],
      ['Café primero, bar despues si la conversa prende.', owner._id],
      ['Esa ruta tiene potencial. Tengo libre el finde.', demoUser._id],
      ['Perfecto, lo dejamos como panorama tentativo.', owner._id],
    ],
    [
      [`Tu perfil dice ${demoUser.intereses?.[0] || 'panoramas'}. Eso suma puntos.`, owner._id],
      ['Jaja excelente filtro. Que plan recomendarias para romper el hielo?', demoUser._id],
      ['Algo simple: terraza, comida rica y cero entrevista laboral.', owner._id],
      ['Aprobado. Cero entrevista laboral es requisito minimo.', demoUser._id],
    ],
    [
      ['El módulo de panoramas se ve ideal para armar algo con más gente.', demoUser._id],
      ['Si, quiero probar invitar matches a eventos y ver como queda.', owner._id],
      ['Cuenta conmigo para la prueba, soy match demo responsable.', demoUser._id],
      ['Ese es el espíritu Cahuín.', owner._id],
    ],
    [
      ['Duda importante: team karaoke o team mirar desde la mesa?', owner._id],
      ['Team cantar una y despues esconderme con dignidad.', demoUser._id],
      ['Perfecto, suficiente valentia para un primer panorama.', owner._id],
      ['Entonces agenda abierta.', demoUser._id],
    ],
    [
      ['Si armamos panorama, voto por algo tranqui y buena comida.', demoUser._id],
      ['Me gusta. Tambien sirve para probar invitaciones dentro del chat.', owner._id],
      ['Te sigo el juego. Total soy demo, pero con estandares.', demoUser._id],
      ['Jaja, eso queda como feature.', owner._id],
    ],
  ];

  return threads[index % threads.length].map(([texto, remitente], messageIndex) => {
    const createdAt = new Date(Date.now() - (60 - index * 7 - messageIndex * 2) * 60 * 1000);
    return { texto, remitente, createdAt, updatedAt: createdAt };
  });
};

const createDemoMatchesAndMessages = async (owner, demoUsers) => {
  const demoIds = demoUsers.map((user) => user._id);
  const existingMatches = await Match.find({
    $or: [
      { remitente: owner._id, receptor: { $in: demoIds } },
      { remitente: { $in: demoIds }, receptor: owner._id },
    ],
  }).select('_id');

  const existingIds = existingMatches.map((match) => match._id);
  if (existingIds.length > 0) {
    await Mensaje.deleteMany({ matchId: { $in: existingIds } });
    await Match.deleteMany({ _id: { $in: existingIds } });
  }

  const chatUsers = demoUsers.slice(0, 6);
  let messageCount = 0;

  for (let index = 0; index < chatUsers.length; index += 1) {
    const demoUser = chatUsers[index];
    const createdAt = new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1000);
    const ownerLike = await Match.create({
      remitente: owner._id,
      receptor: demoUser._id,
      tipo: index === 1 ? 'superlike' : 'like',
      respuestasRemitente: ['Un cafe sin apuro', 'Humor rapido', 'Planes simples'],
      respuestasReceptor: ['Música en vivo', 'Buena comida', 'Cero ghosting'],
      esDemo: true,
      demoKey: DEMO_KEY,
      createdAt,
      updatedAt: createdAt,
    });

    const demoLikeAt = new Date(createdAt.getTime() + 5 * 60 * 1000);
    await Match.create({
      remitente: demoUser._id,
      receptor: owner._id,
      tipo: 'like',
      respuestasRemitente: ['Música en vivo', 'Buena comida', 'Cero ghosting'],
      respuestasReceptor: ['Un cafe sin apuro', 'Humor rapido', 'Planes simples'],
      esDemo: true,
      demoKey: DEMO_KEY,
      createdAt: demoLikeAt,
      updatedAt: demoLikeAt,
    });

    const messages = buildChatMessages(owner, demoUser, index).map((message) => ({
      ...message,
      matchId: ownerLike._id,
      tipo: 'texto',
      leido: index % 2 === 0,
      esDemo: true,
      demoKey: DEMO_KEY,
    }));

    await Mensaje.insertMany(messages);
    messageCount += messages.length;
  }

  return { matchCount: chatUsers.length, messageCount };
};

const createDemoAnonymousQuestions = async (owner, demoUsers) => {
  await PreguntaAnonima.deleteMany({ receptor: owner._id, remitente: { $in: demoUsers.map((user) => user._id) } });

  const questions = [
    'Que panorama te hace decir que si altiro?',
    'Cual es tu red flag personal que ya aprendiste a cuidar?',
    'Que cancion te deja de buen humor aunque el dia venga pesado?',
    'Qué cosa chica te conquista más de lo que debería?',
  ];

  await PreguntaAnonima.insertMany(questions.map((pregunta, index) => ({
    receptor: owner._id,
    remitente: demoUsers[index % demoUsers.length]._id,
    pregunta,
  })));
};

const run = async () => {
  await conectarDB();

  let owner = await resolveOwner();
  if (!owner) throw new Error('No encontre un usuario real. Define DEMO_OWNER_EMAIL o crea un usuario primero.');

  owner = await updateOwnerForDemo(owner);
  const location = normalizeLocation(owner);
  const selectedProfiles = chooseProfiles(owner);

  const demoUsers = [];
  for (let index = 0; index < selectedProfiles.length; index += 1) {
    demoUsers.push(await upsertDemoUser(selectedProfiles[index], index, location));
  }

  const { matchCount, messageCount } = await createDemoMatchesAndMessages(owner, demoUsers);
  await createDemoAnonymousQuestions(owner, demoUsers);

  console.log('Demo seed listo.');
  console.log(`Owner: ${owner.nombre} (${owner._id})`);
  console.log(`Radar: ${demoUsers.length} perfiles demo en ${location.region}/${location.ciudad}`);
  console.log(`Chat: ${matchCount} conversaciónes demo con ${messageCount} mensajes`);
  console.log('Perfil: 4 preguntas anónimas demo pendientes');
  console.log(`Clave: ${DEMO_KEY}`);
};

run()
  .then(() => mongoose.connection.close())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error sembrando datos demo:', error);
    mongoose.connection.close().finally(() => process.exit(1));
  });
