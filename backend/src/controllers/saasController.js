const { catalogPrisma: prisma, getTenantClient } = require('../services/prismaService');
const crypto = require('crypto');
const {
    ensureBootstrapTenant,
    ensureDefaultPlan,
    findTenantBySlugOrHost,
    normalizeHostname,
    safeListTenants,
    sanitizeTenant,
    writeAuditLog,
} = require('../services/saasCatalogService');
const {
    PROVIDER_MICROSOFT,
    defaultRedirectUri,
    encryptSecret,
    microsoftConfigFromTenant,
    publicSsoConfig,
} = require('../services/ssoConfigService');
const { provisionTenantDatabase } = require('../services/tenantProvisioningService');


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

const loadTenantUser = async (req, tenant) => {
    if (!req.userId || !tenant?.database_url) return null;

    const tenantDb = getTenantClient(tenant.database_url);
    return tenantDb.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, role: true, full_name: true, is_active: true },
    });
};

const parseEmailAllowedDomains = (value) => {
    const items = Array.isArray(value)
        ? value
        : String(value || '').split(',');
    const domainPattern = /^(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
    const invalid = [];
    const domains = [];

    for (const item of items) {
        const raw = String(item || '').trim().toLowerCase();
        if (!raw) continue;

        const isInvalid = raw.includes('://')
            || raw.includes('/')
            || raw.includes(':')
            || raw.includes('@')
            || raw.includes('*')
            || !domainPattern.test(raw);

        if (isInvalid) {
            invalid.push(raw);
        } else {
            domains.push(raw);
        }
    }

    return {
        domains: Array.from(new Set(domains)),
        invalid: Array.from(new Set(invalid)),
    };
};

const normalizeOrigin = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
        return `${url.protocol}//${url.hostname}`.toLowerCase();
    } catch (error) {
        return raw.replace(/\/$/, '').toLowerCase();
    }
};

const normalizeCsvList = (value, normalizer = (item) => String(item || '').trim()) => {
    const items = Array.isArray(value) ? value : String(value || '').split(',');
    return Array.from(new Set(items.map(normalizer).filter(Boolean)));
};

const sharepointConfigFromTenant = (tenant) => {
    const configs = Array.isArray(tenant?.sharepoint_configs) ? tenant.sharepoint_configs : [];
    return configs[0] || null;
};

const publicSharepointConfig = (config) => config ? {
    id: config.id,
    authority_tenant_id: config.authority_tenant_id || '',
    api_client_id: config.api_client_id || '',
    api_resource_uri: config.api_resource_uri || '',
    required_scope: config.required_scope || 'access_as_user',
    allowed_origins: config.allowed_origins || [],
    allowed_client_ids: config.allowed_client_ids || [],
    is_enabled: Boolean(config.is_enabled),
    last_tested_at: config.last_tested_at || null,
    last_test_status: config.last_test_status || null,
} : {
    authority_tenant_id: '',
    api_client_id: '',
    api_resource_uri: '',
    required_scope: 'access_as_user',
    allowed_origins: [],
    allowed_client_ids: [],
    is_enabled: false,
};

const resolveManageableTenant = async (req, res) => {
    const assistedSlug = req.headers['x-fx4-tenant-slug'] || req.headers['x-tenant-slug'];

    if (assistedSlug) {
        const user = await requireFx4Admin(req, res);
        if (!user) return null;

        const tenant = await findTenantBySlugOrHost(assistedSlug);
        if (!tenant) {
            res.status(404).json({ error: 'Tenant não encontrado.' });
            return null;
        }

        return { tenant, user, accessMode: 'assisted' };
    }

    const tokenTenant = req.tokenTenantId
        ? await prisma.saasTenant.findUnique({
            where: { id: req.tokenTenantId },
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        })
        : null;
    const tenant = req.tenant?.id ? req.tenant : tokenTenant;

    if (!tenant?.id) {
        res.status(400).json({ error: 'Selecione um cliente para gerenciar estas configurações.' });
        return null;
    }

    if (req.tokenTenantId !== tenant.id) {
        res.status(403).json({ error: 'Sessão não pertence a este tenant.' });
        return null;
    }

    const user = await loadTenantUser(req, tenant);
    if (!user?.is_active || !isFx4Admin(user)) {
        res.status(403).json({ error: 'Configuração restrita a administradores do cliente.' });
        return null;
    }

    return { tenant, user, accessMode: 'tenant' };
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

const publicTenantContext = (tenant) => {
    const safeTenant = sanitizeTenant(tenant);
    if (!safeTenant) return null;

    const {
        database_label,
        has_database_url,
        sso_configs,
        ...publicTenant
    } = safeTenant;

    return publicTenant;
};

const tenantSettingsResponse = (tenant) => ({
    tenant: sanitizeTenant(tenant),
    microsoft_sso: publicSsoConfig(microsoftConfigFromTenant(tenant)) || {
        provider: PROVIDER_MICROSOFT,
        authority_tenant_id: '',
        client_id: '',
        redirect_uri: defaultRedirectUri(tenant?.primary_domain || tenant?.app_subdomain),
        allowed_domains: [],
        is_enabled: false,
        has_client_secret: false,
    },
    sharepoint_webpart: publicSharepointConfig(sharepointConfigFromTenant(tenant)),
});

exports.context = async (req, res) => {
    res.json({
        tenant: publicTenantContext(req.tenant),
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
            provision_database = true,
            local_login_enabled = true,
            microsoft_login_enabled = false,
        } = req.body;

        if (!slug || !display_name) {
            return res.status(400).json({ error: 'Slug e nome do cliente são obrigatórios.' });
        }

        const normalizedSlug = String(slug).trim().toLowerCase();
        const normalizedPrimaryDomain = normalizeHostname(primary_domain) || null;
        const normalizedAppSubdomain = normalizeHostname(app_subdomain) || null;

        let tenantDatabaseUrl = database_url;
        let tenantDatabaseLabel = database_label;
        let provisionedDatabase = null;

        if (!tenantDatabaseUrl && provision_database !== false) {
            provisionedDatabase = await provisionTenantDatabase({
                slug: normalizedSlug,
                databaseLabel: database_label,
            });
            tenantDatabaseUrl = provisionedDatabase.databaseUrl;
            tenantDatabaseLabel = provisionedDatabase.databaseLabel;
        }

        const tenant = await prisma.saasTenant.create({
            data: {
                id: crypto.randomUUID(),
                slug: normalizedSlug,
                display_name,
                legal_name,
                document,
                primary_domain: normalizedPrimaryDomain,
                app_subdomain: normalizedAppSubdomain,
                plan_code,
                database_url: tenantDatabaseUrl,
                database_label: tenantDatabaseLabel,
                local_login_enabled,
                microsoft_login_enabled,
                domains: normalizedPrimaryDomain ? {
                    create: {
                        id: crypto.randomUUID(),
                        hostname: normalizedPrimaryDomain,
                        is_primary: true,
                        proxy_status: 'pending',
                        ssl_status: 'pending',
                    },
                } : undefined,
            },
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        });

        await writeAuditLog({
            req,
            tenantId: tenant.id,
            userEmail: user.email,
            action: 'saas.tenant.create',
            resource: 'saas_tenants',
            afterData: {
                slug: normalizedSlug,
                display_name,
                database_label: tenantDatabaseLabel || null,
                database_created: Boolean(provisionedDatabase?.created),
            },
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
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
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
            'database_url',
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

        let provisionedDatabase = null;
        if (!existing.database_url && !data.database_url && req.body.provision_database === true) {
            provisionedDatabase = await provisionTenantDatabase({
                slug: data.slug || existing.slug,
                databaseLabel: data.database_label || existing.database_label,
            });
            data.database_url = provisionedDatabase.databaseUrl;
            data.database_label = provisionedDatabase.databaseLabel;
        }

        const tenant = await prisma.saasTenant.update({
            where: { id },
            data,
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
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
            afterData: {
                slug: tenant.slug,
                display_name: tenant.display_name,
                database_label: tenant.database_label || null,
                database_created: Boolean(provisionedDatabase?.created),
            },
        });

        res.json(await tenantResponse(tenant));
    } catch (error) {
        res.status(500).json({ error: 'Falha ao atualizar tenant.', details: error.message });
    }
};

exports.getTenantSettings = async (req, res) => {
    const context = await resolveManageableTenant(req, res);
    if (!context) return;

    try {
        const tenant = await prisma.saasTenant.findUnique({
            where: { id: context.tenant.id },
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        });

        if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado.' });
        res.json(tenantSettingsResponse(tenant));
    } catch (error) {
        res.status(500).json({ error: 'Falha ao carregar configurações do tenant.', details: error.message });
    }
};

exports.updateTenantSettings = async (req, res) => {
    const context = await resolveManageableTenant(req, res);
    if (!context) return;

    try {
        const existing = await prisma.saasTenant.findUnique({
            where: { id: context.tenant.id },
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        });

        if (!existing) return res.status(404).json({ error: 'Tenant não encontrado.' });

        const {
            primary_domain,
            app_subdomain,
            branding_logo_url,
            local_login_enabled,
            microsoft_login_enabled,
            microsoft_sso,
            sharepoint_webpart,
        } = req.body;

        const tenantData = {};
        if (primary_domain !== undefined) tenantData.primary_domain = normalizeHostname(primary_domain) || null;
        if (app_subdomain !== undefined) tenantData.app_subdomain = normalizeHostname(app_subdomain) || null;
        if (branding_logo_url !== undefined) tenantData.branding_logo_url = String(branding_logo_url || '').trim() || null;
        if (local_login_enabled !== undefined) tenantData.local_login_enabled = Boolean(local_login_enabled);
        if (microsoft_login_enabled !== undefined) tenantData.microsoft_login_enabled = Boolean(microsoft_login_enabled);

        const tenant = await prisma.saasTenant.update({
            where: { id: existing.id },
            data: tenantData,
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        });

        const domainCandidates = [
            tenantData.primary_domain,
            tenantData.app_subdomain,
        ].filter(Boolean);

        for (const hostname of domainCandidates) {
            await prisma.saasTenantDomain.upsert({
                where: { hostname },
                update: {
                    tenant_id: tenant.id,
                    is_primary: hostname === tenant.primary_domain,
                    proxy_status: 'active',
                    ssl_status: 'pending',
                },
                create: {
                    id: crypto.randomUUID(),
                    tenant_id: tenant.id,
                    hostname,
                    is_primary: hostname === tenant.primary_domain,
                    proxy_status: 'active',
                    ssl_status: 'pending',
                },
            });
        }

        if (microsoft_sso) {
            const currentConfig = microsoftConfigFromTenant(existing);
            const isEnabled = Boolean(microsoft_sso.is_enabled);
            const nextSecret = String(microsoft_sso.client_secret || '').trim();
            const hasSecret = Boolean(nextSecret || currentConfig?.client_secret_encrypted);
            const parsedAllowedDomains = parseEmailAllowedDomains(microsoft_sso.allowed_domains);

            if (isEnabled && (!microsoft_sso.authority_tenant_id || !microsoft_sso.client_id || !hasSecret)) {
                return res.status(400).json({
                    error: 'Para habilitar SSO Microsoft, informe Tenant ID, Client ID e Client Secret.',
                });
            }

            if (parsedAllowedDomains.invalid.length) {
                return res.status(400).json({
                    error: `Domínio de e-mail permitido inválido: ${parsedAllowedDomains.invalid.join(', ')}. Informe apenas domínios como empresa.com.br, sem URL, caminho, e-mail ou curinga.`,
                });
            }

            await prisma.saasSsoConfig.upsert({
                where: { id: currentConfig?.id || crypto.randomUUID() },
                update: {
                    authority_tenant_id: String(microsoft_sso.authority_tenant_id || '').trim() || null,
                    client_id: String(microsoft_sso.client_id || '').trim() || null,
                    client_secret_encrypted: nextSecret ? encryptSecret(nextSecret) : currentConfig?.client_secret_encrypted || null,
                    redirect_uri: String(microsoft_sso.redirect_uri || '').trim() || null,
                    allowed_domains: parsedAllowedDomains.domains,
                    is_enabled: isEnabled,
                },
                create: {
                    id: currentConfig?.id || crypto.randomUUID(),
                    tenant_id: tenant.id,
                    provider: PROVIDER_MICROSOFT,
                    authority_tenant_id: String(microsoft_sso.authority_tenant_id || '').trim() || null,
                    client_id: String(microsoft_sso.client_id || '').trim() || null,
                    client_secret_encrypted: nextSecret ? encryptSecret(nextSecret) : null,
                    redirect_uri: String(microsoft_sso.redirect_uri || '').trim() || null,
                    allowed_domains: parsedAllowedDomains.domains,
                    is_enabled: isEnabled,
                },
            });
        }

        if (sharepoint_webpart) {
            const currentConfig = sharepointConfigFromTenant(existing);
            const isEnabled = Boolean(sharepoint_webpart.is_enabled);
            const apiClientId = String(sharepoint_webpart.api_client_id || '').trim();
            const apiResourceUri = String(sharepoint_webpart.api_resource_uri || '').trim();
            const authorityTenantId = String(sharepoint_webpart.authority_tenant_id || '').trim();
            const requiredScope = String(sharepoint_webpart.required_scope || 'access_as_user').trim() || 'access_as_user';
            const allowedOrigins = normalizeCsvList(sharepoint_webpart.allowed_origins, normalizeOrigin);
            const allowedClientIds = normalizeCsvList(sharepoint_webpart.allowed_client_ids);

            if (isEnabled && (!authorityTenantId || !apiResourceUri || !allowedOrigins.length)) {
                return res.status(400).json({
                    error: 'Para habilitar a webpart SharePoint, informe Tenant ID, Application ID URI e ao menos uma origem SharePoint permitida.',
                });
            }

            await prisma.saasSharepointConfig.upsert({
                where: { id: currentConfig?.id || crypto.randomUUID() },
                update: {
                    authority_tenant_id: authorityTenantId || null,
                    api_client_id: apiClientId || null,
                    api_resource_uri: apiResourceUri || null,
                    required_scope: requiredScope,
                    allowed_origins: allowedOrigins,
                    allowed_client_ids: allowedClientIds,
                    is_enabled: isEnabled,
                },
                create: {
                    id: currentConfig?.id || crypto.randomUUID(),
                    tenant_id: tenant.id,
                    authority_tenant_id: authorityTenantId || null,
                    api_client_id: apiClientId || null,
                    api_resource_uri: apiResourceUri || null,
                    required_scope: requiredScope,
                    allowed_origins: allowedOrigins,
                    allowed_client_ids: allowedClientIds,
                    is_enabled: isEnabled,
                },
            });
        }

        const updated = await prisma.saasTenant.findUnique({
            where: { id: tenant.id },
            include: { domains: true, sso_configs: true, sharepoint_configs: true },
        });

        await writeAuditLog({
            req,
            tenantId: tenant.id,
            userEmail: context.user.email,
            action: 'saas.tenant.settings.update',
            resource: 'saas_tenants',
            beforeData: {
                primary_domain: existing.primary_domain,
                app_subdomain: existing.app_subdomain,
                microsoft_login_enabled: existing.microsoft_login_enabled,
            },
            afterData: {
                primary_domain: updated.primary_domain,
                app_subdomain: updated.app_subdomain,
                microsoft_login_enabled: updated.microsoft_login_enabled,
                sso_enabled: microsoftConfigFromTenant(updated)?.is_enabled || false,
                sharepoint_enabled: sharepointConfigFromTenant(updated)?.is_enabled || false,
            },
        });

        res.json(tenantSettingsResponse(updated));
    } catch (error) {
        res.status(500).json({ error: 'Falha ao salvar configurações do tenant.', details: error.message });
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
