const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Públicas
router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);
router.get('/:id/services', branchController.getBranchServices);
router.get('/:id/exceptions', branchController.getBranchExceptions);

// Solo Admin
router.post('/', authenticateToken, requireAdmin, branchController.createBranch);
router.put('/:id', authenticateToken, requireAdmin, branchController.updateBranch);
router.delete('/:id', authenticateToken, requireAdmin, branchController.deleteBranch);
router.put('/:id/services', authenticateToken, requireAdmin, branchController.updateBranchServices);
router.post('/:id/exceptions', authenticateToken, requireAdmin, branchController.addBranchException);
router.delete('/:id/exceptions/:exceptionId', authenticateToken, requireAdmin, branchController.deleteBranchException);

module.exports = router;
