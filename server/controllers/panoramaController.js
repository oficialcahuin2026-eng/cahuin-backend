const Panorama = require('../models/Panorama');
const eventosOficiales = require('../utils/seedEventos');
const { normalizarRegionChile, inferirRegionPorCiudad } = require('../utils/chileLocations');

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

const mismaRegion = (a = '', b = '') => normalizarTexto(normalizarRegionChile(a)) === normalizarTexto(normalizarRegionChile(b));

const inicioDeHoy = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
};

const eventosFallbackPorRegion = (region) => {
  const regionFinal = normalizarRegionChile(region || '') || inferirRegionPorCiudad(region || '') || region;
  return eventosOficiales
    .filter((evento) => mismaRegion(evento.region, regionFinal))
    .filter((evento) => new Date(evento.fecha) >= inicioDeHoy())
    .map((evento, index) => ({
      ...evento,
      _id: `fallback-${normalizarTexto(regionFinal)}-${index}`,
      categoria: 'Evento Oficial',
      esOficial: true,
      activo: true,
      maxPersonas: 9999,
      participantes: [],
    }));
};

// 🌟 FIX CLAVE: Diccionario para conectar las ciudades con sus regiones
const DICCIONARIO_REGIONES = {
  'Arica y Parinacota': ['Arica', 'Putre', 'Camarones', 'General Lagos'],
  'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara'],
  'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'San Pedro de Atacama', 'Mejillones'],
  'Atacama': ['Copiapó', 'Vallenar', 'Caldera', 'Chañaral', 'Huasco'],
  'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña'],
  'Valparaíso': ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'San Antonio', 'Olmué', 'Limache', 'Quintero'],
  'Metropolitana': ['Santiago', 'Santiago Centro', 'Providencia', 'Maipú', 'Puente Alto', 'La Florida', 'Ñuñoa', 'Melipilla'],
  'O’Higgins': ['Rancagua', 'San Fernando', 'Pichilemu', 'Santa Cruz', 'Machalí', 'Mostazal', 'San Francisco de Mostazal'],
  'Maule': ['Talca', 'Curicó', 'Linares', 'Cauquenes', 'Constitución'],
  'Ñuble': ['Chillán', 'San Carlos', 'Bulnes', 'Quirihue', 'Coihueco'],
  'Bío Bío': ['Concepción', 'Talcahuano', 'Los Ángeles', 'San Pedro de la Paz', 'Coronel'],
  'Araucanía': ['Temuco', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Padre Las Casas'],
  'Los Ríos': ['Valdivia', 'La Unión', 'Panguipulli', 'Río Bueno', 'Futrono'],
  'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas', 'Ancud', 'Frutillar'],
  'Aysén': ['Coyhaique', 'Puerto Aysén', 'Chile Chico', 'Cochrane'],
  'Magallanes': ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos']
};

exports.listar = async (req, res) => {
  try {
    const { region, categoria, pagina = 1 } = req.query;
    await Panorama.updateMany(
      { fecha: { $lt: inicioDeHoy() }, activo: { $ne: false } },
      { $set: { activo: false } }
    );

    const filtro = {
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { fecha: { $gte: inicioDeHoy() } }
      ]
    };

    const regionNormalizada = normalizarRegionChile(region || '') || inferirRegionPorCiudad(region || '');

    if (region) {
      // 🌟 BUSCADOR INTELIGENTE: Expande la búsqueda a TODA la región
      let terminos = [new RegExp(region, 'i')];
      if (regionNormalizada && regionNormalizada !== region) terminos.push(new RegExp(regionNormalizada, 'i'));
      if (region === 'Santiago Centro') terminos.push(new RegExp('Santiago', 'i'));

      const regionBuscadaNorm = normalizarTexto(region);
      for (const [nombreReg, ciudades] of Object.entries(DICCIONARIO_REGIONES)) {
        const nombreRegNormalizado = normalizarRegionChile(nombreReg);
        // Si el usuario buscó por ciudad (ej: "Puente Alto"), agregamos la región ("Metropolitana")
        if (ciudades.some(c => normalizarTexto(c) === regionBuscadaNorm) || (region === 'Santiago Centro' && nombreRegNormalizado === 'Metropolitana')) {
          terminos.push(new RegExp(nombreReg, 'i'));
          if (nombreRegNormalizado !== nombreReg) terminos.push(new RegExp(nombreRegNormalizado, 'i'));
          break;
        }
        // Si el usuario buscó directo por la Región, agregamos todas sus ciudades
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
      .sort({ fecha: 1 }) // Cronológico: Los más próximos primero
      .skip((pagina - 1) * 20).limit(40);

    if (region && panoramas.filter((p) => p.esOficial).length === 0 && (!categoria || categoria === 'Evento Oficial')) {
      const inicio = (pagina - 1) * 20;
      const fallback = eventosFallbackPorRegion(regionNormalizada || region).slice(inicio, inicio + 20);
      panoramas = [...panoramas, ...fallback];
    }

    res.json({ panoramas });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, region, lugar, direccion, fecha, categoria, emoji, maxPersonas } = req.body;
    if (new Date(fecha) < inicioDeHoy()) {
      return res.status(400).json({ message: 'Ese panorama ya pasó. Armemos uno con fecha vigente.' });
    }
    const regionFinal = normalizarRegionChile(region || req.user.region || '') || inferirRegionPorCiudad(req.user.ciudad || '') || 'Metropolitana';

    const panorama = await Panorama.create({
      titulo, descripcion, region: regionFinal, lugar, direccion, fecha: new Date(fecha),
      categoria, emoji, maxPersonas,
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
      return res.status(400).json({ message: 'Este panorama ya terminó.' });
    }
    if (panorama.participantes.length >= panorama.maxPersonas)
      return res.status(400).json({ message: "Panorama lleno po'" });

    const yaInscrito = panorama.participantes.some(id => id.toString() === req.user._id.toString());
    if (!yaInscrito) {
      panorama.participantes.push(req.user._id);
      panorama.mensajesGrupo.push({
        remitente: req.user._id,
        texto: `${req.user.nombre || 'Alguien'} se anoto al panorama.`,
        tipo: 'sistema'
      });
      await panorama.save();
    }
    await panorama.populate('creador', 'nombre foto');
    await panorama.populate('participantes', 'nombre foto');
    res.json({ message: 'Te anotaste. El creador y el grupo ya pueden ver quién se sumó.', panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
