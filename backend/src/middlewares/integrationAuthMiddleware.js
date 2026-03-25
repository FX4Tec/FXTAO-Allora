const { resolveClientByToken } = require('../services/integrationConfigService');

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
    if (!requestIp) return false;

    return allowedEntries.some((entry) => {
        const normalizedEntry = normalizeIp(entry);
        if (!normalizedEntry) return false;

        if (normalizedEntry.includes('/')) {
            return matchesIpv4Cidr(normalizedEntry, requestIp);
        }

        return normalizedEntry === requestIp;
    });
};

module.exports = async (req, res, next) => {
    try {
        if (!isHttpsRequest(req)) {
            return res.status(426).json({
                error: 'HTTPS_REQUIRED',
                message: 'A API de integracao aceita apenas conexoes HTTPS.',
            });
        }

        const authHeader = req.headers.authorization || '';

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'INTEGRATION_TOKEN_REQUIRED',
                message: 'Envie um Bearer token valido para consumir a API de integracao.',
            });
        }

        const token = authHeader.slice('Bearer '.length).trim();
        const { client, ipFilterEnabled } = await resolveClientByToken(token);

        if (!client) {
            return res.status(401).json({
                error: 'INVALID_INTEGRATION_TOKEN',
                message: 'Token de integracao invalido ou inativo.',
            });
        }

        const requestIp = extractRequestIp(req);

        if (ipFilterEnabled) {
            if (!client.allowedIps.length) {
                return res.status(403).json({
                    error: 'IP_FILTER_NOT_CONFIGURED',
                    message: 'O filtro de IP esta ativo, mas este cliente nao possui IPs permitidos cadastrados.',
                });
            }

            if (!isIpAllowed(client.allowedIps, requestIp)) {
                return res.status(403).json({
                    error: 'IP_NOT_ALLOWED',
                    message: 'O IP de origem nao esta autorizado para este cliente de integracao.',
                    requestIp,
                });
            }
        }

        req.integrationClient = {
            key: client.key,
            label: client.label,
            scopes: client.scopes,
            requestIp,
        };

        return next();
    } catch (error) {
        console.error('Integration auth failed:', error);
        return res.status(500).json({ error: 'Failed to validate integration access' });
    }
};
