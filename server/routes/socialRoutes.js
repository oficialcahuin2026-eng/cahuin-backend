const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { proteger } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(proteger);

router.get('/historias', socialController.listarHistorias);
router.post('/historias', upload.single('imagen'), socialController.crearHistoria);
router.post('/historias/:id/reaccionar', socialController.reaccionarHistoria);
router.post('/historias/:id/comentar', socialController.comentarHistoria);
router.post('/historias/:id/sumarse', socialController.sumarseHistoria);

router.get('/historias-exito', socialController.listarHistoriasExito);
router.post('/historias-exito', upload.single('imagen'), socialController.crearHistoriaExito);
router.patch('/historias-exito/:id/revisar', socialController.revisarHistoriaExito);

router.get('/cahuin-dia', socialController.getCahuinDiario);
router.post('/cahuin-dia/votar', socialController.votarCahuinDiario);

router.get('/swipe-panoramas', socialController.getSwipePanoramas);
router.post('/swipe-panoramas/:id', socialController.votarPanorama);

router.get('/mapa-calor', socialController.getMapaCalor);

router.post('/botellas', socialController.crearBotella);
router.get('/botellas/actual', socialController.getBotellaActual);
router.post('/botellas/:id/responder', socialController.responderBotella);
router.post('/botellas/:id/soltar', socialController.soltarBotella);

module.exports = router;
