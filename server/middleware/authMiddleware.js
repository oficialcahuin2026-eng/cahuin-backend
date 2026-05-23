// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protegerRuta = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const usuarioEncontrado = await User.findById(decoded.id).select('-password');
      
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