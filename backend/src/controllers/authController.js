const { catalogPrisma: prisma, getTenantClient } = require('../services/prismaService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeTenant, writeAuditLog } = require('../services/saasCatalogService');

const dbForRequest = (req) => (req.tenant?.database_url ? getTenantClient(req.tenant.database_url) : prisma);

const userSelect = {
    id: true,
    email: true,
    full_name: true,
    role: true,
    can_view_restricted_tao_fields: true,
    auth_provider: true,
    sso_id: true,
    avatar_url: true,
    is_active: true,
    created_at: true,
    updated_at: true,
};

const loginAttempts = new Map();

const getLoginKey = (req, email) => `${req.ip || 'unknown'}:${String(email || '').toLowerCase()}`;

const isRateLimited = (req, email) => {
    const key = getLoginKey(req, email);
    const current = loginAttempts.get(key);
    if (!current) return false;

    if (current.blockedUntil && current.blockedUntil > Date.now()) return true;
    if (current.blockedUntil && current.blockedUntil <= Date.now()) loginAttempts.delete(key);
    return false;
};

const registerFailedLogin = (req, email) => {
    const key = getLoginKey(req, email);
    const current = loginAttempts.get(key) || { count: 0, blockedUntil: null };
    const count = current.count + 1;
    loginAttempts.set(key, {
        count,
        blockedUntil: count >= 8 ? Date.now() + 15 * 60 * 1000 : null,
    });
};

const clearFailedLogin = (req, email) => {
    loginAttempts.delete(getLoginKey(req, email));
};

// Register a new user (Internal/Seed use mostly)
exports.register = async (req, res) => {
    try {
        if (process.env.ALLOW_PUBLIC_REGISTER !== 'true') {
            return res.status(403).json({ error: 'Registro publico desabilitado.' });
        }

        const { email, password, full_name, role } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password_hash,
                full_name,
                role: role || 'user',
                can_view_restricted_tao_fields: Boolean(req.body.can_view_restricted_tao_fields),
            },
        });

        // Remove password from response
        const { password_hash: _, ...userWithoutPassword } = user;

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const tenant = req.tenant;
        const authDb = dbForRequest(req);

        if (tenant && tenant.local_login_enabled === false) {
            await writeAuditLog({
                req,
                tenantId: tenant.id,
                userEmail: email,
                action: 'auth.local_login.blocked',
                resource: 'auth',
                result: 'blocked',
            });
            return res.status(403).json({ error: 'Login local desabilitado para este ambiente.' });
        }

        if (isRateLimited(req, email)) {
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.local_login.rate_limited',
                resource: 'auth',
                result: 'blocked',
            });
            return res.status(429).json({ error: 'Muitas tentativas invalidas. Tente novamente mais tarde.' });
        }

        console.log(`Login attempt for: ${email}`);
        const user = await authDb.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found');
            registerFailedLogin(req, email);
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.local_login.failed',
                resource: 'auth',
                result: 'failed',
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.local_login.inactive_user',
                resource: 'auth',
                result: 'blocked',
            });
            return res.status(403).json({ error: 'User account is inactive' });
        }

        if (!user.password_hash) {
            registerFailedLogin(req, email);
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.local_login.password_unavailable',
                resource: 'auth',
                result: 'failed',
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match for ${email}: ${isMatch}`);
        if (!isMatch) {
            registerFailedLogin(req, email);
            await writeAuditLog({
                req,
                tenantId: tenant?.id,
                userEmail: email,
                action: 'auth.local_login.failed',
                resource: 'auth',
                result: 'failed',
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        clearFailedLogin(req, email);

        const token = jwt.sign({ id: user.id, role: user.role, tenant_id: tenant?.id || null }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        const { password_hash: _, ...userWithoutPassword } = user;

        await writeAuditLog({
            req,
            tenantId: tenant?.id,
            userEmail: email,
            action: 'auth.local_login.success',
            resource: 'auth',
        });

        res.status(200).json({ token, user: userWithoutPassword, tenant: sanitizeTenant(tenant) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get current user
exports.me = async (req, res) => {
    try {
        if (req.tenant?.id && req.tokenTenantId && req.tokenTenantId !== req.tenant.id) {
            return res.status(403).json({ error: 'Token não pertence a este tenant.' });
        }

        const authDb = dbForRequest(req);
        const user = await authDb.user.findUnique({ where: { id: req.userId }, select: userSelect });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ ...user, tenant: sanitizeTenant(req.tenant) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
        }

        if (String(new_password).length < 8) {
            return res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
        }

        if (req.tenant?.id && req.tokenTenantId && req.tokenTenantId !== req.tenant.id) {
            return res.status(403).json({ error: 'Token não pertence a este tenant.' });
        }

        const authDb = dbForRequest(req);
        const user = await authDb.user.findUnique({ where: { id: req.userId } });
        if (!user || !user.password_hash) {
            return res.status(404).json({ error: 'Usuário local não encontrado.' });
        }

        const isMatch = await bcrypt.compare(current_password, user.password_hash);
        if (!isMatch) {
            await writeAuditLog({
                req,
                tenantId: req.tenant?.id,
                userEmail: user.email,
                action: 'auth.password_change.failed',
                resource: 'auth',
                result: 'failed',
            });
            return res.status(401).json({ error: 'Senha atual inválida.' });
        }

        const password_hash = await bcrypt.hash(new_password, 10);
        await authDb.user.update({
            where: { id: user.id },
            data: { password_hash },
        });

        await writeAuditLog({
            req,
            tenantId: req.tenant?.id,
            userEmail: user.email,
            action: 'auth.password_change.success',
            resource: 'auth',
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public branding used by login page (no token required)
exports.branding = async (req, res) => {
    try {
        const authDb = dbForRequest(req);
        const configs = await authDb.systemConfig.findMany({
            where: { key: { in: ['client_logo_url'] } },
            select: { key: true, value: true }
        });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
