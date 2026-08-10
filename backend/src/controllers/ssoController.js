const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { writeAuditLog } = require('../services/saasCatalogService');

const prisma = new PrismaClient();

const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3000/api/auth/microsoft/callback';
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

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
    if (req.tenant && req.tenant.microsoft_login_enabled === false) {
        await writeAuditLog({
            req,
            tenantId: req.tenant.id,
            action: 'auth.sso.disabled',
            resource: 'auth',
            result: 'blocked',
        });
        return res.status(403).json({ error: 'Login Microsoft desabilitado para este ambiente.' });
    }

    const state = signStatePayload({
        nonce: crypto.randomUUID(),
        createdAt: Date.now(),
        tenantId: req.tenant?.id || null,
        host: req.headers['x-forwarded-host'] || req.headers.host || null,
    });

    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        response_mode: 'query',
        scope: 'openid profile email User.Read',
        state,
    });

    const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
    res.redirect(url);
};

// 2. Handle Callback
exports.handleMicrosoftCallback = async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('No code received from Microsoft.');
    }

    if (!verifyState(state)) {
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
        console.log('SSO: Exchanging code for token...');
        // Exchange code for token
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: CLIENT_ID,
                scope: 'openid profile email User.Read',
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
                client_secret: CLIENT_SECRET,
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

        // Find or Create User
        console.log('SSO: Finding/Creating user for email:', email);
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('SSO: Creating new user');
            const autoActivate = process.env.SSO_AUTO_ACTIVATE_NEW_USERS === 'true';
            user = await prisma.user.create({
                data: {
                    email,
                    full_name: userProfile.displayName,
                    auth_provider: 'microsoft',
                    sso_id: userProfile.id,
                    role: 'user',
                    is_active: autoActivate,
                },
            });

            await writeAuditLog({
                req,
                tenantId: req.tenant?.id,
                userEmail: email,
                action: autoActivate ? 'auth.sso.first_login.auto_activated' : 'auth.sso.first_login.blocked',
                resource: 'auth',
                result: autoActivate ? 'success' : 'blocked',
            });
        } else {
            console.log('SSO: Updating existing user');
            // Update existing user if needed (link account)
            if (user.auth_provider === 'local' || !user.sso_id) {
                user = await prisma.user.update({
                    where: { email },
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
                tenantId: req.tenant?.id,
                userEmail: email,
                action: 'auth.sso.inactive_user',
                resource: 'auth',
                result: 'blocked',
            });
            return res.redirect(`${frontendUrl}/access-blocked`);
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, role: user.role, tenant_id: req.tenant?.id || null }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        await writeAuditLog({
            req,
            tenantId: req.tenant?.id,
            userEmail: email,
            action: 'auth.sso.success',
            resource: 'auth',
        });

        // Redirect to Frontend
        // Ensure this URL matches your frontend port
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/sso-callback?token=${token}`);

    } catch (error) {
        console.error('SSO Error Full:', JSON.stringify(error.response?.data || error.message, null, 2));
        console.error('SSO Error Stack:', error.stack);
        res.status(500).send('Authentication failed.');
    }
};
