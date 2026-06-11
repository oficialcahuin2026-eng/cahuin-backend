const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { proteger } = require('../middleware/authMiddleware');

// ✅ Los nombres coinciden exactamente con los exports del controller:
// iaController.pedirConsejoWingman ← exports.pedirConsejoWingman ✅
// iaController.analizarEnergia     ← exports.analizarEnergia     ✅
router.post('/wingman', proteger, iaController.pedirConsejoWingman);
router.post('/energia', proteger, iaController.analizarEnergia);

module.exports = router;