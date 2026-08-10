const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');

router.use(authMiddleware);
router.use(tenantDatabaseMiddleware);

router.post(
    '/',
    uploadController.uploadMiddleware,
    uploadController.handleUploadError,
    uploadController.uploadFile
);

module.exports = router;
