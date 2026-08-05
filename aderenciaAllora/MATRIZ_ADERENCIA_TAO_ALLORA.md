# Matriz de Aderencia - TAO Allora

## Objetivo

Readequar o formulario de preenchimento da TAO para o fork da Allora usando como referencia principal:

- `TAO.docx`
- `CHECK_LIST_INICIAL_DE_OBRA (1).xlsx`

Premissas:

- nao excluir campos existentes da base;
- reaproveitar campos correlatos sempre que fizer sentido;
- manter a finalidade do sistema;
- isolar dados `restritos` em aba propria;
- controlar acesso aos dados restritos por flag no usuario;
- preservar o historico e a compatibilidade com TAOs ja cadastradas.

## Diretrizes validadas com negocio

- preservar a nomenclatura e os labels presentes na documentacao da Allora;
- `Codigo da obra` sera o mesmo conceito tecnico de `ERP Nº`, mas com linguagem Allora na interface;
- `Cliente` nao gerara um novo campo escalar independente da TAO;
- `Valor estimado total da obra` sera mapeado para o core atual `value_total_contract`;
- `Equipe total prevista com imposto` sera mapeado para o core atual `value_team_technical`, com tooltip explicativo;
- `Documentacoes de faturamento direto` serao modeladas como checklist relacional;
- `Compliance` nao fara parte do fork Allora.

## Restricoes tecnicas atuais

Hoje a TAO trabalha com os status/fases:

- `start`
- `step1`
- `step2`
- `step3`
- `step4`
- `step5`

Para o fork Allora, a recomendacao muda:

- podemos abandonar as 6 fases visiveis no frontend;
- mantemos os status tecnicos da TAO apenas por compatibilidade com a base e com o backend;
- o frontend passa a trabalhar com um formulario unico, estruturado em blocos visuais;
- os blocos podem salvar rascunho continuamente, sem depender de um stepper classico.

## Estrutura atual da TAO

- `start`: dados iniciais, faturamento, endereco da obra, gerenciadora e dados bancarios
- `step1`: contrato, datas, impostos, OME e valores do contrato
- `step2`: parcelas, condicoes de pagamento e equipe
- `step3`: aditivos
- `step4`: compliance, licencas, seguros, obrigacoes, multas e medicoes
- `step5`: SharePoint, observacoes, contatos e anexos

## Estrutura alvo proposta para o fork Allora

### Conceito de UX

Em vez de um wizard por etapas, o formulario Allora deve seguir o conceito do `CHECK_LIST_INICIAL_DE_OBRA`:

- uma pagina unica de cadastro;
- blocos verticais bem definidos;
- layout compacto em grid, lembrando a leitura da planilha;
- labels exatamente na linguagem Allora;
- radios e flags para `Sim / Nao` e opcoes de modelo;
- checklist operacional com cara de checklist de escritorio/obra;
- indice lateral ou menu superior fixo para navegar entre blocos;
- salvamento automatico de rascunho ou botao de salvar por bloco;
- versao restrita aparecendo como bloco proprio, nao como fase do processo.

### Estrutura visual recomendada

#### Bloco 1 - Dados iniciais da obra

- `Sigla/nome da obra`
- `Codigo da obra`
- `CENTRO DE CUSTO`
- `Cliente`
- `Engº Responsavel`
- `Gerenciador`
- `Mestre de Obra`
- `Local`
- `Contato Cliente`
- `Data inicio de obra`
- `Termino previsto`
- `Nº Proposta`
- `Arquitetura`

Observacao:

- este bloco deve funcionar como cabecalho principal da TAO Allora.

#### Bloco 2 - Modelo de faturamento

- `Restricao de entrega`
- `Modelo de Faturamento`
- `Para Faturamento Direto, as seguintes documentacoes sao necessarias`
  - `Cliente PF`
  - `RG`
  - `CPF`
  - `Comprovante de Endereco`
  - `Carta de Autorizacao de Faturamento (assinada)`
  - `Cliente PJ`
  - `Cartao CNPJ`
  - `Contrato Social`
  - `Comprovante de Endereco (digitalizado)`

Observacao:

- este trecho deve ser modelado como checklist relacional, nao como JSON.

#### Bloco 3 - Modelo de contratacao

- `Modelo de Contratacao orcamento`
- `Modelo de Contratacao`
- `Periodo de envio de relatorios`
- `Necessidade de envio fisico`
- `Endereco`
- `Observacoes`

#### Bloco 4 - Para Preco Fechado

- `Valor final negociado`
- `Forma de Pagamento`

Observacao:

- este bloco aparece apenas quando `Modelo de Contratacao orcamento = Preco Fechado`.

#### Bloco 5 - Para Administracao

- `% Adm sobre orcamento`
- `Adm fixa`
- `Equipe`
- `Programacao de envio financeiro`
- `Necessidade de envio fisico`
- `Endereco`
- `Observacoes`

Observacao:

- este bloco aparece apenas quando `Modelo de Contratacao = Administracao`.

#### Bloco 6 - Financeiro restrito

- `% ADM sobre orcamento`
- `imposto: incluso ou calcular sobre o percentual`
- `ADM fixa ao mes com imposto`
- `Equipe ao mes com imposto`
- `Tempo de obra`
- `Flag possui orcamento, nao possui orcamento`
- `Adm total prevista com imposto`
- `Equipe total prevista com imposto`
- `Valor mensal do engenheiro com imposto`
- `Valor mensal do mestre com imposto`
- `Custo de obra estimado`
- `Valor estimado total da obra`
- `Adm sobre itens especiais`
- `Observacoes`
- `Envio de relatorios`
- `Contato para envio de relatorios`
- `Com copia`
- `Cliente aceita reembolsos`
- `Cliente aceita pagamentos de excecao fora do prazo`

Observacoes:

- este bloco so aparece para usuarios com a flag `can_view_restricted_tao_fields`;
- `Equipe total prevista com imposto` deve usar tooltip explicando a equivalencia com o campo interno atual de `Equipe Tecnica`;
- `Valor estimado total da obra` reaproveita o core atual de `value_total_contract`, mas sempre exibido com o label Allora.

#### Bloco 7 - Operacional registro de obra

- `Encomendar placa de obra`
- `Cor da placa`
- `Obs`
- `Abertura de pasta fisica`
- `Contato com responsavel da obra por parte do cliente`
- `Abertura de cadastros com fornecedores basicos iniciais`
- `Cadastro no Sienge`
- `Cliente`
- `Empresa`
- `Obra`
- `Centro de custo`
- `Centro de custo Allora`
- `Grupo`
- `Projeto`
- `Necessidade de CNO`
- `CNO Nº`

Observacao:

- este bloco deve ser visualmente o mais proximo da planilha, com itens em lista/checklist e campos de apoio na mesma secao.

#### Bloco 8 - Outros e documentos

- `Contrato com o cliente`
- `Seguro de obra`
- `ART`
- `URL SharePoint`
- `Observacoes gerais`
- `Anexos`

## Estrutura funcional complementar

Itens que continuam existindo, mas fora do formulario inicial Allora:

- `Aditivos`
- `Aprovacoes`
- `Relatorios`

## Funcionalidades que permanecem, mas saem do fluxo principal

Para nao perder finalidade e nao poluir o cadastro inicial:

- `Aditivos` deixam de ser fase principal e passam a ser area complementar da TAO
- `Compliance` deixa de existir no fork Allora como modulo principal

## Controle de dados restritos

### Proposta de seguranca

Adicionar no usuario uma flag booleana:

- `can_view_restricted_tao_fields`

Comportamento esperado:

- sem a flag:
  - usuario nao ve o bloco restrito;
  - endpoints nao retornam os valores restritos;
  - importacao/exportacao ocultam campos restritos;
  - relatorios ocultam campos restritos.
- com a flag:
  - usuario visualiza e edita a fase restrita conforme perfil.

## Matriz de aderencia

### 1. Identificacao, cliente e responsaveis

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| Checklist | Sigla/nome da obra | `Tao.project_name` | Reaproveitar com novo label |
| DOCX | Codigo da obra | `Tao.erp_number` | Reaproveitar com label Allora |
| DOCX | Codigo centro de custo cliente + empresa | novo campo dedicado | Novo campo |
| DOCX | Outros centros de custo cliente | novo campo texto | Novo campo |
| DOCX | Codigo centro de custo Allora | novo campo dedicado | Novo campo |
| DOCX | Projeto # | novo campo dedicado | Novo campo |
| Checklist | Cliente | mesmo core de identificacao principal da obra, sem novo escalar independente | Reaproveitar conforme regra Allora |
| DOCX | Contato do cliente | `TaoContact` tipado | Reaproveitar relacao existente |
| Checklist | Engº Responsavel | `TaoTeamMember` ou `TaoContact` tipado | Reaproveitar relacao existente com papel definido |
| Checklist | Gerenciador | `manager_company_name` / `manager_phone` ou contato tipado | Reaproveitar com ajuste de label, se sem perda semantica |
| Checklist | Mestre de Obra | `TaoTeamMember` tipado | Reaproveitar relacao existente |
| Checklist | Arquitetura | `TaoContact` tipado como `arquitetura` + flag | Reaproveitar relacao + novo flag se necessario |
| Checklist | Contato Cliente | `TaoContact` tipado | Reaproveitar relacao existente |
| Checklist / DOCX | Nº Proposta | novo campo dedicado | Novo campo |
| DOCX | Datas de inicio/termino previstas | `date_start` / `date_end` | Reaproveitar com novo label |
| DOCX | Data de inicio/termino real | novos campos dedicados | Novo campo |
| DOCX | Tempo de obra | derivado das datas ou novo inteiro `duration_months` | Preferivel novo campo |

### 2. Dados da obra e local

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| DOCX | Obra: nome | `Tao.project_name` | Reaproveitar |
| Checklist | Local | `construction_address` + cidade/UF/CEP | Reaproveitar |
| DOCX | Local da obra: endereco completo | `construction_*` | Reaproveitar |
| DOCX / Checklist | CNO | novo campo dedicado | Novo campo |
| DOCX | SFOBRAS | novo campo dedicado | Novo campo |
| Checklist | Restricao de entrega: sim/nao/quais | novos campos boolean + texto | Novo campo |

### 3. Faturamento

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| DOCX | Nome / Razao Social | `billing_company_name` | Reaproveitar |
| DOCX | Endereco completo faturamento | `billing_address`, `billing_neighborhood`, `billing_city`, `billing_state`, `billing_zip` | Reaproveitar |
| DOCX | CNPJ/CPF | `billing_cnpj` | Reaproveitar com label mais generico |
| Checklist | Modelo de Faturamento | novo enum/campo dedicado | Novo campo |
| Checklist | Faturamento direto ao cliente / Allora / outro | `value_billing_direct`, `value_billing_construction`, etc., nao representam o modelo | Novo campo funcional |
| Checklist | Documentacoes necessarias para faturamento direto | nova estrutura de checklist de documentos | Nova relacao |
| Checklist | Necessidade de envio fisico / endereco | novos campos dedicados | Novo campo |

### 4. Contratacao e financeiro geral

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| DOCX / Checklist | Modelo de Contratacao | `hiring_regime` | Reaproveitar |
| DOCX | Administrada fixa ou percentual | `hiring_regime` nao cobre o detalhe | Novo subcampo |
| DOCX / Checklist | Empreitada parcial / total | `hiring_regime` | Reaproveitar |
| Checklist | Modelo de contratacao do orcamento (aberto/preco fechado/outro) | novo campo dedicado | Novo campo |
| Checklist | Valor final negociado | `value_total_contract` ou novo campo | Precisa definicao de negocio |
| Checklist | Forma de pagamento | novo campo texto | Novo campo |
| DOCX | Programacao financeira | `TaoInstallment[]` + observacao | Reaproveitar relacao existente |
| DOCX | Relatorios semanal/quinzenal/mensal/outro | novo campo dedicado | Novo campo |
| DOCX | Data de corte para emissao de NF | novo boolean + dia | Novo campo |
| DOCX | Prazo para equipe enviar notas ao financeiro | novo campo texto | Novo campo |
| DOCX | Dia de envio do relatorio ao cliente | novo campo texto | Novo campo |
| DOCX | Data de pagamento apos envio do relatorio | novo campo texto | Novo campo |
| DOCX / Checklist | Observacoes | `observations_general` ou observacao da fase | Reaproveitar com possivel separacao por contexto |

### 5. Financeiro restrito

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| DOCX | % ADM sobre orcamento | novo campo percentual restrito | Novo campo |
| DOCX | Imposto incluso ou calcular sobre percentual | novo campo dedicado | Novo campo |
| DOCX | ADM fixa ao mes com imposto | novo campo monetario restrito | Novo campo |
| DOCX | Equipe ao mes com imposto | novo campo monetario restrito | Novo campo |
| DOCX | Tempo de obra em meses | novo campo inteiro | Novo campo |
| DOCX | Possui orcamento / nao possui | novo boolean | Novo campo |
| DOCX | ADM total prevista com imposto | novo campo monetario restrito | Novo campo |
| DOCX | Equipe total prevista com imposto | `value_team_technical` | Reaproveitar com tooltip de equivalencia |
| DOCX | Valor mensal do engenheiro | novo campo monetario restrito | Novo campo |
| DOCX | Valor mensal do mestre | novo campo monetario restrito | Novo campo |
| DOCX | Custo de obra estimado | `value_cost_construction` | Reaproveitar |
| DOCX | Valor estimado total da obra | `value_total_contract` | Reaproveitar com label Allora |
| DOCX | ADM sobre itens especiais | novo campo texto restrito | Novo campo |
| DOCX | Observacoes restritas | novo campo texto restrito | Novo campo |
| DOCX | Envio de relatorios - texto explicativo | novo campo texto | Novo campo |
| DOCX | Contato para envio de relatorios | `TaoContact` tipado | Reaproveitar relacao existente |
| DOCX | Com copia | `TaoContact` tipado | Reaproveitar relacao existente |
| DOCX | Cliente aceita reembolsos / texto | novos campos restritos | Novo campo |
| DOCX | Cliente aceita pagamentos de excecao / texto | novos campos restritos | Novo campo |

### 6. Checklist inicial e operacional

| Origem Allora | Item | Destino proposto | Acao |
|---|---|---|---|
| Checklist | Encomendar placa de obra + cor + obs | nova relacao `checklist` | Nova relacao |
| Checklist | Abertura de pasta fisica | nova relacao `checklist` | Nova relacao |
| Checklist | Contato com responsavel da obra | nova relacao `checklist` | Nova relacao |
| Checklist | Abertura de cadastros com fornecedores | nova relacao `checklist` | Nova relacao |
| Checklist | Cadastro no Sienge | nova relacao `checklist` | Nova relacao |
| Checklist | Grupo / cliente / projeto | novos campos ou parte do checklist | Precisa definicao final |
| Checklist | Necessidade de CNO / CNO nº | novo boolean + campo | Novo campo |

Recomendacao:

- modelar checklist em tabela relacionada, nao em dezenas de colunas novas;
- cada item pode ter:
  - categoria
  - nome do item
  - status
  - valor/flag
  - observacao
  - ordem de exibicao

### 7. Outros, documentos e obrigacoes

| Origem Allora | Campo / necessidade | Destino proposto | Acao |
|---|---|---|---|
| DOCX | Contrato com o cliente: data ou nao havera contrato | `date_signature` + novo flag/enum | Reaproveitar parcialmente |
| DOCX | Seguro de obra: vigencia ou nao contratado | novo campo dedicado | Novo campo |
| DOCX | ART: emitida ou nao havera | novo campo dedicado | Novo campo |
| Atual | SharePoint | `sharepoint_url` | Reaproveitar |
| Atual | Anexos | `TaoAttachment[]` | Reaproveitar |
| Atual | Contatos | `TaoContact[]` | Reaproveitar |

## Campos atuais com maior potencial de reaproveitamento

- `project_name`
- `erp_number`
- `date_start`
- `date_end`
- `billing_*`
- `construction_*`
- `manager_*`
- `sharepoint_url`
- `observations_general`
- `hiring_regime`
- `value_total_contract`
- `value_team_technical`
- `value_cost_construction`
- `TaoInstallment[]`
- `TaoTeamMember[]`
- `TaoContact[]`
- `TaoAttachment[]`

## Campos novos mais provaveis

### Cabecalho e identificacao

- centro_custo_cliente
- outros_centros_custo_cliente
- centro_custo_allora
- project_code
- proposal_number
- has_manager
- has_architecture
- actual_start_date
- actual_end_date
- duration_months

### Obra e faturamento

- obra_cno
- obra_sfobras
- has_delivery_restriction
- delivery_restriction_notes
- billing_model
- direct_billing_docs_relational
- requires_physical_delivery
- physical_delivery_address

### Financeiro geral

- budget_model
- negotiated_final_value
- payment_terms_text
- report_frequency
- has_invoice_cutoff
- invoice_cutoff_day
- notes_to_finance_deadline
- report_send_day
- payment_after_report_terms

### Financeiro restrito

- restricted_admin_percent
- restricted_tax_mode
- restricted_admin_monthly_value
- restricted_team_monthly_value
- has_budget_sheet
- restricted_admin_total_estimated
- restricted_team_total_estimated
- restricted_engineer_monthly_value
- restricted_master_monthly_value
- restricted_total_estimated_work_value
- restricted_special_items_admin_text
- restricted_notes
- reports_delivery_notes
- accepts_reimbursements
- accepts_reimbursements_notes
- accepts_exception_payments
- accepts_exception_payments_notes

### Outros

- client_contract_status
- work_insurance_status
- work_insurance_validity
- art_status

## Proposta de modelo de dados complementar

Para reduzir risco e nao inflar excessivamente a tabela `taos`, a melhor divisao e:

- manter `Tao` para cabecalho e campos principais;
- reaproveitar `TaoContact` para contatos por papel;
- reaproveitar `TaoTeamMember` para responsaveis internos;
- criar relacao nova para checklist inicial, por exemplo:
  - `TaoInitialChecklistItem`
- criar relacao nova para documentacoes de faturamento direto, por exemplo:
  - `TaoDirectBillingDocumentItem`
- criar campos novos no `User` para controle de dados restritos;
- adicionar campos novos em `Tao` apenas quando forem dados escalares, unicos e estaveis.

## Estrategia de implementacao recomendada

1. Fechar a matriz final campo a campo com negocio.
2. Definir quais itens serao `escalares`, `contatos`, `equipe` ou `checklist`.
3. Criar migration aditiva:
   - novos campos em `Tao`
   - nova flag em `User`
   - nova tabela de checklist
4. Adaptar backend:
   - DTOs e controllers
   - protecao de dados restritos
5. Reestruturar o frontend do formulario da TAO Allora.
6. Ajustar:
   - importacao/exportacao
   - relatorios
   - integracoes
   - permissoes
7. Testar com a base atual sem apagar dados.

## Decisoes fechadas

- `Codigo da obra` sera o mesmo conceito tecnico de `ERP Nº`, com label Allora no frontend.
- `Cliente` nao abrira um novo campo escalar independente neste fork.
- `Valor estimado total da obra` sera mapeado para `value_total_contract`.
- `Equipe total prevista com imposto` sera mapeado para `value_team_technical`, com tooltip explicativo.
- `Documentacoes de faturamento direto` serao modeladas como checklist relacional.
- `Compliance` nao continuara no fork Allora.

## Recomendacao de proxima etapa

1. montar a `tabela executiva final de implementacao` campo a campo;
2. desenhar o layout visual do formulario unico Allora;
3. definir o pacote de migrations aditivas;
4. implementar primeiro o backend e o controle de acesso aos campos restritos;
5. implementar o novo frontend do formulario Allora;
6. revisar importacao/exportacao, relatorios e integracoes.
