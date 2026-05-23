// server/routes/matches.js
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { proteger } = require('../middleware/authMiddleware'); // Usamos tu Guardia de Seguridad

// 1. Protegemos TODAS las rutas de este archivo exigiendo el "Carnet VIP"
router.use(proteger);

// 2. Rutas para interactuar con los perfiles (Las que usa tu api.js actual)
router.post('/like/:id', matchController.darLike);
router.post('/superlike/:id', matchController.darSuperLike);
router.post('/pass/:id', matchController.pasar);

// 3. Rutas para el listado de matches (Para tu futura pantalla de Chats)
router.get('/', matchController.listarMisMatches);
router.delete('/:id', matchController.eliminar);

// 4. Ruta de compatibilidad (Por si alguna parte vieja de la app sigue usando la ruta base)
router.post('/', matchController.darLikeODislike);

module.exports = router;