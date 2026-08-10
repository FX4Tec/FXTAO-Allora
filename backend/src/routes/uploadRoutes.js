const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post(
    '/',
    uploadController.uploadMiddleware,
    uploadController.handleUploadError,
    uploadController.uploadFile
);

module.exports = router;
