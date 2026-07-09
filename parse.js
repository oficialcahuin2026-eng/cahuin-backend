const fs = require('fs');

const text = fs.readFileSync('raw.txt', 'utf-8');
const lines = text.trim().split('\n');
const events = [];

function formatIso(fecha_str) {
    const match = fecha_str.match(/(\d+)\s+de\s+(julio|Julio)/i);
    if (match) {
        const day = parseInt(match[1], 10);
        return `2026-07-${day.toString().padStart(2, '0')}T20:00:00.000Z`;
    }
    return "2026-07-15T20:00:00.000Z";
}

for (let i = 0; i < lines.length; i += 2) {
    const row = lines[i].split('\t');
    if (row.length >= 4) {
        const fecha = row[0].trim();
        const evento = row[1].trim();
        const lugar = row[2].trim();
        const cat = row[3].trim();
        const desc = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        
        let region = 'Los Ríos';
        const lugar_lower = lugar.toLowerCase();
        if (['concepción', 'talcahuano', 'biobío', 'lota', 'coronel', 'penco', 'lebu', 'arauco', 'san pedro', 'los ángeles', 'huépil', 'chiguayante', 'tomé', 'yumbel', 'cañete', 'nacimiento', 'hualpén', 'curanilahue'].some(r => lugar_lower.includes(r))) {
            region = 'Bío Bío';
        }

        events.push({
            _id: `evt_mock_${events.length}`,
            titulo: evento,
            lugar: lugar,
            fecha: formatIso(fecha),
            fechaString: fecha,
            categoria: cat,
            descripcion: desc,
            esOficial: true,
            createdAt: '2026-07-08T12:00:00.000Z',
            region: region
        });
    }
}

fs.mkdirSync('C:/Users/gonza/OneDrive/Desktop/cahuin/src/data', { recursive: true });
fs.writeFileSync('C:/Users/gonza/OneDrive/Desktop/cahuin/src/data/mockPanoramas.js', 
    'export const mockPanoramas = ' + JSON.stringify(events, null, 2) + ';\n'
);
