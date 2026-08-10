const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');

router.use(authMiddleware);
router.use(tenantDatabaseMiddleware);

router.get('/:resource', resourceController.list);
router.post('/:resource', resourceController.create);
router.get('/:resource/:id', resourceController.get);
router.put('/:resource/:id', resourceController.update);
router.delete('/:resource/:id', resourceController.delete);

module.exports = router;
