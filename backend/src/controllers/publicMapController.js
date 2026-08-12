const createPublicMapController = ({
    getWorks = null,
    recordAudit = null,
} = {}) => ({
    index: async (req, res) => {
        const origin = String(req.headers.origin || '').trim() || null;
        const requestIp = req.publicMapRequestIp || null;
        const listWorks = getWorks || require('../services/publicMapService').listPublicMapWorks;
        const audit = recordAudit || require('../services/publicMapAuditService').safeRecordPublicMapAudit;

        try {
            const requestBaseUrl = `${req.protocol}://${req.get('host')}`;
            const requestUrl = new URL(req.originalUrl, requestBaseUrl).toString();
            const payload = await listWorks({
                cacheKey: req.publicMapTenant?.slug || req.tenant?.slug || 'default',
                query: req.query,
                requestBaseUrl,
                requestUrl,
            });

            await audit({
                clientKey: req.publicMapClient?.key || null,
                origin,
                requestIp,
                resultCount: Array.isArray(payload.data) ? payload.data.length : 0,
                statusCode: 200,
                success: true,
            });

            return res.status(200).json(payload);
        } catch (error) {
            console.error('Failed to fetch public map works:', error);

            await audit({
                clientKey: req.publicMapClient?.key || null,
                errorCode: 'PUBLIC_MAP_FETCH_FAILED',
                origin,
                requestIp,
                statusCode: error.statusCode || 500,
                success: false,
            });

            return res.status(error.statusCode || 500).json({
                error: 'PUBLIC_MAP_FETCH_FAILED',
                message: 'Falha ao carregar as obras publicas do mapa.',
            });
        }
    },
});

module.exports = createPublicMapController();
module.exports.createPublicMapController = createPublicMapController;
