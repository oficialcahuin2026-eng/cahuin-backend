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

// Función para procesar una región y guardar sus resultados
const fetchPanoramasParaRegion = async (region) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY no configurada.");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Usaremos gemini-flash-latest 
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Actúa como un investigador experto en la agenda oficial y local de panoramas en ${region.nombre}, Chile. Tu objetivo es elaborar una guía exhaustiva, ultra detallada y completa de absolutamente todos los eventos —musicales, culturales, deportivos, gastronómicos, ferias, festivales, shows en vivo, celebraciones municipales y actividades en bares, hoteles, restaurantes, discotecas y cualquier otro local— que se realizarán en las comunas de la ${region.nombre} durante el día siguiente.

Directrices de búsqueda:
Tipos de eventos y clasificación:
Música: conciertos, festivales, shows en vivo en estadios, teatros, bares, discotecas y casinos.
Comedia: stand-up, espectáculos humorísticos en teatros, bares y centros culturales.
Cultura: obras de teatro, danza, exposiciones, cine, ferias literarias, actividades en centros culturales y universidades.
Deporte: partidos oficiales (fútbol, básquetbol, tenis, etc.), torneos, maratones, campeonatos locales y nacionales.
Gastronomía: ferias costumbristas, festivales de comida, muestras culinarias en restaurantes, hoteles y plazas.
Ferias y otros panoramas oficiales/locales: celebraciones municipales, fiestas regionales, actividades en hoteles, bares y discotecas.

Tipos de recintos a incluir:
Grandes recintos: estadios, arenas, centros de eventos masivos.
Teatros y centros culturales.
Hotelería y casinos.
Escenas locales: bares, restaurantes, discotecas.

Fuentes de información:
Sitios oficiales, Instagram, Facebook, páginas municipales, productoras locales y medios regionales.

Formato de presentación:
Presenta la información en una tabla Markdown con EXACTAMENTE las siguientes columnas (incluye la cabecera exacta):
| Día | Evento | Lugar y Ciudad | Clasificación | Descripción |

Restricción temporal crítica:
Asegúrate de que todos los datos correspondan única y exclusivamente al día siguiente (mañana).
Filtra y descarta cualquier evento de días anteriores o posteriores.

Busca meticulosamente en las siguientes comunas de la ${region.nombre}:
${region.comunas.map(c => '• ' + c).join('\n')}

IMPORTANTE: Responde ÚNICAMENTE con la tabla Markdown. No incluyas texto antes ni después de la tabla.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    await parseAndSavePanoramas(text, region.nombre, region.nombreCorto);
  } catch (error) {
    console.error(`[Bot] Error obteniendo panoramas de ${region.nombre}:`, error.message);
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
    if (columns.length < 6) continue; // Formato incorrecto o línea de relleno

    // markdown format: | Día | Evento | Lugar y Ciudad | Clasificación | Descripción |
    // index 0 is empty (before first |), index 1 = Día, index 2 = Evento, etc.
    const evento = columns[2];
    const lugar = columns[3];
    const clasificacion = columns[4];
    const descripcion = columns[5];

    if (!evento || evento.includes("---")) continue;

    const fecha = new Date(); // Tomorrow
    fecha.setDate(fecha.getDate() + 1);

    const imagen = assignDefaultImage(clasificacion);
    
    // Asignar emoji según la categoría
    let emoji = '📍';
    const norm = clasificacion.toLowerCase();
    if (norm.includes('música') || norm.includes('musica')) emoji = '🎵';
    else if (norm.includes('comedia')) emoji = '😂';
    else if (norm.includes('cultura')) emoji = '🎭';
    else if (norm.includes('deporte')) emoji = '⚽';
    else if (norm.includes('gastronom')) emoji = '🍔';
    else if (norm.includes('feria')) emoji = '🎪';

    try {
      await Panorama.create({
        creador: systemUser._id,
        titulo: evento,
        descripcion: descripcion,
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
    if (!process.env.GEMINI_API_KEY) return;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
    if (!process.env.GEMINI_API_KEY) return;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const hace48Horas = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const matchesEstancados = await Match.find({ iaIntervino: false });

    for (let match of matchesEstancados) {
      const ultimosMensajes = await Mensaje.find({ matchId: match._id }).sort({ createdAt: -1 }).limit(1);
      
      if (ultimosMensajes.length > 0) {
        const ultimo = ultimosMensajes[0];
        if (ultimo.createdAt < hace48Horas && ultimo.tipo !== 'ia_wingman') {
          
          const prompt = `Analiza este último mensaje de un chat de citas en Chile: "${ultimo.texto}". Escribe UNA sola oración amigable y corta, como un asistente que intenta revivir la charla mencionando de qué hablaban. Termina con una pregunta abierta.`;
          const result = await model.generateContent(prompt);
          const textoIA = result.response.text().trim();

          await Mensaje.create({
            matchId: match._id,
            texto: `🤖 Wingman: ¡Oigan! La charla estaba buena. ${textoIA}`,
            tipo: 'ia_wingman'
          });

          match.iaIntervino = true;
          await match.save();
          // Nota: Socket.io broadcast omitido al ejecutarse en background, los usuarios lo verán al abrir la app.
        }
      }
    }
    console.log('✅ IA Salva-chats finalizado.');
  } catch (e) { console.log('Error Cron IA:', e); }
};

const runDailyScrape = async () => {
  console.log("[Bot] Iniciando recopilación diaria secuencial...");
  
  for (const region of regiones) {
    console.log(`[Bot] Solicitando a Gemini para la región: ${region.nombre}...`);
    await fetchPanoramasParaRegion(region);
    await new Promise(resolve => setTimeout(resolve, 10000)); 
  }

  console.log("[Bot] Ejecutando Cahuín del Día...");
  await generarCahuinDelDia();
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("[Bot] Ejecutando Salva-chats...");
  await ejecutarSalvaChats();

  console.log("[Bot] Recopilación y rutinas IA finalizadas exitosamente.");
};

module.exports = {
  runDailyScrape,
  fetchPanoramasParaRegion
};
