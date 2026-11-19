const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', ruleController.getRules);
router.post('/', authenticateToken, requireAdmin, ruleController.createRule);
router.put('/:id', authenticateToken, requireAdmin, ruleController.updateRule);
router.delete('/:id', authenticateToken, requireAdmin, ruleController.deleteRule);

module.exports = router;
