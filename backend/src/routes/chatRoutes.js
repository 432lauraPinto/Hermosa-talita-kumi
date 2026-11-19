const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

router.post('/', optionalAuth, chatController.handleChat);
router.post('/tool', optionalAuth, chatController.executeToolDirectly);

module.exports = router;
