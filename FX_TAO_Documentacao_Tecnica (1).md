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
  - *Contrato Consultoria:* Switch (`contract_company_consultancy`).
  - *ERP Nº:* `erp_number`.
  - *Área:* `area_m2`.
  - *Dados de Faturamento:* Grupo de campos `billing_*` (Empresa, Endereço, CNPJ, IE, IM).
  - *Endereço Obra:* Grupo de campos `construction_*`.
  - *Gerenciadora:* Grupo de campos `manager_*`.
  - *Dados Bancários:* Dropdowns populados pela entidade `BankAccount`.
    - *Consultoria:* `bank_account_consultancy_id`.
    - *Construção:* `bank_account_construction_id`.
- **Regras:**
  - Bloqueio de edição se obra finalizada ou em aprovação (exceto Admin).

### Step 1: Contrato e Impostos
- **Funcionalidades:**
  - *Modo de Cálculo:* Switch `calculation_mode` ('manual' vs 'auto').
    - *Auto:* Carrega percentuais da tabela `TaoGlobalSettings` e calcula valores automaticamente ao salvar/alterar base.
    - *Manual:* Usuário digita percentuais e valores livremente.
- **Campos Financeiros:**
  - `value_total_contract`, `value_billing_direct`, etc.
- **Matriz de Impostos:**
  - Campos duplos (Percentual/Valor) para: ISS, INSS, PIS, COFINS, CSLL, IR.

### Step 2: Cronograma e Equipe
- **Parcelas (Installments):**
  - *Entidade:* `TaoInstallment`.
  - *Campos:* Descrição, Vencimento, Valor, Status Pagamento, Tipo (Direto/Consultoria/Construção).
  - *Ação:* Adicionar/Remover parcelas. O sistema não impede que a soma difira do total do contrato (validação visual).
- **Equipe (Team Members):**
  - *Entidade:* `TaoTeamMember`.
  - *Campos:* Nome, Cargo, Email, Tipo.

### Step 3: Aditivos
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
- *Input:* JSON completo da obra (validação estrita).
- *Output:* ID da obra criada.
- **GET /api/v1/taos/:id**
- *Output:* Detalhes completos + parcelas + aditivos.

### 7.3 Webhooks (Eventos de Saída)
O sistema disparará POSTs para URLs configuradas nos seguintes eventos:
- `tao.created`: Nova obra cadastrada.
- `tao.approved`: Obra aprovada (status mudou para approved).
- `tao.finalized`: Obra finalizada (status 5).
