const express = require('express');
const router = express.Router();
const taoController = require('../controllers/taoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// CRUD
router.get('/', taoController.list);
router.post('/', taoController.create);
router.post('/:id/decision', taoController.decideApproval);
router.get('/:id', taoController.getById);
router.put('/:id', taoController.update);
router.delete('/:id', taoController.delete);

router.get('/access-check/:identifier', taoController.checkAccess);

// Approval Workflow (TODO: Implement in controller)
// router.post('/:id/approve', taoController.approve);
// router.post('/:id/reject', taoController.reject);

// Sub-resources (TODO: Implement in controller)
// router.post('/:id/installments', taoController.addInstallment);
// router.post('/:id/additives', taoController.addAdditive);

module.exports = router;
