const crypto = require('crypto');

const PROVIDER_MICROSOFT = 'microsoft';

const encryptionSecret = () => process.env.SSO_SECRET_ENCRYPTION_KEY || process.env.JWT_SECRET || 'development-secret';

const encryptionKey = () => crypto
    .createHash('sha256')
    .update(encryptionSecret())
    .digest();

const encryptSecret = (value) => {
    const plain = String(value || '');
    if (!plain) return null;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
};

const decryptSecret = (value) => {
    if (!value) return null;

    const [version, ivValue, tagValue, encryptedValue] = String(value).split(':');
    if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
        throw new Error('Formato inválido de segredo SSO.');
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValue, 'base64url')),
        decipher.final(),
    ]).toString('utf8');
};

const microsoftConfigFromTenant = (tenant) => {
    if (!tenant) return null;
    return (tenant.sso_configs || []).find((config) => config.provider === PROVIDER_MICROSOFT) || null;
};

const tenantOrigin = (host) => {
    const hostname = String(host || '').split(',')[0].trim().split(':')[0].toLowerCase();
    return hostname ? `https://${hostname}` : null;
};

const defaultRedirectUri = (host) => {
    const origin = tenantOrigin(host) || process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${origin.replace(/\/$/, '')}/api/v1/auth/microsoft/callback`;
};

const resolveMicrosoftConfig = (tenant, host) => {
    if (tenant) {
        const config = microsoftConfigFromTenant(tenant);
        if (!tenant.microsoft_login_enabled || !config?.is_enabled) return null;

        return {
            provider: PROVIDER_MICROSOFT,
            tenantId: config.authority_tenant_id || 'common',
            clientId: config.client_id,
            clientSecret: decryptSecret(config.client_secret_encrypted),
            redirectUri: config.redirect_uri || defaultRedirectUri(host),
            allowedDomains: config.allowed_domains || [],
        };
    }

    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) return null;

    return {
        provider: PROVIDER_MICROSOFT,
        tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || defaultRedirectUri(host),
        allowedDomains: [],
    };
};

const publicSsoConfig = (config) => {
    if (!config) return null;
    return {
        id: config.id,
        provider: config.provider,
        authority_tenant_id: config.authority_tenant_id || '',
        client_id: config.client_id || '',
        redirect_uri: config.redirect_uri || '',
        allowed_domains: config.allowed_domains || [],
        is_enabled: Boolean(config.is_enabled),
        has_client_secret: Boolean(config.client_secret_encrypted),
        last_tested_at: config.last_tested_at,
        last_test_status: config.last_test_status,
    };
};

module.exports = {
    PROVIDER_MICROSOFT,
    encryptSecret,
    decryptSecret,
    microsoftConfigFromTenant,
    resolveMicrosoftConfig,
    publicSsoConfig,
    defaultRedirectUri,
    tenantOrigin,
};
