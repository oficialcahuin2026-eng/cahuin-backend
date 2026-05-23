// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const proteger = authMiddleware.proteger || authMiddleware.protegerRuta;

router.get('/me', proteger, userController.getMiPerfil);
router.put('/me', proteger, userController.actualizarPerfil);
router.get('/descubrir', proteger, userController.descubrir);
router.get('/:id', proteger, userController.getPerfil);

// 🛑 LAS NUEVAS RUTAS DE SEGURIDAD
router.post('/:id/bloquear', proteger, userController.bloquearUsuario);
router.post('/:id/reportar', proteger, userController.reportarUsuario);
router.post('/foto', proteger, upload.single('foto'), userController.actualizarFoto);

module.exports = router;