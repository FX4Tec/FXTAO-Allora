const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        // Unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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
