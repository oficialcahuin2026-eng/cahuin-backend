require('dotenv').config();
const mongoose = require('mongoose');
const Panorama = require('./models/Panorama');
const User = require('./models/User');
const { parseAndSavePanoramas } = require('./services/geminiBotService'); // wait parseAndSavePanoramas isn't exported

const assignDefaultImage = (clasificacion) => {
  return "https://images.unsplash.com/photo-1540039155732-d674140d3434?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI_DIRECT);
  console.log("Connected to MongoDB!");

  const markdown = `
| Día | Evento | Lugar y Ciudad | Clasificación | Descripción |
|---|---|---|---|---|
| Miércoles, 29 de Mayo de 2024 | Concierto "Sonidos del Norte" | Casino Luckia Arica (Salón de Eventos), Arica | Música | Una noche para disfrutar de la cumbia y ritmos tropicales. |
`;

  let systemUser = await User.findOne({ email: "bot@cahuin.cl" });
  console.log("User:", systemUser._id);

  const lines = markdown.split('\n').filter(line => line.includes('|'));
  for (let i = 2; i < lines.length; i++) {
    const columns = lines[i].split('|').map(c => c.trim());
    if (columns.length < 6) continue;

    const evento = columns[2];
    const lugar = columns[3];
    const clasificacion = columns[4];
    const descripcion = columns[5];

    if (!evento || evento.includes("---")) continue;

    const fecha = new Date(); // Tomorrow
    fecha.setDate(fecha.getDate() + 1);

    const imagen = assignDefaultImage(clasificacion);
    let emoji = '📍';

    try {
      const p = await Panorama.create({
        creador: systemUser._id,
        titulo: evento,
        descripcion: descripcion,
        fecha: fecha,
        lugar: lugar,
        region: "Arica", // regionCorto for Arica y Parinacota is "Arica"? wait, let's check regiones.js
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
      console.log("Saved panorama:", p._id);
    } catch (e) {
      console.error("Error guardando panorama:", e.message);
    }
  }

  process.exit(0);
};

run().catch(console.error);
