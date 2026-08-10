const { catalogPrisma: prisma } = require('../services/prismaService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sanitizeTenant, writeAuditLog } = require('../services/saasCatalogService');

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
        const user = await prisma.user.findUnique({ where: { email } });
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
        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { password_hash: _, ...userWithoutPassword } = user;
        res.json({ ...userWithoutPassword, tenant: sanitizeTenant(req.tenant) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public branding used by login page (no token required)
exports.branding = async (_req, res) => {
    try {
        const configs = await prisma.systemConfig.findMany({
            where: { key: { in: ['client_logo_url'] } },
            select: { key: true, value: true }
        });
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
