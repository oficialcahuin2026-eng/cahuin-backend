const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta configurar JWT_SECRET');
  }
  return 'cahuin_dev_secret_change_me';
};

const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';

const generarToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES });

const verificarToken = (token) =>
  jwt.verify(token, getJwtSecret());

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const verificarGoogle = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { generarToken, verificarToken, verificarGoogle };
