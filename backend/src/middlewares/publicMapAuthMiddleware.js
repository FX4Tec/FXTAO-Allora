const { safeRecordPublicMapAudit } = require('../services/publicMapAuditService');
const { getPublicMapConfig } = require('../services/publicMapConfigService');
const {
    extractRequestIp,
    isHttpsRequest,
    isIpAllowed,
    timingSafeCompare,
} = require('../services/publicMapSecurityService');

const createPublicMapAuthMiddleware = ({
    getConfig = getPublicMapConfig,
    recordAudit = safeRecordPublicMapAudit,
    resolveClient = null,
    expectedClientKey = 'public_map',
    requiredScope = 'public-map.read',
    fallbackEnvTokenEnabled = true,
    fallbackLabel = 'FXTao Obras Map',
    tokenRequiredError = 'PUBLIC_MAP_TOKEN_REQUIRED',
    invalidTokenError = 'INVALID_PUBLIC_MAP_TOKEN',
    authFailedError = 'PUBLIC_MAP_AUTH_FAILED',
    tokenRequiredMessage = 'Envie um Bearer token valido para consumir o mapa publico.',
    invalidTokenMessage = 'Token de acesso publico invalido, inativo ou sem escopo para o mapa.',
    authFailedMessage = 'Falha ao validar o acesso ao mapa publico.',
} = {}) => async (req, res, next) => {
    const config = getConfig();
    const origin = String(req.headers.origin || '').trim() || null;
    const requestIp = extractRequestIp(req);
    const resolveClientByToken = resolveClient || require('../services/integrationConfigService').resolveClientByToken;

    try {
        if (config.requireHttps && !isHttpsRequest(req)) {
            await recordAudit({
                errorCode: 'HTTPS_REQUIRED',
                origin,
                requestIp,
                statusCode: 426,
                success: false,
            });

            return res.status(426).json({
                error: 'HTTPS_REQUIRED',
                message: 'A API publica do mapa aceita apenas conexoes HTTPS.',
            });
        }

        const authHeader = req.headers.authorization || '';
        if (!authHeader.startsWith('Bearer ')) {
            await recordAudit({
                errorCode: tokenRequiredError,
                origin,
                requestIp,
                statusCode: 401,
                success: false,
            });

            return res.status(401).json({
                error: tokenRequiredError,
                message: tokenRequiredMessage,
            });
        }

        const token = authHeader.slice('Bearer '.length).trim();
        if (!token) {
            await recordAudit({
                errorCode: tokenRequiredError,
                origin,
                requestIp,
                statusCode: 401,
                success: false,
            });

            return res.status(401).json({
                error: tokenRequiredError,
                message: tokenRequiredMessage,
            });
        }

        let { client, ipFilterEnabled } = await resolveClientByToken(token);

        if (
            fallbackEnvTokenEnabled
            && expectedClientKey === 'public_map'
            && (!client || client.key !== expectedClientKey)
            && config.envToken
            && timingSafeCompare(token, config.envToken)
        ) {
            client = {
                key: expectedClientKey,
                label: fallbackLabel,
                scopes: [requiredScope],
                allowedIps: [],
            };
            ipFilterEnabled = false;
        }

        if (
            !client
            || client.key !== expectedClientKey
            || !Array.isArray(client.scopes)
            || !client.scopes.includes(requiredScope)
        ) {
            await recordAudit({
                clientKey: client?.key || null,
                errorCode: invalidTokenError,
                origin,
                requestIp,
                statusCode: 403,
                success: false,
            });

            return res.status(403).json({
                error: invalidTokenError,
                message: invalidTokenMessage,
            });
        }

        if (ipFilterEnabled) {
            if (!Array.isArray(client.allowedIps) || !client.allowedIps.length) {
                await recordAudit({
                    clientKey: client.key,
                    errorCode: 'IP_FILTER_NOT_CONFIGURED',
                    origin,
                    requestIp,
                    statusCode: 403,
                    success: false,
                });

                return res.status(403).json({
                    error: 'IP_FILTER_NOT_CONFIGURED',
                    message: 'O filtro de IP esta ativo, mas nao ha IPs autorizados para este cliente.',
                });
            }

            if (!isIpAllowed(client.allowedIps, requestIp)) {
                await recordAudit({
                    clientKey: client.key,
                    errorCode: 'IP_NOT_ALLOWED',
                    origin,
                    requestIp,
                    statusCode: 403,
                    success: false,
                });

                return res.status(403).json({
                    error: 'IP_NOT_ALLOWED',
                    message: 'O IP de origem nao esta autorizado para consumir o mapa publico.',
                });
            }
        }

        req.publicMapClient = {
            key: client.key,
            label: client.label,
            scopes: client.scopes,
        };
        req.publicMapRequestIp = requestIp;

        return next();
    } catch (error) {
        console.error('Public map auth failed:', error);

            await recordAudit({
                clientKey: req.publicMapClient?.key || null,
                errorCode: authFailedError,
                origin,
                requestIp,
                statusCode: 500,
                success: false,
            });

            return res.status(500).json({
                error: authFailedError,
                message: authFailedMessage,
            });
    }
};

module.exports = createPublicMapAuthMiddleware();
module.exports.createPublicMapAuthMiddleware = createPublicMapAuthMiddleware;
