const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const {
    DIRECT_BILLING_DOCUMENT_DEFINITIONS,
    INITIAL_CHECKLIST_DEFINITIONS,
    RESTRICTED_CONTACT_ROLES,
    RESTRICTED_TAO_FIELDS,
} = require('../constants/taoAllora');

const prisma = new PrismaClient();

const STATUS_IMPORT_MAP = {
    start: 'start',
    '1': 'step1',
    '2': 'step2',
    '3': 'step3',
    '4': 'step4',
    '5': 'step5',
    step1: 'step1',
    step2: 'step2',
    step3: 'step3',
    step4: 'step4',
    step5: 'step5',
};

const STATUS_EXPORT_MAP = {
    start: 'start',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
};

const TEAM_ROLE_DEFINITIONS = [
    { role: 'Engº Responsavel', prefix: 'Engº Responsavel' },
    { role: 'Mestre de Obra', prefix: 'Mestre de Obra' },
];

const CONTACT_ROLE_DEFINITIONS = [
    { role: 'Contato Cliente', prefix: 'Contato Cliente' },
    { role: 'Gerenciador', prefix: 'Gerenciador' },
    { role: 'Arquitetura', prefix: 'Arquitetura' },
    { role: 'Contato para envio de relatorios', prefix: 'Contato para envio de relatorios', restricted: true },
    { role: 'Com copia', prefix: 'Com copia', restricted: true },
];

const BASE_COLUMN_DEFINITIONS = [
    { key: 'tao_id', label: 'ID TAO', kind: 'meta' },
    { key: 'status', label: 'Etapa da TAO', kind: 'field', field: 'status', type: 'status' },
    { key: 'approval_status', label: 'Status da Aprovação', kind: 'field', field: 'approval_status', type: 'approval_status' },
    { key: 'current_approval_level', label: 'Nível Atual de Aprovação', kind: 'field', field: 'current_approval_level', type: 'integer' },
    { key: 'project_name', label: 'Sigla/nome da obra', kind: 'field', field: 'project_name', type: 'string', requiredForCreate: true },
    { key: 'erp_number', label: 'Codigo da obra', kind: 'field', field: 'erp_number', type: 'string' },
    { key: 'center_cost_client', label: 'CENTRO DE CUSTO', kind: 'field', field: 'center_cost_client', type: 'string' },
    { key: 'center_cost_allora', label: 'Codigo centro de custo Allora', kind: 'field', field: 'center_cost_allora', type: 'string' },
    { key: 'project_code', label: 'Projeto #', kind: 'field', field: 'project_code', type: 'string' },
    { key: 'proposal_number', label: 'Nº Proposta', kind: 'field', field: 'proposal_number', type: 'string' },
    { key: 'company_code', label: 'Empresa', kind: 'field', field: 'company_code', type: 'string' },
    { key: 'project_group', label: 'Grupo', kind: 'field', field: 'project_group', type: 'string' },
    { key: 'extra_center_costs_client', label: 'Outros centros de custo + codigo da empresa', kind: 'field', field: 'extra_center_costs_client', type: 'string' },
    { key: 'date_start', label: 'Data inicio de obra', kind: 'field', field: 'date_start', type: 'date' },
    { key: 'date_end', label: 'Termino previsto', kind: 'field', field: 'date_end', type: 'date' },
    { key: 'actual_start_date', label: 'Data de inicio real', kind: 'field', field: 'actual_start_date', type: 'date' },
    { key: 'actual_end_date', label: 'Data de termino real', kind: 'field', field: 'actual_end_date', type: 'date' },
    { key: 'duration_months', label: 'Tempo de obra', kind: 'field', field: 'duration_months', type: 'integer' },
    { key: 'construction_address', label: 'Local', kind: 'field', field: 'construction_address', type: 'string' },
    { key: 'construction_city', label: 'Cidade', kind: 'field', field: 'construction_city', type: 'string' },
    { key: 'construction_state', label: 'UF', kind: 'field', field: 'construction_state', type: 'string' },
    { key: 'construction_zip', label: 'CEP', kind: 'field', field: 'construction_zip', type: 'string' },
    { key: 'has_manager', label: 'Gerenciador habilitado', kind: 'field', field: 'has_manager', type: 'boolean' },
    { key: 'has_architecture', label: 'Arquitetura habilitada', kind: 'field', field: 'has_architecture', type: 'boolean' },
    { key: 'billing_company_name', label: 'Nome / Razao Social', kind: 'field', field: 'billing_company_name', type: 'string' },
    { key: 'billing_cnpj', label: 'CNPJ/CPF', kind: 'field', field: 'billing_cnpj', type: 'string' },
    { key: 'billing_address', label: 'Endereco completo', kind: 'field', field: 'billing_address', type: 'string' },
    { key: 'billing_neighborhood', label: 'Bairro', kind: 'field', field: 'billing_neighborhood', type: 'string' },
    { key: 'billing_city', label: 'Cidade do faturamento', kind: 'field', field: 'billing_city', type: 'string' },
    { key: 'billing_state', label: 'Estado', kind: 'field', field: 'billing_state', type: 'string' },
    { key: 'billing_zip', label: 'CEP do faturamento', kind: 'field', field: 'billing_zip', type: 'string' },
    { key: 'has_delivery_restriction', label: 'Restricao de entrega', kind: 'field', field: 'has_delivery_restriction', type: 'boolean' },
    { key: 'delivery_restriction_notes', label: 'Restricao de entrega - Quais', kind: 'field', field: 'delivery_restriction_notes', type: 'string' },
    { key: 'billing_model', label: 'Modelo de Faturamento', kind: 'field', field: 'billing_model', type: 'string' },
    { key: 'budget_model', label: 'Modelo de Contratacao orcamento', kind: 'field', field: 'budget_model', type: 'string' },
    { key: 'hiring_regime', label: 'Modelo de Contratacao', kind: 'field', field: 'hiring_regime', type: 'string' },
    { key: 'hiring_regime_detail', label: 'Detalhe da Contratacao', kind: 'field', field: 'hiring_regime_detail', type: 'string' },
    { key: 'report_frequency', label: 'Periodo de envio de relatorios', kind: 'field', field: 'report_frequency', type: 'string' },
    { key: 'requires_physical_delivery', label: 'Necessidade de envio fisico', kind: 'field', field: 'requires_physical_delivery', type: 'boolean' },
    { key: 'physical_delivery_address', label: 'Endereco de envio fisico', kind: 'field', field: 'physical_delivery_address', type: 'string' },
    { key: 'has_invoice_cutoff', label: 'Data de corte para emissao de notas fiscais', kind: 'field', field: 'has_invoice_cutoff', type: 'boolean' },
    { key: 'invoice_cutoff_day', label: 'Qual dia', kind: 'field', field: 'invoice_cutoff_day', type: 'string' },
    { key: 'notes_to_finance_deadline', label: 'Prazo para equipe de obras enviar as notas ao financeiro', kind: 'field', field: 'notes_to_finance_deadline', type: 'string' },
    { key: 'report_send_day', label: 'Dia de envio do relatorio ao cliente', kind: 'field', field: 'report_send_day', type: 'string' },
    { key: 'payment_after_report_terms', label: 'Data de pagamento a partir do envio do relatorio', kind: 'field', field: 'payment_after_report_terms', type: 'string' },
    { key: 'financial_schedule_notes', label: 'Programacao financeira', kind: 'field', field: 'financial_schedule_notes', type: 'string' },
    { key: 'value_total_contract', label: 'Valor final negociado', kind: 'field', field: 'value_total_contract', type: 'decimal' },
    { key: 'payment_terms_text', label: 'Forma de Pagamento', kind: 'field', field: 'payment_terms_text', type: 'string' },
    { key: 'admin_financial_schedule_text', label: 'Programacao de envio financeiro', kind: 'field', field: 'admin_financial_schedule_text', type: 'string' },
    { key: 'admin_notes', label: 'Observacoes Administracao', kind: 'field', field: 'admin_notes', type: 'string' },
    { key: 'requires_cno', label: 'Necessidade de CNO', kind: 'field', field: 'requires_cno', type: 'boolean' },
    { key: 'obra_cno', label: 'CNO Nº', kind: 'field', field: 'obra_cno', type: 'string' },
    { key: 'obra_sfobras', label: 'SFOBRAS', kind: 'field', field: 'obra_sfobras', type: 'string' },
    { key: 'client_contract_status', label: 'Contrato com o cliente', kind: 'field', field: 'client_contract_status', type: 'string' },
    { key: 'date_signature', label: 'Data de assinatura', kind: 'field', field: 'date_signature', type: 'date' },
    { key: 'work_insurance_status', label: 'Seguro de obra', kind: 'field', field: 'work_insurance_status', type: 'string' },
    { key: 'work_insurance_validity', label: 'Vigencia da apolice', kind: 'field', field: 'work_insurance_validity', type: 'string' },
    { key: 'art_status', label: 'ART', kind: 'field', field: 'art_status', type: 'string' },
    { key: 'sharepoint_url', label: 'URL SharePoint', kind: 'field', field: 'sharepoint_url', type: 'string' },
    { key: 'observations_general', label: 'Observacoes gerais', kind: 'field', field: 'observations_general', type: 'string' },
];

const RESTRICTED_COLUMN_DEFINITIONS = [
    { key: 'restricted_admin_percent', label: '% ADM sobre orcamento', kind: 'field', field: 'restricted_admin_percent', type: 'decimal', restricted: true },
    { key: 'restricted_tax_mode', label: 'Imposto: incluso ou calcular sobre o percentual', kind: 'field', field: 'restricted_tax_mode', type: 'string', restricted: true },
    { key: 'restricted_admin_monthly_value', label: 'ADM fixa ao mes com imposto', kind: 'field', field: 'restricted_admin_monthly_value', type: 'decimal', restricted: true },
    { key: 'restricted_team_monthly_value', label: 'Equipe ao mes com imposto', kind: 'field', field: 'restricted_team_monthly_value', type: 'decimal', restricted: true },
    { key: 'has_budget_sheet', label: 'Flag possui orcamento', kind: 'field', field: 'has_budget_sheet', type: 'boolean', restricted: true },
    { key: 'restricted_admin_total_estimated', label: 'Adm total prevista com imposto', kind: 'field', field: 'restricted_admin_total_estimated', type: 'decimal', restricted: true },
    { key: 'value_team_technical', label: 'Equipe total prevista com imposto', kind: 'field', field: 'value_team_technical', type: 'decimal', restricted: true },
    { key: 'restricted_engineer_monthly_value', label: 'Valor mensal do engenheiro com imposto', kind: 'field', field: 'restricted_engineer_monthly_value', type: 'decimal', restricted: true },
    { key: 'restricted_master_monthly_value', label: 'Valor mensal do mestre com imposto', kind: 'field', field: 'restricted_master_monthly_value', type: 'decimal', restricted: true },
    { key: 'value_cost_construction', label: 'Custo de obra estimado', kind: 'field', field: 'value_cost_construction', type: 'decimal', restricted: true },
    { key: 'value_total_contract_restricted', label: 'Valor estimado total da obra', kind: 'field', field: 'value_total_contract', type: 'decimal', restricted: true },
    { key: 'restricted_special_items_admin_text', label: 'Adm sobre itens especiais', kind: 'field', field: 'restricted_special_items_admin_text', type: 'string', restricted: true },
    { key: 'restricted_notes', label: 'Observacoes Financeiro Restrito', kind: 'field', field: 'restricted_notes', type: 'string', restricted: true },
    { key: 'reports_delivery_notes', label: 'Envio de relatorios', kind: 'field', field: 'reports_delivery_notes', type: 'string', restricted: true },
    { key: 'accepts_reimbursements', label: 'Cliente aceita reembolsos', kind: 'field', field: 'accepts_reimbursements', type: 'boolean', restricted: true },
    { key: 'accepts_reimbursements_notes', label: 'Observacao sobre reembolsos', kind: 'field', field: 'accepts_reimbursements_notes', type: 'string', restricted: true },
    { key: 'accepts_exception_payments', label: 'Cliente aceita pagamentos de excecao fora do prazo', kind: 'field', field: 'accepts_exception_payments', type: 'boolean', restricted: true },
    { key: 'accepts_exception_payments_notes', label: 'Observacao sobre excecoes', kind: 'field', field: 'accepts_exception_payments_notes', type: 'string', restricted: true },
];

const CONTACT_COLUMN_DEFINITIONS = CONTACT_ROLE_DEFINITIONS.flatMap((definition) => ([
    {
        key: `contact_${definition.role}_name`,
        label: `${definition.prefix} - Nome`,
        kind: 'contact',
        role: definition.role,
        attribute: 'name',
        restricted: Boolean(definition.restricted),
    },
    {
        key: `contact_${definition.role}_email`,
        label: `${definition.prefix} - E-mail`,
        kind: 'contact',
        role: definition.role,
        attribute: 'email',
        restricted: Boolean(definition.restricted),
    },
    {
        key: `contact_${definition.role}_phone`,
        label: `${definition.prefix} - Telefone`,
        kind: 'contact',
        role: definition.role,
        attribute: 'phone',
        restricted: Boolean(definition.restricted),
    },
]));

const TEAM_COLUMN_DEFINITIONS = TEAM_ROLE_DEFINITIONS.flatMap((definition) => ([
    { key: `team_${definition.role}_name`, label: `${definition.prefix} - Nome`, kind: 'team', role: definition.role, attribute: 'name' },
    { key: `team_${definition.role}_email`, label: `${definition.prefix} - E-mail`, kind: 'team', role: definition.role, attribute: 'email' },
    { key: `team_${definition.role}_type`, label: `${definition.prefix} - Equipe`, kind: 'team', role: definition.role, attribute: 'team_type' },
]));

const DOCUMENT_COLUMN_DEFINITIONS = DIRECT_BILLING_DOCUMENT_DEFINITIONS.flatMap((definition) => ([
    {
        key: `document_${definition.key}_checked`,
        label: `Faturamento Direto - ${definition.audience} - ${definition.label}`,
        kind: 'document',
        document_key: definition.key,
        attribute: 'is_checked',
    },
    {
        key: `document_${definition.key}_notes`,
        label: `Faturamento Direto - ${definition.audience} - ${definition.label} - Observacoes`,
        kind: 'document',
        document_key: definition.key,
        attribute: 'notes',
    },
]));

const CHECKLIST_COLUMN_DEFINITIONS = INITIAL_CHECKLIST_DEFINITIONS.flatMap((definition) => {
    const columns = [
        {
            key: `checklist_${definition.key}_checked`,
            label: `Checklist - ${definition.label}`,
            kind: 'checklist',
            item_key: definition.key,
            attribute: 'is_checked',
        },
        {
            key: `checklist_${definition.key}_notes`,
            label: `Checklist - ${definition.label} - Observacoes`,
            kind: 'checklist',
            item_key: definition.key,
            attribute: 'notes',
        },
    ];

    if (definition.key === 'plate_order') {
        columns.splice(1, 0, {
            key: `checklist_${definition.key}_selected_option`,
            label: 'Checklist - Encomendar placa de obra - Cor da placa',
            kind: 'checklist',
            item_key: definition.key,
            attribute: 'selected_option',
        });
    }

    return columns;
});

const ALL_COLUMN_DEFINITIONS = [
    ...BASE_COLUMN_DEFINITIONS,
    ...CONTACT_COLUMN_DEFINITIONS,
    ...TEAM_COLUMN_DEFINITIONS,
    ...DOCUMENT_COLUMN_DEFINITIONS,
    ...CHECKLIST_COLUMN_DEFINITIONS,
    ...RESTRICTED_COLUMN_DEFINITIONS,
];

const cleanString = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const hasValue = (value) => cleanString(value) !== '';

const canViewRestricted = async (userId) => {
    if (!userId) return false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { can_view_restricted_tao_fields: true },
    });

    return Boolean(user?.can_view_restricted_tao_fields);
};

const getVisibleColumns = (allowRestricted) =>
    ALL_COLUMN_DEFINITIONS.filter((column) => allowRestricted || !column.restricted);

const buildHeaderMap = () => {
    const map = new Map();

    ALL_COLUMN_DEFINITIONS.forEach((column) => {
        map.set(cleanString(column.key).toLowerCase(), column.key);
        map.set(cleanString(column.label).toLowerCase(), column.key);
        map.set(cleanString(`${column.label} (${column.key})`).toLowerCase(), column.key);
    });

    return map;
};

const HEADER_TO_COLUMN = buildHeaderMap();

const parseBoolean = (value) => {
    if (!hasValue(value)) return undefined;

    const normalized = cleanString(value).toLowerCase();
    if (['true', '1', 'sim', 'yes', 'y', 'x'].includes(normalized)) return true;
    if (['false', '0', 'nao', 'não', 'no', 'n'].includes(normalized)) return false;

    throw new Error(`Valor booleano inválido: ${value}`);
};

const parseDecimal = (value) => {
    if (!hasValue(value)) return undefined;

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
        throw new Error(`Valor numérico inválido: ${value}`);
    }

    return parsed;
};

const parseInteger = (value) => {
    if (!hasValue(value)) return undefined;

    const parsed = Number.parseInt(cleanString(value), 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`Valor inteiro inválido: ${value}`);
    }

    return parsed;
};

const parseDate = (value) => {
    if (!hasValue(value)) return undefined;

    const normalized = cleanString(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        return new Date(`${normalized}T00:00:00.000Z`);
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
        const [day, month, year] = normalized.split('/');
        return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Data inválida: ${value}`);
    }

    return parsed;
};

const normalizeStatus = (value) => {
    if (!hasValue(value)) return undefined;

    const mapped = STATUS_IMPORT_MAP[cleanString(value).toLowerCase()];
    if (!mapped) {
        throw new Error(`Status da TAO inválido: ${value}`);
    }

    return mapped;
};

const normalizeApprovalStatus = (value) => {
    if (!hasValue(value)) return undefined;

    const normalized = cleanString(value).toLowerCase();
    if (!['draft', 'pending', 'approved', 'rejected'].includes(normalized)) {
        throw new Error(`Status da aprovação inválido: ${value}`);
    }

    return normalized;
};

const formatDateForExport = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toISOString().slice(0, 10);
};

const formatScalarForExport = (type, value) => {
    if (value === null || value === undefined) return '';

    if (type === 'status') return STATUS_EXPORT_MAP[value] || value;
    if (type === 'date') return formatDateForExport(value);
    if (type === 'boolean') return value;
    if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();

    return value;
};

const createSheetBuffer = (rows, format, columns) => {
    const worksheet = XLSX.utils.aoa_to_sheet([
        columns.map((column) => column.label),
        ...rows.map((row) => columns.map((column) => row[column.key] ?? '')),
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TAO');

    if (format === 'csv') {
        return Buffer.from(XLSX.utils.sheet_to_csv(worksheet), 'utf8');
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
};

const normalizeImportedRows = (rawRows = []) =>
    rawRows.map((rawRow) => {
        const normalizedRow = {};

        Object.entries(rawRow || {}).forEach(([header, value]) => {
            const columnKey = HEADER_TO_COLUMN.get(cleanString(header).toLowerCase());
            if (columnKey) {
                normalizedRow[columnKey] = value;
            }
        });

        return normalizedRow;
    });

const buildTemplateRows = (allowRestricted) => {
    const columns = getVisibleColumns(allowRestricted);
    const row = {};
    columns.forEach((column) => {
        row[column.key] = '';
    });

    return [row];
};

const buildGroupKey = (row) => {
    if (hasValue(row.tao_id)) return `id:${cleanString(row.tao_id)}`;
    if (hasValue(row.erp_number)) return `erp:${cleanString(row.erp_number)}`;
    if (hasValue(row.project_name)) return `project:${cleanString(row.project_name).toLowerCase()}`;
    return null;
};

const groupRows = (rows = []) => {
    const groups = new Map();

    rows.forEach((row) => {
        const key = buildGroupKey(row);
        if (!key) return;

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(row);
    });

    return groups;
};

const mergeGroupRows = (rows = []) => {
    const merged = {};

    rows.forEach((row) => {
        Object.entries(row || {}).forEach(([key, value]) => {
            if (hasValue(value)) {
                merged[key] = value;
            }
        });
    });

    return merged;
};

const findExistingTao = async (transaction, row) => {
    if (hasValue(row.tao_id)) {
        return transaction.tao.findUnique({ where: { id: cleanString(row.tao_id) } });
    }

    if (hasValue(row.erp_number)) {
        return transaction.tao.findFirst({ where: { erp_number: cleanString(row.erp_number) } });
    }

    return null;
};

const parseFieldValue = (column, rawValue) => {
    if (!hasValue(rawValue)) return undefined;

    if (column.type === 'status') return normalizeStatus(rawValue);
    if (column.type === 'approval_status') return normalizeApprovalStatus(rawValue);
    if (column.type === 'boolean') return parseBoolean(rawValue);
    if (column.type === 'decimal') return parseDecimal(rawValue);
    if (column.type === 'integer') return parseInteger(rawValue);
    if (column.type === 'date') return parseDate(rawValue);

    return cleanString(rawValue);
};

const buildTaoPayload = (row, allowRestricted) => {
    const payload = {};

    BASE_COLUMN_DEFINITIONS.forEach((column) => {
        if (column.kind !== 'field') return;
        const parsedValue = parseFieldValue(column, row[column.key]);
        if (parsedValue !== undefined) {
            payload[column.field] = parsedValue;
        }
    });

    if (allowRestricted) {
        RESTRICTED_COLUMN_DEFINITIONS.forEach((column) => {
            if (column.kind !== 'field') return;
            const parsedValue = parseFieldValue(column, row[column.key]);
            if (parsedValue !== undefined) {
                payload[column.field] = parsedValue;
            }
        });
    }

    const managerContactFilled = ['name', 'email', 'phone'].some((attribute) =>
        hasValue(row[`contact_Gerenciador_${attribute}`])
    );
    const architectureContactFilled = ['name', 'email', 'phone'].some((attribute) =>
        hasValue(row[`contact_Arquitetura_${attribute}`])
    );

    if (payload.has_manager === undefined && managerContactFilled) {
        payload.has_manager = true;
    }

    if (payload.has_architecture === undefined && architectureContactFilled) {
        payload.has_architecture = true;
    }

    return payload;
};

const buildContactPayloads = (row, allowRestricted) =>
    CONTACT_ROLE_DEFINITIONS
        .filter((definition) => allowRestricted || !definition.restricted)
        .map((definition) => ({
            role: definition.role,
            name: cleanString(row[`contact_${definition.role}_name`]),
            email: cleanString(row[`contact_${definition.role}_email`]).toLowerCase(),
            phone: cleanString(row[`contact_${definition.role}_phone`]),
        }))
        .filter((contact) => contact.name || contact.email || contact.phone)
        .filter((contact) => {
            const managerEnabled = hasValue(row.has_manager)
                ? Boolean(parseBoolean(row.has_manager))
                : ['name', 'email', 'phone'].some((attribute) => hasValue(row[`contact_Gerenciador_${attribute}`]));
            const architectureEnabled = hasValue(row.has_architecture)
                ? Boolean(parseBoolean(row.has_architecture))
                : ['name', 'email', 'phone'].some((attribute) => hasValue(row[`contact_Arquitetura_${attribute}`]));

            if (contact.role === 'Gerenciador' && !managerEnabled) {
                return false;
            }

            if (contact.role === 'Arquitetura' && !architectureEnabled) {
                return false;
            }

            return true;
        });

const buildTeamPayloads = (row) =>
    TEAM_ROLE_DEFINITIONS
        .map((definition) => ({
            role: definition.role,
            name: cleanString(row[`team_${definition.role}_name`]),
            email: cleanString(row[`team_${definition.role}_email`]).toLowerCase(),
            team_type: cleanString(row[`team_${definition.role}_type`]) || null,
        }))
        .filter((member) => member.name || member.email || member.team_type);

const buildDocumentPayloads = (row) =>
    DIRECT_BILLING_DOCUMENT_DEFINITIONS.map((definition) => ({
        document_key: definition.key,
        document_label: definition.label,
        audience: definition.audience,
        is_checked: Boolean(parseBoolean(row[`document_${definition.key}_checked`])),
        notes: cleanString(row[`document_${definition.key}_notes`]) || null,
        sort_order: definition.sort_order,
    }));

const buildChecklistPayloads = (row) =>
    INITIAL_CHECKLIST_DEFINITIONS.map((definition) => ({
        item_key: definition.key,
        item_label: definition.label,
        category: definition.category,
        is_checked: Boolean(parseBoolean(row[`checklist_${definition.key}_checked`])),
        selected_option: cleanString(row[`checklist_${definition.key}_selected_option`]) || null,
        notes: cleanString(row[`checklist_${definition.key}_notes`]) || null,
        sort_order: definition.sort_order,
    }));

const syncContacts = async (transaction, taoId, contacts, allowRestricted) => {
    const allowedRoles = CONTACT_ROLE_DEFINITIONS
        .filter((definition) => allowRestricted || !definition.restricted)
        .map((definition) => definition.role);

    const existing = await transaction.taoContact.findMany({
        where: { tao_id: taoId, role: { in: allowedRoles } },
    });
    const existingByRole = new Map(existing.map((record) => [record.role, record]));
    const payloadByRole = new Map(contacts.map((record) => [record.role, record]));

    for (const record of existing) {
        if (!payloadByRole.has(record.role)) {
            await transaction.taoContact.delete({ where: { id: record.id } });
        }
    }

    for (const role of allowedRoles) {
        const payload = payloadByRole.get(role);
        const current = existingByRole.get(role);

        if (!payload) continue;

        const data = {
            name: payload.name || role,
            role,
            email: payload.email || null,
            phone: payload.phone || null,
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

const syncTeamMembers = async (transaction, taoId, teamMembers) => {
    const existing = await transaction.taoTeamMember.findMany({
        where: { tao_id: taoId, role: { in: TEAM_ROLE_DEFINITIONS.map((definition) => definition.role) } },
    });
    const existingByRole = new Map(existing.map((record) => [record.role, record]));
    const payloadByRole = new Map(teamMembers.map((record) => [record.role, record]));

    for (const record of existing) {
        if (!payloadByRole.has(record.role)) {
            await transaction.taoTeamMember.delete({ where: { id: record.id } });
        }
    }

    for (const definition of TEAM_ROLE_DEFINITIONS) {
        const payload = payloadByRole.get(definition.role);
        const current = existingByRole.get(definition.role);

        if (!payload) continue;

        const data = {
            name: payload.name || definition.role,
            role: definition.role,
            email: payload.email || `${definition.role.toLowerCase().replace(/\s+/g, '.')}@placeholder.local`,
            team_type: payload.team_type || null,
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
    const existing = await transaction.taoDirectBillingDocumentItem.findMany({
        where: { tao_id: taoId },
    });
    const existingByKey = new Map(existing.map((item) => [item.document_key, item]));

    for (const item of items) {
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

const syncChecklistItems = async (transaction, taoId, items) => {
    const existing = await transaction.taoInitialChecklistItem.findMany({
        where: { tao_id: taoId },
    });
    const existingByKey = new Map(existing.map((item) => [item.item_key, item]));

    for (const item of items) {
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

const processGroupImport = async (transaction, rows, reqUserId, allowRestricted) => {
    const mergedRow = mergeGroupRows(rows);
    const existingTao = await findExistingTao(transaction, mergedRow);
    const taoPayload = buildTaoPayload(mergedRow, allowRestricted);

    let tao;
    let taoCreated = 0;
    let taoUpdated = 0;

    if (existingTao) {
        tao =
            Object.keys(taoPayload).length > 0
                ? await transaction.tao.update({
                      where: { id: existingTao.id },
                      data: taoPayload,
                  })
                : existingTao;
        taoUpdated = 1;
    } else {
        if (!taoPayload.project_name) {
            throw new Error('A coluna Sigla/nome da obra é obrigatória para criar uma nova TAO.');
        }

        tao = await transaction.tao.create({
            data: {
                ...taoPayload,
                created_by_id: reqUserId,
            },
        });
        taoCreated = 1;
    }

    const contacts = buildContactPayloads(mergedRow, allowRestricted);
    const teamMembers = buildTeamPayloads(mergedRow);
    const documents = buildDocumentPayloads(mergedRow);
    const checklistItems = buildChecklistPayloads(mergedRow);

    await syncContacts(transaction, tao.id, contacts, allowRestricted);
    await syncTeamMembers(transaction, tao.id, teamMembers);
    await syncDirectBillingDocuments(transaction, tao.id, documents);
    await syncChecklistItems(transaction, tao.id, checklistItems);

    return {
        taoCreated,
        taoUpdated,
        contactsUpdated: contacts.length,
        teamMembersUpdated: teamMembers.length,
        documentsUpdated: documents.length,
        checklistItemsUpdated: checklistItems.length,
        taoId: tao.id,
        projectName: tao.project_name,
    };
};

const getRequestedFormat = (req) => {
    const format = cleanString(req.query.format || 'xlsx').toLowerCase();
    if (!['xlsx', 'csv'].includes(format)) {
        return null;
    }
    return format;
};

const buildExportRows = (taos, allowRestricted) =>
    taos.map((tao) => {
        const row = {};
        const contactsByRole = new Map((tao.contacts || []).map((contact) => [contact.role, contact]));
        const teamByRole = new Map((tao.team_members || []).map((member) => [member.role, member]));
        const documentsByKey = new Map((tao.direct_billing_document_items || []).map((item) => [item.document_key, item]));
        const checklistByKey = new Map((tao.initial_checklist_items || []).map((item) => [item.item_key, item]));

        row.tao_id = tao.id;

        BASE_COLUMN_DEFINITIONS.forEach((column) => {
            if (column.kind !== 'field') return;
            row[column.key] = formatScalarForExport(column.type, tao[column.field]);
        });

        if (allowRestricted) {
            RESTRICTED_COLUMN_DEFINITIONS.forEach((column) => {
                if (column.kind !== 'field') return;
                row[column.key] = formatScalarForExport(column.type, tao[column.field]);
            });
        }

        CONTACT_ROLE_DEFINITIONS
            .filter((definition) => allowRestricted || !definition.restricted)
            .forEach((definition) => {
                const contact = contactsByRole.get(definition.role);
                row[`contact_${definition.role}_name`] = contact?.name || '';
                row[`contact_${definition.role}_email`] = contact?.email || '';
                row[`contact_${definition.role}_phone`] = contact?.phone || '';
            });

        TEAM_ROLE_DEFINITIONS.forEach((definition) => {
            const member = teamByRole.get(definition.role);
            row[`team_${definition.role}_name`] = member?.name || '';
            row[`team_${definition.role}_email`] = member?.email || '';
            row[`team_${definition.role}_type`] = member?.team_type || '';
        });

        DIRECT_BILLING_DOCUMENT_DEFINITIONS.forEach((definition) => {
            const item = documentsByKey.get(definition.key);
            row[`document_${definition.key}_checked`] = item?.is_checked || false;
            row[`document_${definition.key}_notes`] = item?.notes || '';
        });

        INITIAL_CHECKLIST_DEFINITIONS.forEach((definition) => {
            const item = checklistByKey.get(definition.key);
            row[`checklist_${definition.key}_checked`] = item?.is_checked || false;
            row[`checklist_${definition.key}_notes`] = item?.notes || '';

            if (definition.key === 'plate_order') {
                row[`checklist_${definition.key}_selected_option`] = item?.selected_option || '';
            }
        });

        return row;
    });

exports.downloadTemplate = async (req, res) => {
    try {
        const format = getRequestedFormat(req);
        if (!format) {
            return res.status(400).json({ error: 'Formato inválido. Use xlsx ou csv.' });
        }

        const allowRestricted = await canViewRestricted(req.userId);
        const columns = getVisibleColumns(allowRestricted);
        const rows = buildTemplateRows(allowRestricted);
        const fileBuffer = createSheetBuffer(rows, format, columns);
        const fileName = `fxtao-mascara-importacao-allora.${format}`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader(
            'Content-Type',
            format === 'csv'
                ? 'text/csv; charset=utf-8'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        return res.send(fileBuffer);
    } catch (error) {
        console.error('Failed to download TAO template:', error);
        return res.status(500).json({ error: 'Falha ao gerar a máscara de importação.' });
    }
};

exports.exportData = async (req, res) => {
    try {
        const format = getRequestedFormat(req);
        if (!format) {
            return res.status(400).json({ error: 'Formato inválido. Use xlsx ou csv.' });
        }

        const allowRestricted = await canViewRestricted(req.userId);
        const columns = getVisibleColumns(allowRestricted);
        const taos = await prisma.tao.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                contacts: true,
                team_members: true,
                direct_billing_document_items: true,
                initial_checklist_items: true,
            },
        });

        const rows = buildExportRows(taos, allowRestricted);
        const fileBuffer = createSheetBuffer(rows.length ? rows : buildTemplateRows(allowRestricted), format, columns);
        const fileName = `fxtao-export-allora-${new Date().toISOString().slice(0, 10)}.${format}`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader(
            'Content-Type',
            format === 'csv'
                ? 'text/csv; charset=utf-8'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        return res.send(fileBuffer);
    } catch (error) {
        console.error('Failed to export TAO data:', error);
        return res.status(500).json({ error: 'Falha ao exportar dados das TAOs.' });
    }
};

exports.importData = async (req, res) => {
    try {
        if (!req.file?.buffer) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer', raw: false });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            return res.status(400).json({ error: 'Arquivo sem planilha válida.' });
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        const rows = normalizeImportedRows(rawRows);
        const groups = groupRows(rows);
        const allowRestricted = await canViewRestricted(req.userId);

        if (!groups.size) {
            return res.status(400).json({ error: 'Nenhuma linha válida encontrada para importação.' });
        }

        const summary = {
            processedRows: rows.length,
            processedTaos: 0,
            taosCreated: 0,
            taosUpdated: 0,
            contactsUpdated: 0,
            teamMembersUpdated: 0,
            documentsUpdated: 0,
            checklistItemsUpdated: 0,
            errors: [],
        };

        for (const [groupKey, groupRowsValue] of groups.entries()) {
            try {
                const result = await prisma.$transaction((transaction) =>
                    processGroupImport(transaction, groupRowsValue, req.userId, allowRestricted)
                );

                summary.processedTaos += 1;
                summary.taosCreated += result.taoCreated;
                summary.taosUpdated += result.taoUpdated;
                summary.contactsUpdated += result.contactsUpdated;
                summary.teamMembersUpdated += result.teamMembersUpdated;
                summary.documentsUpdated += result.documentsUpdated;
                summary.checklistItemsUpdated += result.checklistItemsUpdated;
            } catch (error) {
                summary.errors.push(`${groupKey}: ${error.message}`);
            }
        }

        return res.status(200).json(summary);
    } catch (error) {
        console.error('Failed to import TAO data:', error);
        return res.status(500).json({ error: 'Falha ao importar arquivo de TAO.' });
    }
};
