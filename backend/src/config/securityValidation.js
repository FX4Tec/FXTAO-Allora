const weakValues = new Set(['change-me', 'password', 'admin', 'secret', 'changeme']);

const isWeak = (value) => !value || weakValues.has(String(value).trim().toLowerCase());

const validateProductionSecurity = () => {
    if (process.env.NODE_ENV !== 'production') return;
    if (process.env.ENFORCE_PRODUCTION_SECURITY === 'false') return;

    const errors = [];

    if (isWeak(process.env.JWT_SECRET) || String(process.env.JWT_SECRET).length < 32) {
        errors.push('JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser valor padrão.');
    }

    if (isWeak(process.env.POSTGRES_PASSWORD)) {
        errors.push('POSTGRES_PASSWORD não pode ser valor padrão.');
    }

    if (!process.env.FRONTEND_URL || !String(process.env.FRONTEND_URL).startsWith('https://')) {
        errors.push('FRONTEND_URL deve usar HTTPS em produção.');
    }

    if (process.env.MICROSOFT_CLIENT_SECRET && String(process.env.MICROSOFT_CLIENT_SECRET).length < 24) {
        errors.push('MICROSOFT_CLIENT_SECRET parece curto demais para produção.');
    }

    if (errors.length) {
        throw new Error(`Configuração de produção insegura: ${errors.join(' ')}`);
    }
};

module.exports = {
    validateProductionSecurity,
};
