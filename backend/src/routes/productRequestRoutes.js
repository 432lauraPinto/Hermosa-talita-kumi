const express = require('express');
const router = express.Router();
const productRequestController = require('../controllers/productRequestController');
const { authenticateToken, requireStaffOrAdmin } = require('../middleware/auth');

// Cliente autenticado: crear solicitud y ver mis solicitudes
router.post('/', authenticateToken, productRequestController.createRequest);
router.get('/my', authenticateToken, productRequestController.getMyRequests);

// Administradores y encargados: ver todas las solicitudes y actualizar estado
router.get('/', authenticateToken, requireStaffOrAdmin, productRequestController.getAllRequests);
router.patch('/:id/status', authenticateToken, requireStaffOrAdmin, productRequestController.updateRequestStatus);

module.exports = router;
