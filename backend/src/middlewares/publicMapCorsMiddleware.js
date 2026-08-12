const { safeRecordPublicMapAudit } = require('../services/publicMapAuditService');
const { getPublicMapConfig } = require('../services/publicMapConfigService');
const { extractRequestIp } = require('../services/publicMapSecurityService');

const setCorsHeaders = (res, origin) => {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Accept, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
};

const createPublicMapCorsMiddleware = ({
    getConfig = getPublicMapConfig,
    recordAudit = safeRecordPublicMapAudit,
} = {}) => async (req, res, next) => {
    const config = getConfig();
    const origin = String(req.headers.origin || '').trim() || null;

    if (!origin) {
        setCorsHeaders(res, null);
        if (req.method === 'OPTIONS') {
            return res.status(204).send();
        }

        return next();
    }

    const originIsAllowed =
        !config.allowedOrigins.length || config.allowedOrigins.includes(origin);

    if (!originIsAllowed) {
        await recordAudit({
            errorCode: 'ORIGIN_NOT_ALLOWED',
            origin,
            requestIp: extractRequestIp(req),
            statusCode: 403,
            success: false,
        });

        return res.status(403).json({
            error: 'ORIGIN_NOT_ALLOWED',
            message: 'A origem informada nao esta autorizada para consumir o mapa publico.',
        });
    }

    setCorsHeaders(res, origin);

    if (req.method === 'OPTIONS') {
        return res.status(204).send();
    }

    return next();
};

module.exports = createPublicMapCorsMiddleware();
module.exports.createPublicMapCorsMiddleware = createPublicMapCorsMiddleware;
