const { safeRecordPublicMapAudit } = require('../services/publicMapAuditService');
const { getPublicMapConfig } = require('../services/publicMapConfigService');
const { extractRequestIp } = require('../services/publicMapSecurityService');

const requestBuckets = new Map();

const purgeExpiredBuckets = (now) => {
    for (const [key, bucket] of requestBuckets.entries()) {
        if (!bucket || bucket.resetAt <= now) {
            requestBuckets.delete(key);
        }
    }
};

const clearPublicMapRateLimitStore = () => {
    requestBuckets.clear();
};

const createPublicMapRateLimitMiddleware = ({
    getConfig = getPublicMapConfig,
    nowProvider = () => Date.now(),
    recordAudit = safeRecordPublicMapAudit,
} = {}) => async (req, res, next) => {
    const config = getConfig();
    const now = nowProvider();
    const requestIp = req.publicMapRequestIp || extractRequestIp(req);
    const clientKey = req.publicMapClient?.key || 'anonymous';
    const bucketKey = `${clientKey}:${requestIp || 'unknown'}`;
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequests;

    if (requestBuckets.size > 5000) {
        purgeExpiredBuckets(now);
    }

    let bucket = requestBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
        bucket = {
            count: 0,
            resetAt: now + windowMs,
        };
    }

    bucket.count += 1;
    requestBuckets.set(bucketKey, bucket);

    const remaining = Math.max(maxRequests - bucket.count, 0);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > maxRequests) {
        const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1);
        res.setHeader('Retry-After', String(retryAfterSeconds));

        await recordAudit({
            clientKey,
            errorCode: 'RATE_LIMIT_EXCEEDED',
            origin: String(req.headers.origin || '').trim() || null,
            requestIp,
            statusCode: 429,
            success: false,
        });

        return res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Limite de requisicoes excedido para o mapa publico.',
        });
    }

    return next();
};

module.exports = createPublicMapRateLimitMiddleware();
module.exports.clearPublicMapRateLimitStore = clearPublicMapRateLimitStore;
module.exports.createPublicMapRateLimitMiddleware = createPublicMapRateLimitMiddleware;
