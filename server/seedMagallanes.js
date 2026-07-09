const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Panorama = require('./models/Panorama');
const conectarDB = require('./config/db');

const eventosRaw = [
  { titulo: 'Patagonia Light Festival', lugar: 'Diversos espacios públicos, Punta Arenas', fechaStr: '1 al 2 de julio', categoria: 'Cultura', descripcion: 'Espectáculo de instalaciones lumínicas urbanas y mapping arquitectónico (cierre de la actividad iniciada a fines de junio).' },
  { titulo: 'Expoindígena 2026', lugar: 'Centro urbano, Punta Arenas', fechaStr: '1 al 5 de julio', categoria: 'Ferias', descripcion: 'Muestra ferial que reúne a artesanos y productores gastronómicos de los pueblos originarios de la región austral.' },
  { titulo: 'Fiesta "SWEET" - Inauguración Oficial', lugar: 'Muchacha Restobar, Punta Arenas', fechaStr: '2 de julio', categoria: 'Otro', descripcion: 'Evento de reapertura de temporada invernal en uno de los clubes nocturnos populares de la ciudad.' },
  { titulo: 'Espacio Dejavu - Jueves Se Baila (Versión Carnaval)', lugar: 'Pub Dejavu, Punta Arenas', fechaStr: '2 de julio', categoria: 'Otro', descripcion: 'Celebración bailable de anticipación al fin de semana de carnaval.' },
  { titulo: 'Mega-Concierto "Show Artista Carnaval": Los Bunkers', lugar: 'Escenario Costanera del Estrecho, Punta Arenas', fechaStr: '3 de julio', categoria: 'Música', descripcion: 'Presentación gratuita y masiva al aire libre de la icónica banda de rock chileno, abriendo las festividades.' },
  { titulo: 'Iván Arenas: "El Profesor Rosa"', lugar: 'Club Bar Natales, Puerto Natales', fechaStr: '3 de julio', categoria: 'Comedia', descripcion: 'Rutina extendida de stand-up comedy y humor sin censura del legendario comunicador nacional.' },
  { titulo: 'Fiesta "Toy Solter@"', lugar: 'Club K, Punta Arenas', fechaStr: '3 de julio', categoria: 'Otro', descripcion: 'Evento de entretenimiento nocturno enfocado en el público joven y universitario local.' },
  { titulo: 'Carnaval de Invierno 30 Años', lugar: 'Costanera del Estrecho, Punta Arenas', fechaStr: '4 y 5 de julio', categoria: 'Ferias', descripcion: 'Magno desfile de dos días de duración que incluye 64 alegorías, murgas, 15 carros alegóricos y el batucazo final.' },
  { titulo: 'Fiesta Old School & Dancehall (DJ Noise b2b DJ Valde)', lugar: 'Local de calle Bulnes 731, Puerto Natales', fechaStr: '4 de julio', categoria: 'Música', descripcion: 'Sesión extendida de DJs locales mezclando reggaetón clásico y ritmos urbanos.' },
  { titulo: 'Invernalia: "El frío muere con más frío"', lugar: 'Resto Bar Submarino Amarillo, Punta Arenas', fechaStr: '4 de julio', categoria: 'Otro', descripcion: 'Encuentro nocturno de celebración bohemia enmarcado en el fin de semana del carnaval.' },
  { titulo: 'Concierto Íntimo de Luis Pedraza', lugar: 'Enigma Club, Punta Arenas', fechaStr: '4 de julio', categoria: 'Música', descripcion: 'Espectáculo acústico y cercano del baladista y cantante pop chileno.' },
  { titulo: 'Iván Arenas: "El Profesor Rosa"', lugar: 'Gyros Bar, Punta Arenas', fechaStr: '4 de julio', categoria: 'Comedia', descripcion: 'Presentación de humor para adultos en un local céntrico de la capital regional.' },
  { titulo: 'Tributo a Miguel Bosé', lugar: "Clandestino's Bar, Puerto Natales", fechaStr: '4 de julio', categoria: 'Música', descripcion: 'Presentación de intérprete regional reviviendo los grandes éxitos de la balada hispana.' },
  { titulo: 'Fiesta "Sugar Carnaval de Invierno"', lugar: 'El Arriero, Punta Arenas', fechaStr: '4 de julio', categoria: 'Otro', descripcion: 'Evento bailable masivo organizado en recinto gastronómico/nocturno tras el paso de los carros alegóricos.' },
  { titulo: 'DJ Poroto x Amaia Fiestas: "Carnaval Fest"', lugar: 'Club K, Punta Arenas', fechaStr: '4 de julio', categoria: 'Música', descripcion: 'Intervención de productores de música electrónica y urbana animando la noche principal de las Invernadas.' },
  { titulo: 'Carnaval x Neoclub 87', lugar: 'Círculo Italiano, Punta Arenas', fechaStr: '4 de julio', categoria: 'Otro', descripcion: 'Celebración nocturna en salón patrimonial, enfocada en la nostalgia de los años 80 y 90.' },
  { titulo: 'Tributo Oficial a Miguel Bosé', lugar: 'Coyote Restobar, Punta Arenas', fechaStr: '5 de julio', categoria: 'Música', descripcion: 'Show musical en vivo para cerrar el fin de semana del carnaval, repasando el catálogo clásico del artista.' },
  { titulo: 'Sesión Ordinaria CORE Magallanes', lugar: 'Edificio del Consejo Regional, Punta Arenas', fechaStr: '6 de julio', categoria: 'Otro', descripcion: 'Encuentro administrativo y de deliberación pública de las autoridades políticas regionales.' },
  { titulo: 'Gala de la Orquesta Latinoamericana: "Raíces de fuego"', lugar: 'Teatro Municipal José Bohr, Punta Arenas', fechaStr: '7 de julio', categoria: 'Música', descripcion: 'Espectáculo sinfónico gratuito dirigido por el maestro Víctor Veliz, interpretado por 25 jóvenes músicos locales.' },
  { titulo: 'Certamen de Talentos "Desafío Escenario 2026"', lugar: 'Sala de Uso Múltiple, Puerto Williams (Cabo de Hornos)', fechaStr: '8 al 12 de julio', categoria: 'Cultura', descripcion: 'Histórico concurso comunitario donde los habitantes compiten exhibiendo habilidades artísticas en canto y danza.' },
  { titulo: 'Fiesta Midweek', lugar: 'Club K, Punta Arenas', fechaStr: '8 de julio', categoria: 'Otro', descripcion: 'Actividad de entretenimiento nocturno programada para quebrar la rutina de mitad de semana invernal.' },
  { titulo: 'XIII Feria Medieval de Magallanes', lugar: 'Escuela República de Croacia, Punta Arenas', fechaStr: '9 al 12 de julio', categoria: 'Ferias', descripcion: 'Evento inmersivo de cuatro días organizado por la Sociedad Tolkien, con teatro, música celta, torneos y tabernas.' },
  { titulo: 'Inauguración XII Convención de Circo del Fin del Mundo', lugar: 'Gimnasio del Liceo María Auxiliadora, Punta Arenas', fechaStr: '9 de julio', categoria: 'Cultura', descripcion: 'Apertura oficial del encuentro internacional de acróbatas con la presentación de la obra "Melonsi Circo".' },
  { titulo: 'Gira Amores de Invierno 2026: Los Vásquez', lugar: 'Salón de Eventos Casino Dreams, Punta Arenas', fechaStr: '10 y 11 de julio', categoria: 'Música', descripcion: 'Concierto estelar doble del fenómeno del pop cebolla chileno en el principal recinto privado de la ciudad.' },
  { titulo: 'Gala del Ballet: "Lago de los cisnes: el renacer"', lugar: 'Teatro Municipal José Bohr, Punta Arenas', fechaStr: '10 de julio', categoria: 'Cultura', descripcion: 'Adaptación de danza contemporánea ejecutada por 17 bailarinas del elenco estable de la ciudad.' },
  { titulo: 'Lanzamiento Oficial del 51° Gran Premio de la Hermandad', lugar: 'Club Croata, Porvenir (Primavera)', fechaStr: '11 de julio', categoria: 'Deporte', descripcion: 'Evento de gala para presentar el trazado, normativas e inscritos del histórico rally automovilístico fueguino.' },
  { titulo: 'Obra Teatral "El Mago de Oz" (Doble función)', lugar: 'Centro Cultural Claudio Paredes Chamorro, Punta Arenas', fechaStr: '11 de julio', categoria: 'Cultura', descripcion: 'Montaje teatral de carácter familiar interpretado por 13 actores del elenco municipal, con alta demanda de público.' },
  { titulo: 'Festival de Boxeo Internacional Amateur', lugar: 'Gimnasio de la Confederación Deportiva, Punta Arenas', fechaStr: '11 de julio', categoria: 'Deporte', descripcion: 'Torneo de contacto que enfrenta a exponentes pugilistas de academias magallánicas contra escuelas invitadas.' },
  { titulo: 'Noche de Tributos: Arctic Monkeys + Babasónicos', lugar: 'Círculo Italiano, Punta Arenas', fechaStr: '11 de julio', categoria: 'Música', descripcion: 'Recital de rock alternativo a cargo de bandas locales, seguido de una fiesta post show para la fanaticada indie.' },
  { titulo: 'Winterfest: 2° Aniversario Natales', lugar: 'Club Bar Natales, Puerto Natales', fechaStr: '11 de julio', categoria: 'Otro', descripcion: 'Magna celebración nocturna que conmemora los años de operación de uno de los locales ancla de Última Esperanza.' },
  { titulo: '1° Aniversario de la Productora Amaia', lugar: 'Club K, Punta Arenas', fechaStr: '11 de julio', categoria: 'Otro', descripcion: 'Fiesta temática celebrando a uno de los colectivos de producción de eventos más activos de la vida nocturna.' },
  { titulo: 'Gala de Clausura de la XII Convención de Circo', lugar: 'Recintos municipales, Punta Arenas', fechaStr: '12 de julio', categoria: 'Cultura', descripcion: 'Espectáculo final que reúne a los mejores exponentes de las disciplinas circenses participantes en el encuentro.' },
  { titulo: 'Maratón Aniversario BT Performance 2026', lugar: 'Costanera del Estrecho, Punta Arenas', fechaStr: '12 de julio', categoria: 'Deporte', descripcion: 'Competencia pedestre urbana desafiando el clima austral, con circuitos categorizados de 3K, 6K y 12K.' },
  { titulo: 'Sesión Ordinaria CORE Magallanes (2)', lugar: 'Edificio del Consejo Regional, Punta Arenas', fechaStr: '13 de julio', categoria: 'Otro', descripcion: 'Reunión programada para la gestión, deliberación y aprobación de presupuestos regionales por parte de los consejeros.' },
  { titulo: 'Gran Fiesta de la Nieve 2026', lugar: 'Centro Urbano, Puerto Williams (Cabo de Hornos)', fechaStr: '13 al 18 de julio', categoria: 'Ferias', descripcion: 'Mega evento comunitario estructurado por alianzas de vecinos, que incluye competencias, carros alegóricos y coronación.' },
  { titulo: 'Fiesta Club Ibiza Rave #01', lugar: 'Muchacha Restobar, Punta Arenas', fechaStr: '15 de julio', categoria: 'Música', descripcion: 'Evento de nicho dedicado íntegramente a la exploración de la música electrónica, el house y el techno subterráneo.' },
  { titulo: 'Recital de Hugo Bistolfi (Ex Rata Blanca)', lugar: 'Clandestinos Bar, Puerto Natales', fechaStr: '17 de julio', categoria: 'Música', descripcion: 'Histórico concierto del afamado tecladista argentino de heavy metal, acercando el rock clásico al público natalino.' },
  { titulo: 'Presentación de Boomer & Kutral Dub', lugar: 'Los Bonitos Delivery, Puerto Natales', fechaStr: '17 de julio', categoria: 'Música', descripcion: 'Intervención musical urbana que mezcla los ritmos cadenciosos del reggae, el dub y el rap nacional.' },
  { titulo: 'Espectáculo de Humor: Rodrigo Villegas', lugar: 'Salón de Eventos Casino Dreams, Punta Arenas', fechaStr: '18 de julio', categoria: 'Comedia', descripcion: 'Presentación estelar de la rutina de comedia "Esto Es Para Ustedes" a cargo del triunfador del Festival de Viña.' },
  { titulo: 'Lanzamiento Discográfico de "Aponkuyen"', lugar: 'Círculo Italiano, Punta Arenas', fechaStr: '18 de julio', categoria: 'Música', descripcion: 'Encuentro de la cultura hip-hop y urbana magallánica, celebrando el estreno del álbum junto a artistas invitados.' },
  { titulo: 'Sesión Ordinaria CORE Magallanes (3)', lugar: 'Edificio del Consejo Regional, Punta Arenas', fechaStr: '20 de julio', categoria: 'Otro', descripcion: 'Instancia de gestión gubernamental para el seguimiento de la cartera de inversiones públicas en la región.' },
  { titulo: 'Evento de Lucha Libre: "MLL Terremoto Blanco 2026"', lugar: 'Recinto local, Punta Arenas', fechaStr: '25 de julio', categoria: 'Deporte', descripcion: 'Espectáculo de sports entertainment y acrobacias en el cuadrilátero a cargo de la productora Magallanes Lucha Libre.' },
  { titulo: 'El Chapuzón Más Austral del Mundo', lugar: 'Aguas del Canal Beagle, Puerto Williams', fechaStr: '26 de julio', categoria: 'Deporte', descripcion: 'Evento de turismo extremo donde 400 personas se lanzan a las aguas glaciares para fomentar la desestacionalización.' },
  { titulo: 'XLV Festival Folclórico en la Patagonia (Fase inicial)', lugar: 'Gimnasio de la Confederación Deportiva, Punta Arenas', fechaStr: '30 y 31 de julio', categoria: 'Música', descripcion: 'Primeras dos jornadas del certamen binacional competitivo que premia la preservación y creación de música de raíz.' },
  { titulo: 'Show de Transformismo: Asskha Sumathra "Iconika"', lugar: 'Salón de Eventos Casino Dreams, Punta Arenas', fechaStr: '31 de julio', categoria: 'Comedia', descripcion: 'Espectáculo performático de alta factura técnica que combina comedia incisiva, moda drag y lip-sync.' },
];

// Parser de fechas
function parseFecha(str) {
  const meses = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  str = str.trim().toLowerCase();

  // "1 al 5 de julio" or "4 y 5 de julio" or "30 y 31 de julio"
  const rangeMatch = str.match(/(\d+)\s+(?:al|y)\s+(\d+)\s+de\s+(\w+)/);
  if (rangeMatch) {
    const d1 = parseInt(rangeMatch[1]);
    const d2 = parseInt(rangeMatch[2]);
    const mes = meses[rangeMatch[3]];
    if (mes !== undefined) {
      return {
        fecha: new Date(2026, mes, d1, 20, 0, 0),
        fechaFin: new Date(2026, mes, d2, 23, 59, 0)
      };
    }
  }

  // "8 al 12 de julio"
  const rangeMatch2 = str.match(/(\d+)\s+al\s+(\d+)\s+de\s+(\w+)/);
  if (rangeMatch2) {
    const d1 = parseInt(rangeMatch2[1]);
    const d2 = parseInt(rangeMatch2[2]);
    const mes = meses[rangeMatch2[3]];
    if (mes !== undefined) {
      return {
        fecha: new Date(2026, mes, d1, 20, 0, 0),
        fechaFin: new Date(2026, mes, d2, 23, 59, 0)
      };
    }
  }

  // "2 de julio"
  const singleMatch = str.match(/(\d+)\s+de\s+(\w+)/);
  if (singleMatch) {
    const d = parseInt(singleMatch[1]);
    const mes = meses[singleMatch[2]];
    if (mes !== undefined) {
      return { fecha: new Date(2026, mes, d, 20, 0, 0), fechaFin: null };
    }
  }

  console.warn('No se pudo parsear fecha:', str);
  return { fecha: new Date(), fechaFin: null };
}

const emojiMap = {
  'Cultura': '🎭',
  'Ferias': '🎪',
  'Música': '🎤',
  'Comedia': '😂',
  'Deporte': '⚽',
  'Gastronomía': '🍔',
  'Otro': '📌',
};

const run = async () => {
  try {
    await conectarDB();
    console.log('Conectado a MongoDB...');

    // Eliminar eventos antiguos de Magallanes para evitar duplicados
    const deleted = await Panorama.deleteMany({ region: 'Magallanes', esOficial: true });
    console.log(`Eliminados ${deleted.deletedCount} eventos anteriores de Magallanes.`);

    const panoramas = eventosRaw.map(e => {
      const { fecha, fechaFin } = parseFecha(e.fechaStr);
      return {
        titulo: e.titulo,
        descripcion: e.descripcion,
        fecha,
        fechaFin,
        region: 'Magallanes',
        lugar: e.lugar,
        categoria: e.categoria,
        esOficial: true,
        activo: true,
        emoji: emojiMap[e.categoria] || '📌',
      };
    });

    const result = await Panorama.insertMany(panoramas);
    console.log(`Insertados ${result.length} eventos de Magallanes.`);
    
    // Verificar
    const count = await Panorama.countDocuments({ region: 'Magallanes', esOficial: true });
    console.log(`Total eventos Magallanes en BD: ${count}`);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();
