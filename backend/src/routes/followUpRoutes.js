const express = require('express');
const router = express.Router();
const { calculateClientFollowUp } = require('../services/followUpService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Cliente consulta su propio seguimiento
router.get('/my-status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'CLIENTE' || !req.user.client_id) {
      return res.status(403).json({ success: false, error: 'Requiere rol de cliente.' });
    }
    const result = await calculateClientFollowUp(req.user.client_id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error en /my-status:', err);
    return res.status(500).json({ success: false, error: 'Error al calcular seguimiento del cliente.' });
  }
});

// Admin consulta seguimiento de un cliente específico
router.get('/client/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await calculateClientFollowUp(req.params.id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error en /client/:id:', err);
    return res.status(500).json({ success: false, error: 'Error al calcular seguimiento del cliente.' });
  }
});

module.exports = router;
