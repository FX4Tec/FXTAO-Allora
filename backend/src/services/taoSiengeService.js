const REGISTRATION_TYPES = [
    'SOMENTE_OBRA',
    'OBRA_E_CENTRO_CUSTO',
    'SOMENTE_CENTRO_CUSTO',
    'CENTRO_CUSTO_ASSOCIADO_OBRA',
];

const LIFECYCLE_STATUSES = [
    'RASCUNHO',
    'EM_VALIDACAO',
    'APROVADA',
    'REPROVADA',
    'CADASTRADA_NO_SIENGE',
    'CANCELADA',
];

const CLIENT_TYPES = ['PESSOA_FISICA', 'PESSOA_JURIDICA', 'OUTROS'];

const COST_CENTER_PURPOSES = [
    'CONSTRUTORA',
    'CLIENTE',
    'INVESTIDOR',
    'SPE',
    'ADMINISTRACAO_OBRA',
    'ASSISTENCIA_TECNICA',
    'OUTROS',
];

const cleanString = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

const hasValue = (value) => cleanString(value) !== '';

const normalizeDocument = (value) => {
    const digits = cleanString(value).replace(/\D+/g, '');
    return digits || null;
};

const normalizeOptionalString = (value) => {
    const normalized = cleanString(value);
    return normalized || null;
};

const parseBooleanLike = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (typeof value === 'boolean') return value;

    const normalized = cleanString(value).toLowerCase();
    if (['true', '1', 'sim', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'nao', 'não', 'no', 'n'].includes(normalized)) return false;

    const error = new Error(`Valor booleano inválido: ${value}`);
    error.statusCode = 400;
    throw error;
};

const parseIntegerLike = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const parsed = Number.parseInt(cleanString(value), 10);
    if (Number.isNaN(parsed)) {
        const error = new Error(`Valor inteiro inválido: ${value}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
};

const ensureEnumValue = (label, value, allowedValues) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (allowedValues.includes(value)) return value;

    const error = new Error(`${label} inválido: ${value}`);
    error.statusCode = 400;
    throw error;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const findCompanyByDocumentOrName = async (transaction, { legalName, tradeName, document }) => {
    const normalizedDocument = normalizeDocument(document);

    if (normalizedDocument) {
        const found = await transaction.company.findUnique({
            where: { document_normalized: normalizedDocument },
        });
        if (found) return found;
    }

    if (legalName) {
        const found = await transaction.company.findFirst({
            where: {
                legal_name: {
                    equals: legalName,
                    mode: 'insensitive',
                },
            },
        });
        if (found) return found;
    }

    if (tradeName) {
        const found = await transaction.company.findFirst({
            where: {
                trade_name: {
                    equals: tradeName,
                    mode: 'insensitive',
                },
            },
        });
        if (found) return found;
    }

    return null;
};

const resolveCompanyReference = async (transaction, companyId, payload, label) => {
    if (hasValue(companyId)) {
        const company = await transaction.company.findUnique({ where: { id: cleanString(companyId) } });
        if (!company) {
            const error = new Error(`${label} não encontrada.`);
            error.statusCode = 400;
            throw error;
        }
        return company.id;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const legalName = cleanString(payload.legal_name || payload.name);
    const tradeName = cleanString(payload.trade_name);
    const document = cleanString(payload.document);

    if (!legalName && !tradeName && !document) {
        return null;
    }

    if (!legalName) {
        const error = new Error(`${label} precisa de razão social para novo cadastro inline.`);
        error.statusCode = 400;
        throw error;
    }

    const existing = await findCompanyByDocumentOrName(transaction, { legalName, tradeName, document });
    if (existing) {
        return existing.id;
    }

    const created = await transaction.company.create({
        data: {
            legal_name: legalName,
            trade_name: normalizeOptionalString(tradeName),
            document: normalizeOptionalString(document),
            document_normalized: normalizeDocument(document),
        },
    });

    return created.id;
};

const findClientByDocumentOrName = async (transaction, { name, document }) => {
    const normalizedDocument = normalizeDocument(document);

    if (normalizedDocument) {
        const found = await transaction.client.findUnique({
            where: { document_normalized: normalizedDocument },
        });
        if (found) return found;
    }

    if (name) {
        const found = await transaction.client.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });
        if (found) return found;
    }

    return null;
};

const resolveClientReference = async (transaction, clientId, payload) => {
    if (hasValue(clientId)) {
        const client = await transaction.client.findUnique({ where: { id: cleanString(clientId) } });
        if (!client) {
            const error = new Error('Cliente/contratante não encontrado.');
            error.statusCode = 400;
            throw error;
        }
        return client.id;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const name = cleanString(payload.name);
    const document = cleanString(payload.document);

    if (!name && !document) {
        return null;
    }

    if (!name) {
        const error = new Error('Cliente novo precisa de nome para cadastro inline.');
        error.statusCode = 400;
        throw error;
    }

    const existing = await findClientByDocumentOrName(transaction, { name, document });
    if (existing) {
        return existing.id;
    }

    const created = await transaction.client.create({
        data: {
            name,
            client_type: ensureEnumValue('Tipo de cliente', payload.client_type, CLIENT_TYPES),
            document: normalizeOptionalString(document),
            document_normalized: normalizeDocument(document),
        },
    });

    return created.id;
};

const resolveBusinessAreaReference = async (transaction, businessAreaId, payload) => {
    if (hasValue(businessAreaId)) {
        const businessArea = await transaction.businessArea.findUnique({
            where: { id: cleanString(businessAreaId) },
        });
        if (!businessArea) {
            const error = new Error('Área de negócio não encontrada.');
            error.statusCode = 400;
            throw error;
        }
        return businessArea.id;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const code = cleanString(payload.code);
    const name = cleanString(payload.name);

    if (!code && !name) {
        return null;
    }

    let existing = null;
    if (code) {
        existing = await transaction.businessArea.findUnique({ where: { code } });
    }

    if (!existing && name) {
        existing = await transaction.businessArea.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });
    }

    if (existing) {
        return existing.id;
    }

    if (!name) {
        const error = new Error('Nova área de negócio precisa de nome.');
        error.statusCode = 400;
        throw error;
    }

    const created = await transaction.businessArea.create({
        data: {
            code: normalizeOptionalString(code),
            name,
            is_active: true,
        },
    });

    return created.id;
};

const resolveCostCenterCategoryReference = async (transaction, categoryId, payload) => {
    if (hasValue(categoryId)) {
        const category = await transaction.costCenterCategory.findUnique({
            where: { id: cleanString(categoryId) },
        });
        if (!category) {
            const error = new Error('Categoria de centro de custo não encontrada.');
            error.statusCode = 400;
            throw error;
        }
        return category.id;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const code = cleanString(payload.code);
    const name = cleanString(payload.name);

    if (!code && !name) {
        return null;
    }

    let existing = null;
    if (code) {
        existing = await transaction.costCenterCategory.findUnique({ where: { code } });
    }

    if (!existing && name) {
        existing = await transaction.costCenterCategory.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });
    }

    if (existing) {
        return existing.id;
    }

    if (!name) {
        const error = new Error('Nova categoria de centro de custo precisa de nome.');
        error.statusCode = 400;
        throw error;
    }

    const created = await transaction.costCenterCategory.create({
        data: {
            code: normalizeOptionalString(code),
            name,
            is_active: true,
        },
    });

    return created.id;
};

const normalizeCostCenterPayload = async (transaction, entries = []) => {
    const normalizedEntries = [];

    for (const [index, rawEntry] of ensureArray(entries).entries()) {
        const costCenterCode = cleanString(rawEntry?.cost_center_code);
        const name = cleanString(rawEntry?.name);

        if (!costCenterCode && !name) {
            continue;
        }

        if (!costCenterCode || !name) {
            const error = new Error(`Centro de custo #${index + 1} precisa de código e nome.`);
            error.statusCode = 400;
            throw error;
        }

        normalizedEntries.push({
            cost_center_code: costCenterCode,
            name,
            linked_document: normalizeOptionalString(rawEntry.linked_document),
            company_id: await resolveCompanyReference(
                transaction,
                rawEntry.company_id,
                rawEntry.company_payload,
                `Empresa responsável do centro de custo #${index + 1}`
            ),
            business_area_id: await resolveBusinessAreaReference(
                transaction,
                rawEntry.business_area_id,
                rawEntry.business_area_payload
            ),
            cost_center_category_id: await resolveCostCenterCategoryReference(
                transaction,
                rawEntry.cost_center_category_id,
                rawEntry.cost_center_category_payload
            ),
            purpose: ensureEnumValue(
                'Finalidade do centro de custo',
                rawEntry.purpose,
                COST_CENTER_PURPOSES
            ),
            is_primary: parseBooleanLike(rawEntry.is_primary) ?? false,
            participates_financial: parseBooleanLike(rawEntry.participates_financial) ?? false,
            participates_budget: parseBooleanLike(rawEntry.participates_budget) ?? false,
            participates_supplies: parseBooleanLike(rawEntry.participates_supplies) ?? false,
            participates_measurements: parseBooleanLike(rawEntry.participates_measurements) ?? false,
            observations: normalizeOptionalString(rawEntry.observations),
        });
    }

    return normalizedEntries;
};

const validateTaoSiengePayload = (payload = {}) => {
    const registrationType = payload.registration_type || null;
    const costCenters = ensureArray(payload.cost_centers).filter((item) => item && item.cost_center_code && item.name);
    const primaryCostCenters = costCenters.filter((item) => Boolean(item.is_primary));
    const primaryPurposes = primaryCostCenters.map((item) => item.purpose || 'OUTROS');

    if (!registrationType) {
        return;
    }

    if (new Set(primaryPurposes).size !== primaryPurposes.length) {
        const error = new Error('A TAO deve possuir no máximo um centro de custo principal por finalidade.');
        error.statusCode = 400;
        throw error;
    }

    switch (registrationType) {
        case 'SOMENTE_OBRA':
            return;
        case 'OBRA_E_CENTRO_CUSTO':
            if (!payload.responsible_company_id) {
                const error = new Error('Empresa responsável é obrigatória para TAO Obra e Centro de Custo.');
                error.statusCode = 400;
                throw error;
            }
            if (!primaryCostCenters.length) {
                const error = new Error('Centro de custo principal é obrigatório para TAO Obra e Centro de Custo.');
                error.statusCode = 400;
                throw error;
            }
            return;
        case 'SOMENTE_CENTRO_CUSTO':
            if (!costCenters.length) {
                const error = new Error('Ao menos um centro de custo é obrigatório para TAO Somente Centro de Custo.');
                error.statusCode = 400;
                throw error;
            }
            return;
        case 'CENTRO_CUSTO_ASSOCIADO_OBRA':
            if (!payload.parent_tao_id) {
                const error = new Error('Obra principal é obrigatória para Centro de Custo Associado à Obra.');
                error.statusCode = 400;
                throw error;
            }
            if (!payload.responsible_company_id) {
                const error = new Error('Empresa responsável é obrigatória para Centro de Custo Associado à Obra.');
                error.statusCode = 400;
                throw error;
            }
            if (!costCenters.length) {
                const error = new Error('Ao menos um centro de custo é obrigatório para Centro de Custo Associado à Obra.');
                error.statusCode = 400;
                throw error;
            }
            return;
        default: {
            const error = new Error(`Tipo de registro inválido: ${registrationType}`);
            error.statusCode = 400;
            throw error;
        }
    }
};

const summarizeCriticalValue = (field, data = {}) => {
    switch (field) {
        case 'cost_centers':
            return ensureArray(data.cost_centers).map((item) => ({
                cost_center_code: item.cost_center_code,
                name: item.name,
                is_primary: Boolean(item.is_primary),
            }));
        default:
            return data[field] ?? null;
    }
};

const buildCriticalFieldChanges = (before = {}, after = {}) => {
    const criticalFields = [
        'erp_number',
        'registration_type',
        'responsible_company_id',
        'client_id',
        'financial_cost_center_category_id',
        'financial_business_area_id',
        'construction_situation',
        'is_ret_regime',
        'cost_centers',
    ];

    return criticalFields
        .map((field) => {
            const previousValue = summarizeCriticalValue(field, before);
            const nextValue = summarizeCriticalValue(field, after);

            if (JSON.stringify(previousValue) === JSON.stringify(nextValue)) {
                return null;
            }

            return {
                field,
                before: previousValue,
                after: nextValue,
            };
        })
        .filter(Boolean);
};

const buildLifecycleMetadata = (payload = {}, current = {}) => {
    const next = {};
    const lifecycleStatus = payload.tao_lifecycle_status;

    if (lifecycleStatus === 'EM_VALIDACAO' && !current.requested_at && !payload.requested_at) {
        next.requested_at = new Date();
    }

    if (lifecycleStatus === 'APROVADA' && !payload.approved_at) {
        next.approved_at = new Date();
    }

    if (lifecycleStatus === 'CADASTRADA_NO_SIENGE' && !payload.sienge_registered_at) {
        next.sienge_registered_at = new Date();
    }

    return next;
};

module.exports = {
    CLIENT_TYPES,
    COST_CENTER_PURPOSES,
    LIFECYCLE_STATUSES,
    REGISTRATION_TYPES,
    buildCriticalFieldChanges,
    buildLifecycleMetadata,
    cleanString,
    ensureEnumValue,
    hasValue,
    normalizeCostCenterPayload,
    normalizeDocument,
    normalizeOptionalString,
    parseBooleanLike,
    parseIntegerLike,
    resolveBusinessAreaReference,
    resolveClientReference,
    resolveCompanyReference,
    resolveCostCenterCategoryReference,
    validateTaoSiengePayload,
};
