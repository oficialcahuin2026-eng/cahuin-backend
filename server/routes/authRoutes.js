// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Las 3 puertas de entrada al Cahuín
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginGoogle);

module.exports = router;