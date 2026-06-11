const express = require('express');
const router = express.Router();
const cartaController = require('../controllers/cartaController');
const { proteger } = require('../middleware/authMiddleware');

router.get('/',                  cartaController.listar);
router.post('/',                 proteger, cartaController.crear);
router.post('/:id/reaccionar',   proteger, cartaController.reaccionar);
// 🌟 NUEVA RUTA PARA EL BOTÓN BASURERO
router.delete('/:id',            proteger, cartaController.eliminar);

module.exports = router;