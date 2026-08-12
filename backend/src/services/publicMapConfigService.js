const DEFAULT_RATE_LIMIT = Object.freeze({
    maxRequests: 60,
    windowMs: 60 * 1000,
});

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

    return fallback;
};

const normalizeBaseUrl = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;

    return trimmed.replace(/\/+$/, '');
};

const parseAllowedOrigins = (value) =>
    Array.from(
        new Set(
            String(value || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );

const parsePositiveInteger = (value, fallback) => {
    const numericValue = Number(value);

    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        return fallback;
    }

    return numericValue;
};

const parseRateLimit = (value) => {
    const [maxRequestsRaw, windowMinutesRaw] = String(value || '').split(',');
    const maxRequests = parsePositiveInteger(maxRequestsRaw, DEFAULT_RATE_LIMIT.maxRequests);
    const windowMinutes = parsePositiveInteger(windowMinutesRaw, DEFAULT_RATE_LIMIT.windowMs / 60000);

    return {
        maxRequests,
        windowMs: windowMinutes * 60 * 1000,
    };
};

const getPublicMapConfig = () => ({
    allowedOrigins: parseAllowedOrigins(process.env.FXTAO_PUBLIC_MAP_ALLOWED_ORIGINS),
    assetBaseUrl: normalizeBaseUrl(process.env.FXTAO_PUBLIC_MAP_ASSET_BASE_URL),
    cacheTtlMs: parsePositiveInteger(process.env.FXTAO_PUBLIC_MAP_CACHE_TTL_SECONDS, DEFAULT_CACHE_TTL_MS / 1000) * 1000,
    envToken: String(process.env.FXTAO_PUBLIC_MAP_TOKEN || '').trim(),
    publicBaseUrl: normalizeBaseUrl(process.env.FXTAO_PUBLIC_MAP_PUBLIC_BASE_URL),
    rateLimit: parseRateLimit(process.env.FXTAO_PUBLIC_MAP_RATE_LIMIT),
    requireHttps: parseBoolean(process.env.FXTAO_PUBLIC_MAP_REQUIRE_HTTPS, true),
});

module.exports = {
    DEFAULT_CACHE_TTL_MS,
    DEFAULT_RATE_LIMIT,
    getPublicMapConfig,
    parseAllowedOrigins,
    parseRateLimit,
};
