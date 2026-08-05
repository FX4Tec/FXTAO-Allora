const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middlewares/authMiddleware');
const requireElevatedRole = require('../middlewares/requireElevatedRole');
const taoTransferController = require('../controllers/taoTransferController');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.use(authMiddleware);
router.use(requireElevatedRole);

router.get('/template', taoTransferController.downloadTemplate);
router.get('/export', taoTransferController.exportData);
router.post('/import', upload.single('file'), taoTransferController.importData);

module.exports = router;
