const { Readable } = require('stream');
const Historia = require('../models/Historia');
const HistoriaExito = require('../models/HistoriaExito');
const CahuinDiario = require('../models/CahuinDiario');
const Panorama = require('../models/Panorama');
const PanoramaSwipe = require('../models/PanoramaSwipe');
const Match = require('../models/Match');
const Mensaje = require('../models/Mensaje');
const User = require('../models/User');
const Botella = require('../models/Botella');
const cloudinary = require('../config/cloudinary');
const eventosOficiales = require('../utils/seedEventos');
const { normalizarRegionChile, inferirRegionPorCiudad } = require('../utils/chileLocations');
const ADMIN_EMAIL = 'oficialcahuin2026@gmail.com';
const esAdmin = (usuario) => (usuario?.email || '').toLowerCase() === ADMIN_EMAIL;
const assertAdmin = (req, res) => {
  if (esAdmin(req.user)) return true;
  res.status(403).json({ message: 'Solo la cuenta oficial puede revisar esto.' });
  return false;
};

const CAHUINES = [
  'Me encanta la pizza con piña y el que opine lo contrario que me pelee.',
  'Primera cita ideal: completo italiano y caminar sin rumbo.',
  'Si responde "jajaja" seco, igual puede haber interés. Discutible.',
  'El karaoke revela más compatibilidad que cualquier test.',
  'Mandar reels cuenta como lenguaje del amor.',
];

const HEAT_ZONES = {
  Araucania: ['Avenida Alemania', 'Centro Temuco', 'Ufro', 'Costanera Villarrica', 'Pucón centro'],
  Metropolitana: ['Bellavista', 'Lastarria', 'Ñuñoa', 'Providencia', 'Barrio Italia'],
  'Arica y Parinacota': ['Centro Arica', 'Playa Chinchorro', 'Morro', 'Azapa', 'Costanera Sur'],
  Valparaiso: ['Cerro Alegre', 'Viña centro', 'Quilpué centro', 'Reñaca', 'Muelle Barón'],
  default: ['Centro', 'Plaza principal', 'Universidad', 'Costanera', 'Barrio de bares'],
};

const normalizarTexto = (valor = '') => valor
  .replace(/Ã¡/g, 'a')
  .replace(/Ã©/g, 'e')
  .replace(/Ã­/g, 'i')
  .replace(/Ã³/g, 'o')
  .replace(/Ãº/g, 'u')
  .replace(/Ã±/g, 'n')
  .replace(/Ã‘/g, 'n')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[’']/g, '')
  .toLowerCase()
  .trim();

const regionUsuario = (user = {}) => {
  const region = normalizarRegionChile(user.region || '') || inferirRegionPorCiudad(user.ciudad || '');
  return region && region !== 'Por definir' ? region : '';
};

const mismaRegion = (a = '', b = '') => normalizarTexto(normalizarRegionChile(a)) === normalizarTexto(normalizarRegionChile(b));

// Genera un regex tolerante a tildes para buscar regiones en la BD
const regexRegion = (region) => {
  const r = normalizarRegionChile(region) || region;
  return r
    .replace(/[aá]/gi, '[aá]')
    .replace(/[eé]/gi, '[eé]')
    .replace(/[ií]/gi, '[ií]')
    .replace(/[oó]/gi, '[oó]')
    .replace(/[uú]/gi, '[uú]')
    .replace(/[ñ]/gi, '[nñ]');
};

const fechaChile = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const inicioDeHoy = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
};

const subirImagenHistoria = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'cahuin_historias',
      resource_type: 'image',
      transformation: [{ width: 1080, height: 1350, crop: 'limit' }],
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    }
  );

  Readable.from(file.buffer).pipe(stream);
});

const getOrCreateCahuin = async () => {
  const fecha = fechaChile();
  const index = new Date(`${fecha}T12:00:00Z`).getDate() % CAHUINES.length;
  return CahuinDiario.findOneAndUpdate(
    { fecha },
    { $setOnInsert: { fecha, texto: CAHUINES[index] } },
    { upsert: true, new: true }
  );
};

const eventosFallbackPorRegion = (region) => {
  const regionNorm = normalizarRegionChile(region || '');
  return eventosOficiales
    .filter((evento) => mismaRegion(evento.region, regionNorm))
    .filter((evento) => new Date(evento.fecha) >= inicioDeHoy())
    .map((evento, index) => ({
      ...evento,
      _id: `fallback-${normalizarTexto(regionNorm)}-${index}`,
      categoria: evento.categoria || 'Evento Oficial',
      esOficial: true,
      activo: true,
      maxPersonas: 9999,
      participantes: [],
      imagen: evento.imagen || '',
    }));
};

const asegurarEventosOficialesRegion = async (region) => {
  const existentes = await Panorama.find({
    esOficial: true,
    region: { $regex: regexRegion(region), $options: 'i' },
    fecha: { $gte: inicioDeHoy() },
  }).limit(1);

  if (existentes.length > 0) return;

  const eventos = eventosFallbackPorRegion(region).map((evento) => ({
    titulo: evento.titulo,
    descripcion: evento.descripcion,
    lugar: evento.lugar,
    direccion: evento.direccion || evento.lugar,
    region: normalizarRegionChile(region),
    fecha: evento.fecha,
    categoria: evento.categoria || 'Evento Oficial',
    emoji: evento.emoji || '🎟️',
    imagen: evento.imagen || '',
    maxPersonas: 9999,
    participantes: [],
    esOficial: true,
    activo: true,
  }));

  if (eventos.length > 0) {
    await Panorama.insertMany(eventos, { ordered: false });
  }
};

const escogerReceptorBotella = async (autorId, excluirIds = []) => {
  const haceDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const candidatos = await User.find({
    _id: { $nin: [autorId, ...excluirIds] },
    cuentaPausada: { $ne: true },
    ultimaConexion: { $gte: haceDosHoras },
  }).select('_id').limit(40);

  if (candidatos.length === 0) {
    const fallback = await User.find({
      _id: { $nin: [autorId, ...excluirIds] },
      cuentaPausada: { $ne: true },
    }).select('_id').limit(40);
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)]._id;
  }

  return candidatos[Math.floor(Math.random() * candidatos.length)]._id;
};

exports.listarHistorias = async (req, res) => {
  try {
    const user = req.user;
    const region = regionUsuario(user);
    const ahora = new Date();
    const filtro = {
      expiraEn: { $gt: ahora },
      $or: [
        { region },
        { region: { $regex: normalizarTexto(region), $options: 'i' } },
        { ciudad: user.ciudad || '' },
        { ciudad: '' },
      ],
    };

    const historias = await Historia.find(filtro)
      .populate('autor', 'nombre foto ciudad region verificado')
      .populate('sumados', 'nombre foto')
      .populate('comentarios.autor', 'nombre foto')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      historias: historias.map((historia) => ({
        ...historia,
        meGusta: (historia.reacciones || []).some((id) => id.toString() === req.user._id.toString()),
      })),
    });
  } catch (error) {
    console.error('Error cargando historias:', error);
    res.status(500).json({ message: 'Error cargando historias' });
  }
};

exports.crearHistoria = async (req, res) => {
  try {
    const { texto, lugar, emoji, imagenUrl } = req.body;
    if (!texto || texto.trim().length < 4) {
      return res.status(400).json({ message: 'Escribe algo para tu historia.' });
    }

    let imagen = imagenUrl || '';
    if (req.file) {
      imagen = await subirImagenHistoria(req.file);
    }

    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + 24);

    const historia = await Historia.create({
      autor: req.user._id,
      texto: texto.trim(),
      lugar: lugar || '',
      emoji: emoji || '📸',
      imagen,
      ciudad: req.user.ciudad || '',
      region: regionUsuario(req.user),
      sumados: [],
      expiraEn,
    });
    await historia.populate('autor', 'nombre foto ciudad region verificado');
    res.status(201).json({ historia });
  } catch (error) {
    console.error('Error creando historia:', error);
    res.status(500).json({ message: 'Error creando historia' });
  }
};

exports.listarHistoriasExito = async (req, res) => {
  try {
    const admin = esAdmin(req.user);
    const { estado } = req.query;
    const filtro = admin && estado && estado !== 'publicadas'
      ? { estado }
      : { estado: 'aprobada' };

    const historias = await HistoriaExito.find(filtro)
      .populate('autor', 'nombre email foto ciudad')
      .populate('revisadoPor', 'nombre email')
      .sort({ createdAt: -1 })
      .limit(admin ? 80 : 20)
      .lean();

    res.json({ historias, esAdmin: admin });
  } catch (error) {
    console.error('Error cargando historias de exito:', error);
    res.status(500).json({ message: 'Error cargando historias de exito' });
  }
};

exports.crearHistoriaExito = async (req, res) => {
  try {
    const { nombres, ciudad, historia, contacto } = req.body;
    if (!nombres || nombres.trim().length < 3) {
      return res.status(400).json({ message: 'Agrega los nombres de la pareja.' });
    }
    if (!historia || historia.trim().length < 30) {
      return res.status(400).json({ message: 'Cuenta una historia un poco mas completa.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Agrega una foto donde salgan ambos.' });
    }

    const imagen = await subirImagenHistoria(req.file);
    const nueva = await HistoriaExito.create({
      autor: req.user._id,
      nombres: nombres.trim(),
      ciudad: ciudad || '',
      historia: historia.trim(),
      contacto: contacto || '',
      imagen,
      estado: 'pendiente',
    });
    await nueva.populate('autor', 'nombre email foto ciudad');
    res.status(201).json({
      historia: nueva,
      message: 'Historia enviada. La cuenta oficial la revisara antes de publicarla.',
    });
  } catch (error) {
    console.error('Error creando historia de exito:', error);
    res.status(500).json({ message: 'Error enviando historia de exito' });
  }
};

exports.revisarHistoriaExito = async (req, res) => {
  try {
    if (!assertAdmin(req, res)) return;
    const { accion, motivo } = req.body;
    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ message: 'Accion invalida.' });
    }
    if (accion === 'rechazar' && (!motivo || motivo.trim().length < 5)) {
      return res.status(400).json({ message: 'Explica por que se rechaza la historia.' });
    }

    const historia = await HistoriaExito.findByIdAndUpdate(
      req.params.id,
      {
        estado: accion === 'aprobar' ? 'aprobada' : 'rechazada',
        motivoRechazo: accion === 'rechazar' ? motivo.trim() : '',
        revisadoPor: req.user._id,
        revisadoEn: new Date(),
      },
      { new: true }
    )
      .populate('autor', 'nombre email foto ciudad')
      .populate('revisadoPor', 'nombre email');

    if (!historia) return res.status(404).json({ message: 'Historia no encontrada.' });
    res.json({
      historia,
      message: accion === 'aprobar'
        ? 'Historia publicada.'
        : 'Historia rechazada con motivo guardado.',
    });
  } catch (error) {
    console.error('Error revisando historia de exito:', error);
    res.status(500).json({ message: 'Error revisando historia' });
  }
};

exports.reaccionarHistoria = async (req, res) => {
  try {
    const historia = await Historia.findById(req.params.id);
    if (!historia) return res.status(404).json({ message: 'Historia no encontrada' });

    const yaReacciono = historia.reacciones.some((id) => id.toString() === req.user._id.toString());
    if (yaReacciono) {
      historia.reacciones = historia.reacciones.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      historia.reacciones.push(req.user._id);
    }
    await historia.save();
    res.json({ historia, meGusta: !yaReacciono });
  } catch (error) {
    res.status(500).json({ message: 'Error reaccionando' });
  }
};

exports.comentarHistoria = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length < 2) return res.status(400).json({ message: 'Escribe un comentario.' });

    const historia = await Historia.findById(req.params.id);
    if (!historia) return res.status(404).json({ message: 'Historia no encontrada' });

    historia.comentarios.push({ autor: req.user._id, texto: texto.trim() });
    await historia.save();
    await historia.populate('comentarios.autor', 'nombre foto');
    res.json({ historia });
  } catch (error) {
    res.status(500).json({ message: 'Error comentando' });
  }
};

exports.sumarseHistoria = async (req, res) => {
  try {
    const historia = await Historia.findById(req.params.id);
    if (!historia) return res.status(404).json({ message: 'Historia no encontrada' });
    if (!historia.sumados.some((id) => id.toString() === req.user._id.toString())) {
      historia.sumados.push(req.user._id);
      await historia.save();
    }
    await historia.populate('autor', 'nombre foto ciudad region verificado');
    await historia.populate('sumados', 'nombre foto');
    res.json({ historia, message: 'Te sumaste al panorama.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sumandote' });
  }
};

exports.getCahuinDiario = async (req, res) => {
  try {
    const cahuin = await getOrCreateCahuin();
    const votosDeAcuerdo = cahuin.votos.filter((v) => v.opcion === 'de_acuerdo').length;
    const votosNiCagando = cahuin.votos.filter((v) => v.opcion === 'ni_cagando').length;
    const miVoto = cahuin.votos.find((v) => v.usuario.toString() === req.user._id.toString())?.opcion || null;
    res.json({ cahuin, stats: { de_acuerdo: votosDeAcuerdo, ni_cagando: votosNiCagando }, miVoto });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando Cahuín del Día' });
  }
};

exports.votarCahuinDiario = async (req, res) => {
  try {
    const { opcion } = req.body;
    if (!['de_acuerdo', 'ni_cagando'].includes(opcion)) return res.status(400).json({ message: 'Voto inválido' });
    const cahuin = await getOrCreateCahuin();
    cahuin.votos = cahuin.votos.filter((v) => v.usuario.toString() !== req.user._id.toString());
    cahuin.votos.push({ usuario: req.user._id, opcion });
    await cahuin.save();
    const votosDeAcuerdo = cahuin.votos.filter((v) => v.opcion === 'de_acuerdo').length;
    const votosNiCagando = cahuin.votos.filter((v) => v.opcion === 'ni_cagando').length;
    res.json({ cahuin, stats: { de_acuerdo: votosDeAcuerdo, ni_cagando: votosNiCagando }, miVoto: opcion });
  } catch (error) {
    res.status(500).json({ message: 'Error votando' });
  }
};

exports.getSwipePanoramas = async (req, res) => {
  try {
    const region = regionUsuario(req.user);
    await asegurarEventosOficialesRegion(region);

    const vistos = await PanoramaSwipe.find({ usuario: req.user._id }).distinct('panorama');
    const panoramas = await Panorama.find({
      _id: { $nin: vistos },
      esOficial: true,
      $or: [
        { fecha: { $gte: inicioDeHoy() } },
        { fechaFin: { $gte: inicioDeHoy() } }
      ],
      region: { $regex: regexRegion(region), $options: 'i' },
    }).sort({ fecha: 1 }).limit(200);

    res.json({ region, panoramas });
  } catch (error) {
    console.error('Error cargando swipe panoramas:', error);
    res.status(500).json({ message: 'Error cargando swipe de panoramas' });
  }
};

exports.votarPanorama = async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['like', 'pass'].includes(decision)) return res.status(400).json({ message: 'Decision invalida' });
    const panorama = await Panorama.findById(req.params.id);
    if (!panorama) return res.status(404).json({ message: 'Panorama no encontrado' });

    await PanoramaSwipe.findOneAndUpdate(
      { usuario: req.user._id, panorama: panorama._id },
      { $set: { decision, region: panorama.region } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (decision !== 'like') return res.json({ match: false, panorama });

    const otroLike = await PanoramaSwipe.findOne({
      usuario: { $ne: req.user._id },
      panorama: panorama._id,
      decision: 'like',
    }).sort({ createdAt: -1 });

    if (!otroLike) {
      return res.json({ match: false, panorama, message: 'Guardado. Si alguien de tu región también quiere ir, puede nacer match.' });
    }

    let match = await Match.findOne({
      $or: [
        { remitente: req.user._id, receptor: otroLike.usuario },
        { remitente: otroLike.usuario, receptor: req.user._id },
      ],
      tipo: { $in: ['like', 'superlike', 'relampago'] },
    });

    if (!match) {
      match = await Match.create({ remitente: req.user._id, receptor: otroLike.usuario, tipo: 'relampago' });
      await Mensaje.create({
        matchId: match._id,
        remitente: req.user._id,
        texto: `Ambos quieren ir a este panorama: ${panorama.titulo} en ${panorama.lugar}. ¿Vamos juntos?`,
      });
    }

    res.json({ match: true, panorama, matchId: match._id, message: 'Match por destino. Ambos quieren ir a este panorama.' });
  } catch (error) {
    res.status(500).json({ message: 'Error votando panorama' });
  }
};

exports.getMapaCalor = async (req, res) => {
  try {
    const region = regionUsuario(req.user) || 'default';
    const zonasBase = HEAT_ZONES[region] || HEAT_ZONES.default;
    const conectados = await User.countDocuments({
      region,
      ultimaConexion: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    });
    const zonas = zonasBase.map((nombre, index) => ({
      nombre,
      intensidad: Math.min(100, Math.max(22, conectados * 9 + (zonasBase.length - index) * 12)),
      personas: Math.max(3, Math.round(conectados / 2) + index + 2),
      vibe: ['after office', 'cafecito', 'previa', 'paseo', 'universidad'][index % 5],
    }));
    res.json({ region, ciudad: req.user.ciudad, zonas });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando mapa de calor' });
  }
};

exports.crearBotella = async (req, res) => {
  try {
    const { texto, audio } = req.body;
    if (!texto || texto.trim().length < 8) {
      return res.status(400).json({ message: 'Escribe una botella con un poco más de corazón.' });
    }

    const receptor = await escogerReceptorBotella(req.user._id);
    const expiraEn = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const botella = await Botella.create({
      autor: req.user._id,
      receptorActual: receptor,
      texto: texto.trim(),
      audio: audio || '',
      regionOrigen: regionUsuario(req.user),
      expiraEn,
      historial: receptor ? [{ usuario: receptor, accion: 'recibida' }] : [],
    });
    await botella.populate('autor', 'nombre foto ciudad region');
    await botella.populate('receptorActual', 'nombre foto ciudad region');
    res.status(201).json({ botella, message: 'Tu botella salio a flotar por Chile.' });
  } catch (error) {
    console.error('Error creando botella:', error);
    res.status(500).json({ message: 'Error lanzando botella' });
  }
};

exports.getBotellaActual = async (req, res) => {
  try {
    const botella = await Botella.findOne({
      receptorActual: req.user._id,
      estado: { $in: ['flotando', 'leida', 'respondida'] },
      expiraEn: { $gt: new Date() },
    })
      .populate('autor', 'nombre foto ciudad region')
      .populate('respuestas.usuario', 'nombre foto')
      .sort({ updatedAt: -1 });

    if (botella && botella.estado === 'flotando') {
      botella.estado = 'leida';
      await botella.save();
    }
    res.json({ botella });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando botella' });
  }
};

exports.responderBotella = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length < 2) return res.status(400).json({ message: 'Escribe una respuesta.' });
    const botella = await Botella.findById(req.params.id);
    if (!botella) return res.status(404).json({ message: 'Botella no encontrada' });
    if (botella.receptorActual?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Esta botella no esta contigo ahora.' });
    }

    botella.estado = 'respondida';
    botella.respuestas.push({ usuario: req.user._id, texto: texto.trim() });
    botella.historial.push({ usuario: req.user._id, accion: 'respondida' });
    await botella.save();
    await botella.populate('autor', 'nombre foto ciudad region');
    await botella.populate('respuestas.usuario', 'nombre foto');
    res.json({ botella, message: 'Respuesta enviada. Si ambos quieren, puede nacer cahuín.' });
  } catch (error) {
    res.status(500).json({ message: 'Error respondiendo botella' });
  }
};

exports.soltarBotella = async (req, res) => {
  try {
    const botella = await Botella.findById(req.params.id);
    if (!botella) return res.status(404).json({ message: 'Botella no encontrada' });
    if (botella.receptorActual?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Esta botella no esta contigo ahora.' });
    }

    const visitados = (botella.historial || []).map((item) => item.usuario).filter(Boolean);
    const nuevoReceptor = await escogerReceptorBotella(botella.autor, visitados);
    botella.receptorActual = nuevoReceptor;
    botella.estado = 'flotando';
    if (nuevoReceptor) botella.historial.push({ usuario: nuevoReceptor, accion: 'recibida' });
    await botella.save();
    res.json({ message: nuevoReceptor ? 'La botella sigue flotando.' : 'No encontramos a quién mandarla por ahora.', botella });
  } catch (error) {
    res.status(500).json({ message: 'Error soltando botella' });
  }
};

exports.getAlertas = async (req, res) => {
  try {
    const usuario = req.user;
    const fecha = fechaChile();
    
    // 1. Cahuin Pendiente
    const cahuinHoy = await CahuinDiario.findOne({ fecha });
    let cahuinPendiente = false;
    if (cahuinHoy) {
      cahuinPendiente = !cahuinHoy.votos.some(v => v.usuario.toString() === usuario._id.toString());
    }

    // 2. Historias Pendientes
    const ahora = new Date();
    const region = regionUsuario(usuario);
    const filtroHistoria = {
      expiraEn: { $gt: ahora },
      autor: { $ne: usuario._id },
      $or: [
        { region },
        { region: { $regex: normalizarTexto(region), $options: 'i' } },
        { ciudad: usuario.ciudad || '' },
        { ciudad: '' },
      ],
    };
    const historiasPendientes = (await Historia.countDocuments(filtroHistoria)) > 0;

    res.json({ cahuin: cahuinPendiente, historias: historiasPendientes });
  } catch (error) {
    console.error('Error alertas:', error);
    res.status(500).json({ message: 'Error obteniendo alertas' });
  }
};
