const Panorama = require('../models/Panorama');

exports.listar = async (req, res) => {
  try {
    const { region, categoria, pagina = 1 } = req.query;
    const filtro = { activo: true, fecha: { $gte: new Date() } };
    if (region)    filtro.region    = region;
    if (categoria) filtro.categoria = categoria;
    const panoramas = await Panorama.find(filtro)
      .populate('creador', 'nombre foto region verificado')
      .sort({ fecha: 1 }).skip((pagina - 1) * 20).limit(20);
    res.json({ panoramas });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, region, lugar, fecha, categoria, emoji, maxPersonas } = req.body;
    const panorama = await Panorama.create({
      titulo, descripcion, region, lugar, fecha: new Date(fecha),
      categoria, emoji, maxPersonas,
      creador: req.usuario._id, participantes: [req.usuario._id],
    });
    await panorama.populate('creador', 'nombre foto');
    res.status(201).json({ panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.unirse = async (req, res) => {
  try {
    const panorama = await Panorama.findById(req.params.id);
    if (!panorama) return res.status(404).json({ message: 'Panorama no encontrado' });
    if (panorama.participantes.length >= panorama.maxPersonas)
      return res.status(400).json({ message: 'Panorama lleno po\'' });
    if (!panorama.participantes.includes(req.usuario._id)) {
      panorama.participantes.push(req.usuario._id);
      await panorama.save();
    }
    res.json({ message: '¡Te uniste al panorama! 🙌', panorama });
  } catch (err) { res.status(500).json({ message: err.message }); }
};