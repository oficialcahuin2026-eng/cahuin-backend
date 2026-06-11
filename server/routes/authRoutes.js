const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 🌟 La nueva ruta que espera la app móvil
router.post('/sync-clerk', authController.syncClerk);

// Rutas antiguas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginGoogle);
router.post('/facebook', authController.loginFacebook);
router.post('/telefono', authController.loginTelefono);

module.exports = router;