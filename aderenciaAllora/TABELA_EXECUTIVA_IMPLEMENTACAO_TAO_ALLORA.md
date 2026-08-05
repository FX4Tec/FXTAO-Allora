# Tabela Executiva de Implementacao - TAO Allora

## Objetivo

Transformar a matriz de aderencia da Allora em um guia operacional de implementacao, campo por campo, preservando:

- os labels da documentacao Allora;
- a base atual da TAO;
- a compatibilidade com os dados ja cadastrados;
- o controle de dados restritos;
- a estrutura visual mais proxima do checklist inicial de obra.

## Regras consolidadas

- `Codigo da obra` usa o core tecnico atual de `ERP Nº`.
- `Cliente` nao abre um campo escalar novo e independente.
- `Valor estimado total da obra` usa o core atual `value_total_contract`.
- `Equipe total prevista com imposto` usa o core atual `value_team_technical` com tooltip explicativo.
- `Documentacoes de faturamento direto` serao modeladas como checklist relacional.
- `Compliance` nao entra no fork Allora.
- `Aditivos`, `Aprovacoes` e `Relatorios` continuam existindo fora do formulario inicial.

## Legenda de implementacao

- `Core reutilizado`: reaproveita campo existente da base.
- `Novo campo em Tao`: adiciona coluna escalar nova na tabela `taos`.
- `Relacao TaoContact`: reaproveita `tao_contacts` com papel/tipo.
- `Relacao TaoTeamMember`: reaproveita `tao_team_members` com papel/tipo.
- `Nova relacao - Direct Billing`: nova tabela para checklist de documentacao de faturamento.
- `Nova relacao - Checklist Inicial`: nova tabela para checklist operacional inicial.
- `Campo espelho`: exibido no layout, mas sem criar novo armazenamento; deriva de outro campo.

## Estrutura visual final aprovada

O formulario Allora deve ser uma pagina unica, com estes blocos:

1. `Dados iniciais da obra`
2. `Modelo de faturamento`
3. `Modelo de contratacao`
4. `Para Preco Fechado`
5. `Para Administracao`
6. `Financeiro restrito`
7. `Operacional registro de obra`
8. `Outros e documentos`

## Campos espelho aprovados

Esses labels devem aparecer para respeitar a linguagem Allora, mas sem criar duplicidade de armazenamento:

- `Cliente`
  Origem do valor: `Sigla/nome da obra` / `project_name`
- `Obra` no bloco operacional
  Origem do valor: `Sigla/nome da obra` / `project_name`
- `Centro de custo` no bloco operacional
  Origem do valor: `CENTRO DE CUSTO`
- `Centro de custo Allora` no bloco operacional
  Origem do valor: campo dedicado Allora

## Tabela executiva final

### Bloco 1 - Dados iniciais da obra

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Sigla/nome da obra | texto | Checklist | `taos.project_name` | Core reutilizado | Sim | Nao | Campo principal da TAO Allora. |
| Codigo da obra | texto | DOCX + Checklist | `taos.erp_number` | Core reutilizado | Sim | Nao | Exibir sempre com label Allora. |
| CENTRO DE CUSTO | texto | Checklist | `taos.center_cost_client` | Novo campo em Tao | Sim | Nao | Campo principal do cabecalho. |
| Cliente | texto somente leitura | Checklist | derivado de `taos.project_name` | Campo espelho | Nao | Nao | Nao persiste separado. |
| Engº Responsavel | seletor + dados de contato | Checklist | `tao_team_members` com papel `Engº Responsavel` | Relacao TaoTeamMember | Sim | Nao | Pode permitir busca e cadastro rapido. |
| Gerenciador | radio `Sim/Nao` + nome/contato | Checklist + DOCX | `taos.has_manager` + `tao_contacts` com papel `Gerenciador` | Novo campo em Tao + Relacao TaoContact | Condicional | Nao | Se `Sim`, abre nome e contato. |
| Mestre de Obra | seletor + dados de contato | Checklist + DOCX | `tao_team_members` com papel `Mestre de Obra` | Relacao TaoTeamMember | Condicional | Nao | Obrigatorio quando ja houver definicao operacional. |
| Local | endereco resumido | Checklist | `taos.construction_address` + `construction_city` + `construction_state` + `construction_zip` | Core reutilizado | Sim | Nao | Layout pode ser compacto com endereco completo. |
| Contato Cliente | nome + telefone + email | Checklist + DOCX | `tao_contacts` com papel `Contato Cliente` | Relacao TaoContact | Sim | Nao | Contato principal do cliente. |
| Data inicio de obra | data | Checklist + DOCX | `taos.date_start` | Core reutilizado | Sim | Nao | Label Allora no frontend. |
| Termino previsto | data | Checklist + DOCX | `taos.date_end` | Core reutilizado | Sim | Nao | Label Allora no frontend. |
| Nº Proposta | texto | Checklist + DOCX | `taos.proposal_number` | Novo campo em Tao | Condicional | Nao | Pode ser exigido por empresa ou area. |
| Arquitetura | radio `Sim/Nao` + nome/contato | Checklist + DOCX | `taos.has_architecture` + `tao_contacts` com papel `Arquitetura` | Novo campo em Tao + Relacao TaoContact | Condicional | Nao | Se `Sim`, abre nome e contato. |
| Data de inicio real | data | DOCX | `taos.actual_start_date` | Novo campo em Tao | Nao | Nao | Preenchimento posterior. |
| Data de termino real | data | DOCX | `taos.actual_end_date` | Novo campo em Tao | Nao | Nao | Preenchimento posterior. |
| Tempo de obra | numero / calculado | DOCX | `taos.duration_months` | Novo campo em Tao | Nao | Nao | Pode ser calculado das datas e editavel. |

### Bloco 2 - Modelo de faturamento

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Nome / Razao Social | texto | DOCX | `taos.billing_company_name` | Core reutilizado | Sim | Nao | Manter label Allora. |
| Endereco completo | texto composto | DOCX | `taos.billing_address`, `billing_neighborhood`, `billing_city`, `billing_state`, `billing_zip` | Core reutilizado | Sim | Nao | Pode usar grid com subcampos internos. |
| CNPJ/CPF | texto | DOCX | `taos.billing_cnpj` | Core reutilizado | Sim | Nao | Mesmo core para PF e PJ, com label Allora. |
| Restricao de entrega | radio `Nao/Sim` | Checklist | `taos.has_delivery_restriction` | Novo campo em Tao | Sim | Nao | Valor booleano com texto complementar. |
| Quais | texto | Checklist | `taos.delivery_restriction_notes` | Novo campo em Tao | Condicional | Nao | Aparece quando `Restricao de entrega = Sim`. |
| Modelo de Faturamento | radio | Checklist + DOCX | `taos.billing_model` | Novo campo em Tao | Sim | Nao | Opcoes: `Direto ao Cliente`, `Allora Construtora`, `Outro`. |
| RG | checkbox | Checklist | `tao_direct_billing_document_items` item `RG` | Nova relacao - Direct Billing | Condicional | Nao | Exibir apenas para `Direto ao Cliente`. |
| CPF | checkbox | Checklist | `tao_direct_billing_document_items` item `CPF` | Nova relacao - Direct Billing | Condicional | Nao | Exibir apenas para `Direto ao Cliente`. |
| Comprovante de Endereco | checkbox | Checklist | `tao_direct_billing_document_items` item `Comprovante de Endereco` | Nova relacao - Direct Billing | Condicional | Nao | Fluxo PF. |
| Carta de Autorizacao de Faturamento (assinada) | checkbox | Checklist | `tao_direct_billing_document_items` item `Carta de Autorizacao de Faturamento (assinada)` | Nova relacao - Direct Billing | Condicional | Nao | Pode ser usada para PF e PJ. |
| Cartao CNPJ | checkbox | Checklist | `tao_direct_billing_document_items` item `Cartao CNPJ` | Nova relacao - Direct Billing | Condicional | Nao | Fluxo PJ. |
| Contrato Social | checkbox | Checklist | `tao_direct_billing_document_items` item `Contrato Social` | Nova relacao - Direct Billing | Condicional | Nao | Fluxo PJ. |
| Comprovante de Endereco (digitalizado) | checkbox | Checklist | `tao_direct_billing_document_items` item `Comprovante de Endereco (digitalizado)` | Nova relacao - Direct Billing | Condicional | Nao | Fluxo PJ. |

### Bloco 3 - Modelo de contratacao

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Modelo de Contratacao orcamento | radio | Checklist + DOCX | `taos.budget_model` | Novo campo em Tao | Sim | Nao | Opcoes: `Aberto`, `Preco Fechado`, `Outro`. |
| Modelo de Contratacao | radio | Checklist + DOCX | `taos.hiring_regime` | Core reutilizado | Sim | Nao | Opcoes Allora no frontend. |
| Detalhe da Administracao | radio | DOCX | `taos.hiring_regime_detail` | Novo campo em Tao | Condicional | Nao | Opcoes: `Fixa`, `Percentual`. |
| Detalhe da Empreitada | radio | DOCX + Checklist | `taos.hiring_regime_detail` | Novo campo em Tao | Condicional | Nao | Opcoes: `Parcial`, `Total (Global)`. |
| Periodo de envio de relatorios | radio | Checklist + DOCX | `taos.report_frequency` | Novo campo em Tao | Sim | Nao | Opcoes: `Semanal`, `Quinzenal`, `Mensal`, `Outro`. |
| Necessidade de envio fisico | radio `Sim/Nao` | Checklist | `taos.requires_physical_delivery` | Novo campo em Tao | Sim | Nao | Core unico reutilizado em todo o formulario. |
| Endereco | texto | Checklist | `taos.physical_delivery_address` | Novo campo em Tao | Condicional | Nao | Aparece quando `Necessidade de envio fisico = Sim`. |
| Observacoes | texto longo | Checklist + DOCX | `taos.observations_general` | Core reutilizado | Nao | Nao | Pode receber observacoes operacionais do bloco. |
| Programacao financeira | grade / lista | DOCX | `tao_installments` + `taos.financial_schedule_notes` | Relacao existente + Novo campo em Tao | Nao | Nao | Lista de parcelas e/ou notas livres. |
| Data de corte para emissao de notas fiscais | radio `Nao/Sim` | DOCX | `taos.has_invoice_cutoff` | Novo campo em Tao | Sim | Nao | Se `Sim`, abre o dia. |
| Qual dia | numero / texto curto | DOCX | `taos.invoice_cutoff_day` | Novo campo em Tao | Condicional | Nao | Dia de corte da NF. |
| Prazo para equipe de obras enviar as notas ao financeiro | texto | DOCX | `taos.notes_to_finance_deadline` | Novo campo em Tao | Nao | Nao | Ex.: dia da semana. |
| Dia de envio do relatorio ao cliente | texto | DOCX | `taos.report_send_day` | Novo campo em Tao | Nao | Nao | Ex.: toda segunda-feira. |
| Data de pagamento a partir do envio do relatorio | texto | DOCX | `taos.payment_after_report_terms` | Novo campo em Tao | Nao | Nao | Regra comercial / financeira. |

### Bloco 4 - Para Preco Fechado

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Valor final negociado | moeda | Checklist | `taos.value_total_contract` | Core reutilizado | Condicional | Nao | Aparece apenas quando `Modelo de Contratacao orcamento = Preco Fechado`. |
| Forma de Pagamento | texto longo | Checklist | `taos.payment_terms_text` | Novo campo em Tao | Condicional | Nao | Regras do preco fechado. |

### Bloco 5 - Para Administracao

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Programacao de envio financeiro | texto | Checklist | `taos.admin_financial_schedule_text` | Novo campo em Tao | Condicional | Nao | Exibir apenas quando `Modelo de Contratacao = Administracao`. |
| Necessidade de envio fisico | radio `Sim/Nao` | Checklist | `taos.requires_physical_delivery` | Core reutilizado | Condicional | Nao | Mesmo core do bloco 3; pode aparecer em modo espelho. |
| Endereco | texto | Checklist | `taos.physical_delivery_address` | Core reutilizado | Condicional | Nao | Mesmo core do bloco 3. |
| Observacoes | texto longo | Checklist | `taos.admin_notes` | Novo campo em Tao | Nao | Nao | Observacoes do contexto de administracao. |

### Bloco 6 - Financeiro restrito

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| % ADM sobre orcamento | percentual | DOCX + Checklist | `taos.restricted_admin_percent` | Novo campo em Tao | Condicional | Sim | Visivel apenas com `can_view_restricted_tao_fields`. |
| imposto: incluso ou calcular sobre o percentual | radio | DOCX | `taos.restricted_tax_mode` | Novo campo em Tao | Condicional | Sim | Opcoes: `Incluso`, `Calcular sobre o percentual`. |
| ADM fixa ao mes com imposto | moeda | DOCX | `taos.restricted_admin_monthly_value` | Novo campo em Tao | Condicional | Sim | Campo restrito. |
| Equipe ao mes com imposto | moeda | DOCX | `taos.restricted_team_monthly_value` | Novo campo em Tao | Condicional | Sim | Campo restrito. |
| Tempo de obra | numero / calculado | DOCX | `taos.duration_months` | Core reutilizado | Nao | Sim | Mesmo core do cabecalho, com exibicao restrita quando fizer sentido. |
| Flag possui orcamento, nao possui orcamento | radio | DOCX | `taos.has_budget_sheet` | Novo campo em Tao | Condicional | Sim | Campo restrito. |
| Adm total prevista com imposto | moeda | DOCX | `taos.restricted_admin_total_estimated` | Novo campo em Tao | Condicional | Sim | Campo restrito. |
| Equipe total prevista com imposto | moeda | DOCX | `taos.value_team_technical` | Core reutilizado | Condicional | Sim | Tooltip: `equivale ao campo interno Equipe Tecnica`. |
| Valor mensal do engenheiro com imposto | moeda | DOCX | `taos.restricted_engineer_monthly_value` | Novo campo em Tao | Nao | Sim | Campo restrito. |
| Valor mensal do mestre com imposto | moeda | DOCX | `taos.restricted_master_monthly_value` | Novo campo em Tao | Nao | Sim | Campo restrito. |
| Custo de obra estimado | moeda | DOCX | `taos.value_cost_construction` | Core reutilizado | Condicional | Sim | Label Allora no frontend. |
| Valor estimado total da obra | moeda | DOCX | `taos.value_total_contract` | Core reutilizado | Condicional | Sim | Mesmo core de `Valor final negociado`; usar logica de contexto e tooltip. |
| Adm sobre itens especiais | texto longo | DOCX | `taos.restricted_special_items_admin_text` | Novo campo em Tao | Nao | Sim | Campo restrito. |
| Observacoes | texto longo | DOCX | `taos.restricted_notes` | Novo campo em Tao | Nao | Sim | Observacoes restritas. |
| Envio de relatorios | texto longo | DOCX | `taos.reports_delivery_notes` | Novo campo em Tao | Nao | Sim | Orientacoes internas de envio. |
| Contato para envio de relatorios | nome + telefone + email | DOCX | `tao_contacts` com papel `Contato para envio de relatorios` | Relacao TaoContact | Nao | Sim | Pode permitir multiplos contatos se necessario. |
| Com copia | nome + telefone + email | DOCX | `tao_contacts` com papel `Com copia` | Relacao TaoContact | Nao | Sim | Pode permitir multiplos contatos se necessario. |
| Cliente aceita reembolsos | radio `Sim/Nao` + texto | DOCX | `taos.accepts_reimbursements` + `taos.accepts_reimbursements_notes` | Novo campo em Tao | Nao | Sim | Campo restrito. |
| Cliente aceita pagamentos de excecao fora do prazo | radio `Sim/Nao` + texto | DOCX | `taos.accepts_exception_payments` + `taos.accepts_exception_payments_notes` | Novo campo em Tao | Nao | Sim | Campo restrito. |

### Bloco 7 - Operacional registro de obra

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Encomendar placa de obra | checklist | Checklist | `tao_initial_checklist_items` item `Encomendar placa de obra` | Nova relacao - Checklist Inicial | Nao | Nao | Item operacional. |
| Cor da placa | selecao | Checklist | metadata do item `Encomendar placa de obra` | Nova relacao - Checklist Inicial | Condicional | Nao | Opcoes: `Verde`, `Branca`, `Laranja`. |
| Obs | texto curto | Checklist | metadata do item `Encomendar placa de obra` | Nova relacao - Checklist Inicial | Nao | Nao | Observacao do item. |
| Abertura de pasta fisica | checklist | Checklist | `tao_initial_checklist_items` item `Abertura de pasta fisica` | Nova relacao - Checklist Inicial | Nao | Nao | Item operacional. |
| Contato com responsavel da obra por parte do cliente | checklist | Checklist | `tao_initial_checklist_items` item correspondente | Nova relacao - Checklist Inicial | Nao | Nao | Item operacional. |
| Abertura de cadastros com fornecedores basicos iniciais | checklist | Checklist | `tao_initial_checklist_items` item correspondente | Nova relacao - Checklist Inicial | Nao | Nao | Item operacional. |
| Cadastro no Sienge | checklist | Checklist | `tao_initial_checklist_items` item correspondente | Nova relacao - Checklist Inicial | Nao | Nao | Item operacional. |
| Cliente | texto somente leitura | Checklist | derivado de `taos.project_name` | Campo espelho | Nao | Nao | Mantido apenas para reproduzir o layout da planilha. |
| Empresa | texto | Checklist | `taos.company_code` | Novo campo em Tao | Condicional | Nao | Se a Allora usar codigo/empresa operacional. |
| Obra | texto somente leitura | Checklist | derivado de `taos.project_name` | Campo espelho | Nao | Nao | Espelho no bloco operacional. |
| Centro de custo | texto somente leitura | Checklist | derivado de `taos.center_cost_client` | Campo espelho | Nao | Nao | Espelho do cabecalho. |
| Centro de custo Allora | texto somente leitura / editavel | Checklist + DOCX | `taos.center_cost_allora` | Novo campo em Tao | Condicional | Nao | Pode ser editavel ou espelho, conforme UX final. |
| Grupo | texto curto | Checklist | `taos.project_group` | Novo campo em Tao | Nao | Nao | Pode ter default `4`. |
| Projeto | texto curto | Checklist + DOCX | `taos.project_code` | Novo campo em Tao | Condicional | Nao | Mesmo campo tecnico do `Projeto #`. |
| Necessidade de CNO | radio `Sim/Nao` | Checklist | `taos.requires_cno` | Novo campo em Tao | Sim | Nao | Valor booleano. |
| CNO Nº | texto | Checklist + DOCX | `taos.obra_cno` | Novo campo em Tao | Condicional | Nao | Aparece quando `Necessidade de CNO = Sim`. |
| SFOBRAS | texto | DOCX | `taos.obra_sfobras` | Novo campo em Tao | Nao | Nao | Identificador operacional complementar. |

### Bloco 8 - Outros e documentos

| Label Allora | Tipo UI | Origem | Destino tecnico | Implementacao | Obrigatorio | Restrito | Observacoes |
|---|---|---|---|---|---|---|---|
| Contrato com o cliente | radio + data | DOCX | `taos.client_contract_status` + `taos.date_signature` | Novo campo em Tao + Core reutilizado | Condicional | Nao | Opcoes: `Assinado`, `Nao havera contrato`. |
| Seguro de obra | radio + vigencia | DOCX | `taos.work_insurance_status` + `taos.work_insurance_validity` | Novo campo em Tao | Condicional | Nao | Opcoes: `Contratado`, `Nao sera contratado`. |
| ART | radio | DOCX | `taos.art_status` | Novo campo em Tao | Condicional | Nao | Opcoes: `Emitida`, `Nao havera ART`. |
| URL SharePoint | texto / url | Atual | `taos.sharepoint_url` | Core reutilizado | Nao | Nao | Mantem integracao documental. |
| Observacoes gerais | texto longo | Atual | `taos.observations_general` | Core reutilizado | Nao | Nao | Observacoes gerais do cadastro. |
| Anexos | upload/lista | Atual | `tao_attachments` | Relacao existente | Nao | Nao | Mantem o comportamento atual de documentos. |

## Estruturas novas recomendadas

### Novos campos em `users`

| Campo tecnico | Tipo | Objetivo |
|---|---|---|
| `can_view_restricted_tao_fields` | boolean | Controlar acesso ao bloco `Financeiro restrito`, exportacao, importacao, relatorios e APIs. |

### Novas relacoes

| Tabela proposta | Objetivo | Observacoes |
|---|---|---|
| `tao_direct_billing_document_items` | Checklist de documentacao exigida para faturamento direto | Cada item com nome, marcado, observacao e ordem. |
| `tao_initial_checklist_items` | Checklist operacional inicial da obra | Cada item com categoria, marcado, valor complementar, observacao e ordem. |

## Ordem recomendada de implementacao

1. Criar a migration aditiva com novos campos em `taos`, novo campo em `users` e novas tabelas relacionais.
2. Adaptar backend, DTOs e regras de autorizacao para o bloco restrito.
3. Criar o novo formulario Allora em pagina unica por blocos.
4. Tratar campos espelho para respeitar o layout sem duplicar armazenamento.
5. Ajustar importacao/exportacao para os novos labels da Allora.
6. Ajustar relatorios e integracoes para os novos campos.
7. Validar com dados existentes antes de qualquer ativacao definitiva no fork.

## Observacoes finais

- Onde o mesmo core tecnico for reutilizado com labels diferentes, o frontend deve usar contexto e tooltip para evitar ambiguidade.
- `value_total_contract` sera usado em mais de um contexto de negocio:
  - `Valor final negociado`
  - `Valor estimado total da obra`
- `value_team_technical` sera exibido com label Allora:
  - `Equipe total prevista com imposto`
- `Cliente` e `Obra` no layout Allora devem ser tratados como espelhos, nao como dois campos persistidos distintos.
