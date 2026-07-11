require('dotenv').config();
const botService = require('./services/geminiBotService');

// Override parseAndSavePanoramas to just log
const fs = require('fs');

const run = async () => {
  const regiones = require('./utils/regiones');
  const region = regiones[0]; // Arica y Parinacota
  console.log("Running for region:", region.nombre);

  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  console.log("RESPONSE FROM GEMINI:");
  console.log(text);
};

run().catch(console.error);
