const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const normalizeHostname = (host) => String(host || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .toLowerCase();

const isMissingCatalogError = (error) => {
    const message = String(error?.message || '');
    return error?.code === 'P2021'
        || error?.code === '42P01'
        || message.includes('saas_tenants')
        || message.includes('saas_tenant_domains');
};

const defaultTenantPayload = () => ({
    slug: process.env.SAAS_DEFAULT_TENANT_SLUG || 'engetec',
    display_name: process.env.SAAS_DEFAULT_TENANT_NAME || 'Engetec',
    legal_name: process.env.SAAS_DEFAULT_TENANT_LEGAL_NAME || 'Engetec',
    document: process.env.SAAS_DEFAULT_TENANT_DOCUMENT || null,
    primary_domain: normalizeHostname(process.env.SAAS_DEFAULT_TENANT_DOMAIN || process.env.FRONTEND_URL),
    app_subdomain: normalizeHostname(process.env.SAAS_DEFAULT_TENANT_DOMAIN || process.env.FRONTEND_URL),
    plan_code: process.env.SAAS_DEFAULT_PLAN_CODE || 'enterprise',
    database_url: process.env.DATABASE_URL || null,
    database_label: process.env.SAAS_DEFAULT_DATABASE_LABEL || 'tenant-engetec',
    local_login_enabled: process.env.SAAS_DEFAULT_LOCAL_LOGIN_ENABLED !== 'false',
    microsoft_login_enabled: process.env.SAAS_DEFAULT_MICROSOFT_LOGIN_ENABLED === 'true',
    support_notes: 'Tenant inicial preservado a partir da base existente.',
});

const fallbackTenant = () => {
    const payload = defaultTenantPayload();
    return {
        id: process.env.SAAS_DEFAULT_TENANT_ID || payload.slug,
        ...payload,
        domains: payload.primary_domain ? [{ hostname: payload.primary_domain, is_primary: true }] : [],
        source: 'environment',
    };
};

const ensureDefaultPlan = async () => prisma.saasPlan.upsert({
    where: { code: process.env.SAAS_DEFAULT_PLAN_CODE || 'enterprise' },
    update: {
        name: 'Enterprise',
        description: 'Plano corporativo com base segregada por cliente.',
        is_active: true,
    },
    create: {
        id: crypto.randomUUID(),
        code: process.env.SAAS_DEFAULT_PLAN_CODE || 'enterprise',
        name: 'Enterprise',
        description: 'Plano corporativo com base segregada por cliente.',
        user_limit: null,
        work_limit: null,
        integration_limit: null,
        is_active: true,
    },
});

const ensureBootstrapTenant = async () => {
    const payload = defaultTenantPayload();
    const tenant = await prisma.saasTenant.upsert({
        where: { slug: payload.slug },
        update: payload,
        create: {
            id: crypto.randomUUID(),
            ...payload,
        },
        include: { domains: true, sso_configs: true },
    });

    if (payload.primary_domain) {
        await prisma.saasTenantDomain.upsert({
            where: { hostname: payload.primary_domain },
            update: {
                tenant_id: tenant.id,
                is_primary: true,
                proxy_status: 'active',
                ssl_status: 'active',
            },
            create: {
                id: crypto.randomUUID(),
                tenant_id: tenant.id,
                hostname: payload.primary_domain,
                is_primary: true,
                proxy_status: 'active',
                ssl_status: 'active',
            },
        });
    }

    return prisma.saasTenant.findUnique({
        where: { id: tenant.id },
        include: { domains: true, sso_configs: true },
    });
};

const findTenantByHost = async (host) => {
    const hostname = normalizeHostname(host);
    if (!hostname) return fallbackTenant();

    try {
        const domain = await prisma.saasTenantDomain.findUnique({
            where: { hostname },
            include: { tenant: { include: { domains: true, sso_configs: true } } },
        });

        if (domain?.tenant) return { ...domain.tenant, source: 'catalog' };

        const tenant = await prisma.saasTenant.findFirst({
            where: {
                OR: [
                    { primary_domain: hostname },
                    { app_subdomain: hostname },
                ],
            },
            include: { domains: true, sso_configs: true },
        });

        return tenant ? { ...tenant, source: 'catalog' } : fallbackTenant();
    } catch (error) {
        if (isMissingCatalogError(error)) return fallbackTenant();
        throw error;
    }
};

const safeListTenants = async () => {
    try {
        return await prisma.saasTenant.findMany({
            include: { domains: true, sso_configs: true },
            orderBy: { display_name: 'asc' },
        });
    } catch (error) {
        if (isMissingCatalogError(error)) return [fallbackTenant()];
        throw error;
    }
};

const writeAuditLog = async ({ req, tenantId, userEmail, action, resource, beforeData, afterData, result = 'success' }) => {
    try {
        await prisma.saasAuditLog.create({
            data: {
                id: crypto.randomUUID(),
                tenant_id: tenantId || null,
                user_email: userEmail || null,
                ip_address: req?.ip || null,
                user_agent: req?.headers?.['user-agent'] || null,
                action,
                resource: resource || null,
                before_data: beforeData || undefined,
                after_data: afterData || undefined,
                result,
                trace_id: req?.headers?.['x-request-id'] || crypto.randomUUID(),
            },
        });
    } catch (error) {
        if (!isMissingCatalogError(error)) {
            console.error('Failed to write SaaS audit log:', error);
        }
    }
};

module.exports = {
    prisma,
    normalizeHostname,
    fallbackTenant,
    ensureDefaultPlan,
    ensureBootstrapTenant,
    findTenantByHost,
    safeListTenants,
    writeAuditLog,
};
