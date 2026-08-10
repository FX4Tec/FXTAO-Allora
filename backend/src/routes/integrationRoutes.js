const express = require('express');

const router = express.Router();
const integrationController = require('../controllers/integrationController');
const integrationAuthMiddleware = require('../middlewares/integrationAuthMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');
const requireIntegrationScope = require('../middlewares/requireIntegrationScope');

router.use(integrationAuthMiddleware);
router.use(tenantDatabaseMiddleware);

router.get('/works/lookup', requireIntegrationScope('lookup.read'), integrationController.lookupWorks);
router.get('/works', requireIntegrationScope('works.read'), integrationController.listWorks);
router.get('/works/:id/financial', requireIntegrationScope('financial.read'), integrationController.getWorkFinancial);
router.get('/works/:id/team', requireIntegrationScope('team.read'), integrationController.getWorkTeam);
router.get('/works/:id', requireIntegrationScope('works.read'), integrationController.getWorkById);

module.exports = router;
