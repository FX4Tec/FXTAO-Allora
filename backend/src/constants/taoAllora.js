const RESTRICTED_TAO_FIELDS = [
    'restricted_admin_percent',
    'restricted_tax_mode',
    'restricted_admin_monthly_value',
    'restricted_team_monthly_value',
    'has_budget_sheet',
    'restricted_admin_total_estimated',
    'restricted_engineer_monthly_value',
    'restricted_master_monthly_value',
    'restricted_special_items_admin_text',
    'restricted_notes',
    'reports_delivery_notes',
    'accepts_reimbursements',
    'accepts_reimbursements_notes',
    'accepts_exception_payments',
    'accepts_exception_payments_notes',
];

const RESTRICTED_CONTACT_ROLES = [
    'Contato para envio de relatorios',
    'Com copia',
];

const DIRECT_BILLING_DOCUMENT_DEFINITIONS = [
    { key: 'rg', label: 'RG', audience: 'Cliente PF', sort_order: 1 },
    { key: 'cpf', label: 'CPF', audience: 'Cliente PF', sort_order: 2 },
    { key: 'proof_of_address_pf', label: 'Comprovante de Endereco', audience: 'Cliente PF', sort_order: 3 },
    { key: 'billing_authorization_pf', label: 'Carta de Autorizacao de Faturamento (assinada)', audience: 'Cliente PF', sort_order: 4 },
    { key: 'cnpj_card', label: 'Cartao CNPJ', audience: 'Cliente PJ', sort_order: 5 },
    { key: 'social_contract', label: 'Contrato Social', audience: 'Cliente PJ', sort_order: 6 },
    { key: 'proof_of_address_pj', label: 'Comprovante de Endereco (digitalizado)', audience: 'Cliente PJ', sort_order: 7 },
    { key: 'billing_authorization_pj', label: 'Carta de Autorizacao de Faturamento (assinada)', audience: 'Cliente PJ', sort_order: 8 },
];

const INITIAL_CHECKLIST_DEFINITIONS = [
    {
        key: 'plate_order',
        label: 'Encomendar placa de obra',
        category: 'Operacional registro de obra',
        sort_order: 1,
    },
    {
        key: 'physical_folder',
        label: 'Abertura de pasta fisica',
        category: 'Operacional registro de obra',
        sort_order: 2,
    },
    {
        key: 'client_responsible_contact',
        label: 'Contato com responsavel da obra por parte do cliente',
        category: 'Operacional registro de obra',
        sort_order: 3,
    },
    {
        key: 'suppliers_registration',
        label: 'Abertura de cadastros com fornecedores basicos iniciais',
        category: 'Operacional registro de obra',
        sort_order: 4,
    },
    {
        key: 'sienge_registration',
        label: 'Cadastro no Sienge',
        category: 'Operacional registro de obra',
        sort_order: 5,
    },
];

module.exports = {
    RESTRICTED_TAO_FIELDS,
    RESTRICTED_CONTACT_ROLES,
    DIRECT_BILLING_DOCUMENT_DEFINITIONS,
    INITIAL_CHECKLIST_DEFINITIONS,
};
