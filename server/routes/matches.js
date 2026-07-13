const express = require('express');
const router  = express.Router();
const matchController = require('../controllers/matchController');
const { proteger } = require('../middleware/authMiddleware');

router.use(proteger);

// Likes / dislikes
router.post('/like/:id',      matchController.darLike);
router.post('/retroceder', matchController.retroceder);
router.post('/superlike/:id', matchController.darSuperLike);
router.post('/pass/:id',      matchController.pasar);
router.post('/',              matchController.darLikeODislike);

// Mis matches
router.get('/',               matchController.listarMisMatches);
router.delete('/:id',         matchController.eliminar);

// Rompehielo
router.post('/:id/rompehielo', matchController.responderRompehielo);

// ✅ Rutas con nombre fijo SIEMPRE antes de las rutas con :id
// (si van después, Express interpreta "deshacer-dislike" como un :id)
router.post('/deshacer-dislike',        matchController.deshacerUltimoDislike);
router.post('/relampago/generar',       matchController.generarRelampago);
router.post('/ruleta-ciega',            matchController.jugarRuletaCiega);       // ✅ NUEVO

// Rutas con :id dinámico al final
router.post('/relampago/:id/salvar',    matchController.salvarRelampago);
router.post('/:id/revelarse',           matchController.revelarseEnRuleta);      // ✅ NUEVO

module.exports = router;