// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');

// Importamos las herramientas del Reloj Automático y el Robot Scraper
const cron = require('node-cron');
const { sincronizarEventos } = require('./utils/scraperEventos');

const app = express();

// 1. Conectar a la base de datos (MongoDB)
conectarDB();

// 2. Middlewares (Seguridad y formato de datos)
app.use(cors());
app.use(express.json());

// 3. Ruta de prueba base
app.get('/api', (req, res) => res.json({ mensaje: '¡API de Cahuín funcionando al tiro! 🇨🇱' }));

// 4. Montaje de Rutas (Todas las puertas de tu aplicación)
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/matches',   require('./routes/matches'));
app.use('/api/mensajes',  require('./routes/mensajes'));
app.use('/api/cueca',     require('./routes/cueca'));
app.use('/api/panoramas', require('./routes/panoramas'));
app.use('/api/premium',   require('./routes/premium'));
app.use('/api/recetas',   require('./routes/recetas'));

// 5. EL RELOJ AUTOMÁTICO (Cron Job)
// Se ejecutará todos los días a las 03:00 AM hora del servidor para buscar eventos nuevos
cron.schedule('0 3 * * *', () => {
  console.log("⏰ Ejecutando tarea programada: Actualización de Eventos Oficiales...");
  sincronizarEventos();
});

// (Opcional) Si quieres forzar al robot a buscar eventos apenas prendas 
// el servidor para probar que funciona, descomenta la línea de abajo:
sincronizarEventos(); 

// 6. Encender el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Cahuín corriendo en puerto ${PORT}`);
});