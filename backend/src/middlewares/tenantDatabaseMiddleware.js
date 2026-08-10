const { catalogPrisma, runWithTenantDatabase } = require('../services/prismaService');
const { findTenantBySlugOrHost } = require('../services/saasCatalogService');

const CENTRAL_HOSTS = new Set(
    String(process.env.SAAS_CENTRAL_DOMAINS || process.env.SAAS_DEFAULT_TENANT_DOMAIN || '')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean)
);

const isFx4Admin = (user) => ['admin', 'director'].includes(user?.role);

const resolveTenant = async (req) => {
    const assistedSlug = req.headers['x-fx4-tenant-slug'] || req.headers['x-tenant-slug'];
    if (assistedSlug) {
        return findTenantBySlugOrHost(assistedSlug);
    }

    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0].toLowerCase();
    if (CENTRAL_HOSTS.has(host)) return null;

    return req.tenant?.source === 'catalog' ? req.tenant : null;
};

const tenantDatabaseMiddleware = async (req, res, next) => {
    try {
        const tenant = await resolveTenant(req);
        if (!tenant?.database_url) {
            return next();
        }

        const assistedSlug = req.headers['x-fx4-tenant-slug'] || req.headers['x-tenant-slug'];
        if (assistedSlug) {
            if (req.tokenTenantId) {
                return res.status(403).json({ error: 'Acesso assistido exige sessão central FX4.' });
            }

            const centralUser = await catalogPrisma.user.findUnique({
                where: { id: req.userId },
                select: { id: true, email: true, role: true, is_active: true },
            });

            if (!centralUser?.is_active || !isFx4Admin(centralUser)) {
                return res.status(403).json({ error: 'Acesso assistido restrito à administração FX4.' });
            }

            req.fx4User = centralUser;
            req.assistedTenant = tenant;
        } else if (req.tokenTenantId !== tenant.id) {
            return res.status(403).json({ error: 'Sessão não pertence a este tenant.' });
        }

        req.tenant = tenant;
        return runWithTenantDatabase(tenant, next);
    } catch (error) {
        return next(error);
    }
};

module.exports = tenantDatabaseMiddleware;
