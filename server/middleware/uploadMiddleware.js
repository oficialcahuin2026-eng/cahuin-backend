// server/middleware/uploadMiddleware.js
const multer = require('multer');

// Usamos la memoria temporal del servidor. 
// Esto evita el choque de versiones que hacía explotar tu Node.js
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

module.exports = upload;