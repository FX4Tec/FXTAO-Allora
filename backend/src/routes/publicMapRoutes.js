const express = require('express');

const publicMapController = require('../controllers/publicMapController');
const publicMapAuthMiddleware = require('../middlewares/publicMapAuthMiddleware');
const publicMapCorsMiddleware = require('../middlewares/publicMapCorsMiddleware');
const publicMapRateLimitMiddleware = require('../middlewares/publicMapRateLimitMiddleware');
const publicMapTenantMiddleware = require('../middlewares/publicMapTenantMiddleware');

const createPublicMapRouter = ({
    authMiddleware = publicMapAuthMiddleware,
    controller = publicMapController,
    corsMiddleware = publicMapCorsMiddleware,
    rateLimitMiddleware = publicMapRateLimitMiddleware,
    tenantMiddleware = publicMapTenantMiddleware,
} = {}) => {
    const router = express.Router();

    router.use('/obras/mapa', corsMiddleware);
    router.use('/:tenantSlug/obras/mapa', corsMiddleware);
    router.get('/obras/mapa', tenantMiddleware, authMiddleware, rateLimitMiddleware, controller.index);
    router.get('/:tenantSlug/obras/mapa', tenantMiddleware, authMiddleware, rateLimitMiddleware, controller.index);

    return router;
};

module.exports = createPublicMapRouter();
module.exports.createPublicMapRouter = createPublicMapRouter;
