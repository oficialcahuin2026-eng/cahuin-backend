const Match = require('../models/Match');
const User  = require('../models/User');
const Mensaje = require('../models/Mensaje');

const actualizarRachaSwipes = async (usuarioId) => {
  const usuario = await User.findById(usuarioId);
  if (!usuario) return null;

  const hoy = new Date();
  const diaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const ultima = usuario.ultimoSwipeRachaFecha ? new Date(usuario.ultimoSwipeRachaFecha) : null;
  const diaUltima = ultima ? new Date(ultima.getFullYear(), ultima.getMonth(), ultima.getDate()) : null;
  const diffDias = diaUltima ? Math.floor((diaHoy - diaUltima) / (1000 * 60 * 60 * 24)) : null;

  if (diffDias === 0) return usuario;

  if (diffDias === 1) {
    usuario.rachaSwipesDias = (usuario.rachaSwipesDias || 0) + 1;
  } else {
    usuario.rachaSwipesDias = 1;
  }

  usuario.ultimoSwipeRachaFecha = hoy;
  usuario.swipesHoy = (usuario.swipesHoy || 0) + 1;

  if (usuario.rachaSwipesDias > 0 && usuario.rachaSwipesDias % 7 === 0) {
    usuario.boostGratisDisponibles = (usuario.boostGratisDisponibles || 0) + 1;
  }

  await usuario.save();
  return usuario;
};

const calcularRachaConversacion = async (matchId) => {
  const mensajes = await Mensaje.find({ matchId }).sort({ createdAt: -1 }).limit(120).select('createdAt');
  const dias = new Set(mensajes.map((m) => new Date(m.createdAt).toDateString()));
  let racha = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i += 1) {
    if (!dias.has(cursor.toDateString())) break;
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return racha;
};

// ─────────────────────────────────────────────
// DAR LIKE
// ─────────────────────────────────────────────
exports.darLike = async (req, res) => {
  try {
    const receptorId  = req.params.id;
    const remitenteId = req.user._id;

    if (!req.user.isPremium) {
      const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0);
      const likesHoy = await Match.countDocuments({
        remitente: remitenteId, tipo: 'like', createdAt: { $gte: inicioHoy }
      });
      if (likesHoy >= 5) return res.status(403).json({ message: '¡Límite de likes diarios! Hazte Premium.' });
    }

    await Match.findOneAndUpdate(
      { remitente: remitenteId, receptor: receptorId },
      { $set: { tipo: 'like' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const usuarioActualizado = await actualizarRachaSwipes(remitenteId);
    await User.findByIdAndUpdate(receptorId, { $inc: { likesRecibidos: 1 } });

    const hayLikeDeVuelta = await Match.findOne({
      remitente: receptorId, receptor: remitenteId, tipo: { $in: ['like', 'superlike'] }
    });
    if (hayLikeDeVuelta) return res.json({ esMatch: true, message: '¡Match!' });
    res.json({ message: 'Like enviado', usuario: usuarioActualizado });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

// ─────────────────────────────────────────────
// DAR SUPER LIKE
// ─────────────────────────────────────────────
exports.darSuperLike = async (req, res) => {
  try {
    await Match.findOneAndUpdate(
      { remitente: req.user._id, receptor: req.params.id },
      { $set: { tipo: 'superlike' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const usuarioActualizado = await actualizarRachaSwipes(req.user._id);
    await User.findByIdAndUpdate(req.params.id, { $inc: { likesRecibidos: 3 } });
    const hayLikeDeVuelta = await Match.findOne({
      remitente: req.params.id, receptor: req.user._id, tipo: { $in: ['like', 'superlike'] }
    });
    if (hayLikeDeVuelta) return res.json({ esMatch: true, message: '¡Match por Súper Like!' });
    res.json({ message: 'Súper Like enviado' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

// ─────────────────────────────────────────────
// PASAR (DISLIKE)
// ─────────────────────────────────────────────
exports.pasar = async (req, res) => {
  try {
    await Match.create({ remitente: req.user._id, receptor: req.params.id, tipo: 'dislike' });
    const usuarioActualizado = await actualizarRachaSwipes(req.user._id);
    res.json({ message: 'Pasaste', usuario: usuarioActualizado });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

// ─────────────────────────────────────────────
// LIKE O DISLIKE (body: { accion, id })
// ─────────────────────────────────────────────
exports.darLikeODislike = async (req, res) => {
  const { accion, id } = req.body;
  if (accion === 'like') return exports.darLike({ params: { id }, user: req.user }, res);
  return exports.pasar({ params: { id }, user: req.user }, res);
};

// ─────────────────────────────────────────────
// LISTAR MIS MATCHES
// ─────────────────────────────────────────────
exports.listarMisMatches = async (req, res) => {
  try {
    const miId = String(req.user._id);
    const miUsuario = await User.findById(miId);

    const misLikesDocs = await Match.find({
      remitente: miId, tipo: { $in: ['like', 'superlike', 'relampago'] }
    });
    const misLikesIds = misLikesDocs.map(m => String(m.receptor));

    const meDieronLikeDocs = await Match.find({
      remitente: { $in: misLikesIds }, receptor: miId, tipo: { $in: ['like', 'superlike'] }
    }).populate('remitente', 'nombre foto fotos ciudad region edad verificado fechasDisponibles intereses descripcion ultimaConexion');

    const relampagos = await Match.find({
      tipo: 'relampago',
      $or: [{ remitente: miId }, { receptor: miId }]
    })
      .populate('remitente', 'nombre foto fotos ciudad region edad verificado fechasDisponibles intereses descripcion ultimaConexion')
      .populate('receptor',  'nombre foto fotos ciudad region edad verificado fechasDisponibles intereses descripcion ultimaConexion');

    const matchesNormales = await Promise.all(meDieronLikeDocs.map(async (m) => {
      const miLikeHaciaEl = misLikesDocs.find(l => String(l.receptor) === String(m.remitente._id));
      const roomId      = (miLikeHaciaEl.createdAt < m.createdAt) ? miLikeHaciaEl._id : m._id;
      const salaMatch   = await Match.findById(roomId);

      const misRespuestas = String(salaMatch.remitente) === miId
        ? salaMatch.respuestasRemitente : salaMatch.respuestasReceptor;
      const susRespuestas = String(salaMatch.remitente) === miId
        ? salaMatch.respuestasReceptor  : salaMatch.respuestasRemitente;

      const rachaConversacion = await calcularRachaConversacion(roomId);
      const noLeidos = await Mensaje.countDocuments({
        matchId: roomId,
        remitente: { $ne: miId },
        leido: { $ne: true },
      });

      const misIntereses = miUsuario.intereses || [];
      const susIntereses = m.remitente.intereses || [];
      const comunes = misIntereses.filter(i => susIntereses.includes(i));
      const compatibilidadReal = Math.min(99, 60 + (comunes.length * 8));

      return {
        roomId,
        usuario:        m.remitente,
        fecha:          m.createdAt,
        yaRespondi:     misRespuestas.length > 0,
        elYaRespondio:  susRespuestas.length > 0,
        compatibilidad: compatibilidadReal,
        interesesComunes: comunes,
        rachaConversacion,
        noLeidos,
        esRelampago:    false,
        esRuletaCiega:  false,
      };
    }));

    const matchesRelampago = relampagos.map(r => {
      const otroUsuario = String(r.remitente._id) === miId ? r.receptor : r.remitente;
      const esRuleta    = r.esRuletaCiega === true;

      const yoRevelé   = String(r.remitente._id) === miId ? r.revelóRemitente  : r.revelóReceptor;
      const elReveló   = String(r.remitente._id) === miId ? r.revelóReceptor   : r.revelóRemitente;
      const ambosRevelaron = yoRevelé && elReveló;

      const usuarioFinal = esRuleta && !ambosRevelaron
        ? {
            _id:    otroUsuario._id,
            nombre: '???',
            foto:   null,
            fotos:  [],
            ciudad: otroUsuario.ciudad, 
            edad:   otroUsuario.edad,
          }
        : otroUsuario;

      return {
        roomId:         r._id,
        usuario:        usuarioFinal,
        fecha:          r.createdAt,
        yaRespondi:     true,
        elYaRespondio:  true,
        compatibilidad: esRuleta ? null : 99,
        rachaConversacion: 0,
        noLeidos:       0,
        esRelampago:    !esRuleta,
        esRuletaCiega:  esRuleta,
        salvado:        r.salvado,
        expiraEn:       r.expiraEn,
        yoRevelé,
        elReveló,
        ambosRevelaron,
      };
    });

    res.json({ matches: [...matchesNormales, ...matchesRelampago] });
  } catch (error) {
    console.error('Error listarMisMatches:', error);
    res.status(500).json({ message: 'Error cargando matches' });
  }
};

// ─────────────────────────────────────────────
// ELIMINAR MATCH
// ─────────────────────────────────────────────
exports.eliminar = async (req, res) => {
  try {
    await Match.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch (error) { res.status(500).json({ message: 'Error' }); }
};

// ─────────────────────────────────────────────
// ROMPEHIELO
// ─────────────────────────────────────────────
exports.responderRompehielo = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match no encontrado' });

    const miId        = String(req.user._id);
    const remitenteId = String(match.remitente);

    if (remitenteId === miId) {
      match.respuestasRemitente = req.body.respuestas;
    } else {
      match.respuestasReceptor = req.body.respuestas;
    }

    await match.save();
    res.json({ message: 'Respuestas guardadas' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ─────────────────────────────────────────────
// MATCH RELÁMPAGO — generar
// ─────────────────────────────────────────────
exports.generarRelampago = async (req, res) => {
  try {
    const miUsuario  = await User.findById(req.user._id);
    const candidatos = await User.find({
      region: miUsuario.region,
      _id:    { $ne: miUsuario._id }
    }).limit(50);

    if (candidatos.length === 0)
      return res.status(404).json({ message: 'No hay candidatos en tu región.' });

    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

    const expira = new Date();
    expira.setHours(expira.getHours() + 24);

    await Match.create({
      remitente:   miUsuario._id,
      receptor:    elegido._id,
      tipo:        'relampago',
      esRelampago: true,
      expiraEn:    expira,
    });

    res.json({ message: '¡Match Relámpago generado! Tienes 24 horas. ⚡' });
  } catch (error) { res.status(500).json({ message: 'Error generando relámpago' }); }
};

// ─────────────────────────────────────────────
// MATCH RELÁMPAGO — salvar (cuesta 100 Cahuines)
// ─────────────────────────────────────────────
exports.salvarRelampago = async (req, res) => {
  try {
    const match   = await Match.findById(req.params.id);
    const usuario = await User.findById(req.user._id);

    if (usuario.cahuines < 100)
      return res.status(400).json({ message: 'No tienes suficientes Cahuines (cuesta 100 🪙)' });

    usuario.cahuines -= 100;
    await usuario.save();

    match.salvado = true;
    await match.save();

    res.json({ message: '¡Match salvado! Ahora es para siempre. 💾' });
  } catch (error) { res.status(500).json({ message: 'Error al salvar' }); }
};

// ─────────────────────────────────────────────
// DESHACER ÚLTIMO DISLIKE (cuesta 50 Cahuines)
// ─────────────────────────────────────────────
exports.deshacerUltimoDislike = async (req, res) => {
  try {
    const miUsuario = await User.findById(req.user._id);

    if (miUsuario.cahuines < 50)
      return res.status(400).json({ message: 'No tienes suficientes Cahuines (cuesta 50)' });

    const ultimoDislike = await Match.findOne({
      remitente: req.user._id, tipo: 'dislike'
    }).sort({ createdAt: -1 });

    if (!ultimoDislike)
      return res.status(404).json({ message: 'No tienes perfiles recientes para deshacer.' });

    miUsuario.cahuines -= 50;
    await miUsuario.save();

    await Match.findByIdAndDelete(ultimoDislike._id);

    const perfilRecuperado = await User.findById(ultimoDislike.receptor).select('-password');

    res.json({ message: '¡Reencuentro activado! ⏪', perfil: perfilRecuperado, usuario: miUsuario });
  } catch (error) { res.status(500).json({ message: 'Error deshaciendo dislike' }); }
};

// ─────────────────────────────────────────────
// ✅ RULETA CIEGA: AHORA CON PROTECCIÓN ANTI-SOLEDAD
// ─────────────────────────────────────────────
exports.jugarRuletaCiega = async (req, res) => {
  try {
    const miUsuario = await User.findById(req.user._id);

    if (miUsuario.cahuines < 500)
      return res.status(400).json({ message: 'No tienes 500 Cahuines 🪙' });

    // Busca candidatos PRIMERO
    const candidatos = await User.find({
      region: miUsuario.region,
      _id:    { $ne: miUsuario._id, $nin: miUsuario.bloqueados || [] }
    });

    if (candidatos.length === 0) {
      // 🌟 FIX: Si estás solo en la base de datos, te avisa y NO TE COBRA.
      return res.status(404).json({ message: 'Por el momento no hay ningún Cahuín disponible. 🏜️ (No se te cobró nada)' });
    }

    // Si hay alguien, lo elegimos
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];

    // 🌟 AHORA SÍ COBRAMOS LOS 500 CAHUINES
    miUsuario.cahuines -= 500;
    await miUsuario.save();

    const expira = new Date();
    expira.setHours(expira.getHours() + 1);

    const match = await Match.create({
      remitente:      miUsuario._id,
      receptor:       elegido._id,
      tipo:           'relampago',   
      esRelampago:    true,
      esRuletaCiega:  true,          
      expiraEn:       expira,
      revelóRemitente: false,        
      revelóReceptor:  false,        
    });

    res.json({ message: '¡Ruleta girada! Tienes 1 hora de chat anónimo. 🎰', match });
  } catch (e) {
    res.status(500).json({ message: 'Error en la ruleta' });
  }
};

// ─────────────────────────────────────────────
// REVELARSE EN RULETA CIEGA
// ─────────────────────────────────────────────
exports.revelarseEnRuleta = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match || !match.esRuletaCiega)
      return res.status(404).json({ message: 'Ruleta no encontrada' });

    const miId = String(req.user._id);

    if (String(match.remitente) === miId) {
      match.revelóRemitente = true;
    } else {
      match.revelóReceptor = true;
    }

    await match.save();

    const ambosRevelaron = match.revelóRemitente && match.revelóReceptor;

    res.json({
      message: ambosRevelaron
        ? '¡Los dos se revelaron! Ahora pueden verse. 🎉'
        : 'Te revelaste. Esperando que el otro también lo haga... ⏳',
      ambosRevelaron,
    });
  } catch (e) {
    res.status(500).json({ message: 'Error al revelarse' });
  }
};
