const User = require('../models/User');
const Match = require('../models/Match');
const Reporte = require('../models/Reporte');
const PreguntaAnonima = require('../models/PreguntaAnonima');
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');
const {
  inferirRegionPorCiudad,
  normalizarCiudadChile,
  normalizarRegionChile,
} = require('../utils/chileLocations');
const { CATEGORIAS_EXPLORAR } = require('../utils/explorarCategorias');

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 18;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad;
};

const obtenerEdadValida = (fechaNacimiento, edad) => {
  const edadPorFecha = calcularEdad(fechaNacimiento);
  const edadFinal = edadPorFecha ?? Number(edad || 0);
  if (!Number.isFinite(edadFinal) || edadFinal < 18) return null;
  return edadFinal;
};

const subirFotoPerfil = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'cahuin_perfiles',
      resource_type: 'image',
      transformation: [{ width: 800, height: 1000, crop: 'limit' }],
    },
    (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    }
  );

  Readable.from(file.buffer).pipe(stream);
});

exports.getMiPerfil = async (req, res) => {
  try {
    let usuario = await User.findById(req.user._id).select('-password');
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const hoy = new Date();
    const ultima = usuario.ultimaConexion || new Date();

    if (usuario.fechaNacimiento) {
      usuario.edad = calcularEdad(usuario.fechaNacimiento);
      const nac = new Date(usuario.fechaNacimiento);
      if (nac.getMonth() === hoy.getMonth() && nac.getDate() === hoy.getDate()) {
        if (usuario.ultimoCumpleCeleb !== hoy.getFullYear()) {
          const premiumExpira = new Date();
          premiumExpira.setHours(premiumExpira.getHours() + 24);
          usuario.premiumHasta = premiumExpira;
          usuario.isPremium = true;
          usuario.ultimoCumpleCeleb = hoy.getFullYear();
        }
      }
    }

    if (usuario.premiumHasta && usuario.premiumHasta < hoy) {
      usuario.isPremium = false;
      usuario.premiumPlan = 'free';
      usuario.premiumHasta = null;
    }

    if (usuario.isPremium) {
      const ultimaEntrega = usuario.ultimaEntregaPremium ? new Date(usuario.ultimaEntregaPremium) : new Date(0);
      const diffTiempoPrem = hoy.getTime() - ultimaEntrega.getTime();
      const diffDiasPrem = Math.floor(diffTiempoPrem / (1000 * 60 * 60 * 24));

      if (diffDiasPrem >= 7) {
        usuario.cahuines += 5000;
        usuario.ultimaEntregaPremium = hoy;
      }
    }

    const diaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const diaUltima = new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate());
    const diffTiempo = diaHoy.getTime() - diaUltima.getTime();
    const diffDias = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));

    if (diffDias === 1) {
      usuario.rachaDias += 1;
      usuario.cahuines += usuario.rachaDias % 7 === 0 ? 100 : Math.min(usuario.rachaDias, 6) * 10;
      if (usuario.rachaDias % 7 === 0) {
        const boost = new Date();
        boost.setMinutes(boost.getMinutes() + 30);
        usuario.boostActivoHasta = boost;
      }
    } else if (diffDias > 1) {
      usuario.rachaDias = 1;
      usuario.cahuines += 10;
    }

    const hoyFechaStr = hoy.toDateString();
    const ultimoSwipeStr = new Date(usuario.ultimoSwipeFecha).toDateString();
    if (hoyFechaStr !== ultimoSwipeStr) {
      usuario.swipesHoy = 0;
    }

    usuario.ultimaConexion = hoy;
    await usuario.save();

    res.json({ usuario });
  } catch (error) { res.status(500).json({ message: 'Error en perfil' }); }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    if (req.body.fechaNacimiento) {
      req.body.edad = calcularEdad(req.body.fechaNacimiento);
    }
    if (req.body.fechaNacimiento && req.body.edad < 18) {
      return res.status(400).json({ message: 'Cahuín es solo para mayores de 18 años.' });
    }
    if (!req.body.fechaNacimiento && req.body.edad !== undefined && Number(req.body.edad) < 18) {
      return res.status(400).json({ message: 'Cahuín es solo para mayores de 18 años.' });
    }
    if (req.body.ciudad) {
      req.body.ciudad = normalizarCiudadChile(req.body.ciudad);
    }
    if (req.body.region) {
      req.body.region = normalizarRegionChile(req.body.region);
    }
    if (req.body.ciudad && (!req.body.region || req.body.region === 'Por definir')) {
      const regionInferida = inferirRegionPorCiudad(req.body.ciudad);
      if (regionInferida) req.body.region = regionInferida;
    }

    const usuario = await User.findByIdAndUpdate(
      req.user._id, 
      { $set: req.body }, 
      { new: true, runValidators: true, upsert: true } // 🌟 BLINDAJE: Si no existe, lo crea
    ).select('-password');

    res.json({ usuario });
  } catch (error) { res.status(500).json({ message: 'Error actualizando' }); }
};

exports.actualizar = exports.actualizarPerfil;

exports.verificarPerfil = async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(req.user._id, { verificado: true }, { new: true }).select('-password');
    res.json({ usuario, message: 'Perfil verificado con éxito' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.descubrir = async (req, res) => {
  try {
    const { categoria } = req.query;
    const miUsuario = await User.findById(req.user._id);
    if (miUsuario.modoRecuperacion && miUsuario.swipesHoy >= 10) return res.json({ perfiles: [], mensaje: 'Alcanzaste tu limite consciente de hoy.' });
    const ignorarIds = [miUsuario._id, ...(miUsuario.bloqueados || [])];

    const ciudadBusqueda = miUsuario.ciudad && miUsuario.ciudad !== 'Por definir' ? miUsuario.ciudad : '';
    let regionBusqueda = miUsuario.region && miUsuario.region !== 'Por definir' ? miUsuario.region : inferirRegionPorCiudad(ciudadBusqueda);
    if (miUsuario.viaje && miUsuario.viaje.ciudadDestino && new Date() < new Date(miUsuario.viaje.fechaFin)) {
      regionBusqueda = miUsuario.viaje.ciudadDestino;
    }
    const terminosUbicacion = [...new Set([ciudadBusqueda, regionBusqueda].filter(Boolean))];

    let query = {
      _id: { $nin: ignorarIds },
      cuentaPausada: { $ne: true },
    };

    if (terminosUbicacion.length > 0) {
      query.$or = [
        { region: { $in: terminosUbicacion } },
        { ciudad: { $in: terminosUbicacion } },
        { 'viaje.ciudadDestino': { $in: terminosUbicacion }, 'viaje.fechaInicio': { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      ];
    }

    if (miUsuario.preferencia === 'Hombres') {
      query.genero = 'Hombre';
    } else if (miUsuario.preferencia === 'Mujeres') {
      query.genero = 'Mujer';
    }

    if (miUsuario.tipoApego === 'Evitativo') query.tipoApego = { $ne: 'Evitativo' };

    if (categoria && CATEGORIAS_EXPLORAR[categoria]) {
      const config = CATEGORIAS_EXPLORAR[categoria];
      const condicionesCategoria = [{ categoriasExplorar: categoria }];
      if (config.queBuscas?.length) condicionesCategoria.push({ queBuscas: { $in: config.queBuscas } });
      if (config.intereses?.length) condicionesCategoria.push({ intereses: { $in: config.intereses } });
      query.$and = [...(query.$and || []), { $or: condicionesCategoria }];
    }

    const usuarios = await User.find(query);

    usuarios.sort((a, b) => {
      let scoreA = 0; let scoreB = 0;
      if (a.boostActivoHasta && a.boostActivoHasta > new Date()) scoreA += 100;
      if (b.boostActivoHasta && b.boostActivoHasta > new Date()) scoreB += 100;
      if (a.ciudad === ciudadBusqueda) scoreA += 30;
      if (b.ciudad === ciudadBusqueda) scoreB += 30;
      if (a.queBuscas === miUsuario.queBuscas) scoreA += 40;
      if (b.queBuscas === miUsuario.queBuscas) scoreB += 40;
      if (categoria && a.categoriasExplorar?.includes(categoria)) scoreA += 50;
      if (categoria && b.categoriasExplorar?.includes(categoria)) scoreB += 50;
      if (a.tipoApego === 'Seguro') scoreA += 15;
      if (b.tipoApego === 'Seguro') scoreB += 15;
      return scoreB - scoreA;
    });

    const perfiles = [];
    const limiteDistancia = miUsuario.distanciaMax || 50;

    for (let perfil of usuarios) {
      const esVisitante = perfil.viaje && perfil.viaje.ciudadDestino && new Date() < new Date(perfil.viaje.fechaFin);
      const dist = calcularDistancia(miUsuario.latitud, miUsuario.longitud, perfil.latitud, perfil.longitud);
      const mismaRegion = regionBusqueda && perfil.region === regionBusqueda;
      const mismaCiudad = ciudadBusqueda && perfil.ciudad === ciudadBusqueda;
      const ubicacionCompatibleSinGps = dist === null && (mismaCiudad || mismaRegion);

      if (esVisitante || (dist !== null && dist <= limiteDistancia) || ubicacionCompatibleSinGps) {
        const obj = perfil.toObject();
        obj.distanciaKm = esVisitante ? 'Modo Viajero' : (dist !== null ? dist : 'Cerca');
        obj.esVisitante = esVisitante;
        perfiles.push(obj);
      }
    }
    res.json({ perfiles: perfiles.slice(0, 20) });
  } catch (error) { res.status(500).json({ message: 'Error al buscar perfiles' }); }
};

exports.getPerfil = async (req, res) => {
  try {
    const perfil = await User.findById(req.params.id).select('-password');
    const preguntas = await PreguntaAnonima.find({
      receptor: req.params.id,
      respondida: true,
      visibleEnPerfil: true,
    }).sort({ updatedAt: -1 }).limit(6).select('pregunta respuesta createdAt updatedAt');
    res.json({ perfil, preguntas });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.bloquearUsuario = async (req, res) => {
  try { await User.findByIdAndUpdate(req.user._id, { $addToSet: { bloqueados: req.params.id } }); res.json({ message: 'Bloqueado' }); } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.reportarUsuario = async (req, res) => {
  try {
    await Reporte.create({ denunciante: req.user._id, reportado: req.params.id });
    res.json({ message: 'Usuario reportado exitosamente. Lo revisaremos.' });
  } catch (error) { res.status(500).json({ message: 'Error al procesar el reporte' }); }
};

exports.actualizarFotosMult = async (req, res) => {
  try {
    let fotosMantenidas = req.body.fotosExistentes ? JSON.parse(req.body.fotosExistentes) : [];
    let nuevasFotos = req.files && req.files.length > 0 ? await Promise.all(req.files.map(subirFotoPerfil)) : [];

    // 🌟 BLINDAJE: Evita que crashee si dbUser es nulo
    let dbUser = await User.findById(req.user._id);
    
    // Si por latencia de la base de datos no lo encuentra, lo crea o simula un array vacío
    const tieneFotosActuales = dbUser && dbUser.fotos && dbUser.fotos.length > 0;

    if (fotosMantenidas.length === 0 && nuevasFotos.length === 0) {
      if (!tieneFotosActuales) {
        nuevasFotos.push('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400');
      } else {
        return res.json(dbUser);
      }
    }

    const fotosFinales = [...fotosMantenidas, ...nuevasFotos].slice(0, 6);
    
    const usuario = await User.findByIdAndUpdate(
      req.user._id, 
      { fotos: fotosFinales, foto: fotosFinales[0] || '' }, 
      { new: true, upsert: true } // Upsert salvará el día si el ID venía pero no estaba creado
    ).select('-password');

    res.json(usuario);
  } catch (error) { 
    console.error("Error en subir fotos:", error);
    res.status(500).json({ message: 'Error procesando archivos' }); 
  }
};

exports.calificarUsuario = async (req, res) => {
  try {
    const { rating } = req.body;
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'No encontrado' });
    const nuevoNum = (targetUser.numCalificaciones || 0) + 1;
    targetUser.reputacion = (((targetUser.reputacion || 5) * (targetUser.numCalificaciones || 0)) + Number(rating)) / nuevoNum;
    targetUser.numCalificaciones = nuevoNum;
    await targetUser.save();
    res.json({ message: 'Calificado' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.registrarVista = async (req, res) => {
  try {
     const { id } = req.params;
     if(id === req.user._id.toString()) return res.json({ message: 'Propio' });
     const target = await User.findById(id);
     if(!target) return res.status(404).json({ message: 'No existe' });
     const vistaReciente = target.vistasPerfil.find(v => v.espectador.toString() === req.user._id.toString() && (Date.now() - v.fecha) < 43200000);
     if(!vistaReciente) { target.vistasPerfil.push({ espectador: req.user._id }); await target.save(); }
     res.json({ message: 'Vista registrada' });
  } catch(e) { res.status(500).json({ error: e.message }) }
};

exports.getVistas = async (req, res) => {
   try {
      const miUsuario = await User.findById(req.user._id).populate('vistasPerfil.espectador', 'nombre foto edad ciudad');
      if(miUsuario && miUsuario.vistasPerfil) {
        miUsuario.vistasPerfil.sort((a,b) => b.fecha - a.fecha);
      }
      res.json({ vistas: miUsuario?.vistasPerfil || [] });
   } catch(e) { res.status(500).json({ error: e.message }) }
};

exports.getLikesRecibidos = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id).select('isPremium premiumPlan');
    const plan = usuario?.premiumPlan || (usuario?.isPremium ? 'gold' : 'free');
    const puedeRevelar = usuario?.isPremium && ['gold', 'platinum'].includes(plan);

    const likes = await Match.find({
      receptor: req.user._id,
      tipo: { $in: ['like', 'superlike'] },
    })
      .sort({ createdAt: -1 })
      .limit(24)
      .populate('remitente', 'nombre foto fotos edad ciudad region verificado ultimaConexion intereses descripcion');

    const topPicks = await User.find({
      _id: { $ne: req.user._id },
      cuentaPausada: { $ne: true },
    })
      .sort({ likesRecibidos: -1, ultimaConexion: -1 })
      .limit(12)
      .select('nombre foto fotos edad ciudad region verificado ultimaConexion intereses descripcion likesRecibidos');

    const normalizar = (item, index) => {
      const perfil = item.remitente || item;
      const foto = perfil?.foto || perfil?.fotos?.[0] || '';
      return {
        _id: perfil?._id,
        nombre: puedeRevelar ? perfil?.nombre : null,
        edad: perfil?.edad,
        ciudad: puedeRevelar ? perfil?.ciudad : null,
        foto: puedeRevelar ? foto : foto,
        verificado: perfil?.verificado,
        tipo: item.tipo || 'top_pick',
        horasRestantes: Math.max(1, 6 - index),
        activoReciente: perfil?.ultimaConexion ? (Date.now() - new Date(perfil.ultimaConexion).getTime()) < 2 * 60 * 60 * 1000 : false,
        revelado: puedeRevelar,
      };
    };

    res.json({
      plan,
      puedeRevelar,
      likes: likes.map(normalizar),
      topPicks: topPicks.map(normalizar),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando likes recibidos' });
  }
};

exports.guardarArquetipo = async (req, res) => {
  try {
    const usuario = await User.findByIdAndUpdate(req.user._id, { arquetipoCahuinero: req.body.arquetipo }, { new: true }).select('-password');
    res.json({ usuario, message: 'Arquetipo guardado' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.getTrending = async (req, res) => {
  try {
    const miUsuario = await User.findById(req.user._id);
    if(!miUsuario) return res.json({ trending: [] });
    
    const topPerfiles = await User.find({ region: miUsuario.region, _id: { $ne: miUsuario._id } })
      .sort({ likesRecibidos: -1 }).limit(10).select('nombre foto edad ciudad likesRecibidos arquetipoCahuinero');
    res.json({ trending: topPerfiles });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.togglePausaCuenta = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id);
    usuario.cuentaPausada = !usuario.cuentaPausada;
    if (!usuario.cuentaPausada) usuario.cahuines += 500;
    await usuario.save();
    res.json({ usuario, message: usuario.cuentaPausada ? 'Cuenta Pausada' : '¡Bienvenido de vuelta! Recibiste 500 Cahuines.' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.getDiarioMatch = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id);
    const notas = usuario.diarioCitas.filter(n => n.matchId.toString() === req.params.matchId);
    notas.sort((a,b) => b.fecha - a.fecha);
    res.json({ notas });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.escribirDiario = async (req, res) => {
  try {
    const { texto } = req.body;
    const usuario = await User.findById(req.user._id);
    usuario.diarioCitas.push({ matchId: req.params.matchId, texto, fecha: new Date() });
    await usuario.save();
    res.json({ message: 'Nota guardada en secreto 📖' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.getAnalyticsPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id).select('vistasPerfil fotos foto intereses likesRecibidos isPremium');
    if(!usuario) return res.json({ analytics: {} });
    
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);
    const vistasSemana = (usuario.vistasPerfil || []).filter(v => v.fecha >= desde);
    const interesesTop = (usuario.intereses || []).slice(0, 3).map((nombre, index) => ({
      nombre,
      likes: Math.max(1, Math.round((usuario.likesRecibidos || 0) / (index + 2))),
    }));

    res.json({
      analytics: {
        vistasSemana: vistasSemana.length,
        fotoTop: usuario.fotos?.[0] || usuario.foto || '',
        segundosFotoTop: Math.max(6, vistasSemana.length * 3),
        interesesTop,
        premium: usuario.isPremium,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando analytics' });
  }
};

exports.activarBoost = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id);
    if ((usuario.boostGratisDisponibles || 0) > 0) {
      const boostHasta = new Date();
      boostHasta.setMinutes(boostHasta.getMinutes() + 30);
      usuario.boostGratisDisponibles -= 1;
      usuario.boostActivoHasta = boostHasta;
      await usuario.save();

      return res.json({
        usuario,
        boostActivoHasta: boostHasta,
        message: 'Usaste tu Boost gratis de racha por 30 minutos.'
      });
    }

    if (usuario.cahuines < 500) {
      return res.status(400).json({ message: 'Necesitas 500 Cahuines para activar destacado.' });
    }

    const boostHasta = new Date();
    boostHasta.setMinutes(boostHasta.getMinutes() + 30);
    usuario.cahuines -= 500;
    usuario.boostActivoHasta = boostHasta;
    await usuario.save();

    res.json({
      usuario,
      boostActivoHasta: boostHasta,
      message: 'Modo Destacado activado por 30 minutos en tu ciudad.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error activando destacado' });
  }
};

exports.continuarRachaSwipes = async (req, res) => {
  try {
    const usuario = await User.findById(req.user._id);
    if (usuario.cahuines < 1) return res.status(400).json({ message: 'Necesitas 1 Cahuin para salvar la racha.' });

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    usuario.cahuines -= 1;
    usuario.ultimoSwipeRachaFecha = ayer;
    usuario.rachaSwipesDias = Math.max(usuario.rachaSwipesDias || 1, 1);
    await usuario.save();

    res.json({ usuario, message: 'Racha salvada. Haz un swipe hoy para continuarla.' });
  } catch (error) {
    res.status(500).json({ message: 'Error salvando racha' });
  }
};

exports.enviarPreguntaAnonima = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length < 6) {
      return res.status(400).json({ message: 'Escribe una pregunta un poquito mas completa.' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'No puedes mandarte preguntas a ti mismo.' });
    }

    const receptor = await User.findById(req.params.id).select('_id');
    if (!receptor) return res.status(404).json({ message: 'Usuario no encontrado' });

    const pregunta = await PreguntaAnonima.create({
      receptor: receptor._id,
      remitente: req.user._id,
      pregunta: texto.trim(),
    });

    res.status(201).json({ pregunta, message: 'Pregunta anonima enviada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error enviando pregunta' });
  }
};

exports.getMisPreguntasAnonimas = async (req, res) => {
  try {
    const preguntas = await PreguntaAnonima.find({ receptor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('pregunta respuesta respondida visibleEnPerfil createdAt updatedAt');
    res.json({ preguntas });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando preguntas' });
  }
};

exports.responderPreguntaAnonima = async (req, res) => {
  try {
    const { respuesta, visibleEnPerfil = true } = req.body;
    if (!respuesta || respuesta.trim().length < 2) {
      return res.status(400).json({ message: 'Escribe una respuesta antes de publicar.' });
    }

    const pregunta = await PreguntaAnonima.findOne({ _id: req.params.id, receptor: req.user._id });
    if (!pregunta) return res.status(404).json({ message: 'Pregunta no encontrada' });

    pregunta.respuesta = respuesta.trim();
    pregunta.respondida = true;
    pregunta.visibleEnPerfil = visibleEnPerfil !== false;
    await pregunta.save();

    res.json({ pregunta, message: 'Respuesta guardada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error respondiendo pregunta' });
  }
};