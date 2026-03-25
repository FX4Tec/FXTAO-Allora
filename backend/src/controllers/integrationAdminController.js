const {
    INTEGRATION_CLIENTS,
    normalizeIpList,
    regenerateClientToken,
    getIntegrationSettings,
    saveIntegrationSettings,
} = require('../services/integrationConfigService');

exports.getSettings = async (_req, res) => {
    try {
        const settings = await getIntegrationSettings();
        return res.status(200).json(settings);
    } catch (error) {
        console.error('Failed to fetch integration settings:', error);
        return res.status(500).json({ error: 'Failed to fetch integration settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const payload = {
            ipFilterEnabled: Boolean(req.body.ipFilterEnabled),
            clients: (Array.isArray(req.body.clients) ? req.body.clients : [])
                .filter((client) => client && INTEGRATION_CLIENTS[client.key])
                .map((client) => ({
                    key: client.key,
                    active: Boolean(client.active),
                    allowedIps: normalizeIpList(client.allowedIps),
                })),
        };

        const settings = await saveIntegrationSettings(payload);
        return res.status(200).json(settings);
    } catch (error) {
        console.error('Failed to update integration settings:', error);
        return res.status(500).json({ error: 'Failed to update integration settings' });
    }
};

exports.regenerateClientToken = async (req, res) => {
    try {
        const result = await regenerateClientToken(req.params.clientKey);
        return res.status(201).json(result);
    } catch (error) {
        console.error('Failed to rotate integration token:', error);
        return res.status(error.statusCode || 500).json({
            error: error.message || 'Failed to rotate integration token',
        });
    }
};
