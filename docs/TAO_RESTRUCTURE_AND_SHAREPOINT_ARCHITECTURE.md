# Reestruturação da TAO e integração SharePoint

## Objetivo

Evoluir o cadastro da TAO sem remover ou renomear dados existentes, cobrir os dados necessários à abertura da obra no Sienge e publicar uma visão segura da obra em uma Web Part configurável por página do SharePoint.

## Priorização dos dados

1. **Identificação e vínculo Sienge**: código ERP, código da obra, empresa, cliente, tipo de registro, situação e área.
2. **Centros de custo**: coleção com vários CCs, finalidade, principal por finalidade e participação nos módulos do ERP.
3. **Contrato e faturamento**: datas, prazo, regime, valores, impostos, composição do faturamento e regras de nota fiscal.
4. **Operação da obra**: despesas indiretas, equipe, parcelas, responsáveis e contatos.
5. **Compliance**: CNO, projetos, alvarás, seguros, AVCB, certidões, ART e checklist.
6. **Publicação**: fotos, endereço, status e campos operacionais permitidos na página SharePoint.

## Fases do formulário

| Fase | Nome | Conteúdo principal |
| --- | --- | --- |
| Início | Cadastro e Sienge | Identidade, empresa, cliente, endereço, faturamento, bancos e todos os CCs |
| 1 | Contrato e Valores | Regime, datas, prazo, valores, impostos e parâmetros dos módulos Sienge |
| 2 | Financeiro e Equipe | Composição financeira, despesas indiretas, parcelas, condições e equipe |
| 3 | Aprovações e Aditivos | Alçadas, decisões e mudanças contratuais |
| 4 | Documentos e Compliance | Projetos, licenças, seguros, certidões e obrigações |
| 5 | Contatos e Publicação | Contatos, anexos, fotos, observações e dados de publicação |

Os centros de custo são editados somente na fase inicial. A fase financeira apenas consome essa estrutura, eliminando divergência entre dois editores.

## Compatibilidade de dados

- As colunas legadas `center_cost_client` e `center_cost_allora` permanecem no banco.
- `backend/src/scripts/backfillTaoCostCenters.js` copia os valores legados para `tao_cost_centers` sem apagar a origem.
- A chave lógica do CC é obra + código + finalidade. Assim, cliente e empresa podem usar o mesmo número sem colisão.
- A migration `20260720_tao_professional_structure` só adiciona colunas/tabelas e altera o e-mail da equipe para opcional.
- O backup anterior à mudança está em `backups/pre_tao_restructure_20260720/fxtao_before_tao_restructure.dump`.

## Mapeamento do modelo de referência

| Informação do exemplo | Campo/modelo FX TAO |
| --- | --- |
| Número/nome/metragem da obra | `erp_number`, `project_name`, `area_m2` |
| Empresa e cliente | `responsible_company`, `client`, `company_code`, `client_code` |
| CC cliente / CC empresa / N CCs | `TaoCostCenter.purpose` e coleção `cost_centers` |
| IPTU e CNO | `billing_iptu_number`, `obra_cno`, `requires_cno` |
| Prazo e datas | `duration_days`, `date_signature`, `date_start`, `date_end` |
| Composição de faturamento | `TaoFinancialCompositionItem` |
| Bonificação e conversão de imposto | `bonus_percent`, `tax_conversion_percent` |
| Medições e vencimentos | `TaoInstallment.issue_date`, `due_date`, `percentage`, `notes` |
| Despesas indiretas | `TaoIndirectExpenseItem` |
| Equipe de obra e apoio | `TaoTeamMember` com telefone e ordenação |
| Condição/forma de pagamento | `payment_terms_text`, `payment_methods` |
| Pedido de compra | `requires_purchase_order`, `purchase_order_process` |
| Datas de corte e portal | campos de corte de NF e `supplier_portal_url` |
| Compliance da obra | campos de projeto, licença, seguro, AVCB, CND e Habite-se |

## API da Web Part

- Endpoint: `GET /api/v1/sharepoint/works/:identifier`.
- Identificador aceito: UUID da TAO, `erp_number` ou `project_code`.
- Autenticação: token delegado do Microsoft Entra ID com o escopo `access_as_user`.
- Validações: assinatura RSA, emissor, audiência, expiração, escopo e, opcionalmente, aplicativo cliente.
- A resposta exclui valores financeiros, dados bancários, contatos financeiros restritos, aprovações e logs.
- As imagens são obtidas dos anexos da TAO identificados como arquivo de imagem.

## Implantação segura

1. Configurar e testar o registro de aplicativo Entra descrito em `sharepoint/tao-work-page-webpart/README.md`.
2. Definir as variáveis `SHAREPOINT_*` usando `deploy/.env.example` como referência.
3. Executar backup do PostgreSQL.
4. Aplicar `prisma migrate deploy` no container da API.
5. Executar `node src/scripts/backfillTaoCostCenters.js` uma vez; o script é idempotente.
6. Validar uma TAO antiga, uma nova TAO e a Central de Aprovações.
7. Publicar o pacote `.sppkg`, aprovar a permissão da API e configurar uma obra por página.

## Rollback

- Antes da publicação, restaurar o dump de baseline em um banco isolado para validar o procedimento.
- O rollback da aplicação pode reutilizar a versão anterior porque as colunas antigas continuam presentes.
- Não remover as novas tabelas durante um rollback operacional; elas não interferem no código anterior e preservam os dados capturados.
- Se a restauração total for necessária, usar o dump em `backups/pre_tao_restructure_20260720/` conforme o procedimento padrão de `pg_restore` do ambiente.
