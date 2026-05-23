const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/mensajeController');
const { proteger } = require('../middleware/authMiddleware');

router.use(proteger);
router.get('/:matchId',  ctrl.listar);
router.post('/:matchId', ctrl.enviar);

module.exports = router;