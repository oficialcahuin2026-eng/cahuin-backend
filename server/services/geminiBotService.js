const { GoogleGenerativeAI } = require("@google/generative-ai");
const Panorama = require("../models/Panorama");
const User = require("../models/User"); // To assign an owner to the bot panoramas
const regiones = require("../utils/regiones");

// Helper para asignar fotos por defecto según clasificación
const assignDefaultImage = (clasificacion) => {
  const norm = clasificacion.toLowerCase();
  if (norm.includes("música") || norm.includes("musica") || norm.includes("concierto")) {
    return "https://images.unsplash.com/photo-1540039155732-d674140d3434?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  }
  if (norm.includes("comedia") || norm.includes("stand")) {
    return "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  }
  if (norm.includes("cultura") || norm.includes("teatro")) {
    return "https://images.unsplash.com/photo-1514306191717-452ec28c7814?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  }
  if (norm.includes("deporte")) {
    return "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  }
  if (norm.includes("gastronom") || norm.includes("comida")) {
    return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
  }
  // Ferias y otros
  return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
};

// Helper para obtener una API key aleatoria si hay múltiples configuradas (separadas por coma)
const getRandomApiKey = () => {
  const envKey = process.env.GEMINI_API_KEY;
  if (!envKey) return null;
  const keys = envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
};

// Función para procesar una región y guardar sus resultados
const fetchPanoramasParaRegion = async (region) => {
  const prompt = `Actúa como un investigador experto en la agenda oficial y local de panoramas en ${region.nombre}, Chile. Tu objetivo es elaborar una guía exhaustiva, ultra detallada y verificable de absolutamente todos los eventos que se realizarán en las comunas de la ${region.nombre} durante el día siguiente.

Directrices de búsqueda:
Tipos de eventos y clasificación (incluyendo pero no limitándose a):
Música: conciertos, tocatas, batallas de rap, peñas, bandas tributo, K-pop dance, orquestas, karaoke, batucadas.
Comedia y Artes: stand-up, teatro, danza, ferias literarias, exposiciones.
Entretenimiento y Niños: circos, parques, cuentacuentos, shows de magia, teatro infantil/bebés, estrenos de cine, autocines.
Cultura Geek y Nicho: convenciones anime, cómics, cosplay, e-sports, torneos TCG, juegos de rol, Expo Tattoo, tuning.
Deporte y Recreación: partidos oficiales, maratones, cicletadas furiosas, skate, lucha libre, trekking.
Mundo Rural y Huaso: rodeos, carreras a la chilena, rayuela, domaduras, trillas, ferias agrícolas.
Universidades y Educación: ferias científicas, hackathons, fiestas mechonas, tocatas de facultad, kermesses.
Economía y Gastronomía: ferias costumbristas, food trucks, catas, showrooms, ropa vintage, remates.
Comunidad, Solidaridad y 3ra Edad: completadas, bingos, malones, mateadas, clubes de adulto mayor, asambleas, voluntariados, fiestas patronales.
Alternativo, Bienestar y Disidencias: fiestas tecno/rave, eventos LGBTQ+ (ballroom, transformismo), ferias feministas, temazcales, ceremonias de cacao, sonoterapia, yoga.

Tipos de recintos a incluir: Estadios, arenas, medialunas, teatros, museos, universidades, colegios, hoteles, casinos, carpas, bares, discotecas, plazas, juntas de vecinos, gimnasios, playas, cerros, ferias libres.

RESTRICCIÓN ANTI-ALUCINACIÓN (CRÍTICO):
Bajo ninguna circunstancia inventes eventos. Todo debe ser 100% real y verificable. Si en una comuna no hay eventos para el día de mañana, simplemente omítela.

Formato de presentación (Tabla Markdown EXACTA):
| Hora | Evento | Lugar/Comuna | Categoría | Público | Precio | Organizador | Enlace/Fuente |

Restricción temporal crítica: Solo eventos del día siguiente (mañana). Descarta fechas pasadas o futuras.

Busca meticulosamente en las comunas y localidades de:
• ${region.comunas.join(', ')}

IMPORTANTE: Responde ÚNICAMENTE con la tabla Markdown. No incluyas texto antes ni después.`;

  let retries = 3;
  let success = false;

  while (retries > 0 && !success) {
    try {
      const currentApiKey = getRandomApiKey();
      if (!currentApiKey) throw new Error("GEMINI_API_KEY no configurada");
      const genAI = new GoogleGenerativeAI(currentApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log("=== RAW GEMINI OUTPUT ===");
      console.log(text);
      console.log("=========================");
      await parseAndSavePanoramas(text, region.nombre, region.nombreCorto);
      success = true;
    } catch (error) {
      retries--;
      const isRateLimitOrServerDown = error.message.includes("503") || error.message.includes("429") || error.message.includes("quota");
      
      if (isRateLimitOrServerDown && retries > 0) {
        console.error(`[Bot] Congestión en Gemini para ${region.nombre} (Error ${error.message.substring(0, 40)}...). Reintentando en 15s. Intentos restantes: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        console.error(`[Bot] Error final obteniendo panoramas de ${region.nombre}:`, error.message);
        break;
      }
    }
  }

  if (!success) {
    console.error(`[Bot] ❌ Se saltó la región ${region.nombre} por demasiados errores de Gemini hoy.`);
  }
};

const parseAndSavePanoramas = async (markdown, regionName, regionCorto) => {
  // Buscamos al "Usuario Sistema" para asignarle estos panoramas
  let systemUser = await User.findOne({ email: "bot@cahuin.cl" });
  if (!systemUser) {
    systemUser = await User.create({
      nombre: "Cahuin Bot",
      email: "bot@cahuin.cl",
      password: "secret_bot_password",
      genero: "Prefiero no decirlo",
      fechaNacimiento: new Date(1990, 1, 1),
      foto: "https://ui-avatars.com/api/?name=Cahuin+Bot&background=0D8ABC&color=fff"
    });
  }

  // Separar líneas
  const lines = markdown.split('\n').filter(line => line.includes('|'));
  if (lines.length < 3) return; // Probablemente no hubo tabla

  // Ignorar cabeceras (índices 0 y 1)
  for (let i = 2; i < lines.length; i++) {
    const columns = lines[i].split('|').map(c => c.trim());
    if (columns.length < 9) continue; // Formato incorrecto o línea de relleno

    // | Hora | Evento | Lugar/Comuna | Categoría | Público | Precio | Organizador | Enlace/Fuente |
    // index 0 = vacio, index 1 = Hora, 2 = Evento, 3 = Lugar, 4 = Categoría, 5 = Público, 6 = Precio, 7 = Organizador, 8 = Enlace
    const hora = columns[1];
    const evento = columns[2];
    const lugar = columns[3];
    const clasificacion = columns[4];
    const publico = columns[5];
    const precio = columns[6];
    const organizador = columns[7];
    const enlace = columns[8];

    if (!evento || evento.includes("---")) continue;

    const fecha = new Date(); // Tomorrow
    fecha.setDate(fecha.getDate() + 1);

    const imagen = assignDefaultImage(clasificacion);
    
    // Asignar emoji según la categoría
    let emoji = '📍';
    const norm = clasificacion.toLowerCase();
    if (norm.includes('música') || norm.includes('musica')) emoji = '🎵';
    else if (norm.includes('comedia')) emoji = '😂';
    else if (norm.includes('cultura') || norm.includes('arte')) emoji = '🎭';
    else if (norm.includes('deporte') || norm.includes('skate') || norm.includes('trekking')) emoji = '⚽';
    else if (norm.includes('gastronom') || norm.includes('comida') || norm.includes('food')) emoji = '🍔';
    else if (norm.includes('geek') || norm.includes('anime') || norm.includes('cosplay') || norm.includes('esports')) emoji = '👾';
    else if (norm.includes('rural') || norm.includes('huaso') || norm.includes('rodeo')) emoji = '🐴';
    else if (norm.includes('niños') || norm.includes('infantil') || norm.includes('circo')) emoji = '🧸';
    else if (norm.includes('bienestar') || norm.includes('yoga') || norm.includes('lgbt') || norm.includes('rave')) emoji = '✨';
    else if (norm.includes('feria')) emoji = '🎪';
    else if (norm.includes('universidad') || norm.includes('educación')) emoji = '🎓';

    const descripcionExtra = `⏰ Hora: ${hora}\n🎟️ Precio: ${precio}\n👥 Público: ${publico}\n🏷️ Categoría: ${clasificacion}\n🏢 Organizador: ${organizador}\n🔗 Enlace/Fuente: ${enlace}`;

    try {
      await Panorama.create({
        creador: systemUser._id,
        titulo: evento,
        descripcion: descripcionExtra,
        fecha: fecha,
        lugar: lugar,
        region: regionCorto, // Usar el nombre corto exacto que espera la App (ej: "Araucanía")
        privacidad: "Público",
        esOficial: true,
        categoria: clasificacion,
        emoji: emoji,
        imagen: imagen,
        participantes: [],
        solicitudes: [],
        mensajesGrupo: [],
        likes: [],
        superlikes: []
      });
    } catch (e) {
      console.error("[Bot] Error guardando panorama:", e.message);
    }
  }
  console.log(`[Bot] ${lines.length - 2} panoramas procesados para ${regionName}.`);
};

const CahuinDiario = require("../models/CahuinDiario");
const Match = require("../models/Match");
const Mensaje = require("../models/Mensaje");

const generarCahuinDelDia = async () => {
  console.log('🗣️ Generando Cahuín del Día con Gemini...');
  try {
    const apiKey = getRandomApiKey();
    if (!apiKey) return;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `Escribe un enunciado polémico, divertido o interesante sobre citas, amor, costumbres chilenas o vida cotidiana que sirva como "Cahuín del Día" para que usuarios de una app de citas en Chile voten "De acuerdo" o "Ni cagando". Debe ser de máximo 2 oraciones, con un tono relajado y chileno (pero sin exagerar). Ejemplo: "Mandar reels cuenta como lenguaje del amor." Responde SOLO con el enunciado, sin comillas.`;
    const result = await model.generateContent(prompt);
    const textoIA = result.response.text().trim().replace(/^"|"$/g, '');

    const fechaChile = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    const fechaActual = fechaChile();
    
    await CahuinDiario.findOneAndUpdate(
      { fecha: fechaActual },
      { $setOnInsert: { fecha: fechaActual, texto: textoIA, autorAnonimo: 'Gemini (Inteligencia Cahuinera)' } },
      { upsert: true, new: true }
    );
    console.log('✅ Cahuín del Día generado:', textoIA);
  } catch (e) { console.log('Error Cron Cahuin:', e); }
};

const ejecutarSalvaChats = async () => {
  console.log('🤖 IA Salva-chats: Revisando conversaciones estancadas...');
  try {
    const apiKey = getRandomApiKey();
    if (!apiKey) return;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const hace48Horas = new Date(Date.now() - 48 * 60 * 60 * 1000);
    // Limitamos a 100 chats máximos por ejecución para evitar payloads inmensos
    const matchesEstancados = await Match.find({ iaIntervino: false }).limit(100);
    const chatsParaProcesar = [];

    for (let match of matchesEstancados) {
      const ultimosMensajes = await Mensaje.find({ matchId: match._id }).sort({ createdAt: -1 }).limit(1);
      if (ultimosMensajes.length > 0) {
        const ultimo = ultimosMensajes[0];
        if (ultimo.createdAt < hace48Horas && ultimo.tipo !== 'ia_wingman') {
          chatsParaProcesar.push({ id: match._id.toString(), texto: ultimo.texto });
        }
      }
    }

    if (chatsParaProcesar.length === 0) {
      console.log('✅ IA Salva-chats: Ningún chat necesita ser revivido hoy.');
      return;
    }

    console.log(`🤖 Procesando ${chatsParaProcesar.length} chats en modo mayorista...`);

    const prompt = `Analiza los siguientes mensajes finales de distintos chats de citas estancados. Para cada uno, escribe UNA sola oración amigable y corta que intente revivir la charla mencionando de qué hablaban, terminando con una pregunta abierta. Usa lenguaje relajado chileno.
Devuelve EXACTAMENTE un array JSON válido con objetos que tengan "id" y "respuesta". Ejemplo:
[{"id": "123", "respuesta": "¡Oye! Estaba buena la charla sobre eso. ¿Qué pasó al final?"}]

Mensajes a analizar:
${chatsParaProcesar.map(c => `ID: ${c.id} | Mensaje: "${c.texto}"`).join('\n')}
`;

    // Solicitamos JSON como salida estricta
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const textoRespuesta = result.response.text().trim();
    let respuestas = [];
    try {
      respuestas = JSON.parse(textoRespuesta);
    } catch (parseError) {
      console.error('Error parseando respuesta JSON de IA Salva-chats:', textoRespuesta);
      return;
    }

    for (const res of respuestas) {
      const matchDb = await Match.findById(res.id);
      if (matchDb) {
        await Mensaje.create({
          matchId: matchDb._id,
          texto: `🤖 Wingman: ${res.respuesta}`,
          tipo: 'ia_wingman'
        });
        matchDb.iaIntervino = true;
        await matchDb.save();
      }
    }
    console.log(`✅ IA Salva-chats finalizado: ${respuestas.length} chats revividos.`);
  } catch (e) { console.log('Error Cron IA:', e); }
};

const runDailyScrape = async () => {
  console.log("[Bot] Iniciando recopilación diaria secuencial con descansos de 30 segundos...");
  
  for (const region of regiones) {
    console.log(`[Bot] Solicitando a Gemini para la región: ${region.nombre}...`);
    await fetchPanoramasParaRegion(region);
    await new Promise(resolve => setTimeout(resolve, 30000)); 
  }

  console.log("[Bot] Ejecutando Cahuín del Día...");
  await generarCahuinDelDia();
  await new Promise(resolve => setTimeout(resolve, 30000));

  console.log("[Bot] Ejecutando Salva-chats...");
  await ejecutarSalvaChats();

  console.log("[Bot] Recopilación y rutinas IA finalizadas exitosamente.");
};

module.exports = {
  runDailyScrape,
  fetchPanoramasParaRegion
};
