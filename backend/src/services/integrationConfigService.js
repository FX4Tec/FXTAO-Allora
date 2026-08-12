const { prisma } = require('./prismaService');
const crypto = require('crypto');


const ALL_SCOPES = ['works.read', 'financial.read', 'team.read', 'lookup.read'];
const PUBLIC_MAP_SCOPES = ['public-map.read'];
const IP_FILTER_KEY = 'integration_ip_filter_enabled';
const CLIENT_KEY_PREFIX = 'integration_client_';

const INTEGRATION_CLIENTS = {
    rdo: {
        key: 'rdo',
        label: 'RDO',
        scopes: ALL_SCOPES,
    },
    fx31: {
        key: 'fx31',
        label: 'FX31',
        scopes: ALL_SCOPES,
    },
    generic: {
        key: 'generic',
        label: 'Generico',
        scopes: ALL_SCOPES,
    },
    public_map: {
        key: 'public_map',
        label: 'Mapa publico de obras',
        scopes: PUBLIC_MAP_SCOPES,
    },
};

const safeJsonParse = (value, fallback = {}) => {
    if (!value) return fallback;

    try {
        return JSON.parse(value);
    } catch (_error) {
        return fallback;
    }
};

const uniqueValues = (values) => Array.from(new Set(values));

const normalizeIpList = (input) => {
    if (Array.isArray(input)) {
        return uniqueValues(
            input
                .map((item) => String(item || '').trim())
                .filter(Boolean)
        );
    }

    if (typeof input === 'string') {
        return uniqueValues(
            input
                .split(/\r?\n|,|;/)
                .map((item) => item.trim())
                .filter(Boolean)
        );
    }

    return [];
};

const buildDefaultClientState = (clientKey) => {
    const client = INTEGRATION_CLIENTS[clientKey];

    if (!client) {
        throw new Error(`Unsupported integration client: ${clientKey}`);
    }

    return {
        key: client.key,
        label: client.label,
        active: false,
        allowedIps: [],
        scopes: [...client.scopes],
        tokenHash: null,
        tokenPreview: null,
        lastRotatedAt: null,
    };
};

const sanitizeClientForApi = (client) => ({
    key: client.key,
    label: client.label,
    active: Boolean(client.active),
    allowedIps: normalizeIpList(client.allowedIps),
    scopes: Array.isArray(client.scopes) && client.scopes.length ? client.scopes : [...buildDefaultClientState(client.key).scopes],
    hasToken: Boolean(client.tokenHash),
    tokenPreview: client.tokenPreview || null,
    lastRotatedAt: client.lastRotatedAt || null,
});

const clientConfigKey = (clientKey) => `${CLIENT_KEY_PREFIX}${clientKey}`;

const readRawConfigMap = async () => {
    const keys = [
        IP_FILTER_KEY,
        ...Object.keys(INTEGRATION_CLIENTS).map(clientConfigKey),
    ];

    const configs = await prisma.systemConfig.findMany({
        where: { key: { in: keys } },
        select: { key: true, value: true },
    });

    return configs.reduce((accumulator, config) => {
        accumulator[config.key] = config.value;
        return accumulator;
    }, {});
};

const hydrateClientState = (clientKey, rawValue) => {
    const defaults = buildDefaultClientState(clientKey);
    const raw = safeJsonParse(rawValue, {});

    return {
        ...defaults,
        active: typeof raw.active === 'boolean' ? raw.active : defaults.active,
        allowedIps: normalizeIpList(raw.allowedIps ?? defaults.allowedIps),
        scopes: Array.isArray(raw.scopes) && raw.scopes.length ? raw.scopes : defaults.scopes,
        tokenHash: typeof raw.tokenHash === 'string' ? raw.tokenHash : null,
        tokenPreview: typeof raw.tokenPreview === 'string' ? raw.tokenPreview : null,
        lastRotatedAt: typeof raw.lastRotatedAt === 'string' ? raw.lastRotatedAt : null,
    };
};

const loadIntegrationState = async () => {
    const rawMap = await readRawConfigMap();
    const ipFilterEnabled = String(rawMap[IP_FILTER_KEY] || 'false').toLowerCase() === 'true';
    const clients = Object.keys(INTEGRATION_CLIENTS).map((clientKey) =>
        hydrateClientState(clientKey, rawMap[clientConfigKey(clientKey)])
    );

    return {
        httpsRequired: true,
        ipFilterEnabled,
        clients,
    };
};

const upsertConfigValue = async (key, value) =>
    prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });

const serializeClientState = (client) =>
    JSON.stringify({
        active: Boolean(client.active),
        allowedIps: normalizeIpList(client.allowedIps),
        scopes: Array.isArray(client.scopes) && client.scopes.length ? client.scopes : [...buildDefaultClientState(client.key).scopes],
        tokenHash: client.tokenHash || null,
        tokenPreview: client.tokenPreview || null,
        lastRotatedAt: client.lastRotatedAt || null,
    });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const timingSafeHashCompare = (leftHash, rightHash) => {
    if (!leftHash || !rightHash) return false;

    try {
        const leftBuffer = Buffer.from(leftHash, 'hex');
        const rightBuffer = Buffer.from(rightHash, 'hex');

        if (leftBuffer.length !== rightBuffer.length) return false;
        return crypto.timingSafeEqual(leftBuffer, rightBuffer);
    } catch (_error) {
        return false;
    }
};

const maskToken = (token) => {
    if (!token || token.length < 16) {
        return 'token-configurado';
    }

    return `${token.slice(0, 12)}...${token.slice(-4)}`;
};

const saveIntegrationSettings = async (payload = {}) => {
    const currentState = await loadIntegrationState();
    const requestedClients = new Map(
        (Array.isArray(payload.clients) ? payload.clients : [])
            .filter((client) => client && INTEGRATION_CLIENTS[client.key])
            .map((client) => [client.key, client])
    );

    const nextClients = currentState.clients.map((client) => {
        const incoming = requestedClients.get(client.key) || {};

        return {
            ...client,
            active: typeof incoming.active === 'boolean' ? incoming.active : client.active,
            allowedIps: normalizeIpList(
                incoming.allowedIps !== undefined ? incoming.allowedIps : client.allowedIps
            ),
        };
    });

    await upsertConfigValue(IP_FILTER_KEY, String(Boolean(payload.ipFilterEnabled)));

    for (const client of nextClients) {
        await upsertConfigValue(clientConfigKey(client.key), serializeClientState(client));
    }

    return {
        httpsRequired: true,
        ipFilterEnabled: Boolean(payload.ipFilterEnabled),
        clients: nextClients.map(sanitizeClientForApi),
    };
};

const regenerateClientToken = async (clientKey) => {
    if (!INTEGRATION_CLIENTS[clientKey]) {
        const error = new Error('Integration client not found');
        error.statusCode = 404;
        throw error;
    }

    const currentState = await loadIntegrationState();
    const currentClient = currentState.clients.find((client) => client.key === clientKey);

    if (!currentClient) {
        const error = new Error('Integration client not found');
        error.statusCode = 404;
        throw error;
    }

    const token = `fxi_${clientKey}_${crypto.randomBytes(24).toString('hex')}`;
    const nextClient = {
        ...currentClient,
        active: true,
        tokenHash: hashToken(token),
        tokenPreview: maskToken(token),
        lastRotatedAt: new Date().toISOString(),
    };

    await upsertConfigValue(clientConfigKey(clientKey), serializeClientState(nextClient));

    return {
        client: sanitizeClientForApi(nextClient),
        token,
    };
};

const getIntegrationSettings = async () => {
    const state = await loadIntegrationState();

    return {
        httpsRequired: state.httpsRequired,
        ipFilterEnabled: state.ipFilterEnabled,
        clients: state.clients.map(sanitizeClientForApi),
    };
};

const resolveClientByToken = async (token) => {
    const state = await loadIntegrationState();
    const tokenHash = hashToken(token);
    const client = state.clients.find(
        (item) => item.active && item.tokenHash && timingSafeHashCompare(item.tokenHash, tokenHash)
    );

    return {
        httpsRequired: state.httpsRequired,
        ipFilterEnabled: state.ipFilterEnabled,
        client,
    };
};

module.exports = {
    ALL_SCOPES,
    INTEGRATION_CLIENTS,
    getIntegrationSettings,
    normalizeIpList,
    regenerateClientToken,
    resolveClientByToken,
    saveIntegrationSettings,
};
