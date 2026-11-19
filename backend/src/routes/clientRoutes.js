const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, clientController.getAllClients);
router.get('/:id', authenticateToken, requireAdmin, clientController.getClientDetails);

module.exports = router;
