const fs = require('fs');
const regiones = require('./utils/regiones');

const hoy = new Date();
const mañana = new Date(hoy);
mañana.setDate(mañana.getDate() + 1);
const hoyStr = hoy.toISOString().split('T')[0];
const mañanaStr = mañana.toISOString().split('T')[0];

let markdown = `# Prompts de Gemini para las 16 Regiones\n\n`;
markdown += `Aquí están los 16 prompts exactos que el servidor le envía a Gemini, uno por cada región, con las fechas de hoy inyectadas dinámicamente para evitar alucinaciones temporales.\n\n`;

for (const region of regiones) {
  const listaComunas = region.comunas.map(c => `• ${c}`).join('\n');

  const prompt = `Actúa como un investigador experto en la agenda oficial y local de panoramas en ${region.nombre}, Chile.
ATENCIÓN: Hoy es ${hoyStr}. "Mañana" es ${mañanaStr}. Estamos en el año ${hoy.getFullYear()}.
Tu objetivo es elaborar una guía exhaustiva, ultra detallada y verificable de absolutamente todos los eventos que se realizarán durante el día de mañana (${mañanaStr}), Y TAMBIÉN los eventos futuros más relevantes y masivos (conciertos, festivales, partidos, convenciones, etc.) que estén confirmados para ocurrir durante los próximos 6 a 12 meses a partir de hoy.

Asegúrate de investigar y abarcar las siguientes comunas y localidades de la región:
${listaComunas}

Directrices de búsqueda y categorización:
REGLA ESTRICTA DE CATEGORÍAS: Clasifica CADA evento usando ÚNICA Y EXCLUSIVAMENTE una de estas 7 categorías (usa la palabra exacta, sin agregar nada más):
1. Música (para conciertos, fiestas, tocatas, DJ, K-pop)
2. Cultura (para exposiciones, teatro, danza, anime, convenciones)
3. Deporte (para maratones, partidos de fútbol, skate, lucha libre)
4. Comedia (para stand-up, shows de magia, humor)
5. Feria (para ferias libres, ferias de emprendedores, kermesses, convenciones)
6. Gastronomía (para ferias costumbristas, catas, food trucks, fiestas de la vendimia)
7. Otros (si no calza en ninguna de las anteriores: talleres, circo, eventos rurales, patronales, etc)

Tipos de recintos a incluir: Estadios, arenas, teatros, museos, universidades, colegios, hoteles, casinos, carpas, bares, discotecas, plazas, gimnasios, playas, cerros, ferias libres.

Instrucciones de formato de salida (OBLIGATORIO):
No incluyas introducciones ni conclusiones.
El resultado debe ser ÚNICAMENTE una tabla en formato Markdown con las siguientes columnas exactas:

| Fecha (YYYY-MM-DD) | Hora | Evento | Lugar/Comuna | Categoría | Público | Precio | Descripción (Breve de 1 a 2 líneas) | Organizador | Enlace/Fuente |

Restricciones para la tabla:
- Si no encuentras hora, pon "Todo el día".
- "Lugar/Comuna": Escribe el recinto y la comuna obligatoriamente.
- "Categoría": Usa solo una de las 7 permitidas.
- "Público": Especifica si es "Todo público", "Mayores de 18", etc.
- "Precio": Si es gratis pon "Gratis", si no, el valor en CLP.
- "Descripción (Breve de 1 a 2 líneas)": Escribe un pequeño resumen narrativo de qué trata el evento.
- "Enlace/Fuente": Incluye el sitio web oficial o la red social (ej: puntoticket.com, Instagram @...).`;

  markdown += `## ${region.nombre}\n\n`;
  markdown += "```text\n" + prompt + "\n```\n\n";
}

fs.writeFileSync('C:\\Users\\gonza\\.gemini\\antigravity\\brain\\78828986-b837-4d4e-842d-ae9279265155\\prompts_gemini.md', markdown);
console.log("Artifact created!");
