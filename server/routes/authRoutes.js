const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginGoogle);
router.post('/facebook', authController.loginFacebook);
router.post('/telefono', authController.loginTelefono);

module.exports = router;
