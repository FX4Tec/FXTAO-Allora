const { findTenantByHost } = require('../services/saasCatalogService');

const normalizeHost = (host) => String(host || '').split(':')[0].toLowerCase();

const centralHosts = () => new Set(
    String(process.env.SAAS_CENTRAL_DOMAINS || '')
        .split(',')
        .map((host) => normalizeHost(host.trim()))
        .filter(Boolean)
);

module.exports = async (req, _res, next) => {
    try {
        const forwardedHost = req.headers['x-forwarded-host'];
        const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
        if (centralHosts().has(normalizeHost(host))) {
            req.tenant = null;
            return next();
        }

        req.tenant = await findTenantByHost(host);
    } catch (error) {
        console.error('Tenant context resolution failed:', error);
        req.tenant = null;
    }

    next();
};
