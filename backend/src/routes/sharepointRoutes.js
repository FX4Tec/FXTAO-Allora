const express = require('express');
const sharepointController = require('../controllers/sharepointController');
const sharepointAuthMiddleware = require('../middlewares/sharepointAuthMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');

const router = express.Router();

router.use(sharepointAuthMiddleware);
router.use(tenantDatabaseMiddleware);
router.get('/works/:identifier', sharepointController.getWork);

module.exports = router;
