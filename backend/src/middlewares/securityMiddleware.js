const crypto = require('crypto');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const splitCsv = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeOrigin = (origin) => String(origin || '').replace(/\/$/, '').toLowerCase();

const configuredOrigins = () => {
    const origins = [
        process.env.FRONTEND_URL,
        process.env.CORS_ALLOWED_ORIGINS,
    ].flatMap(splitCsv);

    return new Set(origins.map(normalizeOrigin).filter(Boolean));
};

const configuredOriginSuffixes = () => splitCsv(process.env.SAAS_ALLOWED_ORIGIN_SUFFIXES)
    .map((suffix) => suffix.toLowerCase().replace(/^\*\./, '.'))
    .filter((suffix) => suffix.startsWith('.'));

const originMatchesAllowedSuffix = (origin) => {
    try {
        const hostname = new URL(origin).hostname.toLowerCase();
        return configuredOriginSuffixes().some((suffix) => hostname.endsWith(suffix));
    } catch (error) {
        return false;
    }
};

const requestId = (req, res, next) => {
    const existingId = req.headers['x-request-id'];
    req.id = existingId || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
};

const corsMiddleware = cors({
    credentials: true,
    origin(origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = configuredOrigins();
        if (process.env.NODE_ENV !== 'production' && !allowedOrigins.size) {
            return callback(null, true);
        }

        if (allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }

        if (originMatchesAllowedSuffix(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origem não autorizada pelo CORS.'));
    },
});

const createLimiter = ({ windowMinutes, max, message }) => rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
});

const globalApiLimiter = createLimiter({
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 600),
    message: 'Muitas requisições. Tente novamente em instantes.',
});

const authLimiter = createLimiter({
    windowMinutes: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || 15),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 30),
    message: 'Muitas tentativas de autenticação. Tente novamente mais tarde.',
});

const uploadLimiter = createLimiter({
    windowMinutes: Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MINUTES || 60),
    max: Number(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS || 40),
    message: 'Limite de uploads excedido. Tente novamente mais tarde.',
});

const helmetMiddleware = helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: false,
});

module.exports = {
    requestId,
    corsMiddleware,
    helmetMiddleware,
    globalApiLimiter,
    authLimiter,
    uploadLimiter,
};
