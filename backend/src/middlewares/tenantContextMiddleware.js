const { findTenantByHost } = require('../services/saasCatalogService');

module.exports = async (req, _res, next) => {
    try {
        const forwardedHost = req.headers['x-forwarded-host'];
        const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
        req.tenant = await findTenantByHost(host);
    } catch (error) {
        console.error('Tenant context resolution failed:', error);
        req.tenant = null;
    }

    next();
};
