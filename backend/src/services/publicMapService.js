const { prisma } = require('./prismaService');
const { getPublicMapConfig } = require('./publicMapConfigService');

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const PUBLIC_COUNTRY = 'Brasil';
const STATUS_FALLBACK_BY_TAO_STEP = {
    start: 'planejada',
    step1: 'planejada',
    step2: 'planejada',
    step3: 'em_andamento',
    step4: 'em_andamento',
    step5: 'em_andamento',
};

const PUBLIC_STATUS_ALIASES = new Map([
    ['planejada', 'planejada'],
    ['planejado', 'planejada'],
    ['prevista', 'planejada'],
    ['previsto', 'planejada'],
    ['futura', 'planejada'],
    ['futuro', 'planejada'],
    ['orcada', 'planejada'],
    ['planejamento', 'planejada'],
    ['em andamento', 'em_andamento'],
    ['em_andamento', 'em_andamento'],
    ['em execucao', 'em_andamento'],
    ['obra em andamento', 'em_andamento'],
    ['andamento', 'em_andamento'],
    ['ativa', 'em_andamento'],
    ['ativo', 'em_andamento'],
    ['pausada', 'pausada'],
    ['pausado', 'pausada'],
    ['paralisada', 'pausada'],
    ['paralisado', 'pausada'],
    ['suspensa', 'pausada'],
    ['suspenso', 'pausada'],
    ['hold', 'pausada'],
    ['concluida', 'concluida'],
    ['concluido', 'concluida'],
    ['finalizada', 'concluida'],
    ['finalizado', 'concluida'],
    ['entregue', 'concluida'],
    ['encerrada', 'concluida'],
    ['encerrado', 'concluida'],
    ['cancelada', 'cancelada'],
    ['cancelado', 'cancelada'],
]);

const PUBLIC_MAP_SELECT = {
    id: true,
    erp_number: true,
    project_name: true,
    segment: true,
    project_type: true,
    status: true,
    approval_status: true,
    latitude: true,
    longitude: true,
    date_start: true,
    date_end: true,
    construction_address: true,
    construction_zip: true,
    construction_neighborhood: true,
    construction_city: true,
    construction_state: true,
    is_public_map_enabled: true,
    public_slug: true,
    public_image_url: true,
    public_status_override: true,
    public_client_name: true,
    public_address_number: true,
    updated_at: true,
};

const cachedRecordSnapshots = new Map();

const sanitizeNullableString = (value) => {
    if (value === null || value === undefined) return null;

    const normalized = String(value).replace(/\s+/g, ' ').trim();
    return normalized || null;
};

const normalizeSlug = (value) => {
    const normalized = sanitizeNullableString(value);
    if (!normalized) return null;

    return normalized.replace(/^\/+/, '');
};

const removeDiacritics = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const normalizePublicStatus = (value) => {
    const normalized = sanitizeNullableString(value);
    if (!normalized) return null;

    const key = removeDiacritics(normalized)
        .toLowerCase()
        .replace(/[-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return PUBLIC_STATUS_ALIASES.get(key) || null;
};

const normalizeUf = (value) => {
    const normalized = sanitizeNullableString(value);
    if (!normalized) return null;

    const letters = removeDiacritics(normalized).replace(/[^a-z]/gi, '').toUpperCase();
    if (letters.length < 2) return null;

    return letters.slice(0, 2);
};

const normalizeCep = (value) => {
    const normalized = sanitizeNullableString(value);
    if (!normalized) return null;

    const digits = normalized.replace(/\D/g, '');
    if (digits.length === 8) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }

    return normalized;
};

const toNullableNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;

    const numericValue = Number(typeof value?.toString === 'function' ? value.toString() : value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const toDateString = (value) => {
    if (!value) return null;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
};

const toDateTimeString = (value) => {
    if (!value) return null;
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const joinUrl = (baseUrl, path) => {
    const normalizedBase = sanitizeNullableString(baseUrl);
    const normalizedPath = sanitizeNullableString(path);

    if (!normalizedBase || !normalizedPath) return null;
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;

    return `${normalizedBase.replace(/\/+$/, '')}/${normalizedPath.replace(/^\/+/, '')}`;
};

const splitAddressAndNumber = (address, explicitNumber) => {
    const normalizedAddress = sanitizeNullableString(address);
    const normalizedNumber = sanitizeNullableString(explicitNumber);

    if (!normalizedAddress) {
        return {
            endereco: null,
            numero: normalizedNumber,
        };
    }

    if (normalizedNumber) {
        return {
            endereco: normalizedAddress,
            numero: normalizedNumber,
        };
    }

    const commaMatch = normalizedAddress.match(/^(.*?),(?:\s*)(s\/n|\d[\w-]*)$/i);
    if (commaMatch) {
        return {
            endereco: sanitizeNullableString(commaMatch[1]),
            numero: sanitizeNullableString(commaMatch[2]?.toUpperCase()),
        };
    }

    const trailingNumberMatch = normalizedAddress.match(/^(.*?)(?:\s+)(s\/n|\d[\w-]*)$/i);
    if (trailingNumberMatch) {
        return {
            endereco: sanitizeNullableString(trailingNumberMatch[1]),
            numero: sanitizeNullableString(trailingNumberMatch[2]?.toUpperCase()),
        };
    }

    return {
        endereco: normalizedAddress,
        numero: null,
    };
};

const derivePublicStatus = (tao, now = new Date()) => {
    const overrideStatus = normalizePublicStatus(tao.public_status_override);
    if (overrideStatus) return overrideStatus;

    const endDate = tao.date_end ? new Date(tao.date_end) : null;
    if (endDate && !Number.isNaN(endDate.getTime()) && endDate.getTime() < now.getTime()) {
        return 'concluida';
    }

    const startDate = tao.date_start ? new Date(tao.date_start) : null;
    if (startDate && !Number.isNaN(startDate.getTime()) && startDate.getTime() > now.getTime()) {
        return 'planejada';
    }

    const normalizedInternalStatus = normalizePublicStatus(tao.status);
    if (normalizedInternalStatus) return normalizedInternalStatus;

    return STATUS_FALLBACK_BY_TAO_STEP[tao.status] || 'em_andamento';
};

const hasRequiredPayloadFields = (payload) =>
    Boolean(
        payload.external_id &&
        payload.nome &&
        payload.status &&
        payload.endereco &&
        payload.cidade &&
        payload.uf &&
        payload.updated_at
    );

const buildPublicUrl = (slug, publicBaseUrl) => {
    const normalizedSlug = normalizeSlug(slug);
    if (!normalizedSlug) return null;
    if (/^https?:\/\//i.test(normalizedSlug)) return normalizedSlug;

    return joinUrl(publicBaseUrl, normalizedSlug);
};

const buildImageUrl = (imageUrl, assetBaseUrl, requestBaseUrl) => {
    const normalizedImageUrl = sanitizeNullableString(imageUrl);
    if (!normalizedImageUrl) return null;
    if (/^https?:\/\//i.test(normalizedImageUrl)) return normalizedImageUrl;

    return joinUrl(assetBaseUrl || requestBaseUrl, normalizedImageUrl);
};

const serializePublicMapWork = (tao, options = {}) => {
    const { endereco, numero } = splitAddressAndNumber(
        tao.construction_address,
        tao.public_address_number
    );

    const payload = {
        external_id: sanitizeNullableString(tao.erp_number) || sanitizeNullableString(tao.id),
        nome: sanitizeNullableString(tao.project_name),
        status: derivePublicStatus(tao, options.now),
        tipo: sanitizeNullableString(tao.segment) || sanitizeNullableString(tao.project_type),
        cliente: sanitizeNullableString(tao.public_client_name),
        endereco,
        numero,
        bairro: sanitizeNullableString(tao.construction_neighborhood),
        cidade: sanitizeNullableString(tao.construction_city),
        uf: normalizeUf(tao.construction_state),
        cep: normalizeCep(tao.construction_zip),
        pais: PUBLIC_COUNTRY,
        latitude: toNullableNumber(tao.latitude),
        longitude: toNullableNumber(tao.longitude),
        url_publica: buildPublicUrl(tao.public_slug, options.publicBaseUrl),
        imagem: buildImageUrl(tao.public_image_url, options.assetBaseUrl, options.requestBaseUrl),
        data_inicio: toDateString(tao.date_start),
        data_previsao_entrega: toDateString(tao.date_end),
        updated_at: toDateTimeString(tao.updated_at),
    };

    return hasRequiredPayloadFields(payload) ? payload : null;
};

const normalizePositiveInteger = (value, fallback) => {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
};

const getPaginationSettings = (query = {}) => {
    const shouldPaginate =
        Object.prototype.hasOwnProperty.call(query, 'page') ||
        Object.prototype.hasOwnProperty.call(query, 'limit');

    return {
        limit: Math.min(normalizePositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
        page: normalizePositiveInteger(query.page, 1),
        shouldPaginate,
    };
};

const buildNextPageUrl = (requestUrl, page, limit, total) => {
    if (!requestUrl) return null;
    if ((page - 1) * limit >= total) return null;

    const nextUrl = new URL(requestUrl);
    nextUrl.searchParams.set('page', String(page));
    nextUrl.searchParams.set('limit', String(limit));

    return nextUrl.toString();
};

const extractLastUpdate = (works, fallbackValue) => {
    const timestamps = works
        .map((item) => new Date(item.updated_at).getTime())
        .filter((value) => Number.isFinite(value));

    if (!timestamps.length) return fallbackValue;
    return new Date(Math.max(...timestamps)).toISOString();
};

const fetchPublicMapRecords = async (prismaClient = prisma) =>
    prismaClient.tao.findMany({
        where: {
            is_public_map_enabled: true,
            OR: [
                { approval_flow_enabled: false },
                { approval_flow_enabled: null },
                { approval_status: 'approved' },
            ],
        },
        orderBy: [
            { updated_at: 'desc' },
            { project_name: 'asc' },
        ],
        select: PUBLIC_MAP_SELECT,
    });

const getCachedOrFreshRecords = async (options = {}) => {
    const config = options.config || getPublicMapConfig();
    const now = options.now instanceof Date ? options.now : new Date();
    const nowTimestamp = now.getTime();
    const cacheKey = sanitizeNullableString(options.cacheKey) || 'default';
    const cachedRecordSnapshot = cachedRecordSnapshots.get(cacheKey);

    if (
        cachedRecordSnapshot &&
        cachedRecordSnapshot.expiresAt > nowTimestamp &&
        Array.isArray(cachedRecordSnapshot.records)
    ) {
        return cachedRecordSnapshot.records;
    }

    const records = await fetchPublicMapRecords(options.prismaClient || prisma);
    cachedRecordSnapshots.set(cacheKey, {
        records,
        expiresAt: nowTimestamp + config.cacheTtlMs,
    });

    return records;
};

const invalidatePublicMapCache = (cacheKey = null) => {
    const normalizedCacheKey = sanitizeNullableString(cacheKey);
    if (normalizedCacheKey) {
        cachedRecordSnapshots.delete(normalizedCacheKey);
        return;
    }

    cachedRecordSnapshots.clear();
};

const listPublicMapWorks = async (options = {}) => {
    const config = options.config || getPublicMapConfig();
    const query = options.query || {};
    const now = options.now instanceof Date ? options.now : new Date();
    const records = await getCachedOrFreshRecords({
        cacheKey: options.cacheKey,
        config,
        now,
        prismaClient: options.prismaClient,
    });

    const includeCancelled = String(query.include_cancelled || '').trim().toLowerCase() === 'true';
    const works = records
        .map((tao) =>
            serializePublicMapWork(tao, {
                assetBaseUrl: config.assetBaseUrl,
                now,
                publicBaseUrl: config.publicBaseUrl,
                requestBaseUrl: options.requestBaseUrl,
            })
        )
        .filter(Boolean)
        .filter((tao) => includeCancelled || tao.status !== 'cancelada');

    const lastUpdate = extractLastUpdate(works, now.toISOString());
    const pagination = getPaginationSettings(query);

    if (!pagination.shouldPaginate) {
        return {
            success: true,
            last_update: lastUpdate,
            data: works,
        };
    }

    const total = works.length;
    const offset = (pagination.page - 1) * pagination.limit;
    const pagedWorks = works.slice(offset, offset + pagination.limit);
    const nextPageUrl = buildNextPageUrl(
        options.requestUrl,
        pagination.page + 1,
        pagination.limit,
        total
    );

    return {
        success: true,
        last_update: lastUpdate,
        data: pagedWorks,
        links: {
            next: nextPageUrl,
        },
        meta: {
            current_page: pagination.page,
            per_page: pagination.limit,
            total,
            next_page_url: nextPageUrl,
        },
    };
};

module.exports = {
    DEFAULT_LIMIT,
    MAX_LIMIT,
    buildImageUrl,
    buildPublicUrl,
    derivePublicStatus,
    invalidatePublicMapCache,
    listPublicMapWorks,
    normalizeCep,
    normalizePublicStatus,
    normalizeUf,
    serializePublicMapWork,
    splitAddressAndNumber,
};
