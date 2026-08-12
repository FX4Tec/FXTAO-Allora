const crypto = require('crypto');

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const isHttpsRequest = (req) => {
    if (req.secure) return true;

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim()
        .toLowerCase();

    return forwardedProto === 'https';
};

const normalizeIp = (value) => {
    if (!value) return '';

    let normalized = String(value).trim();

    if (normalized.includes(',')) {
        normalized = normalized.split(',')[0].trim();
    }

    if (normalized.startsWith('::ffff:')) {
        normalized = normalized.slice(7);
    }

    if (normalized === '::1') {
        normalized = '127.0.0.1';
    }

    if (normalized.includes(':') && normalized.includes('.') && normalized.lastIndexOf(':') > normalized.lastIndexOf('.')) {
        normalized = normalized.slice(0, normalized.lastIndexOf(':'));
    }

    return normalized;
};

const extractRequestIp = (req) =>
    normalizeIp(
        req.headers['x-forwarded-for'] ||
        req.ip ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        ''
    );

const ipv4ToNumber = (ip) =>
    ip.split('.').reduce((result, part) => ((result << 8) >>> 0) + Number(part), 0) >>> 0;

const matchesIpv4Cidr = (allowedEntry, requestIp) => {
    const [network, prefixRaw] = allowedEntry.split('/');
    const prefix = Number(prefixRaw);

    if (!IPV4_REGEX.test(network) || !IPV4_REGEX.test(requestIp)) return false;
    if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
    if (prefix === 0) return true;

    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (ipv4ToNumber(network) & mask) === (ipv4ToNumber(requestIp) & mask);
};

const isIpAllowed = (allowedEntries, requestIp) => {
    if (!requestIp || !Array.isArray(allowedEntries)) return false;

    return allowedEntries.some((entry) => {
        const normalizedEntry = normalizeIp(entry);
        if (!normalizedEntry) return false;

        if (normalizedEntry.includes('/')) {
            return matchesIpv4Cidr(normalizedEntry, requestIp);
        }

        return normalizedEntry === requestIp;
    });
};

const timingSafeCompare = (leftValue, rightValue) => {
    const left = String(leftValue || '');
    const right = String(rightValue || '');

    if (!left || !right) return false;

    const leftHash = crypto.createHash('sha256').update(left).digest();
    const rightHash = crypto.createHash('sha256').update(right).digest();

    return crypto.timingSafeEqual(leftHash, rightHash);
};

module.exports = {
    extractRequestIp,
    isHttpsRequest,
    isIpAllowed,
    normalizeIp,
    timingSafeCompare,
};
