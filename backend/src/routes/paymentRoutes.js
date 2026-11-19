const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, paymentController.getPayments);
router.post('/', authenticateToken, requireAdmin, paymentController.createPayment);
router.put('/:id', authenticateToken, requireAdmin, paymentController.updatePayment);

module.exports = router;
