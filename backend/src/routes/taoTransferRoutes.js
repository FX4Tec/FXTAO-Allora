const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middlewares/authMiddleware');
const tenantDatabaseMiddleware = require('../middlewares/tenantDatabaseMiddleware');
const requireElevatedRole = require('../middlewares/requireElevatedRole');
const taoTransferController = require('../controllers/taoTransferController');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
        fields: 10,
        parts: 12,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = new Set([
            'text/csv',
            'application/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);

        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('Formato inválido. Use xlsx ou csv.'));
        }

        return cb(null, true);
    },
});

router.use(authMiddleware);
router.use(tenantDatabaseMiddleware);
router.use(requireElevatedRole);

router.get('/template', taoTransferController.downloadTemplate);
router.get('/export', taoTransferController.exportData);
router.post(
    '/import',
    upload.single('file'),
    (err, req, res, next) => {
        if (!err) return next();
        if (err instanceof multer.MulterError || err.message === 'Formato inválido. Use xlsx ou csv.') {
            return res.status(400).json({ error: err.message });
        }
        return next(err);
    },
    taoTransferController.importData
);

module.exports = router;
