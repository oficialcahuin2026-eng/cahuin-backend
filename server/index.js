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

// Modelos para la IA Salva-chats
const Match = require('./models/Match');
const Mensaje = require('./models/Mensaje');

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

app.use(express.json());

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

// 🌟 IDEA 1: IA SALVA-CHATS (Se ejecuta todos los días a las 20:00 hrs)
cron.schedule('0 20 * * *', async () => {
  console.log('🤖 IA Salva-chats: Revisando conversaciones estancadas...');
  try {
    if (!process.env.GEMINI_API_KEY) return;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const hace48Horas = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const matchesEstancados = await Match.find({ iaIntervino: false });

    for (let match of matchesEstancados) {
      const ultimosMensajes = await Mensaje.find({ matchId: match._id }).sort({ createdAt: -1 }).limit(1);
      
      if (ultimosMensajes.length > 0) {
        const ultimo = ultimosMensajes[0];
        // Si pasaron 48 hrs y no es un mensaje del sistema
        if (ultimo.createdAt < hace48Horas && ultimo.tipo !== 'ia_wingman') {
          
          const prompt = `Analiza este último mensaje de un chat de citas en Chile: "${ultimo.texto}". Escribe UNA sola oración amigable y corta, como un asistente que intenta revivir la charla mencionando de qué hablaban. Termina con una pregunta abierta.`;
          const result = await model.generateContent(prompt);
          const textoIA = result.response.text().trim();

          // Inyecta el mensaje salvavidas directo al chat
          const nuevoMensaje = await Mensaje.create({
            matchId: match._id,
            texto: `🤖 Wingman: ¡Oigan! La charla estaba buena. ${textoIA}`,
            tipo: 'ia_wingman'
          });

          match.iaIntervino = true;
          await match.save();

          // Notifica a los celulares si están conectados
          io.to(match._id.toString()).emit('recibirMensaje', nuevoMensaje);
        }
      }
    }
  } catch (e) { console.log('Error Cron IA:', e); }
});

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

const PORT = process.env.PORT || 5000;

const iniciarServidor = async () => {
  await conectarDB();
  server.listen(PORT, () => console.log(`Servidor Cahuin corriendo en el puerto ${PORT} con WebSockets`));
};

iniciarServidor();