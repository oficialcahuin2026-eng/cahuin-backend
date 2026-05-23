const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');

// Rutas para las recetas
router.get('/', recetaController.listar);
router.post('/', recetaController.crear);
router.post('/:id/like', recetaController.like);

module.exports = router;