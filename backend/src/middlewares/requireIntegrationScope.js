module.exports = (requiredScope) => (req, res, next) => {
    const scopes = req.integrationClient?.scopes || [];

    if (!scopes.includes(requiredScope)) {
        return res.status(403).json({
            error: 'INSUFFICIENT_SCOPE',
            message: `The integration token does not have access to scope ${requiredScope}.`,
        });
    }

    return next();
};
