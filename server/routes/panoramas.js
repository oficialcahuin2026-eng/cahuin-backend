const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/panoramaController');
const { proteger } = require('../middleware/authMiddleware');

router.use(proteger);
router.get('/',         ctrl.listar);
router.post('/',        ctrl.crear);
router.post('/:id/unirse', ctrl.unirse);

module.exports = router;