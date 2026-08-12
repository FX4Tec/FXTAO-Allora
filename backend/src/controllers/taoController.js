const { prisma } = require('../services/prismaService');
const {
    DIRECT_BILLING_DOCUMENT_DEFINITIONS,
    INITIAL_CHECKLIST_DEFINITIONS,
    RESTRICTED_CONTACT_ROLES,
    RESTRICTED_TAO_FIELDS,
} = require('../constants/taoAllora');
const {
    buildCriticalFieldChanges,
    buildLifecycleMetadata,
    cleanString: cleanSiengeString,
    ensureEnumValue,
    hasValue: siengeHasValue,
    normalizeCostCenterPayload,
    parseBooleanLike,
    parseIntegerLike,
    resolveBusinessAreaReference,
    resolveClientReference,
    resolveCompanyReference,
    resolveCostCenterCategoryReference,
    validateTaoSiengePayload,
    REGISTRATION_TYPES,
    LIFECYCLE_STATUSES,
} = require('../services/taoSiengeService');
const { invalidatePublicMapCache } = require('../services/publicMapService');


const MANAGED_CONTACT_ROLES = [
    'Contato Cliente',
    'Gerenciador',
    'Arquitetura',
    'Contato para envio de relatorios',
    'Com copia',
];

const MANAGED_TEAM_MEMBER_ROLES = [
    'Engº Responsavel',
    'Mestre de Obra',
];

const invalidateTenantPublicMapCache = (req) => {
    invalidatePublicMapCache(req?.tenant?.slug || null);
};

const TAO_DATE_FIELDS = [
    'opening_date',
    'date_signature',
    'date_mobilization',
    'date_start',
    'date_end',
    'actual_start_date',
    'actual_end_date',
    'keys_delivery_date',
    'requested_at',
    'approved_at',
    'sienge_registered_at',
    'insurance_guarantee_date',
    'insurance_construction_date',
    'avcb_date',
    'cnd_iss_date',
    'cnd_inss_date',
    'habite_se_date',
    'geocoded_at',
];

const TAO_INTEGER_FIELDS = [
    'current_approval_level',
    'duration_months',
    'duration_days',
    'planned_construction_units',
    'service_invoice_cutoff_day',
    'material_invoice_cutoff_day',
];

const TAO_DECIMAL_FIELDS = [
    'area_m2',
    'latitude',
    'longitude',
    'value_total_contract',
    'value_billing_direct',
    'value_billing_consultancy',
    'value_billing_construction',
    'value_team_technical',
    'value_cost_construction',
    'value_taxes',
    'value_b_revenue',
    'value_rateable_1',
    'value_rateable_2',
    'tax_pis_percent',
    'tax_pis_value',
    'tax_cofins_percent',
    'tax_cofins_value',
    'tax_csll_percent',
    'tax_csll_value',
    'tax_ir_percent',
    'tax_ir_value',
    'tax_iss_percent',
    'tax_iss_value',
    'tax_iss_retained_client_percent',
    'tax_iss_retained_client_value',
    'tax_iss_collected_company_percent',
    'tax_iss_collected_company_value',
    'tax_inss_percent',
    'tax_inss_value',
    'tax_inss_retained_client_percent',
    'tax_inss_retained_client_value',
    'tax_inss_collected_company_percent',
    'tax_inss_collected_company_value',
    'tax_cofins_retained_client_percent',
    'tax_cofins_retained_client_value',
    'tax_deduction_signal_percent',
    'tax_deduction_signal_value',
    'tax_contractual_retention_percent',
    'tax_contractual_retention_value',
    'restricted_admin_percent',
    'restricted_admin_monthly_value',
    'restricted_team_monthly_value',
    'restricted_admin_total_estimated',
    'restricted_engineer_monthly_value',
    'restricted_master_monthly_value',
    'gross_sales_value',
    'minimum_invoice_amount',
    'bonus_percent',
    'tax_conversion_percent',
];

const TAO_BOOLEAN_FIELDS = [
    'contract_company_consultancy',
    'billing_not_established',
    'ome_billing_company',
    'scope_project_legal_status',
    'avcb_status',
    'habite_se_status',
    'has_manager',
    'has_architecture',
    'has_delivery_restriction',
    'requires_physical_delivery',
    'requires_cno',
    'has_invoice_cutoff',
    'has_budget_sheet',
    'accepts_reimbursements',
    'accepts_exception_payments',
    'is_registration_consistent',
    'has_engineering_budget',
    'has_engineering_planning',
    'has_physical_progress_tracking',
    'compose_financial_availability',
    'export_to_client_portal',
    'is_ret_regime',
    'generates_sped_efd_contributions',
    'uses_client_portal',
    'requires_purchase_order',
    'architect_transfer_required',
    'scope_project_executive_status',
    'scope_permit_execution_status',
    'scope_cno_status',
    'insurance_guarantee_status',
    'insurance_construction_status',
    'cnd_iss_status',
    'cnd_inss_status',
    'is_public_map_enabled',
    'is_public_progress_enabled',
    'approval_flow_enabled',
];

const TAO_ALLOWED_FIELDS = [
    'project_name', 'segment', 'project_type', 'status', 'approval_flow_enabled', 'approval_status',
    'current_approval_level', 'calculation_mode', 'registration_type', 'tao_lifecycle_status',
    'erp_number', 'opening_date', 'area_m2',
    'latitude', 'longitude', 'construction_situation', 'is_registration_consistent',
    'is_public_map_enabled', 'is_public_progress_enabled', 'public_slug', 'public_image_url', 'public_description',
    'public_status_override', 'public_client_name', 'public_address_number', 'geocoded_at',
    'center_cost_client', 'extra_center_costs_client',
    'center_cost_allora', 'project_code', 'proposal_number', 'client_code', 'has_manager',
    'has_architecture', 'contract_company_consultancy', 'hiring_regime',
    'hiring_regime_detail', 'budget_model', 'contract_description', 'sharepoint_url',
    'observations_general', 'technical_responsible_name', 'delivery_address',
    'client_link_notes', 'parent_tao_id', 'responsible_company_id', 'client_id',
    'date_signature', 'date_mobilization', 'date_start', 'date_end',
    'actual_start_date', 'actual_end_date', 'duration_months', 'duration_days',
    'billing_company_name', 'billing_address', 'billing_zip', 'billing_neighborhood',
    'billing_city', 'billing_state', 'billing_cnpj', 'billing_ie', 'billing_im',
    'billing_drm', 'billing_iptu_number', 'billing_not_established', 'billing_model',
    'has_delivery_restriction', 'delivery_restriction_notes',
    'requires_physical_delivery', 'physical_delivery_address',
    'construction_address', 'construction_zip', 'construction_neighborhood',
    'construction_city', 'construction_state', 'requires_cno', 'obra_cno',
    'obra_sfobras',
    'manager_company_name', 'manager_address', 'manager_phone', 'company_code',
    'project_group',
    'bank_account_consultancy_id', 'bank_account_construction_id',
    'default_financial_bank_account_id', 'billing_issue_bank_account_id',
    'value_total_contract', 'value_billing_direct', 'value_billing_consultancy',
    'value_billing_construction', 'value_team_technical', 'value_cost_construction',
    'value_taxes', 'value_b_revenue', 'value_rateable_1', 'value_rateable_2',
    'financial_schedule_notes', 'report_frequency', 'has_invoice_cutoff',
    'invoice_cutoff_day', 'notes_to_finance_deadline', 'report_send_day',
    'payment_after_report_terms', 'payment_terms_text', 'admin_financial_schedule_text',
    'admin_notes', 'financial_notebook_send_rule', 'payment_methods',
    'requires_purchase_order', 'purchase_order_process', 'supplier_portal_url',
    'minimum_invoice_amount', 'bonus_percent', 'tax_conversion_percent',
    'direct_billing_control_notes', 'signal_payment_notes', 'invoice_cutoff_notes',
    'service_invoice_cutoff_day', 'material_invoice_cutoff_day',
    'architect_transfer_required',
    'restricted_admin_percent', 'restricted_tax_mode', 'restricted_admin_monthly_value',
    'restricted_team_monthly_value', 'has_budget_sheet',
    'restricted_admin_total_estimated', 'restricted_engineer_monthly_value',
    'restricted_master_monthly_value', 'restricted_special_items_admin_text',
    'restricted_notes', 'reports_delivery_notes', 'accepts_reimbursements',
    'accepts_reimbursements_notes', 'accepts_exception_payments',
    'accepts_exception_payments_notes',
    'tax_pis_percent', 'tax_pis_value', 'tax_cofins_percent', 'tax_cofins_value',
    'tax_csll_percent', 'tax_csll_value', 'tax_ir_percent', 'tax_ir_value',
    'tax_iss_percent', 'tax_iss_value',
    'tax_iss_retained_client_percent', 'tax_iss_retained_client_value',
    'tax_iss_collected_company_percent', 'tax_iss_collected_company_value',
    'tax_inss_percent', 'tax_inss_value',
    'tax_inss_retained_client_percent', 'tax_inss_retained_client_value',
    'tax_inss_collected_company_percent', 'tax_inss_collected_company_value',
    'tax_cofins_retained_client_percent', 'tax_cofins_retained_client_value',
    'tax_deduction_signal_percent', 'tax_deduction_signal_value',
    'tax_contractual_retention_percent', 'tax_contractual_retention_value',
    'ome_procedure', 'ome_billing_company',
    'obligations_text', 'fines_text', 'measurements_text',
    'scope_project_legal_status', 'scope_project_legal_text',
    'scope_project_executive_status', 'scope_project_executive_text',
    'scope_permit_execution_status', 'scope_permit_execution_text',
    'scope_cno_status', 'scope_cno_text',
    'insurance_guarantee_status', 'insurance_guarantee_text', 'insurance_guarantee_date',
    'insurance_construction_status', 'insurance_construction_text', 'insurance_construction_date',
    'avcb_status', 'avcb_text', 'avcb_date',
    'cnd_iss_status', 'cnd_iss_text', 'cnd_iss_date',
    'cnd_inss_status', 'cnd_inss_text', 'cnd_inss_date',
    'habite_se_status', 'habite_se_text', 'habite_se_date',
    'client_contract_status', 'work_insurance_status', 'work_insurance_validity',
    'art_status',
    'engineering_supply_services_table', 'appropriation_level', 'area_measure_unit',
    'planned_construction_units', 'has_engineering_budget', 'has_engineering_planning',
    'has_physical_progress_tracking', 'engineering_responsible_name',
    'financial_company_id', 'financial_business_area_id', 'financial_cost_center_category_id',
    'compose_financial_availability', 'export_to_client_portal', 'financial_responsible_name',
    'is_ret_regime', 'enterprise_nature', 'real_estate_unit_type',
    'generates_sped_efd_contributions', 'fiscal_responsible_name', 'fiscal_notes',
    'keys_delivery_date', 'gross_sales_value', 'units_grouping', 'uses_client_portal',
    'client_portal_links', 'commercial_responsible_name',
    'requested_at', 'engineering_approver_user_id', 'financial_approver_user_id',
    'fiscal_approver_user_id', 'board_approver_user_id',
    'approved_at', 'rejection_reason', 'sienge_registered_at',
];

const NESTED_PAYLOAD_KEYS = [
    'allora_contacts',
    'allora_team_members',
    'direct_billing_document_items',
    'initial_checklist_items',
    'financial_composition_items',
    'indirect_expense_items',
];

const ALLORA_CONTACT_ROLE_METADATA = {
    'Contato Cliente': { restricted: false },
    Gerenciador: { restricted: false },
    Arquitetura: { restricted: false },
    'Contato para envio de relatorios': { restricted: true },
    'Com copia': { restricted: true },
};

const TAO_INCLUDE = {
    installments: true,
    additives: true,
    team_members: true,
    contacts: true,
    attachments: true,
    progress_topics: { orderBy: { sort_order: 'asc' } },
    approvers: true,
    access_permissions: true,
    logs: { orderBy: { created_at: 'desc' } },
    direct_billing_document_items: { orderBy: { sort_order: 'asc' } },
    initial_checklist_items: { orderBy: { sort_order: 'asc' } },
    created_by: { select: { id: true, full_name: true, email: true } },
    updated_by: { select: { id: true, full_name: true, email: true } },
    responsible_company: true,
    client: true,
    parent_tao: { select: { id: true, project_name: true, erp_number: true } },
    child_taos: { select: { id: true, project_name: true, erp_number: true } },
    default_financial_bank_account: true,
    billing_issue_bank_account: true,
    financial_company: true,
    financial_business_area: true,
    financial_cost_center_category: true,
    engineering_approver: { select: { id: true, full_name: true, email: true } },
    financial_approver: { select: { id: true, full_name: true, email: true } },
    fiscal_approver: { select: { id: true, full_name: true, email: true } },
    board_approver: { select: { id: true, full_name: true, email: true } },
    cost_centers: {
        include: {
            company: true,
            business_area: true,
            cost_center_category: true,
        },
        orderBy: [{ is_primary: 'desc' }, { cost_center_code: 'asc' }],
    },
    authorized_bank_accounts: {
        include: {
            bank_account: true,
        },
        orderBy: { created_at: 'asc' },
    },
    financial_composition_items: {
        orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    },
    indirect_expense_items: {
        orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    },
};

// Map frontend status values ('1', '2', etc.) to Prisma enum values ('step1', 'step2', etc.)
const mapTaoStatus = (status) => {
    const statusMap = { '1': 'step1', '2': 'step2', '3': 'step3', '4': 'step4', '5': 'step5', start: 'start' };
    return statusMap[status] || status;
};

const TAO_STATUS_ORDER = ['start', 'step1', 'step2', 'step3', 'step4', 'step5'];

const getHigherTaoStatus = (currentStatus, nextStatus) => {
    const normalizedCurrent = mapTaoStatus(currentStatus) || 'start';
    const normalizedNext = mapTaoStatus(nextStatus) || normalizedCurrent;
    const currentIndex = TAO_STATUS_ORDER.indexOf(normalizedCurrent);
    const nextIndex = TAO_STATUS_ORDER.indexOf(normalizedNext);

    if (nextIndex === -1) return normalizedCurrent;
    if (currentIndex === -1) return normalizedNext;
    return nextIndex > currentIndex ? normalizedNext : normalizedCurrent;
};

// Map Prisma enum values back to frontend values for responses
const unmapTaoStatus = (status) => {
    const reverseMap = { step1: '1', step2: '2', step3: '3', step4: '4', step5: '5', start: 'start' };
    return reverseMap[status] || status;
};

const cleanString = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

const hasValue = (value) => cleanString(value) !== '';

const parseBoolean = (value) => {
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

const parseInteger = (value) => {
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

const parseDecimal = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (typeof value === 'number') {
        if (Number.isNaN(value)) {
            const error = new Error(`Valor numérico inválido: ${value}`);
            error.statusCode = 400;
            throw error;
        }
        return value;
    }

    let normalized = cleanString(value).replace(/\s+/g, '');
    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
        normalized =
            normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
                ? normalized.replace(/\./g, '').replace(',', '.')
                : normalized.replace(/,/g, '');
    } else if (hasComma) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
    }

    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
        const error = new Error(`Valor numérico inválido: ${value}`);
        error.statusCode = 400;
        throw error;
    }

    return parsed;
};

const normalizeDateValue = (field, value) => {
    if (value === undefined) return undefined;
    if (value == null || value === '') {
        return null;
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            const error = new Error(`Data inválida no campo ${field}.`);
            error.statusCode = 400;
            throw error;
        }
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return new Date(`${trimmed}T00:00:00.000Z`);
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    const error = new Error(`Data inválida no campo ${field}.`);
    error.statusCode = 400;
    throw error;
};

const canViewRestricted = (user) => Boolean(user?.can_view_restricted_tao_fields);

const stripRestrictedFieldsFromData = (data, user) => {
    if (canViewRestricted(user)) {
        return data;
    }

    const sanitized = { ...data };
    for (const field of RESTRICTED_TAO_FIELDS) {
        delete sanitized[field];
    }

    return sanitized;
};

const buildTaoData = (body, user) => {
    const data = {};

    for (const field of TAO_ALLOWED_FIELDS) {
        if (!(field in body)) continue;

        let value = body[field];

        if (field === 'status' && value != null) {
            value = mapTaoStatus(value);
        } else if (TAO_DATE_FIELDS.includes(field)) {
            value = normalizeDateValue(field, value);
        } else if (TAO_BOOLEAN_FIELDS.includes(field)) {
            value = parseBoolean(value);
        } else if (TAO_INTEGER_FIELDS.includes(field)) {
            value = parseInteger(value);
        } else if (TAO_DECIMAL_FIELDS.includes(field)) {
            value = parseDecimal(value);
        } else if (field === 'registration_type') {
            value = ensureEnumValue('Tipo de registro', value, REGISTRATION_TYPES);
        } else if (field === 'tao_lifecycle_status') {
            value = ensureEnumValue('Status da TAO', value, LIFECYCLE_STATUSES);
        } else if (typeof value === 'string') {
            value = value.trim();
            if (value === '') value = null;
        }

        data[field] = value;
    }

    return stripRestrictedFieldsFromData(data, user);
};

const serialize = (value) => JSON.parse(JSON.stringify(value));

const normalizeIdArray = (values = []) =>
    Array.from(
        new Set(
            (Array.isArray(values) ? values : [])
                .map((value) => cleanSiengeString(value))
                .filter(Boolean)
        )
    );

const normalizeAlloraContacts = (entries = [], user, body = {}) => {
    if (!Array.isArray(entries)) return [];

    return entries
        .map((entry) => ({
            role: cleanString(entry.role),
            name: cleanString(entry.name),
            email: cleanString(entry.email),
            phone: cleanString(entry.phone),
        }))
        .filter((entry) => MANAGED_CONTACT_ROLES.includes(entry.role))
        .filter((entry) => {
            if (entry.role === 'Gerenciador' && !parseBoolean(body.has_manager ?? false)) {
                return false;
            }

            if (entry.role === 'Arquitetura' && !parseBoolean(body.has_architecture ?? false)) {
                return false;
            }

            return true;
        })
        .filter((entry) => {
            if (RESTRICTED_CONTACT_ROLES.includes(entry.role) && !canViewRestricted(user)) {
                return false;
            }
            return true;
        });
};

const normalizeAlloraTeamMembers = (entries = []) => {
    if (!Array.isArray(entries)) return [];

    return entries
        .map((entry) => ({
            role: cleanString(entry.role),
            name: cleanString(entry.name),
            email: cleanString(entry.email).toLowerCase(),
            phone: cleanString(entry.phone),
            team_type: cleanString(entry.team_type),
        }))
        .filter((entry) => MANAGED_TEAM_MEMBER_ROLES.includes(entry.role));
};

const normalizeDirectBillingDocuments = (entries = []) => {
    const byKey = new Map();

    if (Array.isArray(entries)) {
        for (const entry of entries) {
            const key = cleanString(entry.document_key);
            if (!key) continue;
            byKey.set(key, entry);
        }
    }

    return DIRECT_BILLING_DOCUMENT_DEFINITIONS.map((definition) => {
        const current = byKey.get(definition.key) || {};
        return {
            document_key: definition.key,
            document_label: definition.label,
            audience: definition.audience,
            is_checked: Boolean(current.is_checked),
            notes: cleanString(current.notes) || null,
            sort_order: definition.sort_order,
        };
    });
};

const normalizeInitialChecklistItems = (entries = []) => {
    const byKey = new Map();

    if (Array.isArray(entries)) {
        for (const entry of entries) {
            const key = cleanString(entry.item_key);
            if (!key) continue;
            byKey.set(key, entry);
        }
    }

    return INITIAL_CHECKLIST_DEFINITIONS.map((definition) => {
        const current = byKey.get(definition.key) || {};
        return {
            item_key: definition.key,
            item_label: definition.label,
            category: definition.category,
            is_checked: Boolean(current.is_checked),
            selected_option: cleanString(current.selected_option) || null,
            value_text: cleanString(current.value_text) || null,
            notes: cleanString(current.notes) || null,
            sort_order: definition.sort_order,
        };
    });
};

const normalizeFinancialCompositionItems = (entries = []) => {
    if (!Array.isArray(entries)) return [];

    return entries
        .map((entry, index) => ({
            item_key: cleanString(entry.item_key) || `financial-item-${index + 1}`,
            label: cleanString(entry.label),
            category: cleanString(entry.category) || null,
            amount: parseDecimal(entry.amount),
            percentage: parseDecimal(entry.percentage),
            include_in_total: parseBoolean(entry.include_in_total) ?? true,
            sort_order: parseInteger(entry.sort_order) ?? index,
            notes: cleanString(entry.notes) || null,
        }))
        .filter((entry) => entry.label);
};

const normalizeIndirectExpenseItems = (entries = []) => {
    if (!Array.isArray(entries)) return [];

    return entries
        .map((entry, index) => ({
            item_key: cleanString(entry.item_key) || `indirect-expense-${index + 1}`,
            label: cleanString(entry.label),
            monthly_value: parseDecimal(entry.monthly_value),
            total_period: parseDecimal(entry.total_period),
            person_name: cleanString(entry.person_name) || null,
            sort_order: parseInteger(entry.sort_order) ?? index,
            notes: cleanString(entry.notes) || null,
        }))
        .filter((entry) => entry.label);
};

const mergeDefinitions = (definitions, currentItems, keyName) => {
    const serializedItems = serialize(currentItems || []);
    const byKey = new Map(serializedItems.map((item) => [item[keyName], item]));

    return definitions.map((definition) => ({
        ...definition,
        ...(byKey.get(definition[keyName]) || {}),
    }));
};

const sanitizeTaoResponse = (tao, user) => {
    if (!tao) return tao;

    const serialized = serialize(tao);
    serialized.status = unmapTaoStatus(serialized.status);

    if (!canViewRestricted(user)) {
        for (const field of RESTRICTED_TAO_FIELDS) {
            delete serialized[field];
        }

        if (Array.isArray(serialized.contacts)) {
            serialized.contacts = serialized.contacts.filter(
                (contact) => !RESTRICTED_CONTACT_ROLES.includes(contact.role)
            );
        }
    }

    if (Array.isArray(serialized.direct_billing_document_items)) {
        serialized.direct_billing_document_items = mergeDefinitions(
            DIRECT_BILLING_DOCUMENT_DEFINITIONS,
            serialized.direct_billing_document_items,
            'document_key'
        );
    } else {
        serialized.direct_billing_document_items = serialize(DIRECT_BILLING_DOCUMENT_DEFINITIONS);
    }

    if (Array.isArray(serialized.initial_checklist_items)) {
        serialized.initial_checklist_items = mergeDefinitions(
            INITIAL_CHECKLIST_DEFINITIONS,
            serialized.initial_checklist_items,
            'item_key'
        );
    } else {
        serialized.initial_checklist_items = serialize(INITIAL_CHECKLIST_DEFINITIONS);
    }

    if (Array.isArray(serialized.authorized_bank_accounts)) {
        serialized.authorized_bank_account_ids = serialized.authorized_bank_accounts.map(
            (entry) => entry.bank_account_id
        );
    } else {
        serialized.authorized_bank_accounts = [];
        serialized.authorized_bank_account_ids = [];
    }

    if (!Array.isArray(serialized.cost_centers)) {
        serialized.cost_centers = [];
    }

    return serialized;
};

const getRequestUser = async (reqOrUserId) => {
    if (typeof reqOrUserId === 'object' && reqOrUserId?.fx4User) {
        return {
            id: reqOrUserId.fx4User.id,
            email: reqOrUserId.fx4User.email,
            full_name: reqOrUserId.fx4User.full_name || 'Administrador FX4',
            role: reqOrUserId.fx4User.role,
            can_view_restricted_tao_fields: true,
        };
    }

    const userId = typeof reqOrUserId === 'object' ? reqOrUserId?.userId : reqOrUserId;
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            can_view_restricted_tao_fields: true,
        },
    });
};

const resolveTenantWriteUserId = async (transaction, req, user) => {
    if (!req?.fx4User) return req?.userId || user?.id || null;

    const email = String(user?.email || req.fx4User.email || '').trim().toLowerCase();
    if (!email) return req.userId;

    const existingUser = await transaction.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existingUser?.id) return existingUser.id;

    const createdUser = await transaction.user.create({
        data: {
            email,
            full_name: req.assistedTenant?.display_name
                ? `Suporte FX4 em ${req.assistedTenant.display_name}`
                : user?.full_name || 'Suporte FX4',
            role: 'admin',
            auth_provider: 'local',
            is_active: true,
            can_view_restricted_tao_fields: true,
        },
        select: { id: true },
    });

    return createdUser.id;
};

const ensureTaoExists = async (transaction, taoId, currentTaoId = null) => {
    if (!siengeHasValue(taoId)) return null;

    const normalizedId = cleanSiengeString(taoId);
    if (currentTaoId && normalizedId === currentTaoId) {
        const error = new Error('Uma TAO não pode ser vinculada a si mesma como obra principal.');
        error.statusCode = 400;
        throw error;
    }

    const tao = await transaction.tao.findUnique({
        where: { id: normalizedId },
        select: { id: true },
    });

    if (!tao) {
        const error = new Error('Obra principal vinculada não encontrada.');
        error.statusCode = 400;
        throw error;
    }

    return tao.id;
};

const ensureBankAccountExists = async (transaction, bankAccountId, label) => {
    if (bankAccountId === undefined) return undefined;
    if (!siengeHasValue(bankAccountId)) return null;

    const normalizedId = cleanSiengeString(bankAccountId);
    const bankAccount = await transaction.bankAccount.findUnique({
        where: { id: normalizedId },
        select: { id: true },
    });

    if (!bankAccount) {
        const error = new Error(`${label} não encontrada.`);
        error.statusCode = 400;
        throw error;
    }

    return bankAccount.id;
};

const ensureUserExists = async (transaction, userId, label) => {
    if (userId === undefined) return undefined;
    if (!siengeHasValue(userId)) return null;

    const normalizedId = cleanSiengeString(userId);
    const user = await transaction.user.findUnique({
        where: { id: normalizedId },
        select: { id: true },
    });

    if (!user) {
        const error = new Error(`${label} não encontrado.`);
        error.statusCode = 400;
        throw error;
    }

    return user.id;
};

const resolveSiengeReferences = async (transaction, body, currentTaoId = null) => {
    const relationData = {};

    if ('parent_tao_id' in body) {
        relationData.parent_tao_id = await ensureTaoExists(transaction, body.parent_tao_id, currentTaoId);
    }

    if ('responsible_company_id' in body || 'responsible_company_payload' in body) {
        relationData.responsible_company_id = await resolveCompanyReference(
            transaction,
            body.responsible_company_id,
            body.responsible_company_payload,
            'Empresa responsável'
        );
    }

    if ('client_id' in body || 'client_payload' in body) {
        relationData.client_id = await resolveClientReference(
            transaction,
            body.client_id,
            body.client_payload
        );
    }

    if ('financial_company_id' in body || 'financial_company_payload' in body) {
        relationData.financial_company_id = await resolveCompanyReference(
            transaction,
            body.financial_company_id,
            body.financial_company_payload,
            'Empresa financeira responsável'
        );
    }

    if ('financial_business_area_id' in body || 'financial_business_area_payload' in body) {
        relationData.financial_business_area_id = await resolveBusinessAreaReference(
            transaction,
            body.financial_business_area_id,
            body.financial_business_area_payload
        );
    }

    if ('financial_cost_center_category_id' in body || 'financial_cost_center_category_payload' in body) {
        relationData.financial_cost_center_category_id = await resolveCostCenterCategoryReference(
            transaction,
            body.financial_cost_center_category_id,
            body.financial_cost_center_category_payload
        );
    }

    if ('default_financial_bank_account_id' in body) {
        relationData.default_financial_bank_account_id = await ensureBankAccountExists(
            transaction,
            body.default_financial_bank_account_id,
            'Conta corrente padrão'
        );
    }

    if ('billing_issue_bank_account_id' in body) {
        relationData.billing_issue_bank_account_id = await ensureBankAccountExists(
            transaction,
            body.billing_issue_bank_account_id,
            'Conta para emissão de boletos'
        );
    }

    if ('engineering_approver_user_id' in body) {
        relationData.engineering_approver_user_id = await ensureUserExists(
            transaction,
            body.engineering_approver_user_id,
            'Aprovador de engenharia'
        );
    }

    if ('financial_approver_user_id' in body) {
        relationData.financial_approver_user_id = await ensureUserExists(
            transaction,
            body.financial_approver_user_id,
            'Aprovador financeiro'
        );
    }

    if ('fiscal_approver_user_id' in body) {
        relationData.fiscal_approver_user_id = await ensureUserExists(
            transaction,
            body.fiscal_approver_user_id,
            'Aprovador fiscal'
        );
    }

    if ('board_approver_user_id' in body) {
        relationData.board_approver_user_id = await ensureUserExists(
            transaction,
            body.board_approver_user_id,
            'Aprovador de diretoria'
        );
    }

    const costCenters = 'cost_centers' in body
        ? await normalizeCostCenterPayload(transaction, body.cost_centers)
        : undefined;

    const authorizedBankAccountIds = 'authorized_bank_account_ids' in body
        ? normalizeIdArray(body.authorized_bank_account_ids)
        : undefined;

    for (const bankAccountId of authorizedBankAccountIds || []) {
        await ensureBankAccountExists(transaction, bankAccountId, 'Conta corrente autorizada');
    }

    return {
        relationData,
        costCenters,
        authorizedBankAccountIds,
    };
};

const syncManagedContacts = async (transaction, taoId, contacts, user, body) => {
    const payload = normalizeAlloraContacts(contacts, user, body);
    const existing = await transaction.taoContact.findMany({
        where: { tao_id: taoId, role: { in: MANAGED_CONTACT_ROLES } },
    });

    const payloadByRole = new Map(payload.map((entry) => [entry.role, entry]));

    for (const record of existing) {
        if (!payloadByRole.has(record.role)) {
            await transaction.taoContact.delete({ where: { id: record.id } });
        }
    }

    for (const role of MANAGED_CONTACT_ROLES) {
        const entry = payloadByRole.get(role);
        const current = existing.find((record) => record.role === role);

        if (!entry || (!entry.name && !entry.email && !entry.phone)) {
            continue;
        }

        const data = {
            name: entry.name || role,
            role,
            email: entry.email || null,
            phone: entry.phone || null,
        };

        if (current) {
            await transaction.taoContact.update({
                where: { id: current.id },
                data,
            });
        } else {
            await transaction.taoContact.create({
                data: {
                    tao_id: taoId,
                    ...data,
                },
            });
        }
    }
};

const syncManagedTeamMembers = async (transaction, taoId, teamMembers) => {
    const payload = normalizeAlloraTeamMembers(teamMembers);
    const existing = await transaction.taoTeamMember.findMany({
        where: { tao_id: taoId, role: { in: MANAGED_TEAM_MEMBER_ROLES } },
    });

    const payloadByRole = new Map(payload.map((entry) => [entry.role, entry]));

    for (const record of existing) {
        if (!payloadByRole.has(record.role)) {
            await transaction.taoTeamMember.delete({ where: { id: record.id } });
        }
    }

    for (const role of MANAGED_TEAM_MEMBER_ROLES) {
        const entry = payloadByRole.get(role);
        const current = existing.find((record) => record.role === role);

        if (!entry || (!entry.name && !entry.email && !entry.phone)) {
            continue;
        }

        const data = {
            name: entry.name || role,
            role,
            email: entry.email || null,
            phone: entry.phone || null,
            team_type: entry.team_type || null,
        };

        if (current) {
            await transaction.taoTeamMember.update({
                where: { id: current.id },
                data,
            });
        } else {
            await transaction.taoTeamMember.create({
                data: {
                    tao_id: taoId,
                    ...data,
                },
            });
        }
    }
};

const syncDirectBillingDocuments = async (transaction, taoId, items) => {
    const payload = normalizeDirectBillingDocuments(items);
    const existing = await transaction.taoDirectBillingDocumentItem.findMany({
        where: { tao_id: taoId },
    });
    const existingByKey = new Map(existing.map((item) => [item.document_key, item]));

    for (const item of payload) {
        const current = existingByKey.get(item.document_key);

        if (current) {
            await transaction.taoDirectBillingDocumentItem.update({
                where: { id: current.id },
                data: item,
            });
        } else {
            await transaction.taoDirectBillingDocumentItem.create({
                data: {
                    tao_id: taoId,
                    ...item,
                },
            });
        }
    }
};

const syncInitialChecklistItems = async (transaction, taoId, items) => {
    const payload = normalizeInitialChecklistItems(items);
    const existing = await transaction.taoInitialChecklistItem.findMany({
        where: { tao_id: taoId },
    });
    const existingByKey = new Map(existing.map((item) => [item.item_key, item]));

    for (const item of payload) {
        const current = existingByKey.get(item.item_key);

        if (current) {
            await transaction.taoInitialChecklistItem.update({
                where: { id: current.id },
                data: item,
            });
        } else {
            await transaction.taoInitialChecklistItem.create({
                data: {
                    tao_id: taoId,
                    ...item,
                },
            });
        }
    }
};

const syncItemsByKey = async (model, taoId, items, normalizeItems) => {
    const payload = normalizeItems(items);
    const existing = await model.findMany({ where: { tao_id: taoId } });
    const existingByKey = new Map(existing.map((item) => [item.item_key, item]));
    const nextKeys = new Set(payload.map((item) => item.item_key));

    for (const current of existing) {
        if (!nextKeys.has(current.item_key)) {
            await model.delete({ where: { id: current.id } });
        }
    }

    for (const item of payload) {
        const current = existingByKey.get(item.item_key);
        if (current) {
            await model.update({ where: { id: current.id }, data: item });
        } else {
            await model.create({ data: { tao_id: taoId, ...item } });
        }
    }
};

const syncCostCenters = async (transaction, taoId, costCenters) => {
    if (!Array.isArray(costCenters)) {
        return;
    }

    const existing = await transaction.taoCostCenter.findMany({
        where: { tao_id: taoId },
    });
    const buildKey = (item) => `${item.cost_center_code}::${item.purpose || ''}`;
    const existingByCode = new Map(existing.map((item) => [buildKey(item), item]));
    const nextCodes = new Set(costCenters.map(buildKey));

    for (const current of existing) {
        if (!nextCodes.has(buildKey(current))) {
            await transaction.taoCostCenter.delete({ where: { id: current.id } });
        }
    }

    for (const item of costCenters) {
        const current = existingByCode.get(buildKey(item));
        const data = {
            cost_center_code: item.cost_center_code,
            name: item.name,
            linked_document: item.linked_document || null,
            company_id: item.company_id,
            business_area_id: item.business_area_id,
            cost_center_category_id: item.cost_center_category_id,
            purpose: item.purpose,
            is_primary: Boolean(item.is_primary),
            participates_financial: Boolean(item.participates_financial),
            participates_budget: Boolean(item.participates_budget),
            participates_supplies: Boolean(item.participates_supplies),
            participates_measurements: Boolean(item.participates_measurements),
            observations: item.observations || null,
        };

        if (current) {
            await transaction.taoCostCenter.update({
                where: { id: current.id },
                data,
            });
        } else {
            await transaction.taoCostCenter.create({
                data: {
                    tao_id: taoId,
                    ...data,
                },
            });
        }
    }
};

const syncAuthorizedBankAccounts = async (transaction, taoId, bankAccountIds) => {
    if (!Array.isArray(bankAccountIds)) {
        return;
    }

    const existing = await transaction.taoAuthorizedBankAccount.findMany({
        where: { tao_id: taoId },
    });
    const existingIds = new Set(existing.map((item) => item.bank_account_id));
    const nextIds = new Set(bankAccountIds);

    for (const current of existing) {
        if (!nextIds.has(current.bank_account_id)) {
            await transaction.taoAuthorizedBankAccount.delete({ where: { id: current.id } });
        }
    }

    for (const bankAccountId of bankAccountIds) {
        if (existingIds.has(bankAccountId)) {
            continue;
        }

        await transaction.taoAuthorizedBankAccount.create({
            data: {
                tao_id: taoId,
                bank_account_id: bankAccountId,
            },
        });
    }
};

const syncNestedData = async (transaction, taoId, body, user) => {
    if ('allora_contacts' in body) {
        await syncManagedContacts(transaction, taoId, body.allora_contacts, user, body);
    }

    if ('allora_team_members' in body) {
        await syncManagedTeamMembers(transaction, taoId, body.allora_team_members);
    }

    if ('direct_billing_document_items' in body) {
        await syncDirectBillingDocuments(transaction, taoId, body.direct_billing_document_items);
    }

    if ('initial_checklist_items' in body) {
        await syncInitialChecklistItems(transaction, taoId, body.initial_checklist_items);
    }

    if ('financial_composition_items' in body) {
        await syncItemsByKey(
            transaction.taoFinancialCompositionItem,
            taoId,
            body.financial_composition_items,
            normalizeFinancialCompositionItems
        );
    }

    if ('indirect_expense_items' in body) {
        await syncItemsByKey(
            transaction.taoIndirectExpenseItem,
            taoId,
            body.indirect_expense_items,
            normalizeIndirectExpenseItems
        );
    }
};

const sanitizeWriteBody = (body, user) => {
    const payload = { ...body };

    if (!canViewRestricted(user)) {
        for (const field of RESTRICTED_TAO_FIELDS) {
            delete payload[field];
        }

        if (Array.isArray(payload.allora_contacts)) {
            payload.allora_contacts = payload.allora_contacts.filter(
                (entry) => !RESTRICTED_CONTACT_ROLES.includes(cleanString(entry.role))
            );
        }
    }

    return payload;
};

const buildValidationSnapshot = (current = {}, data = {}, relationData = {}, costCenters) => ({
    ...current,
    ...data,
    ...relationData,
    cost_centers: Array.isArray(costCenters)
        ? costCenters
        : Array.isArray(current.cost_centers)
            ? current.cost_centers
            : [],
});

const buildAuditSnapshot = (tao = {}) => ({
    erp_number: tao.erp_number ?? null,
    registration_type: tao.registration_type ?? null,
    responsible_company_id: tao.responsible_company_id ?? null,
    client_id: tao.client_id ?? null,
    financial_cost_center_category_id: tao.financial_cost_center_category_id ?? null,
    financial_business_area_id: tao.financial_business_area_id ?? null,
    construction_situation: tao.construction_situation ?? null,
    is_ret_regime: tao.is_ret_regime ?? null,
    cost_centers: Array.isArray(tao.cost_centers)
        ? tao.cost_centers.map((item) => ({
            cost_center_code: item.cost_center_code,
            name: item.name,
            is_primary: item.is_primary,
        }))
        : [],
});

const hasTaoApprovalApprover = (approvers = []) =>
    Array.isArray(approvers) && approvers.some((entry) => ['tao', 'both'].includes(entry.scope));

const ensureApprovalFlowConsistency = ({ body = {}, data = {}, existing = {}, approvers = [] }) => {
    const hasApprover = hasTaoApprovalApprover(approvers);
    const effectiveApprovalFlowEnabled = data.approval_flow_enabled !== undefined
        ? Boolean(data.approval_flow_enabled)
        : Boolean(existing.approval_flow_enabled);
    const requestedApprovalStatus = data.approval_status ?? existing.approval_status;

    if (data.approval_flow_enabled === true && !hasApprover) {
        const error = new Error('A hierarquia de aprovação só pode ser ativada após cadastrar pelo menos um aprovador de TAO.');
        error.statusCode = 400;
        throw error;
    }

    if (requestedApprovalStatus === 'pending' && (!effectiveApprovalFlowEnabled || !hasApprover)) {
        const error = new Error('Não é possível deixar a TAO pendente sem hierarquia ativa e aprovador configurado.');
        error.statusCode = 400;
        throw error;
    }

    if (data.approval_flow_enabled === false || (!hasApprover && existing.approval_status === 'pending')) {
        data.approval_status = 'draft';
        data.current_approval_level = 0;
        if (data.tao_lifecycle_status === 'EM_VALIDACAO' || existing.tao_lifecycle_status === 'EM_VALIDACAO') {
            data.tao_lifecycle_status = null;
        }
    }

    if (body.approval_status === 'pending') {
        data.approval_flow_enabled = true;
    }
};

// Create new TAO
exports.create = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        const body = sanitizeWriteBody(req.body || {}, user);
        const data = buildTaoData(body, user);

        const tao = await prisma.$transaction(async (transaction) => {
            const writerUserId = await resolveTenantWriteUserId(transaction, req, user);
            data.created_by_id = writerUserId;
            data.updated_by_id = writerUserId;

            const { relationData, costCenters, authorizedBankAccountIds } = await resolveSiengeReferences(
                transaction,
                body
            );

            Object.assign(data, relationData, buildLifecycleMetadata(data));
            ensureApprovalFlowConsistency({ body, data, existing: {}, approvers: [] });
            validateTaoSiengePayload(buildValidationSnapshot({}, data, relationData, costCenters));

            const created = await transaction.tao.create({ data });
            await syncNestedData(transaction, created.id, body, user);
            await syncCostCenters(transaction, created.id, costCenters);
            await syncAuthorizedBankAccounts(transaction, created.id, authorizedBankAccountIds);

            const loaded = await transaction.tao.findUnique({
                where: { id: created.id },
                include: TAO_INCLUDE,
            });

            await transaction.taoLog.create({
                data: {
                    tao_id: created.id,
                    user_email: user?.email || null,
                    action: 'create',
                    details: {
                        source: 'taoController.create',
                        registration_type: loaded?.registration_type || null,
                        tao_lifecycle_status: loaded?.tao_lifecycle_status || null,
                        cost_center_count: loaded?.cost_centers?.length || 0,
                    },
                },
            });

            return loaded;
        });

        invalidateTenantPublicMapCache(req);
        res.status(201).json(sanitizeTaoResponse(tao, user));
    } catch (error) {
        console.error('Failed to create TAO:', error);
        res.status(error.statusCode || 500).json({ error: 'Failed to create TAO', details: error.message });
    }
};

// List all TAOs (with simple pagination/filter support)
exports.list = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        const {
            page = 1,
            limit = 10,
            status,
            approval_status: approvalStatus,
            sort_by: sortBy = 'project_name',
            sort_order: sortOrder = 'asc',
        } = req.query;
        const skip = (page - 1) * limit;

        const where = {};
        if (status) where.status = mapTaoStatus(status);
        if (approvalStatus) where.approval_status = approvalStatus;

        const allowedSortFields = {
            project_name: 'project_name',
            erp_number: 'erp_number',
            hiring_regime: 'hiring_regime',
            created_at: 'created_at',
            status: 'status',
        };

        const normalizedSortField = allowedSortFields[String(sortBy || '').trim()] || 'project_name';
        const normalizedSortOrder = String(sortOrder || '').toLowerCase() === 'desc' ? 'desc' : 'asc';

        const taos = await prisma.tao.findMany({
            where,
            skip: Number.parseInt(skip, 10),
            take: Number.parseInt(limit, 10),
            orderBy: [
                { [normalizedSortField]: normalizedSortOrder },
                { created_at: 'desc' },
            ],
            include: {
                created_by: { select: { full_name: true, email: true } },
            },
        });

        const total = await prisma.tao.count({ where });

        res.status(200).json({
            data: taos.map((tao) => sanitizeTaoResponse(tao, user)),
            meta: {
                total,
                page: Number.parseInt(page, 10),
                limit: Number.parseInt(limit, 10),
                pages: Math.ceil(total / limit),
                sort_by: normalizedSortField,
                sort_order: normalizedSortOrder,
            },
        });
    } catch (error) {
        console.error('Failed to fetch TAOs:', error);
        res.status(500).json({ error: 'Failed to fetch TAOs' });
    }
};

// Get TAO by ID
exports.getById = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        const { id } = req.params;
        const tao = await prisma.tao.findUnique({
            where: { id },
            include: TAO_INCLUDE,
        });

        if (!tao) {
            return res.status(404).json({ error: 'TAO not found' });
        }

        res.status(200).json(sanitizeTaoResponse(tao, user));
    } catch (error) {
        console.error('Failed to fetch TAO:', error);
        res.status(500).json({ error: 'Failed to fetch TAO' });
    }
};

// Update TAO
exports.update = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        const { id } = req.params;
        const body = sanitizeWriteBody(req.body || {}, user);
        const data = buildTaoData(body, user);

        const tao = await prisma.$transaction(async (transaction) => {
            const existing = await transaction.tao.findUnique({
                where: { id },
                include: {
                    cost_centers: true,
                    approvers: true,
                },
            });

            if (!existing) {
                const error = new Error('TAO not found');
                error.statusCode = 404;
                throw error;
            }

            const isPrivileged = user?.role === 'admin' || user?.role === 'director';
            if (!isPrivileged && body.approval_status && body.approval_status !== existing.approval_status) {
                const canSubmit = ['draft', 'rejected'].includes(existing.approval_status)
                    && body.approval_status === 'pending'
                    && Number(body.current_approval_level || 0) === 0;
                if (!canSubmit) {
                    const error = new Error('Alteração de aprovação deve usar o fluxo de decisão da TAO.');
                    error.statusCode = 403;
                    throw error;
                }
            }
            const isLocked = ['pending', 'approved'].includes(existing.approval_status)
                || ['APROVADA', 'CADASTRADA_NO_SIENGE', 'CANCELADA'].includes(existing.tao_lifecycle_status);
            if (isLocked && !isPrivileged) {
                const error = new Error('TAO bloqueada para edição durante/após aprovação.');
                error.statusCode = 423;
                throw error;
            }

            const previousAuditSnapshot = buildAuditSnapshot(existing);
            const { relationData, costCenters, authorizedBankAccountIds } = await resolveSiengeReferences(
                transaction,
                body,
                id
            );
            const writerUserId = await resolveTenantWriteUserId(transaction, req, user);

            const updateData = {
                ...data,
                ...relationData,
                ...buildLifecycleMetadata(data, existing),
                updated_by_id: writerUserId,
            };

            ensureApprovalFlowConsistency({
                body,
                data: updateData,
                existing,
                approvers: existing.approvers,
            });

            if (Object.prototype.hasOwnProperty.call(updateData, 'status')) {
                updateData.status = getHigherTaoStatus(existing.status, updateData.status);
            }

            validateTaoSiengePayload(
                buildValidationSnapshot(existing, updateData, relationData, costCenters)
            );

            await transaction.tao.update({
                where: { id },
                data: updateData,
            });

            await syncNestedData(transaction, id, body, user);
            await syncCostCenters(transaction, id, costCenters);
            await syncAuthorizedBankAccounts(transaction, id, authorizedBankAccountIds);

            const loaded = await transaction.tao.findUnique({
                where: { id },
                include: TAO_INCLUDE,
            });

            const criticalChanges = buildCriticalFieldChanges(
                previousAuditSnapshot,
                buildAuditSnapshot(loaded)
            );

            if (criticalChanges.length) {
                await transaction.taoLog.create({
                    data: {
                        tao_id: id,
                        user_email: user?.email || null,
                        action: 'update',
                        details: {
                            source: 'taoController.update',
                            critical_changes: criticalChanges,
                        },
                    },
                });
            }

            return loaded;
        });

        invalidateTenantPublicMapCache(req);
        res.status(200).json(sanitizeTaoResponse(tao, user));
    } catch (error) {
        console.error('Failed to update TAO:', error);
        res.status(error.statusCode || 500).json({ error: 'Failed to update TAO', details: error.message });
    }
};

// Delete TAO
exports.delete = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        if (!user || !['admin', 'director'].includes(user.role)) {
            return res.status(403).json({ error: 'Apenas administradores e diretores podem excluir uma TAO.' });
        }
        const { id } = req.params;
        await prisma.tao.delete({ where: { id } });
        invalidateTenantPublicMapCache(req);
        res.status(204).send();
    } catch (error) {
        console.error('Failed to delete TAO:', error);
        res.status(500).json({ error: 'Failed to delete TAO' });
    }
};

exports.decideApproval = async (req, res) => {
    try {
        const user = await getRequestUser(req);
        const action = cleanString(req.body?.action).toLowerCase();
        const comments = cleanString(req.body?.comments) || null;
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ error: 'A decisão deve ser approved ou rejected.' });
        }

        const tao = await prisma.$transaction(async (transaction) => {
            const current = await transaction.tao.findUnique({
                where: { id: req.params.id },
                include: { approvers: true },
            });
            if (!current) {
                const error = new Error('TAO not found');
                error.statusCode = 404;
                throw error;
            }
            if (current.approval_status !== 'pending') {
                const error = new Error('Esta TAO não está aguardando aprovação.');
                error.statusCode = 409;
                throw error;
            }
            if (!current.approval_flow_enabled || !hasTaoApprovalApprover(current.approvers)) {
                const error = new Error('Esta TAO não possui hierarquia de aprovação ativa.');
                error.statusCode = 409;
                throw error;
            }

            const expectedLevel = (current.current_approval_level || 0) + 1;
            const approver = current.approvers.find((entry) =>
                entry.user_email === user?.email
                && ['tao', 'both'].includes(entry.scope)
                && entry.level === expectedLevel
            );
            const isPrivileged = user?.role === 'admin' || user?.role === 'director';
            if (!approver && !isPrivileged) {
                const error = new Error('Usuário não é o aprovador responsável pelo nível atual.');
                error.statusCode = 403;
                throw error;
            }

            const relevantApprovers = current.approvers.filter((entry) => ['tao', 'both'].includes(entry.scope));
            const maxLevel = relevantApprovers.length
                ? Math.max(...relevantApprovers.map((entry) => entry.level))
                : expectedLevel;
            const decisionLevel = approver?.level || expectedLevel;
            const isFinalApproval = action === 'approved' && decisionLevel >= maxLevel;
            const writerUserId = await resolveTenantWriteUserId(transaction, req, user);

            await transaction.taoApprovalHistory.create({
                data: {
                    reference_id: current.id,
                    reference_type: 'tao',
                    approver_email: user.email,
                    action,
                    level: decisionLevel,
                    comments,
                },
            });

            await transaction.tao.update({
                where: { id: current.id },
                data: {
                    current_approval_level: action === 'approved' ? decisionLevel : current.current_approval_level,
                    approval_status: action === 'rejected' ? 'rejected' : isFinalApproval ? 'approved' : 'pending',
                    tao_lifecycle_status: action === 'rejected' ? 'REPROVADA' : isFinalApproval ? 'APROVADA' : 'EM_VALIDACAO',
                    approved_at: isFinalApproval ? new Date() : null,
                    rejection_reason: action === 'rejected' ? comments : null,
                    updated_by_id: writerUserId,
                },
            });

            return transaction.tao.findUnique({ where: { id: current.id }, include: TAO_INCLUDE });
        });

        invalidateTenantPublicMapCache(req);
        return res.status(200).json(sanitizeTaoResponse(tao, user));
    } catch (error) {
        console.error('Failed to decide TAO approval:', error);
        return res.status(error.statusCode || 500).json({ error: 'Falha ao registrar decisão.', details: error.message });
    }
};

// Check Access for Deep Linking
exports.checkAccess = async (req, res) => {
    try {
        const { identifier } = req.params;
        const userId = req.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const userEmail = user.email;
        const userRole = user.role;

        const tao = await prisma.tao.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { erp_number: identifier },
                ],
            },
            include: {
                approvers: true,
                access_permissions: true,
                team_members: true,
                created_by: true,
            },
        });

        if (!tao) {
            return res.status(404).json({ authorized: false, reason: 'TAO_NOT_FOUND' });
        }

        if (userRole === 'admin' || userRole === 'director') {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'ADMIN_OR_DIRECTOR' });
        }

        if (tao.created_by.email === userEmail) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'CREATOR' });
        }

        const isApprover = tao.approvers.some((approver) => approver.user_email === userEmail);
        if (isApprover) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'APPROVER' });
        }

        const hasWorkPermission = tao.access_permissions.some((permission) => permission.user_email === userEmail);
        if (hasWorkPermission) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'WORK_PERMISSION' });
        }

        const isTeamMember = tao.team_members.some((member) => member.email === userEmail);
        if (isTeamMember) {
            return res.status(200).json({ authorized: true, taoId: tao.id, reason: 'TEAM_MEMBER' });
        }

        return res.status(403).json({ authorized: false, taoId: tao.id, reason: 'UNAUTHORIZED' });
    } catch (error) {
        console.error('Check Access Error:', error);
        res.status(500).json({ error: 'Failed to check access' });
    }
};
