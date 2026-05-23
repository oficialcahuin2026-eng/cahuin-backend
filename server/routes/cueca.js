// server/routes/cueca.js
const express = require('express');
const router = express.Router();
const cuecaController = require('../controllers/cuecaController');
const { proteger } = require('../middleware/authMiddleware');

// El guardia VIP protege este juego
router.use(proteger);

// Rutas de las 3 patitas de la cueca
router.get('/:id', cuecaController.getEstado);
router.post('/:id/iniciar', cuecaController.iniciar);
router.post('/:id/responder', cuecaController.responder);

module.exports = router;