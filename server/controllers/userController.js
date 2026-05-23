// server/controllers/userController.js
const User = require('../models/User');
const Match = require('../models/Match');

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

exports.getMiPerfil = async (req, res) => {
  try { const usuario = await User.findById(req.user._id).select('-password'); res.json({ usuario }); } catch (error) { res.status(500).json({ message: 'Error obteniendo perfil' }); }
};

exports.actualizarPerfil = async (req, res) => {
  try { const usuario = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true }).select('-password'); res.json({ usuario }); } catch (error) { res.status(500).json({ message: 'Error actualizando perfil' }); }
};

exports.descubrir = async (req, res) => {
  try {
    const miUsuario = await User.findById(req.user._id);
    const interacciones = await Match.find({ remitente: req.user._id });
    
    let ignorados = interacciones.map(m => m.receptor);
    ignorados.push(req.user._id); 
    if (miUsuario.bloqueados) ignorados = ignorados.concat(miUsuario.bloqueados);

    // 🌟 LECTURA DE LOS FILTROS AVANZADOS
    const minEdad = parseInt(req.query.minEdad) || 18;
    const maxEdad = parseInt(req.query.maxEdad) || 100;
    const maxDistancia = parseInt(req.query.maxDistancia) || 10000; // Kilómetros máximos

    let filtro = { 
      _id: { $nin: ignorados }, 
      region: miUsuario.region,
      edad: { $gte: minEdad, $lte: maxEdad } // 🌟 FILTRO DE EDAD DIRECTO EN BD
    };
    
    if (miUsuario.preferencia === 'Hombres') filtro.genero = 'Hombre';
    if (miUsuario.preferencia === 'Mujeres') filtro.genero = 'Mujer';

    const perfilesBrutos = await User.find(filtro).limit(40).select('-password');

    // 🌟 FILTRO DE DISTANCIA
    const perfiles = [];
    for (let perfil of perfilesBrutos) {
      const dist = calcularDistancia(miUsuario.latitud, miUsuario.longitud, perfil.latitud, perfil.longitud);
      // Si la distancia es nula (no tiene GPS) o es menor al máximo permitido, lo agregamos
      if (dist === null || dist <= maxDistancia) {
        const obj = perfil.toObject();
        obj.distanciaKm = dist;
        perfiles.push(obj);
      }
    }

    res.json({ perfiles: perfiles.slice(0, 20) }); // Devolvemos máximo 20 para no saturar
  } catch (error) { res.status(500).json({ message: 'Error al buscar perfiles' }); }
};

exports.getPerfil = async (req, res) => {
  try { const perfil = await User.findById(req.params.id).select('-password'); res.json({ perfil }); } catch (error) { res.status(500).json({ message: 'Error obteniendo perfil' }); }
};

exports.bloquearUsuario = async (req, res) => {
  try { await User.findByIdAndUpdate(req.user._id, { $addToSet: { bloqueados: req.params.id } }); res.json({ message: 'Bloqueado' }); } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.reportarUsuario = async (req, res) => {
  try { res.json({ message: 'Reportado' }); } catch (error) { res.status(500).json({ message: 'Error' }); }
};

exports.actualizar = exports.actualizarPerfil;
exports.actualizarFoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' });
    
    // req.file.path contiene la URL eterna generada por Cloudinary
    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user._id, { foto: req.file.path }, { new: true }
    ).select('-password');
    
    res.json({ foto: usuarioActualizado.foto });
  } catch (error) { res.status(500).json({ message: 'Error subiendo la foto' }); }
};