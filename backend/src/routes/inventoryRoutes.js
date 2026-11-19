const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getInventory);
router.post('/movement', inventoryController.registerMovement);
router.get('/movements', inventoryController.getMovements);

module.exports = router;
