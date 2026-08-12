const express = require('express');

const publicMapController = require('../controllers/publicMapController');
const publicMapAuthMiddleware = require('../middlewares/publicMapAuthMiddleware');
const publicProgressController = require('../controllers/publicProgressController');
const publicProgressAuthMiddleware = require('../middlewares/publicProgressAuthMiddleware');
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

    router.use('/obras/:workRef/progresso', corsMiddleware);
    router.use('/:tenantSlug/obras/:workRef/progresso', corsMiddleware);
    router.get('/obras/:workRef/progresso', tenantMiddleware, publicProgressAuthMiddleware, rateLimitMiddleware, publicProgressController.show);
    router.get('/:tenantSlug/obras/:workRef/progresso', tenantMiddleware, publicProgressAuthMiddleware, rateLimitMiddleware, publicProgressController.show);

    router.use('/obras/mapa', corsMiddleware);
    router.use('/:tenantSlug/obras/mapa', corsMiddleware);
    router.get('/obras/mapa', tenantMiddleware, authMiddleware, rateLimitMiddleware, controller.index);
    router.get('/:tenantSlug/obras/mapa', tenantMiddleware, authMiddleware, rateLimitMiddleware, controller.index);

    return router;
};

module.exports = createPublicMapRouter();
module.exports.createPublicMapRouter = createPublicMapRouter;
