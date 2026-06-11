const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { proteger } = require('../middleware/authMiddleware');

router.get('/products', paymentController.getProducts);
router.post('/mercadopago/preference', proteger, paymentController.createMercadoPagoPreference);
router.post('/mercadopago/webhook', paymentController.mercadoPagoWebhook);
router.get('/webpay/commit', paymentController.commitWebpay);
router.post('/webpay/commit', paymentController.commitWebpay);
router.post('/webpay/create', proteger, paymentController.createWebpayTransaction);
router.get('/intents/:id', proteger, paymentController.getIntent);

module.exports = router;
