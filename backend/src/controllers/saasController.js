const { catalogPrisma: prisma, getTenantClient } = require('../services/prismaService');
const crypto = require('crypto');
const {
    ensureBootstrapTenant,
    ensureDefaultPlan,
    safeListTenants,
    sanitizeTenant,
    writeAuditLog,
} = require('../services/saasCatalogService');


const isFx4Admin = (user) => ['admin', 'director'].includes(user?.role);

const loadUser = async (req) => {
    if (!req.userId) return null;
    return prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, role: true, full_name: true },
    });
};

const requireFx4Admin = async (req, res) => {
    const user = await loadUser(req);
    if (!isFx4Admin(user)) {
        res.status(403).json({ error: 'Acesso restrito ao painel SaaS FX4.' });
        return null;
    }
    return user;
};

const tenantStats = async (tenant) => {
    if (!tenant?.database_url) return { users_count: 0, taos_count: 0, database_status: 'not_configured' };

    try {
        const client = getTenantClient(tenant.database_url);
        const [users_count, taos_count] = await Promise.all([
            client.user.count(),
            client.tao.count(),
        ]);

        return { users_count, taos_count, database_status: 'connected' };
    } catch (error) {
        return {
            users_count: 0,
            taos_count: 0,
            database_status: 'error',
            database_error: error.message,
        };
    }
};

const tenantResponse = async (tenant) => ({
    ...sanitizeTenant(tenant),
    stats: await tenantStats(tenant),
});

exports.context = async (req, res) => {
    res.json({
        tenant: sanitizeTenant(req.tenant),
        strategy: 'database_per_tenant',
        isolation: 'Banco separado por cliente. A base atual está registrada como tenant Engetec.',
    });
};

exports.bootstrap = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const plan = await ensureDefaultPlan();
        const tenant = await ensureBootstrapTenant();
        await writeAuditLog({
            req,
            tenantId: tenant.id,
            userEmail: user.email,
            action: 'saas.bootstrap',
            resource: 'saas_tenants',
            afterData: { tenant_slug: tenant.slug, plan_code: plan.code },
        });
        res.json({ tenant: sanitizeTenant(tenant), plan });
    } catch (error) {
        console.error('Failed to bootstrap SaaS catalog:', error);
        res.status(500).json({ error: 'Falha ao inicializar catálogo SaaS.', details: error.message });
    }
};

exports.listTenants = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const tenants = await Promise.all((await safeListTenants()).map(tenantResponse));
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao listar tenants.', details: error.message });
    }
};

exports.createTenant = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const {
            slug,
            display_name,
            legal_name,
            document,
            primary_domain,
            app_subdomain,
            plan_code,
            database_url,
            database_label,
            local_login_enabled = true,
            microsoft_login_enabled = false,
        } = req.body;

        if (!slug || !display_name) {
            return res.status(400).json({ error: 'Slug e nome do cliente são obrigatórios.' });
        }

        const tenant = await prisma.saasTenant.create({
            data: {
                id: crypto.randomUUID(),
                slug,
                display_name,
                legal_name,
                document,
                primary_domain,
                app_subdomain,
                plan_code,
                database_url,
                database_label,
                local_login_enabled,
                microsoft_login_enabled,
                domains: primary_domain ? {
                    create: {
                        id: crypto.randomUUID(),
                        hostname: primary_domain,
                        is_primary: true,
                        proxy_status: 'pending',
                        ssl_status: 'pending',
                    },
                } : undefined,
            },
            include: { domains: true, sso_configs: true },
        });

        await writeAuditLog({
            req,
            tenantId: tenant.id,
            userEmail: user.email,
            action: 'saas.tenant.create',
            resource: 'saas_tenants',
            afterData: { slug, display_name },
        });

        res.status(201).json(await tenantResponse(tenant));
    } catch (error) {
        res.status(500).json({ error: 'Falha ao criar tenant.', details: error.message });
    }
};

exports.updateTenant = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const { id } = req.params;
        const existing = await prisma.saasTenant.findUnique({
            where: { id },
            include: { domains: true, sso_configs: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Tenant não encontrado.' });
        }

        const allowedFields = [
            'slug',
            'display_name',
            'legal_name',
            'document',
            'primary_domain',
            'app_subdomain',
            'plan_code',
            'database_label',
            'commercial_status',
            'operational_status',
            'local_login_enabled',
            'microsoft_login_enabled',
            'support_notes',
        ];

        const data = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) data[field] = req.body[field];
        });

        const tenant = await prisma.saasTenant.update({
            where: { id },
            data,
            include: { domains: true, sso_configs: true },
        });

        if (data.primary_domain) {
            await prisma.saasTenantDomain.upsert({
                where: { hostname: data.primary_domain },
                update: {
                    tenant_id: tenant.id,
                    is_primary: true,
                    proxy_status: 'active',
                    ssl_status: 'active',
                },
                create: {
                    id: crypto.randomUUID(),
                    tenant_id: tenant.id,
                    hostname: data.primary_domain,
                    is_primary: true,
                    proxy_status: 'active',
                    ssl_status: 'active',
                },
            });

            await prisma.saasTenantDomain.updateMany({
                where: {
                    tenant_id: tenant.id,
                    hostname: { not: data.primary_domain },
                },
                data: { is_primary: false },
            });
        }

        await writeAuditLog({
            req,
            tenantId: tenant.id,
            userEmail: user.email,
            action: 'saas.tenant.update',
            resource: 'saas_tenants',
            beforeData: { slug: existing.slug, display_name: existing.display_name },
            afterData: { slug: tenant.slug, display_name: tenant.display_name },
        });

        res.json(await tenantResponse(tenant));
    } catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar tenant.', details: error.message });
    }
};

exports.listPlans = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const plans = await prisma.saasPlan.findMany({
            include: { features: true },
            orderBy: { name: 'asc' },
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao listar planos.', details: error.message });
    }
};

exports.listAuditLogs = async (req, res) => {
    const user = await requireFx4Admin(req, res);
    if (!user) return;

    try {
        const logs = await prisma.saasAuditLog.findMany({
            orderBy: { created_at: 'desc' },
            take: 100,
            include: { tenant: { select: { slug: true, display_name: true } } },
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao listar auditoria.', details: error.message });
    }
};
