const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const cron = require('node-cron'); // 🌟 NUEVO: El temporizador
const { GoogleGenerativeAI } = require('@google/generative-ai'); // 🌟 NUEVO: IA de Google

const conectarDB = require('./config/db');

// Modelos para la IA Salva-chats y Limpieza
const Match = require('./models/Match');
const Mensaje = require('./models/Mensaje');
const Historia = require('./models/Historia');
const Panorama = require('./models/Panorama');
const CahuinDiario = require('./models/CahuinDiario');
const cloudinary = require('./config/cloudinary');
const appwrite = require('./config/appwrite');

const app = express();
const server = http.createServer(app); 

const io = new Server(server, { cors: { origin: "*" } });

// 🌟 AQUÍ ESTÁ LA MAGIA DEL CORS CORREGIDO
app.use(cors({
    origin: [
        'https://cahuin.app', 
        'https://www.cahuin.app',
        'https://cahuin-web-github-student-organization.appwrite.network', 
        'http://localhost:3000',
        'http://localhost:8081' // Para que el emulador de Expo siga funcionando
    ],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => res.json({ ok: true, mensaje: 'API de Cahuin activa' }));
app.get('/api', (req, res) => res.json({ ok: true, mensaje: 'API de Cahuin funcionando' }));
app.get('/api/health', (req, res) => res.json({ ok: true, servicio: 'cahuin-backend' }));

app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/matches',   require('./routes/matches'));
app.use('/api/mensajes',  require('./routes/mensajes'));
app.use('/api/cueca',     require('./routes/cueca'));
app.use('/api/panoramas', require('./routes/panoramas'));
app.use('/api/premium',   require('./routes/premium'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/recetas',   require('./routes/recetas'));
app.use('/api/cartas',    require('./routes/cartas'));
app.use('/api/ia',        require('./routes/iaRoutes'));
app.use('/api/social',    require('./routes/socialRoutes'));
app.use('/api/bot',       require('./routes/bot'));

// 🌟 CRON: Limpieza de almacenamiento y base de datos (Se ejecuta a las 03:00 AM)
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Limpieza de servidor: Buscando historias y eventos caducados...');
  try {
    const ahora = new Date();
    
    // 1. Limpieza de Historias (borrar de Cloudinary y BD)
    const historiasVencidas = await Historia.find({ expiraEn: { $lt: ahora } });
    for (let historia of historiasVencidas) {
      if (historia.imagen) {
        const match = historia.imagen.match(/\/v\d+\/(.+)\.\w+$/);
        if (match && match[1]) {
          await cloudinary.uploader.destroy(match[1]).catch(() => {});
        }
      }
    }
    const borradas = await Historia.deleteMany({ expiraEn: { $lt: ahora } });
    console.log(`🧹 ${borradas.deletedCount} historias eliminadas permanentemente.`);

    // 2. Limpieza de Panoramas de usuarios vencidos hace más de 24 hrs
    const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const eventosVencidos = await Panorama.find({ 
      $or: [
        { fechaFin: { $lt: ayer } },
        { fechaFin: { $exists: false }, fecha: { $lt: ayer } }
      ]
    });
    for (let evento of eventosVencidos) {
      if (evento.imagen && evento.imagen.includes('cloudinary')) {
        const match = evento.imagen.match(/\/v\d+\/(.+)\.\w+$/);
        if (match && match[1]) {
          await cloudinary.uploader.destroy(match[1]).catch(() => {});
        }
      }
    }
    const eventosBorrados = await Panorama.deleteMany({ 
      $or: [
        { fechaFin: { $lt: ayer } },
        { fechaFin: { $exists: false }, fecha: { $lt: ayer } }
      ]
    });
    console.log(`🧹 ${eventosBorrados.deletedCount} panoramas (oficiales y comunidad) eliminados.`);

  } catch (e) {
    console.log('Error Limpieza:', e);
  }
});

// Nota: Las funciones de Cahuín del Día e IA Salva-chats ahora se ejecutan de forma secuencial 
// dentro de geminiBotService.js al terminar de recopilar panoramas, para evitar colisiones en la API de Gemini.

// Tracking de conectados por región
const conectadosPorRegion = {};

io.on('connection', (socket) => {
  console.log('🔌 Nuevo celular conectado al chat en vivo');
  
  socket.on('registrarRegion', (region) => {
    if (region) {
      socket.userRegion = region;
      conectadosPorRegion[region] = (conectadosPorRegion[region] || 0) + 1;
      io.emit('statsRegiones', conectadosPorRegion);
    }
  });

  socket.on('entrarSala', (matchId) => { socket.join(matchId); });
  socket.on('enviarMensaje', (data) => { socket.to(data.matchId).emit('recibirMensaje', data.mensaje); });
  
  socket.on('disconnect', () => { 
    if (socket.userRegion && conectadosPorRegion[socket.userRegion] > 0) {
      conectadosPorRegion[socket.userRegion] -= 1;
      io.emit('statsRegiones', conectadosPorRegion);
    }
    console.log('❌ Celular desconectado del chat'); 
  });
});

// Cronjob: Todos los domingos a las 23:59pm se reinicia 'likesSemana' para la competencia semanal
cron.schedule('59 23 * * 0', async () => {
  try {
    const User = require('./models/User');
    await User.updateMany({}, { $set: { likesSemana: 0 } });
    console.log('🌟 Competencia Semanal Reiniciada: likesSemana puestos a 0');
  } catch (error) {
    console.error('Error al reiniciar likesSemana:', error);
  }
}, {
  scheduled: true,
  timezone: "America/Santiago"
});

const PORT = process.env.PORT || 5000;

const iniciarServidor = async () => {
  await conectarDB();
  server.listen(PORT, () => console.log(`Servidor Cahuin corriendo en el puerto ${PORT} con WebSockets`));
};

iniciarServidor();