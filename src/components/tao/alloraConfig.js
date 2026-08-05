export const ALLORA_NAV_SECTIONS = [
  { id: 'dados-iniciais', label: 'Dados iniciais' },
  { id: 'faturamento', label: 'Faturamento' },
  { id: 'contratacao', label: 'Contratação' },
  { id: 'preco-fechado', label: 'Preço Fechado' },
  { id: 'administracao', label: 'Administração' },
  { id: 'financeiro-restrito', label: 'Financeiro restrito' },
  { id: 'operacional', label: 'Operacional' },
  { id: 'outros', label: 'Outros' },
];

export const ALLORA_CONTACT_ROLES = [
  'Contato Cliente',
  'Gerenciador',
  'Arquitetura',
  'Contato para envio de relatorios',
  'Com copia',
];

export const ALLORA_TEAM_ROLES = [
  'Engº Responsavel',
  'Mestre de Obra',
];

export const DIRECT_BILLING_DOCUMENTS = [
  { document_key: 'rg', document_label: 'RG', audience: 'Cliente PF', sort_order: 1 },
  { document_key: 'cpf', document_label: 'CPF', audience: 'Cliente PF', sort_order: 2 },
  { document_key: 'proof_of_address_pf', document_label: 'Comprovante de Endereco', audience: 'Cliente PF', sort_order: 3 },
  { document_key: 'billing_authorization_pf', document_label: 'Carta de Autorizacao de Faturamento (assinada)', audience: 'Cliente PF', sort_order: 4 },
  { document_key: 'cnpj_card', document_label: 'Cartao CNPJ', audience: 'Cliente PJ', sort_order: 5 },
  { document_key: 'social_contract', document_label: 'Contrato Social', audience: 'Cliente PJ', sort_order: 6 },
  { document_key: 'proof_of_address_pj', document_label: 'Comprovante de Endereco (digitalizado)', audience: 'Cliente PJ', sort_order: 7 },
  { document_key: 'billing_authorization_pj', document_label: 'Carta de Autorizacao de Faturamento (assinada)', audience: 'Cliente PJ', sort_order: 8 },
];

export const INITIAL_CHECKLIST_ITEMS = [
  {
    item_key: 'plate_order',
    item_label: 'Encomendar placa de obra',
    category: 'Operacional registro de obra',
    sort_order: 1,
  },
  {
    item_key: 'physical_folder',
    item_label: 'Abertura de pasta fisica',
    category: 'Operacional registro de obra',
    sort_order: 2,
  },
  {
    item_key: 'client_responsible_contact',
    item_label: 'Contato com responsavel da obra por parte do cliente',
    category: 'Operacional registro de obra',
    sort_order: 3,
  },
  {
    item_key: 'suppliers_registration',
    item_label: 'Abertura de cadastros com fornecedores basicos iniciais',
    category: 'Operacional registro de obra',
    sort_order: 4,
  },
  {
    item_key: 'sienge_registration',
    item_label: 'Cadastro no Sienge',
    category: 'Operacional registro de obra',
    sort_order: 5,
  },
];

export const createDefaultAlloraContacts = () =>
  ALLORA_CONTACT_ROLES.map((role) => ({
    role,
    name: '',
    email: '',
    phone: '',
  }));

export const createDefaultAlloraTeamMembers = () =>
  ALLORA_TEAM_ROLES.map((role) => ({
    role,
    name: '',
    email: '',
    team_type: role === 'Engº Responsavel' ? 'Equipe Obra' : 'Equipe Apoio',
  }));

export const createDefaultDirectBillingDocuments = () =>
  DIRECT_BILLING_DOCUMENTS.map((item) => ({
    ...item,
    is_checked: false,
    notes: '',
  }));

export const createDefaultInitialChecklistItems = () =>
  INITIAL_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    is_checked: false,
    selected_option: '',
    value_text: '',
    notes: '',
  }));
