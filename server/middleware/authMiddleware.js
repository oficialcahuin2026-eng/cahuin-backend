// server/middleware/authMiddleware.js
const User = require('../models/User');
const { verificarToken } = require('../config/auth');

const protegerRuta = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verificarToken(token);
      
      const usuarioEncontrado = await User.findById(decoded.id).select('-password');
      if (!usuarioEncontrado) {
        return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
      }
      
      // PARCHE MÁGICO: Asignamos a ambos nombres para compatibilidad total
      req.user = usuarioEncontrado;
      req.usuario = usuarioEncontrado; 
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'No autorizado, pase VIP inválido' });
    }
  }

  if (!token) return res.status(401).json({ message: 'No autorizado, no hay pase VIP' });
};

module.exports = { protegerRuta, proteger: protegerRuta };
