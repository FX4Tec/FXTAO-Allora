# Documentação Funcional e Técnica - FX TAO
Gerado em: 09/02/2026, 15:28:08

## Visão Geral
O FX TAO é um sistema para gestão de Termos de Abertura de Obra (TAO), controlando o ciclo de vida desde o rascunho, preenchimento de dados financeiros e contratuais, até a aprovação e acompanhamento de aditivos.

---

## 1. Dashboard (/Dashboard)
**Objetivo:** Visão executiva consolidada dos empreendimentos.

### Funcionalidades e Regras
- **Filtros:** Dropdown para seleção de obra específica. Afeta todos os KPIs.
- **KPIs (Cards Superiores):**
  - *Performance:* Média ponderada ou status geral.
  - *Área Total:* Soma do campo `area_m2` das obras ativas.
  - *Valor Contratado:* Soma de `value_total_contract` + Aditivos aprovados.
  - *Faturamento:* Soma das parcelas (`TaoInstallment`) com `is_paid = true`.
  - *Impostos:* Soma calculada dos impostos retidos/recolhidos.
  - *Equipe:* Custo total estimado da equipe técnica.
- **Gráficos:**
  - *Distribuição por Regime:* Gráfico de pizza agrupando obras pelo campo `hiring_regime`.
  - *Calendário de Recebíveis:* Lista de parcelas (`TaoInstallment`) ordenadas por `due_date` (próximos 30 dias).
- **Tabelas:**
  - *Aditivos Recentes:* Lista de `TaoAdditive` aprovados recentemente.
  - *Projetos Ativos:* Lista resumida de obras com status diferente de '5' (Finalizado).

---

## 2. Gerenciamento de Obras (/TaoList)
**Objetivo:** Listagem e controle de acesso aos formulários de TAO.

### Elementos de Tela
- **Botão "Novo Termo de Abertura":** Redireciona para `/TaoForm` (criação).
- **Barra de Busca:** Filtra a tabela localmente por Nome da Obra ou ERP.
- **Tabela de Dados:**
  - *Colunas:* ID (Link), Obra, ERP, Regime, Data Criação, Status.
  - *Ações:* Botão "Editar" (Lápis) redireciona para o form.
- **Regras de Negócio:**
  - Ordenação padrão por data de criação decrescente (mais recentes primeiro).

---

## 3. Formulário de Obra (/TaoForm)
**Objetivo:** Cadastro completo e edição do TAO.
**Estrutura:** Navegação por Stepper (Start -> 1 -> 2 -> 3 -> 4 -> 5).
**Entidade Principal:** `Tao`.

### Header Geral
- **Status:** Badge indicando `approval_status` (Draft, Pending, Approved, Rejected).
- **Botão "Enviar para Aprovação":** Visível apenas se status for 'draft' ou 'rejected'. Altera status para 'pending' e notifica aprovadores nível 1.
- **Ações de Compartilhamento:** Copiar Link e WhatsApp.

### Step Inicial (Setup)
- **Campos e Bindings:**
  - *Nome da Obra:* `project_name` (Obrigatório).
  - *Tipo de Registro Sienge:* `registration_type` com opções `SOMENTE_OBRA`, `OBRA_E_CENTRO_CUSTO`, `SOMENTE_CENTRO_CUSTO`, `CENTRO_CUSTO_ASSOCIADO_OBRA`.
  - *Data de Abertura:* `opening_date`.
  - *Situação da Obra:* `construction_situation`.
  - *Registro Consistente:* `is_registration_consistent`.
  - *Responsável Técnico:* `technical_responsible_name`.
  - *Empresa Responsável:* `responsible_company_id` ou `responsible_company_payload`.
  - *Cliente / Contratante:* `client_id` ou `client_payload`.
  - *Observações do vínculo cliente x obra:* `client_link_notes`.
  - *Obra Principal Vinculada:* `parent_tao_id` quando o tipo de registro for centro de custo associado.
  - *Contrato Consultoria:* Switch (`contract_company_consultancy`).
  - *ERP Nº:* `erp_number`.
  - *Área:* `area_m2`.
  - *Dados de Faturamento:* Grupo de campos `billing_*` (Empresa, Endereço, CNPJ, IE, IM).
  - *Endereço Obra:* Grupo de campos `construction_*`.
  - *Endereço de Entrega:* `delivery_address`.
  - *Gerenciadora:* Grupo de campos `manager_*`.
  - *Dados Bancários:* Dropdowns populados pela entidade `BankAccount`.
    - *Consultoria:* `bank_account_consultancy_id`.
    - *Construção:* `bank_account_construction_id`.
- **Regras:**
  - Bloqueio de edição se obra finalizada ou em aprovação (exceto Admin).
  - Não duplica empresa/cliente quando o formulário envia payload inline com documento já cadastrado.
  - `CENTRO_CUSTO_ASSOCIADO_OBRA` exige vínculo com outra TAO já existente.

### Step 1: Contrato e Impostos
- **Funcionalidades:**
  - *Modo de Cálculo:* Switch `calculation_mode` ('manual' vs 'auto').
    - *Auto:* Carrega percentuais da tabela `TaoGlobalSettings` e calcula valores automaticamente ao salvar/alterar base.
    - *Manual:* Usuário digita percentuais e valores livremente.
- **Campos de Engenharia (Sienge):**
  - `engineering_supply_services_table`, `appropriation_level`, `area_measure_unit`, `planned_construction_units`.
  - Flags `has_engineering_budget`, `has_engineering_planning`, `has_physical_progress_tracking`.
  - Responsável: `engineering_responsible_name`.
- **Campos Financeiros (Sienge):**
  - `financial_company_id` ou `financial_company_payload`.
  - `financial_business_area_id` ou `financial_business_area_payload`.
  - `financial_cost_center_category_id` ou `financial_cost_center_category_payload`.
  - `default_financial_bank_account_id`, `authorized_bank_account_ids`, `billing_issue_bank_account_id`.
  - Flags `compose_financial_availability`, `export_to_client_portal`.
  - Responsável: `financial_responsible_name`.
- **Campos Fiscais (Sienge):**
  - `is_ret_regime`, `enterprise_nature`, `real_estate_unit_type`, `generates_sped_efd_contributions`.
  - Responsável: `fiscal_responsible_name`.
  - Observações: `fiscal_notes`.
- **Campos Comerciais / Vendas:**
  - `keys_delivery_date`, `gross_sales_value`, `units_grouping`, `uses_client_portal`, `client_portal_links`.
  - Responsável: `commercial_responsible_name`.
- **Campos Financeiros:**
  - `value_total_contract`, `value_billing_direct`, etc.
- **Matriz de Impostos:**
  - Campos duplos (Percentual/Valor) para: ISS, INSS, PIS, COFINS, CSLL, IR.

### Step 2: Cronograma e Equipe
- **Centros de Custo Associados:**
  - *Entidade:* `TaoCostCenter`.
  - *Campos:* `cost_center_code`, `name`, `company_id`, `business_area_id`, `cost_center_category_id`, `purpose`.
  - *Flags:* `is_primary`, `participates_financial`, `participates_budget`, `participates_supplies`, `participates_measurements`.
  - *Observações:* `observations`.
  - Uma TAO pode possuir múltiplos centros de custo associados.
- **Parcelas (Installments):**
  - *Entidade:* `TaoInstallment`.
  - *Campos:* Descrição, Vencimento, Valor, Status Pagamento, Tipo (Direto/Consultoria/Construção).
  - *Ação:* Adicionar/Remover parcelas. O sistema não impede que a soma difira do total do contrato (validação visual).
- **Equipe (Team Members):**
  - *Entidade:* `TaoTeamMember`.
  - *Campos:* Nome, Cargo, Email, Tipo.

### Step 3: Aditivos
- **Controle de Aprovação TAO / Sienge:**
  - *Status dedicado:* `tao_lifecycle_status` com fluxo `RASCUNHO`, `EM_VALIDACAO`, `APROVADA`, `REPROVADA`, `CADASTRADA_NO_SIENGE`, `CANCELADA`.
  - *Aprovadores por área:* `engineering_approver_user_id`, `financial_approver_user_id`, `fiscal_approver_user_id`, `board_approver_user_id`.
  - *Datas de controle:* `requested_at`, `approved_at`, `sienge_registered_at`.
  - *Motivo de reprovação:* `rejection_reason`.
  - *Histórico de alterações:* reaproveita `TaoLog` com registro automático dos campos críticos.
- **Entidade:** `TaoAdditive`.
- **Campos:** Descrição, Data Aprovação, Valor.
- **Regras de Negócio:**
  - Aditivos criados entram como 'pending' se houver workflow configurado, ou 'approved' direto dependendo da regra simplificada.
  - Valor do aditivo soma ao Valor Total do Contrato para fins de KPIs.

### Step 4: Documentação e Compliance
- **Checklist:** Switches booleanos para diversos itens (`scope_project_legal_status`, `avcb_status`, etc.).
- **Campos de Texto:** Observações para cada item do checklist.

### Step 5: Finalização
- **Observações Gerais:** Campo texto livre.
- **Contatos:** Lista de contatos da obra (`TaoContact`).
- **Anexos:** Upload de arquivos via integração (`TaoAttachment`).
- **Ação Final:** Botão "Finalizar" altera status do fluxo para '5'.

### Estruturas Relacionais Novas
- `Company`: cadastro referenciável por `responsible_company_id`, `financial_company_id` e centros de custo.
- `Client`: cadastro referenciável por `client_id`.
- `BusinessArea`: domínio financeiro para área de negócio.
- `CostCenterCategory`: domínio financeiro para categoria.
- `TaoCostCenter`: relação N:1 entre TAO e centros de custo associados.
- `TaoAuthorizedBankAccount`: relação N:N simplificada entre TAO e contas correntes autorizadas.

### Regras de Validação por Tipo de Registro
- `SOMENTE_OBRA`: não exige empresa financeira nem centro de custo.
- `OBRA_E_CENTRO_CUSTO`: exige empresa responsável, área de negócio e ao menos um centro de custo principal.
- `SOMENTE_CENTRO_CUSTO`: exige ao menos um centro de custo.
- `CENTRO_CUSTO_ASSOCIADO_OBRA`: exige obra principal, empresa responsável e centro de custo associado.

### Auditoria e Compatibilidade
- Todas as mudanças de banco são aditivas e versionadas por migration.
- Registros legados continuam válidos porque os novos campos são opcionais quando não houver regra nova aplicada.
- Campos críticos auditados automaticamente: `erp_number`, `registration_type`, `responsible_company_id`, `client_id`, `financial_business_area_id`, `financial_cost_center_category_id`, `construction_situation`, `is_ret_regime` e composição de `cost_centers`.

---

## 4. Mapa de Calor (/Heatmap)
**Objetivo:** Visualização geoespacial das obras.
- **Integração:** Leaflet Maps.
- **Dados:** Usa `latitude` e `longitude` do cadastro do TAO.
- **Interação:** Clique no marker abre popup com resumo e link para o formulário.

---

## 5. Central de Aprovações (/Approvals)
**Objetivo:** Gestão de pendências por parte dos aprovadores.
- **Abas:**
  - *Pendentes:* Lista TAOs e Aditivos onde `approval_status = 'pending'` E o usuário logado é o aprovador da vez (cruzamento com `TaoApprover`).
  - *Histórico:* Lista logs da entidade `TaoApprovalHistory`.
- **Ações:**
  - *Aprovar:* Altera status para 'approved' (ou sobe nível). Envia notificação ao criador.
  - *Rejeitar:* Altera status para 'rejected'. Exige comentário.

---

## 6. Configurações (/Settings)
**Objetivo:** Parâmetros globais do sistema.
- **Entidade:** `TaoGlobalSettings`.
- **Campos Configuráveis:**
  - Alíquotas Padrão (ISS, INSS, PIS, COFINS, etc.).
  - Splits Padrão de Contrato (Consultoria vs Construção).
- **Logs:** Tabela de auditoria (`TaoLog`) mostrando quem alterou o que e quando.
- **Exportação:**
  - *Dump JSON:* Todos os dados estruturados.
  - *Dump SQL:* Script de criação e inserção de dados.
  - *Doc Técnica:* Este arquivo.

---

## Modelo de Dados (Resumo Entidades)
- **Tao:** Tabela principal.
- **TaoInstallment:** 1:N com Tao.
- **TaoAdditive:** 1:N com Tao.
- **TaoContact / TaoTeamMember:** 1:N com Tao.
- **TaoAttachment:** 1:N com Tao (Link S3).
- **TaoApprover:** Configuração de quem aprova (N:N lógico User-Tao).
- **Notification:** Alertas de sistema.

---

## 7. Especificação de APIs e Integrações (Standalone)
**Objetivo:** Endpoints para integração com sistemas externos (ERP, BI, CRM).
**Autenticação:** Bearer Token (JWT).

### 7.1 Autenticação
- **POST /api/v1/auth/login**
- *Input:* `{ email, password }`
- *Output:* `{ token, user: { id, name, role } }`

### 7.2 Obras (TAOs)
- **GET /api/v1/taos**
- *Query Params:* `page`, `limit`, `status`, `erp_number`
- *Output:* Lista de obras paginada.
- **POST /api/v1/taos**
- *Input:* JSON completo da obra, incluindo:
  - campos base do TAO
  - campos Sienge
  - referências por ID (`responsible_company_id`, `client_id`, `financial_business_area_id`, etc.)
  - payload inline opcional (`responsible_company_payload`, `client_payload`, `financial_company_payload`, `financial_business_area_payload`, `financial_cost_center_category_payload`)
  - lista `cost_centers`
  - lista `authorized_bank_account_ids`
- *Output:* ID da obra criada.
- **GET /api/v1/taos/:id**
- *Output:* Detalhes completos + parcelas + aditivos.
- **PUT /api/v1/taos/:id**
- *Comportamento:* Atualização compatível com registros legados, sincronizando centros de custo, contas autorizadas e auditoria crítica.

### 7.2.1 Recursos de Apoio
- **GET /api/v1/resources/companies**
- **GET /api/v1/resources/clients**
- **GET /api/v1/resources/business-areas**
- **GET /api/v1/resources/cost-center-categories**
- **GET /api/v1/resources/bank-accounts**
- *Uso:* Popular catálogos da TAO e permitir referência por ID sem duplicidade desnecessária.

### 7.3 Webhooks (Eventos de Saída)
O sistema disparará POSTs para URLs configuradas nos seguintes eventos:
- `tao.created`: Nova obra cadastrada.
- `tao.approved`: Obra aprovada (status mudou para approved).
- `tao.finalized`: Obra finalizada (status 5).
