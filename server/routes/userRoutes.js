const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const proteger = authMiddleware.proteger || authMiddleware.protegerRuta;

router.get('/me', proteger, userController.getMiPerfil);
router.get('/me/vistas', proteger, userController.getVistas);
router.get('/me/likes', proteger, userController.getLikesRecibidos);
router.get('/me/analytics', proteger, userController.getAnalyticsPerfil);
router.get('/admin/reportes', proteger, userController.listarReportesAdmin);
router.patch('/admin/reportes/:id', proteger, userController.resolverReporteAdmin);
router.get('/trending', proteger, userController.getTrending); 
router.put('/me', proteger, userController.actualizarPerfil);
router.get('/descubrir', proteger, userController.descubrir);

// Mecánicas Especiales
router.post('/me/verificar', proteger, userController.verificarPerfil);
router.post('/me/arquetipo', proteger, userController.guardarArquetipo);
router.post('/me/pausa', proteger, userController.togglePausaCuenta);
router.post('/me/boost', proteger, userController.activarBoost);
router.post('/me/racha-swipes/continuar', proteger, userController.continuarRachaSwipes);

// 🌟 IDEA 2: Sugeridor de Fotos IA (Ruta Base)
router.post('/me/fotos/analizar', proteger, (req, res) => res.json({ message: "Pronto: Cloudinary Vision AI en acción." }));

// 🌟 IDEA 3: Calendario de Disponibilidad
router.put('/me/disponibilidad', proteger, (req, res) => res.json({ message: "Pronto: Calendario actualizado." }));

// Preguntas anonimas tipo NGL interno
router.get('/me/preguntas', proteger, userController.getMisPreguntasAnonimas);
router.post('/preguntas/:id/responder', proteger, userController.responderPreguntaAnonima);
router.post('/:id/preguntas', proteger, userController.enviarPreguntaAnonima);

// Diario Privado
router.get('/diario/:matchId', proteger, userController.getDiarioMatch);
router.post('/diario/:matchId', proteger, userController.escribirDiario);

// Galería Múltiple
router.post('/fotos', proteger, upload.array('nuevasFotos', 6), userController.actualizarFotosMult);

// Interacciones con otros perfiles
router.post('/:id/visto', proteger, userController.registrarVista); 
router.get('/:id', proteger, userController.getPerfil);
router.post('/:id/bloquear', proteger, userController.bloquearUsuario);
router.post('/:id/reportar', proteger, userController.reportarUsuario);
router.post('/:id/calificar', proteger, userController.calificarUsuario);

module.exports = router;
