const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    }
});

const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
    storage: storage,
    limits: {
        fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
        files: 1,
        fields: 10,
        parts: 12,
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('Tipo de arquivo não permitido.'));
        }
        return cb(null, true);
    },
});

// Middleware for single file upload 'file'
exports.uploadMiddleware = upload.single('file');

exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct URL - assuming we serve 'uploads' statically at /uploads
    // In production, this would be an S3 URL or similar.
    // We need the full URL or relative path.
    // Let's return a relative path for now, or full URL if we knew the host.
    // The frontend can handle full URL if we prepend generic host, or relative.
    // Base44 likely returned a full URL.
    // Let's return: `${process.env.API_URL}/uploads/${req.file.filename}`
    // But API_URL is frontend env. Backend doesn't know its own public URL easily without config.
    // Let's assume localhost:3000 for now or use req.protocol + host.

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({ file_url: fileUrl, filename: req.file.filename, mimetype: req.file.mimetype });
};

exports.handleUploadError = (err, req, res, next) => {
    if (!err) return next();

    if (err instanceof multer.MulterError || err.message === 'Tipo de arquivo não permitido.') {
        return res.status(400).json({ error: err.message });
    }

    return next(err);
};
