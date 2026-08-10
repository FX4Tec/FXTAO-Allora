const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const saasController = require('../controllers/saasController');

const router = express.Router();

router.get('/context', saasController.context);

router.use(authMiddleware);

router.post('/bootstrap', saasController.bootstrap);
router.get('/tenants', saasController.listTenants);
router.post('/tenants', saasController.createTenant);
router.get('/plans', saasController.listPlans);
router.get('/audit-logs', saasController.listAuditLogs);

module.exports = router;
