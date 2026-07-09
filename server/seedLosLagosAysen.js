const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const Panorama = require('./models/Panorama');
const conectarDB = require('./config/db');

const parseDateString = (dateStr) => {
    dateStr = dateStr.trim();
    const year = 2026;
    
    // Format: 01/07/2026
    if (dateStr.includes('/')) {
        const [day, month, y] = dateStr.split('/');
        return {
            fecha: new Date(`${y}-${month}-${day}T20:00:00Z`),
            fechaFin: null
        };
    }
    
    // Format: 01 al 31 Jul or 01 Jul
    const match = dateStr.match(/(\d+)(?:\s+al\s+(\d+))?\s+([A-Za-z]+)/i);
    if (match) {
        const startDay = match[1].padStart(2, '0');
        const endDay = match[2] ? match[2].padStart(2, '0') : null;
        let monthName = match[3].toLowerCase();
        
        const monthMap = {
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        };
        const month = monthMap[monthName.substring(0,3)] || '07';
        
        const fecha = new Date(`${year}-${month}-${startDay}T20:00:00Z`);
        const fechaFin = endDay ? new Date(`${year}-${month}-${endDay}T20:00:00Z`) : null;
        
        return { fecha, fechaFin };
    }
    
    // Format: "27 y 28 Jul"
    const matchY = dateStr.match(/(\d+)\s+y\s+(\d+)\s+([A-Za-z]+)/i);
    if (matchY) {
        const startDay = matchY[1].padStart(2, '0');
        const endDay = matchY[2].padStart(2, '0');
        let monthName = matchY[3].toLowerCase();
        const monthMap = {
            'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'ago': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
        };
        const month = monthMap[monthName.substring(0,3)] || '07';
        const fecha = new Date(`${year}-${month}-${startDay}T20:00:00Z`);
        const fechaFin = new Date(`${year}-${month}-${endDay}T20:00:00Z`);
        return { fecha, fechaFin };
    }
    
    // Default
    return { fecha: new Date('2026-07-01T20:00:00Z'), fechaFin: null };
};

const CATEGORIAS_OFICIALES = ['Todos', 'Música', 'Cultura', 'Deporte', 'Comedia', 'Feria', 'Gastronomía'];

const parseFile = (filename, defaultRegion) => {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 5);
    
    const eventos = [];
    
    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 5) continue;
        
        const dateStr = parts[0].trim();
        const title = parts[1].trim();
        const lugar = parts[2].trim();
        let categoria = parts[3].trim();
        const descripcion = parts[4].trim();
        
        const { fecha, fechaFin } = parseDateString(dateStr);
        
        // Map categoria
        if (categoria.toLowerCase().includes('feria') || categoria.toLowerCase().includes('otros') || categoria.toLowerCase().includes('recreación')) {
            categoria = 'Feria';
        } else if (!CATEGORIAS_OFICIALES.includes(categoria)) {
            const found = CATEGORIAS_OFICIALES.find(c => categoria.toLowerCase().includes(c.toLowerCase()));
            categoria = found || 'Cultura';
        }
        
        let emoji = '📌';
        if (categoria === 'Música') emoji = '🎤';
        if (categoria === 'Deporte') emoji = '⚽';
        if (categoria === 'Comedia') emoji = '🎭';
        if (categoria === 'Gastronomía') emoji = '🍔';
        if (categoria === 'Cultura') emoji = '🎨';
        if (categoria === 'Feria') emoji = '🎪';
        
        eventos.push({
            titulo: title,
            descripcion,
            lugar,
            region: defaultRegion,
            fecha,
            fechaFin,
            categoria,
            emoji,
            esOficial: true,
            maxPersonas: 1000,
            activo: true
        });
    }
    
    return eventos;
};

const run = async () => {
    try {
        await conectarDB();
        console.log('Conectado a MongoDB...');
        
        // Eliminar eventos anteriores de esas regiones si fuera necesario, pero mejor solo insertar.
        
        const eventosLosLagos = parseFile('raw_loslagos.txt', 'Los Lagos');
        console.log(`Leídos ${eventosLosLagos.length} eventos de Los Lagos`);
        
        const eventosAysen = parseFile('raw_aysen.txt', 'Aysén');
        console.log(`Leídos ${eventosAysen.length} eventos de Aysén`);
        
        const todos = [...eventosLosLagos, ...eventosAysen];
        
        const result = await Panorama.insertMany(todos);
        console.log(`Insertados ${result.length} eventos con éxito!`);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
