// server/controllers/iaController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

// ✅ FUNCIÓN 1: pedirConsejoWingman
// Nombre corregido: antes era exports.getWingman → no coincidía con iaRoutes.js
exports.pedirConsejoWingman = async (req, res) => {
  try {
    const { targetUserId, contextoChat } = req.body;

    const targetUser = targetUserId ? await User.findById(targetUserId) : null;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        consejo: "Configura la GEMINI_API_KEY en Render po'.",
        opener: "Oye, ¿cuál es tu panorama favorito del finde? 🍻"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const infoPerfil = targetUser ? `
      - Nombre: ${targetUser.nombre}, ${targetUser.edad} años, de ${targetUser.ciudad}
      ${targetUser.musica      ? `- Le gusta la música: ${targetUser.musica}` : ''}
      ${targetUser.peliculas   ? `- Le gustan las películas: ${targetUser.peliculas}` : ''}
      ${targetUser.descripcion ? `- Su bio: ${targetUser.descripcion}` : ''}
      ${targetUser.arquetipoCahuinero ? `- Su arquetipo: ${targetUser.arquetipoCahuinero}` : ''}
    ` : 'No hay información del perfil disponible.';

    const chatContexto = (contextoChat && contextoChat.length > 0)
      ? contextoChat.join(' | ')
      : '(chat vacío, ayuda a romper el hielo)';

    const prompt = `
      Eres el 'Wingman' de Cahuín, una app de citas chilena.
      Hablas en español chileno informal y natural (po, cachai, al tiro, pero sin exagerar).
      
      Perfil de la persona con quien quiere conectar:
      ${infoPerfil}
      
      Últimos mensajes del chat: [${chatContexto}]
      
      Responde SOLO con JSON válido, sin texto extra ni bloques de markdown:
      {"consejo": "consejo breve y táctico de máx 120 caracteres", "opener": "mensaje sugerido de máx 140 caracteres, natural y levemente coqueto"}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonLimpio = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(jsonLimpio);

    res.json(parsedData);
  } catch (error) {
    console.error('Error del Wingman:', error.message);
    res.json({
      consejo: 'Relájate y sé tú mismo/a, eso siempre funciona.',
      opener: '¿Qué se cuenta? ¿Algún panorama copado para este finde? 😄'
    });
  }
};

// ✅ FUNCIÓN 2: analizarEnergia
// Esta función faltaba completamente en el controller anterior.
// El route la pedía → llegaba como undefined → crash del servidor.
exports.analizarEnergia = (req, res) => {
  try {
    const { mensajes } = req.body;
    if (!mensajes || mensajes.length === 0) {
      return res.json({ nivel: 0, estado: 'fría', emoji: '❄️' });
    }

    let energia = 0;
    const ahora = new Date();

    mensajes.forEach(msg => {
      if (!msg?.texto) return;

      const diffMin = (ahora - new Date(msg.createdAt)) / 60000;
      if (diffMin < 10)  energia += 15;
      else if (diffMin < 60) energia += 5;

      if (msg.texto.length > 50)      energia += 10;
      else if (msg.texto.length > 20) energia += 5;

      if (msg.texto.match(/😂|🤣|😍|🔥|❤️|jaja|haha|jeje|ajaj/i)) energia += 15;

      if (msg.texto.includes('?')) energia += 8;
    });

    let estado = 'fría';
    let emoji  = '❄️';
    if      (energia > 100) { estado = 'en llamas'; emoji = '🌋'; }
    else if (energia > 50)  { estado = 'caliente';  emoji = '🔥'; }
    else if (energia > 20)  { estado = 'tibia';     emoji = '🟡'; }

    res.json({ nivel: Math.min(energia, 150), estado, emoji });
  } catch (error) {
    res.status(500).json({ message: 'Error calculando energía' });
  }
};