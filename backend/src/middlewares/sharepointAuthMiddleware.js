const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { catalogPrisma } = require('../services/prismaService');

const CACHE_TTL_MS = 60 * 60 * 1000;
const openIdCache = new Map();

const splitEnvList = (value) => String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const normalizeOrigin = (origin) => String(origin || '').replace(/\/$/, '').toLowerCase();

const normalizeAudience = (value) => String(value || '').trim();

const loadOpenIdConfiguration = async (tenantId) => {
    const cached = openIdCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached;
    }

    const metadataUrl = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
        throw new Error(`Falha ao consultar metadados Entra ID (${metadataResponse.status}).`);
    }

    const metadata = await metadataResponse.json();
    const jwksResponse = await fetch(metadata.jwks_uri);
    if (!jwksResponse.ok) {
        throw new Error(`Falha ao consultar chaves Entra ID (${jwksResponse.status}).`);
    }

    const jwks = await jwksResponse.json();
    const nextCache = {
        issuer: metadata.issuer,
        keys: jwks.keys || [],
        expiresAt: Date.now() + CACHE_TTL_MS,
    };
    openIdCache.set(tenantId, nextCache);
    return nextCache;
};

const findTenantConfig = async ({ origin, claims }) => {
    const normalizedOrigin = normalizeOrigin(origin);
    const tokenTenantId = String(claims?.tid || '').trim();
    const tokenAudience = normalizeAudience(claims?.aud);

    if (!normalizedOrigin && !tokenTenantId && !tokenAudience) return null;

    try {
        const configs = await catalogPrisma.saasSharepointConfig.findMany({
            where: {
                is_enabled: true,
                tenant: { operational_status: 'active' },
                ...(normalizedOrigin ? { allowed_origins: { has: normalizedOrigin } } : {}),
            },
            include: {
                tenant: { include: { domains: true, sso_configs: true, sharepoint_configs: true } },
            },
        });

        return configs.find((config) => {
            const authorityMatches = !config.authority_tenant_id || !tokenTenantId || config.authority_tenant_id === tokenTenantId;
            const audiences = [config.api_resource_uri, config.api_client_id ? `api://${config.api_client_id}` : null, config.api_client_id]
                .map(normalizeAudience)
                .filter(Boolean);
            const audienceMatches = !tokenAudience || audiences.includes(tokenAudience);
            return authorityMatches && audienceMatches;
        }) || null;
    } catch (error) {
        if (['P2021', 'P2022'].includes(error?.code)) return null;
        throw error;
    }
};

module.exports = async (req, res, next) => {
    try {
        const [scheme, token] = String(req.headers.authorization || '').split(' ');
        if (!/^Bearer$/i.test(scheme || '') || !token) {
            return res.status(401).json({ error: 'Token Entra ID ausente ou malformado.' });
        }

        const decodedHeader = jwt.decode(token, { complete: true });
        if (!decodedHeader?.header?.kid) {
            return res.status(401).json({ error: 'Token Entra ID inválido.' });
        }

        const decodedClaims = jwt.decode(token) || {};
        const tenantConfig = await findTenantConfig({
            origin: req.headers.origin,
            claims: decodedClaims,
        });

        const tenantId = tenantConfig?.authority_tenant_id || process.env.MICROSOFT_TENANT_ID;
        const audiences = tenantConfig
            ? [
                tenantConfig.api_resource_uri,
                tenantConfig.api_client_id ? `api://${tenantConfig.api_client_id}` : null,
                tenantConfig.api_client_id,
            ].map(normalizeAudience).filter(Boolean)
            : splitEnvList(process.env.SHAREPOINT_API_AUDIENCE);
        const requiredScope = tenantConfig?.required_scope || process.env.SHAREPOINT_REQUIRED_SCOPE || 'access_as_user';

        if (!tenantId || audiences.length === 0) {
            return res.status(503).json({
                error: 'Integração SharePoint não configurada.',
                details: 'Configure a webpart SharePoint no cadastro do cliente SaaS.',
            });
        }

        const metadata = await loadOpenIdConfiguration(tenantId);
        const signingKey = metadata.keys.find((key) => key.kid === decodedHeader.header.kid);
        if (!signingKey) {
            openIdCache.delete(tenantId);
            return res.status(401).json({ error: 'Chave de assinatura Entra ID não reconhecida.' });
        }

        const publicKey = crypto.createPublicKey({ key: signingKey, format: 'jwk' });
        const claims = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            audience: audiences,
            issuer: [metadata.issuer, `https://sts.windows.net/${tenantId}/`],
        });

        const scopes = String(claims.scp || '').split(' ').filter(Boolean);
        if (!scopes.includes(requiredScope)) {
            return res.status(403).json({ error: `Escopo obrigatório ausente: ${requiredScope}.` });
        }

        const allowedClientIds = tenantConfig?.allowed_client_ids?.length
            ? tenantConfig.allowed_client_ids
            : splitEnvList(process.env.SHAREPOINT_ALLOWED_CLIENT_IDS);
        const callingClientId = claims.azp || claims.appid;
        if (allowedClientIds.length > 0 && !allowedClientIds.includes(callingClientId)) {
            return res.status(403).json({ error: 'Aplicativo cliente não autorizado.' });
        }

        req.sharepointTenant = tenantConfig?.tenant || null;
        req.sharepointIdentity = {
            tenantId: claims.tid,
            objectId: claims.oid,
            email: claims.preferred_username || claims.upn || null,
            clientId: callingClientId || null,
            scopes,
        };
        return next();
    } catch (error) {
        console.error('SharePoint token validation failed:', error.message);
        return res.status(401).json({ error: 'Token Entra ID inválido ou expirado.' });
    }
};
