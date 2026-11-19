const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');

// Catálogo general de productos
router.get('/', optionalAuth, productController.getAllProducts);
router.post('/', authenticateToken, requireAdmin, productController.createProduct);
router.put('/:id', authenticateToken, requireAdmin, productController.updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, productController.deleteProduct);

// Productos asignados al cliente
router.get('/client', authenticateToken, productController.getClientProducts);
router.post('/client/assign', authenticateToken, requireAdmin, productController.assignProductToClient);
router.delete('/client/assign/:id', authenticateToken, requireAdmin, productController.removeClientProduct);

module.exports = router;
