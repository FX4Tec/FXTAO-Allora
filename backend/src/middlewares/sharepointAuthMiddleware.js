const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const CACHE_TTL_MS = 60 * 60 * 1000;
let openIdCache = null;

const splitEnvList = (value) => String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const loadOpenIdConfiguration = async (tenantId) => {
    if (openIdCache && openIdCache.expiresAt > Date.now()) {
        return openIdCache;
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
    openIdCache = {
        issuer: metadata.issuer,
        keys: jwks.keys || [],
        expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return openIdCache;
};

module.exports = async (req, res, next) => {
    try {
        const tenantId = process.env.MICROSOFT_TENANT_ID;
        const audiences = splitEnvList(process.env.SHAREPOINT_API_AUDIENCE);
        const requiredScope = process.env.SHAREPOINT_REQUIRED_SCOPE || 'access_as_user';

        if (!tenantId || audiences.length === 0) {
            return res.status(503).json({
                error: 'Integração SharePoint não configurada.',
                details: 'Defina MICROSOFT_TENANT_ID e SHAREPOINT_API_AUDIENCE.',
            });
        }

        const [scheme, token] = String(req.headers.authorization || '').split(' ');
        if (!/^Bearer$/i.test(scheme || '') || !token) {
            return res.status(401).json({ error: 'Token Entra ID ausente ou malformado.' });
        }

        const decodedHeader = jwt.decode(token, { complete: true });
        if (!decodedHeader?.header?.kid) {
            return res.status(401).json({ error: 'Token Entra ID inválido.' });
        }

        const metadata = await loadOpenIdConfiguration(tenantId);
        const signingKey = metadata.keys.find((key) => key.kid === decodedHeader.header.kid);
        if (!signingKey) {
            openIdCache = null;
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

        const allowedClientIds = splitEnvList(process.env.SHAREPOINT_ALLOWED_CLIENT_IDS);
        const callingClientId = claims.azp || claims.appid;
        if (allowedClientIds.length > 0 && !allowedClientIds.includes(callingClientId)) {
            return res.status(403).json({ error: 'Aplicativo cliente não autorizado.' });
        }

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
