const express = require('express');
const router = express.Router();
const recetaController = require('../controllers/recetaController');
const { proteger } = require('../middleware/authMiddleware');

router.get('/', recetaController.listar);
router.post('/', proteger, recetaController.crear);
router.post('/:id/like', proteger, recetaController.like);

module.exports = router;