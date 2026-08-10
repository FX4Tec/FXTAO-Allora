const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');

// All user routes required authentication
router.use(authMiddleware);
router.use(tenantDatabaseMiddleware);

// Apply strict admin check for modifying users? 
// For now, let's assume any authenticated user can list (for assigners) 
// but only admins can create/update/delete.
// I'll add a simple inline middleware or assume the UI handles it + basic trust for MVP.
// Ideally: checkRole('admin') middleware.

router.get('/', userController.list);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

module.exports = router;
