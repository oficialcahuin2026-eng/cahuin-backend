const mongoose = require('mongoose');
const { parseAndSavePanoramas } = require('./services/geminiBotService'); // Wait, parseAndSavePanoramas is not exported!

const markdown = `
| Día | Evento | Lugar y Ciudad | Clasificación | Descripción |
|---|---|---|---|---|
| Miércoles, 29 de Mayo de 2024 | Concierto "Sonidos del Norte" | Casino Luckia Arica (Salón de Eventos), Arica | Música | Una noche para disfrutar de la cumbia y ritmos tropicales a cargo de una banda local en vivo. Entrada con ticket de acceso al casino. |
`;

const run = async () => {
  // Simulating parseAndSavePanoramas logic to see where it fails
  const lines = markdown.split('\n').filter(line => line.includes('|'));
  console.log("Lines length:", lines.length);
  if (lines.length < 3) return console.log("Return at < 3");

  for (let i = 2; i < lines.length; i++) {
    const columns = lines[i].split('|').map(c => c.trim());
    console.log("Columns length:", columns.length);
    console.log("Columns:", columns);
    if (columns.length < 6) {
      console.log("Skipping because < 6");
      continue;
    }

    const evento = columns[2];
    const lugar = columns[3];
    const clasificacion = columns[4];
    const descripcion = columns[5];

    console.log("Parsed:", {evento, lugar, clasificacion, descripcion});
    
    if (!evento || evento.includes("---")) {
      console.log("Skipping because --- or empty");
      continue;
    }
    
    console.log("This panorama WOULD be saved!");
  }
};

run();
