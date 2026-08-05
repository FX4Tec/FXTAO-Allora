const express = require('express');
const sharepointController = require('../controllers/sharepointController');
const sharepointAuthMiddleware = require('../middlewares/sharepointAuthMiddleware');

const router = express.Router();

router.use(sharepointAuthMiddleware);
router.get('/works/:identifier', sharepointController.getWork);

module.exports = router;
