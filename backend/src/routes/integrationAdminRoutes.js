const express = require('express');

const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');
const requireElevatedRole = require('../middlewares/requireElevatedRole');
const integrationAdminController = require('../controllers/integrationAdminController');

router.use(authMiddleware);
router.use(tenantDatabaseMiddleware);
router.use(requireElevatedRole);

router.get('/settings', integrationAdminController.getSettings);
router.put('/settings', integrationAdminController.updateSettings);
router.post('/clients/:clientKey/regenerate-token', integrationAdminController.regenerateClientToken);

module.exports = router;
