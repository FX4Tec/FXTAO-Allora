const axios = require('axios');
const { catalogPrisma: prisma, getTenantClient } = require('../services/prismaService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { findTenantBySlugOrHost, safeListTenants, writeAuditLog } = require('../services/saasCatalogService');
const { resolveMicrosoftConfig, tenantOrigin } = require('../services/ssoConfigService');

const dbForTenant = (tenant) => (tenant?.database_url ? getTenantClient(tenant.database_url) : prisma);

const resolveTenantFromState = async (req, statePayload) => {
    if (req.tenant?.id) return req.tenant;
    if (!statePayload?.tenantId) return null;

    const tenant = await prisma.saasTenant.findUnique({
        where: { id: statePayload.tenantId },
        include: { domains: true, sso_configs: true },
    });

    return tenant || null;
};

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const findTenantByUserEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) return null;

    const tenants = await safeListTenants();
    for (const tenant of tenants) {
        if (tenant.operational_status === 'suspended' || !tenant.database_url) continue;

        try {
            const tenantDb = getTenantClient(tenant.database_url);
            const user = await tenantDb.user.findUnique({
                where: { email: normalizedEmail },
                select: { id: true },
            });
            if (user) return tenant;
        } catch (error) {
            console.error(`Failed to resolve SSO tenant for ${tenant.slug}:`, error.message);
        }
    }

    return null;
};

const findCatalogUserByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes('@')) return null;

    return prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
    });
};

const resolveTenantForInitiate = async (req) => {
    if (req.tenant?.id) return req.tenant;
    if (req.query.tenant) return findTenantBySlugOrHost(req.query.tenant);
    if (req.query.email) {
        if (await findCatalogUserByEmail(req.query.email)) return null;
        return findTenantByUserEmail(req.query.email);
    }
    return null;
};

const originFromState = (statePayload) => {
    const hostOrigin = tenantOrigin(statePayload?.host);
    return hostOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
};

const isEmailDomainAllowed = (email, allowedDomains = []) => {
    if (!allowedDomains.length) return true;
    const domain = normalizeEmail(email).split('@')[1];
    return Boolean(domain && allowedDomains.includes(domain));
};

const signStatePayload = (payload) => {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'development-secret')
        .update(encodedPayload)
        .digest('base64url');
    return `${encodedPayload}.${signature}`;
};

const verifyState = (state) => {
    try {
        const [encodedPayload, signature] = String(state || '').split('.');
        if (!encodedPayload || !signature) return null;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'development-secret')
            .update(encodedPayload)
            .digest('base64url');

        const receivedBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);
        if (
            receivedBuffer.length !== expectedBuffer.length
            || !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
        ) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (!payload.createdAt || Date.now() - payload.createdAt > STATE_MAX_AGE_MS) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
};

// 1. Redirect to Microsoft Login
exports.initiateMicrosoftLogin = async (req, res) => {
    const tenant = await resolveTenantForInitiate(req);
    const host = req.headers['x-forwarded-host'] || req.headers.host || null;
    const microsoftConfig = resolveMicrosoftConfig(tenant, host);

    if (!microsoftConfig?.clientId || !microsoftConfig?.clientSecret) {
        await writeAuditLog({
            req,
            tenantId: tenant?.id,
            action: 'auth.sso.disabled',
            resource: 'auth',
            result: 'blocked',
        });
        return res.status(403).json({ error: 'Login Microsoft desabilitado para este ambiente.' });
    }

    const state = signStatePayload({
        nonce: crypto.randomUUID(),
        createdAt: Date.now(),
        tenantId: tenant?.id || null,
        tenantSlug: tenant?.slug || null,
        host,
        redirectUri: microsoftConfig.redirectUri,
    });

    const params = new URLSearchParams({
        client_id: microsoftConfig.clientId,
        response_type: 'code',
        redirect_uri: microsoftConfig.redirectUri,
        response_mode: 'query',
        scope: 'openid profile email User.Read',
        state,
    });

    const url = `https://login.microsoftonline.com/${microsoftConfig.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
    res.redirect(url);
};

// 2. Handle Callback
exports.handleMicrosoftCallback = async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('No code received from Microsoft.');
    }

    const statePayload = verifyState(state);

    if (!statePayload) {
        await writeAuditLog({
            req,
            tenantId: req.tenant?.id,
            action: 'auth.sso.invalid_state',
            resource: 'auth',
            result: 'blocked',
        });
        return res.status(400).send('Invalid Microsoft login state.');
    }

    try {
        const tenant = await resolveTenantFromState(req, statePayload);
        const authDb = dbForTenant(tenant);
        const microsoftConfig = resolveMicrosoftConfig(tenant, statePayload.host);

        if (!microsoftConfig?.clientId || !microsoftConfig?.clientSecret) {
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                action: 'auth.sso.callback.disabled',
                resource: 'auth',
                result: 'blocked',
            });
            return res.status(403).send('Microsoft login is disabled for this tenant.');
        }

        console.log('SSO: Exchanging code for token...');
        // Exchange code for token
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${microsoftConfig.tenantId}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: microsoftConfig.clientId,
                scope: 'openid profile email User.Read',
                code: code,
                redirect_uri: statePayload.redirectUri || microsoftConfig.redirectUri,
                grant_type: 'authorization_code',
                client_secret: microsoftConfig.clientSecret,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            console.error('SSO Error: No access_token in response', tokenResponse.data);
            throw new Error('No access_token received from Microsoft');
        }

        // Get User Profile
        const profileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const userProfile = profileResponse.data; // { id, displayName, mail, userPrincipalName }

        const email = userProfile.mail || userProfile.userPrincipalName;

        if (!email) {
            console.error('SSO Error: No email in profile');
            return res.status(400).send('Microsoft did not return an email address.');
        }

        if (tenant && !isEmailDomainAllowed(email, microsoftConfig.allowedDomains)) {
            await writeAuditLog({
                req,
                tenantId: tenant.id,
                userEmail: email,
                action: 'auth.sso.email_domain.blocked',
                resource: 'auth',
                result: 'blocked',
            });
            return res.status(403).send('Email domain is not authorized for this tenant.');
        }

        // Find or Create User
        console.log('SSO: Finding/Creating user for email:', email);
        const normalizedEmail = normalizeEmail(email);
        let user = await authDb.user.findUnique({ where: { email: normalizedEmail } });

        if (!user) {
            console.log('SSO: Creating new user');
            const autoActivate = process.env.SSO_AUTO_ACTIVATE_NEW_USERS === 'true';
            user = await authDb.user.create({
                data: {
                    email: normalizedEmail,
                    full_name: userProfile.displayName,
                    auth_provider: 'microsoft',
                    sso_id: userProfile.id,
                    role: 'user',
                    is_active: autoActivate,
                },
            });

            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: autoActivate ? 'auth.sso.first_login.auto_activated' : 'auth.sso.first_login.blocked',
                resource: 'auth',
                result: autoActivate ? 'success' : 'blocked',
            });
        } else {
            console.log('SSO: Updating existing user');
            // Update existing user if needed (link account)
            if (user.auth_provider === 'local' || !user.sso_id) {
                user = await authDb.user.update({
                    where: { email: normalizedEmail },
                    data: {
                        auth_provider: 'microsoft',
                        sso_id: userProfile.id
                    }
                });
            }
        }

        // Check if user is active
        if (!user.is_active) {
            console.error('SSO Error: User is inactive:', email);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.sso.inactive_user',
                resource: 'auth',
                result: 'blocked',
            });
            return res.redirect(`${frontendUrl}/access-blocked`);
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role, tenant_id: tenant?.id || null }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        await writeAuditLog({
            req,
            tenantId: tenant?.id,
            userEmail: normalizedEmail,
            action: 'auth.sso.success',
            resource: 'auth',
        });

        // Redirect to Frontend
        // Ensure this URL matches your frontend port
        const frontendUrl = originFromState(statePayload);
        res.redirect(`${frontendUrl}/sso-callback?token=${token}`);

    } catch (error) {
        console.error('SSO Error Full:', JSON.stringify(error.response?.data || error.message, null, 2));
        console.error('SSO Error Stack:', error.stack);
        res.status(500).send('Authentication failed.');
    }
};
