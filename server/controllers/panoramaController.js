const Panorama = require('../models/Panorama');
const Match = require('../models/Match');
const Mensaje = require('../models/Mensaje');
const eventosOficiales = require('../utils/seedEventos');
const { normalizarRegionChile, inferirRegionPorCiudad } = require('../utils/chileLocations');

const normalizarTexto = (valor = '') => valor
  .replace(/ÃƒÂ¡/g, 'a')
  .replace(/ÃƒÂ©/g, 'e')
  .replace(/ÃƒÂ­/g, 'i')
  .replace(/ÃƒÂ³/g, 'o')
  .replace(/ÃƒÂº/g, 'u')
  .replace(/ÃƒÂ±/g, 'n')
  .replace(/Ãƒâ€˜/g, 'n')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[â€™']/g, '')
  .toLowerCase()
  .trim();

const mismaRegion = (a = '', b = '') => normalizarTexto(normalizarRegionChile(a)) === normalizarTexto(normalizarRegionChile(b));

const inicioDeHoy = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
};

// Genera un regex tolerante a tildes para buscar regiones en la BD
const regexRegion = (region) => {
  const r = normalizarRegionChile(region) || region;
  return r
    .replace(/[aÃ¡]/gi, '[aÃ¡]')
    .replace(/[eÃ©]/gi, '[eÃ©]')
    .replace(/[iÃ­]/gi, '[iÃ­]')
    .replace(/[oÃ³]/gi, '[oÃ³]')
    .replace(/[uÃº]/gi, '[uÃº]')
    .replace(/[Ã±]/gi, '[nÃ±]');
};

const eventosFallbackPorRegion = (region) => {
  const regionFinal = normalizarRegionChile(region || '') || inferirRegionPorCiudad(region || '') || region;
  return eventosOficiales
    .filter((evento) => mismaRegion(evento.region, regionFinal))
    .filter((evento) => new Date(evento.fecha) >= inicioDeHoy())
    .map((evento, index) => ({
      ...evento,
      _id: `fallback-${normalizarTexto(regionFinal)}-${index}`,
      categoria: evento.categoria || 'Evento Oficial',
      imagen: evento.imagen || '',
      esOficial: true,
      activo: true,
      maxPersonas: 9999,
      participantes: [],
    }));
};

// ðŸŒŸ FIX CLAVE: Diccionario para conectar las ciudades con sus regiones
const DICCIONARIO_REGIONES = {
  'Arica y Parinacota': ['Arica', 'Putre', 'Camarones', 'General Lagos'],
  'TarapacÃ¡': ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara'],
  'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'San Pedro de Atacama', 'Mejillones'],
  'Atacama': ['CopiapÃ³', 'Vallenar', 'Caldera', 'ChaÃ±aral', 'Huasco'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'VicuÃ±a'],
  'ValparaÃ­so': ['ValparaÃ­so', 'ViÃ±a del Mar', 'QuilpuÃ©', 'Villa Alemana', 'San Antonio', 'OlmuÃ©', 'Limache', 'Quintero'],
  'Metropolitana': ['Santiago', 'Santiago Centro', 'Providencia', 'MaipÃº', 'Puente Alto', 'La Florida', 'Ã‘uÃ±oa', 'Melipilla'],
  'Oâ€™Higgins': ['Rancagua', 'San Fernando', 'Pichilemu', 'Santa Cruz', 'MachalÃ­', 'Mostazal', 'San Francisco de Mostazal'],
  'Maule': ['Talca', 'CuricÃ³', 'Linares', 'Cauquenes', 'ConstituciÃ³n'],
  'Ã‘uble': ['ChillÃ¡n', 'San Carlos', 'Bulnes', 'Quirihue', 'Coihueco'],
  'BÃ­o BÃ­o': ['ConcepciÃ³n', 'Talcahuano', 'Los Ãngeles', 'San Pedro de la Paz', 'Coronel'],
  'AraucanÃ­a': ['Temuco', 'Villarrica', 'PucÃ³n', 'Angol', 'Victoria', 'Padre Las Casas'],
  'Los RÃ­os': ['Valdivia', 'La UniÃ³n', 'Panguipulli', 'RÃ­o Bueno', 'Futrono'],
  'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas', 'Ancud', 'Frutillar'],
  'AysÃ©n': ['Coyhaique', 'Puerto AysÃ©n', 'Chile Chico', 'Cochrane'],
  'Magallanes': ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos']
};

exports.listar = async (req, res) => {
  try {
    const { region, categoria, pagina = 1 } = req.query;
    await Panorama.updateMany(
      {
        $or: [
          { fechaFin: { $lt: inicioDeHoy() }, activo: { $ne: false } },
          { fechaFin: { $exists: false }, fecha: { $lt: inicioDeHoy() }, activo: { $ne: false } }
        ]
      },
      { $set: { activo: false } }
    );

    const filtro = {
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        {
          $or: [
            { fecha: { $gte: inicioDeHoy() } },
            { fechaFin: { $gte: inicioDeHoy() } }
          ]
        }
      ]
    };

    const regionNormalizada = normalizarRegionChile(region || '') || inferirRegionPorCiudad(region || '');

    if (region) {
      // ðŸŒŸ BUSCADOR INTELIGENTE: Expande la bÃºsqueda a TODA la regiÃ³n
      let terminos = [new RegExp(regexRegion(region), 'i')];
      if (regionNormalizada && regionNormalizada !== region) terminos.push(new RegExp(regexRegion(regionNormalizada), 'i'));
      if (region === 'Santiago Centro') terminos.push(new RegExp('Santiago', 'i'));

      const regionBuscadaNorm = normalizarTexto(region);
      for (const [nombreReg, ciudades] of Object.entries(DICCIONARIO_REGIONES)) {
        const nombreRegNormalizado = normalizarRegionChile(nombreReg);
        // Si el usuario buscÃ³ por ciudad (ej: "Puente Alto"), agregamos la regiÃ³n ("Metropolitana")
        if (ciudades.some(c => normalizarTexto(c) === regionBuscadaNorm) || (region === 'Santiago Centro' && nombreRegNormalizado === 'Metropolitana')) {
          terminos.push(new RegExp(nombreReg, 'i'));
          if (nombreRegNormalizado !== nombreReg) terminos.push(new RegExp(nombreRegNormalizado, 'i'));
          break;
        }
        // Si el usuario buscÃ³ directo por la RegiÃ³n, agregamos todas sus ciudades
        if (normalizarTexto(nombreReg) === regionBuscadaNorm || normalizarTexto(nombreRegNormalizado) === regionBuscadaNorm) {
          terminos.push(new RegExp(nombreReg, 'i'));
          if (nombreRegNormalizado !== nombreReg) terminos.push(new RegExp(nombreRegNormalizado, 'i'));
          ciudades.forEach(c => terminos.push(new RegExp(c, 'i')));
          break;
        }
      }

      filtro.$and.push({
        $or: [
          { region: { $in: terminos } },
          { lugar: { $in: terminos } },
          { direccion: { $in: terminos } }
        ]
      });
    }

    if (categoria) {
        filtro.$and.push({ categoria: categoria });
    }

    let panoramas = await Panorama.find(filtro)
      .populate('creador', 'nombre foto region verificado')
      .sort({ fecha: 1 }); // CronolÃ³gico: Los mÃ¡s prÃ³ximos primero

    if (region && panoramas.filter((p) => p.esOficial).length === 0 && (!categoria || categoria === 'Evento Oficial')) {
      const fallback = eventosFallbackPorRegion(regionNormalizada || region);
      panoramas = [...panoramas, ...fallback];
    }

    res.json({ panoramas });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, region, lugar, direccion, fecha, categoria, emoji, maxPersonas, privacidad } = req.body;
    if (new Date(fecha) < inicioDeHoy()) {
      return res.status(400).json({ message: 'Ese panorama ya pasÃ³. Armemos uno con fecha vigente.' });
    }
    const regionFinal = normalizarRegionChile(region || req.user.region || '') || inferirRegionPorCiudad(req.user.ciudad || '') || 'Metropolitana';

    const panorama = await Panorama.create({
      titulo, descripcion, region: regionFinal, lugar, direccion, fecha: new Date(fecha),
      categoria, emoji, maxPersonas,
      privacidad: privacidad || 'PÃºblico',
      activo: true,
      creador: req.user._id, participantes: [req.user._id],
      mensajesGrupo: [{
        remitente: req.user._id,
        texto: `${req.user.nombre || 'Alguien'} creo el panorama. Ya se puede armar el grupo.`,
        tipo: 'sistema'
      }],
    });
    await panorama.populate('creador', 'nombre foto');
    res.status(201).json({ panorama });
  } catch (err) {
    console.log("Error creando panorama:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.unirse = async (req, res) => {
  try {
    const panorama = await Panorama.findById(req.params.id);
    if (!panorama) return res.status(404).json({ message: 'Panorama no encontrado' });
    if (new Date(panorama.fecha) < inicioDeHoy()) {
      panorama.activo = false;
      await panorama.save();
      return res.status(400).json({ message: 'Este panorama ya terminÃ³.' });
    }
    if (panorama.participantes.length >= panorama.maxPersonas)
      return res.status(400).json({ message: "Panorama lleno po'" });

    const yaInscrito = panorama.participantes.some(id => id.toString() === req.user._id.toString());
    const yaSolicitado = panorama.solicitudes?.some(id => id.toString() === req.user._id.toString());
    
    if (yaInscrito) {
      return res.status(400).json({ message: 'Ya estÃ¡s anotado' });
    }

    if (panorama.privacidad !== 'PÃºblico') {
      if (!yaSolicitado) {
        if (!panorama.solicitudes) panorama.solicitudes = [];
        panorama.solicitudes.push(req.user._id);
        await panorama.save();
      }
      return res.json({ message: 'Solicitud enviada al creador', panorama });
    } else {
      // PÃºblico: Se une de inmediato
      panorama.participantes.push(req.user._id);
      panorama.mensajesGrupo.push({
        remitente: req.user._id,
        texto: `${req.user.nombre || 'Alguien'} se uniÃ³ al panorama.`,
        tipo: 'sistema'
      });
      await panorama.save();
    }
    await panorama.populate('creador', 'nombre foto');
    await panorama.populate('participantes', 'nombre foto');
    res.json({ message: 'Te anotaste. El creador y el grupo ya pueden ver quiÃ©n se sumÃ³.', panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.gestionarSolicitud = async (req, res) => {
  try {
    const { id, usuarioId, accion } = req.body; // accion: 'aceptar' o 'rechazar'
    const panorama = await Panorama.findById(id);
    if (!panorama) return res.status(404).json({ message: 'Panorama no encontrado' });
    if (panorama.creador.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'No eres el creador' });

    panorama.solicitudes = panorama.solicitudes.filter(uid => uid.toString() !== usuarioId);

    if (accion === 'aceptar') {
      if (panorama.participantes.length >= panorama.maxPersonas) return res.status(400).json({ message: 'Panorama lleno' });
      panorama.participantes.push(usuarioId);
      panorama.mensajesGrupo.push({ remitente: usuarioId, texto: 'Se unió al panorama.', tipo: 'sistema' });
    }
    await panorama.save();
    await panorama.populate('participantes', 'nombre foto');
    await panorama.populate('solicitudes', 'nombre foto');
    res.json({ message: 'Solicitud procesada', panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.abandonarGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const panorama = await Panorama.findById(id);
    if (!panorama) return res.status(404).json({ message: 'No encontrado' });

    panorama.participantes = panorama.participantes.filter(uid => uid.toString() !== req.user._id.toString());
    panorama.mensajesGrupo.push({ remitente: req.user._id, texto: 'Abandonó el panorama.', tipo: 'sistema' });
    await panorama.save();
    res.json({ message: 'Abandonaste el grupo' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.enviarMensajeGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const { texto, audioUrl } = req.body;
    const panorama = await Panorama.findById(id);
    if (!panorama) return res.status(404).json({ message: 'No encontrado' });
    if (!panorama.participantes.includes(req.user._id) && panorama.creador.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'No estás en el panorama' });

    panorama.mensajesGrupo.push({ remitente: req.user._id, texto, audioUrl, tipo: 'texto' });
    await panorama.save();
    res.json({ message: 'Mensaje enviado', panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.listarMisGrupos = async (req, res) => {
  try {
    const userId = req.user._id;
    const panoramas = await Panorama.find({
      $or: [{ creador: userId }, { participantes: userId }]
    })
      .populate('creador', 'nombre foto')
      .populate('participantes', 'nombre foto')
      .populate('mensajesGrupo.remitente', 'nombre');
    res.json({ panoramas });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.obtener = async (req, res) => {
  try {
    const panorama = await Panorama.findById(req.params.id)
      .populate('creador', 'nombre foto')
      .populate('participantes', 'nombre foto')
      .populate('solicitudes', 'nombre foto')
      .populate('mensajesGrupo.remitente', 'nombre foto');
    if (!panorama) return res.status(404).json({ message: 'No encontrado' });
    res.json({ panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
