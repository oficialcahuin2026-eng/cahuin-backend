const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET  = process.env.JWT_SECRET  || 'cahuin_secreto_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';

const generarToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const verificarToken = (token) =>
  jwt.verify(token, JWT_SECRET);

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verificarGoogle = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { generarToken, verificarToken, verificarGoogle };