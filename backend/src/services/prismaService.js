const { AsyncLocalStorage } = require('async_hooks');
const { PrismaClient } = require('@prisma/client');

const tenantStorage = new AsyncLocalStorage();
const catalogPrisma = new PrismaClient();
const tenantClients = new Map();

const getTenantClient = (databaseUrl) => {
    if (!databaseUrl) return catalogPrisma;

    if (!tenantClients.has(databaseUrl)) {
        tenantClients.set(databaseUrl, new PrismaClient({
            datasources: {
                db: { url: databaseUrl },
            },
        }));
    }

    return tenantClients.get(databaseUrl);
};

const getCurrentPrisma = () => {
    const store = tenantStorage.getStore();
    return store?.databaseUrl ? getTenantClient(store.databaseUrl) : catalogPrisma;
};

const runWithTenantDatabase = (tenant, callback) => {
    if (!tenant?.database_url) return callback();

    return tenantStorage.run({
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        databaseUrl: tenant.database_url,
    }, callback);
};

const prisma = new Proxy({}, {
    get(target, property) {
        const client = getCurrentPrisma();
        const value = client[property];
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

module.exports = {
    prisma,
    catalogPrisma,
    getTenantClient,
    getCurrentPrisma,
    runWithTenantDatabase,
};
