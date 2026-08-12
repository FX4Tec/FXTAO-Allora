const { findTenantBySlugOrHost } = require('../services/saasCatalogService');
const { runWithTenantDatabase } = require('../services/prismaService');

const tenantValueFromRequest = (req) =>
    req.params?.tenantSlug
    || req.query?.tenant
    || req.headers['x-fxtao-tenant']
    || req.headers['x-fx4-tenant-slug']
    || req.headers['x-tenant-slug'];

const publicMapTenantMiddleware = async (req, res, next) => {
    try {
        const tenantValue = String(tenantValueFromRequest(req) || '').trim();
        if (!tenantValue) {
            return res.status(400).json({
                error: 'TENANT_REQUIRED',
                message: 'Informe o tenant do cliente para consumir o mapa publico.',
            });
        }

        const tenant = await findTenantBySlugOrHost(tenantValue);
        if (!tenant?.database_url || tenant.operational_status === 'suspended') {
            return res.status(404).json({
                error: 'TENANT_NOT_FOUND',
                message: 'Cliente nao encontrado ou indisponivel para o mapa publico.',
            });
        }

        req.publicMapTenant = {
            id: tenant.id,
            slug: tenant.slug,
            display_name: tenant.display_name,
        };
        req.tenant = tenant;

        return runWithTenantDatabase(tenant, next);
    } catch (error) {
        return next(error);
    }
};

module.exports = publicMapTenantMiddleware;
