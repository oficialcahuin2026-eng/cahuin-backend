const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Panorama = require('./models/Panorama');
const conectarDB = require('./config/db');

const run = async () => {
    try {
        await conectarDB();
        console.log('Conectado a MongoDB...');
        
        // Cargar mockPanoramas pero usando import dinamico
        const mockModule = await import('../src/data/mockPanoramas.js');
        const riosMock = mockModule.mockPanoramas.filter(p => p.region === 'Los Ríos');
        
        const emojimap = {
            'Ferias': '🎪',
            'Comedia': '😂',
            'Cultura': '🎭',
            'Música': '🎤',
            'Deporte': '⚽',
            'Gastronomía': '🍔'
        };

        const panoramas = riosMock.map(m => {
            let f = new Date(m.fecha);
            let ff = null;
            if (m.fechaString && m.fechaString.toLowerCase().includes('hasta el')) {
                // "Hasta el 12 de julio"
                const match = m.fechaString.match(/hasta el (\d+)/i);
                if (match) {
                    ff = new Date(2026, 6, parseInt(match[1]), 20, 0, 0); // Julio es 6 (0-indexed)
                }
            }
            return {
                titulo: m.titulo,
                descripcion: m.descripcion,
                fecha: f,
                fechaFin: ff,
                region: m.region,
                lugar: m.lugar,
                categoria: m.categoria,
                esOficial: true,
                activo: true,
                emoji: emojimap[m.categoria] || '📌'
            };
        });

        // Eliminar eventos viejos de Los Ríos que puedan estar repetidos si ya los hubiese
        // Pero primero borrar si no hay match
        const result = await Panorama.insertMany(panoramas);
        console.log(`Insertados ${result.length} eventos de Los Ríos.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
