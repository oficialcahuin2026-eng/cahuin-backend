const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/panoramaController');
const { proteger } = require('../middleware/authMiddleware');

router.use(proteger);
router.get('/',         ctrl.listar);
router.post('/',        ctrl.crear);
router.post('/:id/unirse', ctrl.unirse);
router.post('/gestionar', ctrl.gestionarSolicitud);
router.post('/:id/abandonar', ctrl.abandonarGrupo);
router.post('/:id/mensajes', ctrl.enviarMensajeGrupo);
router.get('/mis-grupos', ctrl.listarMisGrupos);
router.get('/:id', ctrl.obtener);

module.exports = router;