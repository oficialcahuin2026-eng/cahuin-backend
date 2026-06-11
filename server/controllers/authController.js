const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { generarToken } = require('../config/auth');
const { inferirRegionPorCiudad, normalizarCiudadChile, normalizarRegionChile } = require('../utils/chileLocations');

const sanitizarUsuario = (usuario) => {
  const obj = usuario.toObject ? usuario.toObject() : { ...usuario };
  delete obj.password;
  return obj;
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento);
  if (Number.isNaN(nac.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

const obtenerEdadValida = (fechaNacimiento, edad) => {
  const edadPorFecha = calcularEdad(fechaNacimiento);
  const edadFinal = edadPorFecha ?? Number(edad || 0);
  if (!Number.isFinite(edadFinal) || edadFinal < 18) return null;
  return edadFinal;
};

// 🌟 ESTA ES LA VERSIÓN CORREGIDA PARA CLERK (Con el token)
exports.syncClerk = async (req, res) => {
  try {
    const { clerkId, email, nombre, fotoUrl } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requerido para sincronizar' });
    }

    // Buscamos si el usuario ya existe por su correo
    let usuario = await User.findOne({ email: email.toLowerCase() });

    if (!usuario) {
      // Si es un usuario nuevo, lo creamos
      usuario = await User.create({
        nombre: nombre || 'Cahuinero',
        email: email.toLowerCase(),
        password: 'ClerkPassword123!', 
        foto: fotoUrl || '',
        fotos: fotoUrl ? [fotoUrl] : [],
        telefono: '',
        fechaNacimiento: null,
        ciudad: 'Por definir',
        region: 'Por definir',
        genero: 'Otro',
        preferencia: 'Todxs',
        edad: 18,
        aceptaTerminos: true,
      });
    } else if (!usuario.foto && fotoUrl) {
      // Si el usuario ya existía pero no tenía foto, le ponemos la de Google/Facebook
      usuario.foto = fotoUrl;
      usuario.fotos = [fotoUrl];
      await usuario.save();
    }

    // 🌟 LA MAGIA ESTÁ AQUÍ: Generamos el token local que Cahuín entiende
    const tokenLocal = generarToken(usuario._id);

    // Lo enviamos de vuelta a la app móvil
    res.status(200).json({ 
        usuario: sanitizarUsuario(usuario),
        token: tokenLocal 
    });
  } catch (error) {
    console.error("Error en syncClerk:", error);
    res.status(500).json({ message: 'Error al sincronizar con la base de datos' });
  }
};


// ----- RUTAS ANTIGUAS (Las dejamos por compatibilidad temporal) -----

const googleAudiences = () => [
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, telefono, fechaNacimiento, ciudad, region, genero, preferencia, edad, aceptaTerminos } = req.body;

    const usuarioExiste = await User.findOne({ email });
    if (usuarioExiste) return res.status(400).json({ message: 'Este correo ya está registrado' });

    if (!fechaNacimiento) return res.status(400).json({ message: 'Debes indicar tu fecha de nacimiento.' });

    const edadFinal = obtenerEdadValida(fechaNacimiento, edad);
    if (!edadFinal) return res.status(400).json({ message: 'Cahuín es solo para mayores de 18 años.' });

    const ciudadFinal = ciudad ? normalizarCiudadChile(ciudad) : 'Por definir';
    const regionFinal = region && region !== 'Por definir'
      ? normalizarRegionChile(region)
      : (inferirRegionPorCiudad(ciudadFinal) || 'Por definir');

    const usuario = await User.create({
      nombre,
      email,
      password,
      telefono,
      fechaNacimiento,
      ciudad: ciudadFinal,
      region: regionFinal,
      genero,
      preferencia,
      edad: edadFinal,
      aceptaTerminos,
    });

    res.status(201).json({ usuario: sanitizarUsuario(usuario), token: generarToken(usuario._id) });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la cuenta' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await User.findOne({ email });

    if (usuario && (await usuario.matchPassword(password))) {
      res.json({ usuario: sanitizarUsuario(usuario), token: generarToken(usuario._id) });
    } else {
      res.status(401).json({ message: "Correo o contraseña incorrectos" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

exports.loginGoogle = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token requerido' });

    const audiences = googleAudiences();
    if (audiences.length === 0) return res.status(500).json({ message: 'Faltan client IDs de Google en el servidor.' });

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({ idToken: token, audience: audiences });
    const { email, name: nombre, picture: foto } = ticket.getPayload();

    let usuario = await User.findOne({ email });
    if (!usuario) {
      usuario = await User.create({
        nombre,
        email,
        password: 'LoginGoogle123!',
        foto: foto || '',
        fotos: foto ? [foto] : [],
        telefono: '',
        fechaNacimiento: null,
        ciudad: 'Por definir',
        region: 'Por definir',
        genero: 'Otro',
        preferencia: 'Todos',
        edad: 18,
        aceptaTerminos: true,
      });
    }
    res.json({ usuario: sanitizarUsuario(usuario), token: generarToken(usuario._id) });
  } catch (error) {
    res.status(500).json({ message: 'Error con Google' });
  }
};

exports.loginFacebook = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Token de Facebook requerido' });

    const fbResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    );
    const perfil = await fbResponse.json();
    if (!fbResponse.ok || !perfil?.id) {
      return res.status(401).json({ message: 'Facebook no pudo verificar esta cuenta.' });
    }

    const email = perfil.email || `facebook-${perfil.id}@cahuin.social`;
    const nombre = perfil.name || 'Cahuinero';
    const foto = perfil.picture?.data?.url || '';

    let usuario = await User.findOne({ email });
    if (!usuario) {
      usuario = await User.create({
        nombre,
        email,
        password: 'LoginFacebook123!',
        foto: foto || '',
        fotos: foto ? [foto] : [],
        telefono: '',
        fechaNacimiento: null,
        ciudad: 'Por definir',
        region: 'Por definir',
        genero: 'Otro',
        preferencia: 'Todos',
        edad: 18,
        aceptaTerminos: true,
      });
    }
    res.json({ usuario: sanitizarUsuario(usuario), token: generarToken(usuario._id) });
  } catch (error) {
    res.status(500).json({ message: 'Error con Facebook' });
  }
};

exports.loginTelefono = async (req, res) => {
  try {
    const { telefono } = req.body;
    let usuario = await User.findOne({ telefono });

    if (!usuario) {
      usuario = await User.create({
        nombre: 'Cahuinero',
        email: `${telefono}@cahuin.cl`,
        password: 'Telefono123!',
        telefono,
        fechaNacimiento: null,
        ciudad: 'Por definir',
        region: 'Por definir',
        genero: 'Otro',
        preferencia: 'Todos',
        edad: 18,
        aceptaTerminos: true,
      });
    }
    res.json({ usuario: sanitizarUsuario(usuario), token: generarToken(usuario._id) });
  } catch (error) {
    res.status(500).json({ message: 'Error con teléfono' });
  }
};