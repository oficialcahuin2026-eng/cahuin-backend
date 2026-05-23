const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/premiumController');
const { proteger } = require('../middleware/authMiddleware');

router.use(proteger);
router.get('/planes',    ctrl.getPlanes);
router.get('/regalos',   ctrl.getRegalos);
router.get('/estado',    ctrl.getEstado);
router.post('/suscribir',ctrl.suscribir);

module.exports = router;