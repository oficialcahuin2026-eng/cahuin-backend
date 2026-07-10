const express = require('express');
const router = express.Router();
const botService = require('../services/geminiBotService');

// GET /api/bot/recopilar?token=mi_secreto
router.get('/recopilar', (req, res) => {
  const { token } = req.query;
  
  // Seguridad simple para evitar que cualquiera active el bot
  if (token !== (process.env.BOT_TOKEN || 'cahuin_secreto')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Iniciamos la función asíncrona PERO no esperamos a que termine
  // para poder devolverle un estado 200 inmediatamente a cron-job.org
  // y que no se caiga por timeout (son 16 regiones, demorará varios minutos)
  botService.runDailyScrape().catch(err => console.error('[Bot] Fallo general:', err));

  res.status(200).json({ 
    status: 'success', 
    message: 'Proceso de recopilación iniciado en segundo plano. Esto puede tomar varios minutos.' 
  });
});

module.exports = router;
