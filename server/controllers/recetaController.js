// server/controllers/recetaController.js
const Receta = require('../models/Receta');

exports.listar = async (req, res) => {
  try {
    // Buscamos las recetas y traemos los datos del autor (nombre, foto y ciudad)
    const recetas = await Receta.find()
      .populate('autor', 'nombre foto ciudad')
      .sort({ createdAt: -1 }); // Las más nuevas primero

    res.json({ recetas });
  } catch (error) {
    console.error("❌ Error listando recetas:", error);
    res.status(500).json({ message: 'Error al obtener las recetas' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { titulo, descripcion, categoria } = req.body;
    
    // Creamos la receta usando la ciudad del usuario que la publica
    const nuevaReceta = await Receta.create({
      titulo,
      descripcion,
      categoria: categoria || 'Plato de fondo',
      region: req.user?.ciudad || 'Temuco',
      autor: req.user._id
    });

    // Rellenamos los datos del autor para devolverlo inmediatamente a la app
    await nuevaReceta.populate('autor', 'nombre foto ciudad');

    console.log(`🍳 ¡${req.user.nombre} publicó una nueva receta: ${titulo}!`);
    res.status(201).json({ receta: nuevaReceta });
  } catch (error) {
    console.error("❌ Error creando receta:", error);
    res.status(500).json({ message: 'Error al crear la receta' });
  }
};

exports.like = async (req, res) => {
  try {
    res.json({ message: 'Like registrado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al dar like' });
  }
};