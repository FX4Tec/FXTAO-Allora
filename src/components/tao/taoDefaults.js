export const DEFAULT_FINANCIAL_COMPOSITION_ITEMS = [
  ['b_aberto', 'B Aberto', 'FATURAMENTO'],
  ['b_diluido', 'B Diluído', 'FATURAMENTO'],
  ['itens_cliente', 'Itens contratados pelo cliente', 'FATURAMENTO'],
  ['itens_obra_faturados', 'Itens da obra faturados', 'FATURAMENTO'],
  ['seguro', 'Seguro', 'ENCARGOS'],
  ['art', 'ART', 'ENCARGOS'],
  ['copias_plotagens', 'Cópias e plotagens', 'ENCARGOS'],
  ['b2', 'B2', 'FATURAMENTO'],
].map(([item_key, label, category], sort_order) => ({
  item_key,
  label,
  category,
  amount: null,
  percentage: null,
  include_in_total: true,
  sort_order,
  notes: '',
}));

export const DEFAULT_INDIRECT_EXPENSE_ITEMS = [
  ['coordenador', 'Coordenador'],
  ['engenheiro', 'Engenheiro'],
  ['mestre', 'Encarregado / Mestre'],
  ['administrativo', 'Administrativo de obra'],
  ['estagiario', 'Estagiário'],
  ['sso', 'SSO'],
  ['refeicao_transporte', 'Refeição e Transporte'],
].map(([item_key, label], sort_order) => ({
  item_key,
  label,
  monthly_value: null,
  total_period: null,
  person_name: '',
  sort_order,
  notes: '',
}));
