// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generarToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    // 🌟 Recibimos la edad y los términos
    const { nombre, email, password, ciudad, region, genero, preferencia, edad, aceptaTerminos } = req.body;

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) return res.status(400).json({ message: 'Este correo ya está registrado' });

    const usuario = await User.create({
      nombre, email, password, ciudad, region, genero, preferencia, edad, aceptaTerminos
    });

    res.status(201).json({
      usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, foto: usuario.foto, region: usuario.region, ciudad: usuario.ciudad, isPremium: usuario.isPremium },
      token: generarToken(usuario._id)
    });
  } catch (error) { res.status(500).json({ message: 'Error al crear la cuenta' }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });

    if (usuario && (await usuario.compararPassword(password))) {
      res.json({
        usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, foto: usuario.foto, region: usuario.region, ciudad: usuario.ciudad, isPremium: usuario.isPremium },
        token: generarToken(usuario._id)
      });
    } else { res.status(401).json({ message: 'Correo o contraseña incorrectos po\'' }); }
  } catch (error) { res.status(500).json({ message: 'Error al iniciar sesión' }); }
};

exports.loginGoogle = async (req, res) => {
  try {
    const { email, nombre, foto } = req.body;
    let usuario = await User.findOne({ email });

    if (!usuario) {
      usuario = await User.create({
        nombre, email, password: 'LoginGoogleSeguro123!', foto: foto || '', ciudad: 'Por definir', region: 'Por definir', genero: 'Otro', preferencia: 'Todos', edad: 18, aceptaTerminos: true
      });
    }
    res.json({
      usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, foto: usuario.foto, region: usuario.region, ciudad: usuario.ciudad, isPremium: usuario.isPremium },
      token: generarToken(usuario._id)
    });
  } catch (error) { res.status(500).json({ message: 'Error al iniciar sesión con Google' }); }
};