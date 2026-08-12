const { createPublicMapAuthMiddleware } = require('./publicMapAuthMiddleware');

module.exports = createPublicMapAuthMiddleware({
    expectedClientKey: 'progress_chart',
    requiredScope: 'progress.read',
    fallbackEnvTokenEnabled: false,
    tokenRequiredError: 'PUBLIC_PROGRESS_TOKEN_REQUIRED',
    invalidTokenError: 'INVALID_PUBLIC_PROGRESS_TOKEN',
    authFailedError: 'PUBLIC_PROGRESS_AUTH_FAILED',
    tokenRequiredMessage: 'Envie um Bearer token valido para consumir o grafico publico de evolucao.',
    invalidTokenMessage: 'Token de acesso publico invalido, inativo ou sem escopo para o grafico de evolucao.',
    authFailedMessage: 'Falha ao validar o acesso ao grafico publico de evolucao.',
});
