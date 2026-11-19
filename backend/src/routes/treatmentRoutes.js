const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/history', authenticateToken, treatmentController.getTreatmentHistory);
router.post('/history', authenticateToken, requireAdmin, treatmentController.createTreatmentRecord);
router.put('/history/:id', authenticateToken, requireAdmin, treatmentController.updateTreatmentRecord);

module.exports = router;
