const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-mfa', authController.verifyMFALogin);

router.get('/me', authenticateToken, authController.getProfile);
router.put('/me', authenticateToken, authController.updateProfile);

// 2FA / TOTP Management
router.post('/mfa/setup', authenticateToken, authController.setupMFA);
router.post('/mfa/enable', authenticateToken, authController.enableMFA);
router.post('/mfa/disable', authenticateToken, authController.disableMFA);

module.exports = router;
