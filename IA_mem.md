# IA Memory

Este arquivo registra prompts e retornos das execucoes de IA relacionadas ao app FXTAO.

## Regras de registro

- Registrar data e hora da execucao.
- Registrar o prompt recebido.
- Registrar um resumo objetivo do retorno entregue.
- Registrar arquivos alterados, comandos relevantes e proximos passos sugeridos.

## Historico

### 2026-03-23 15:29 America/Sao_Paulo

**Prompt**

Analise o projeto /opt/FXTAO veja se esta no ar e seus indicadores.
Aproveitando crie um arquivo chamado IA_mem.md em ../FXTAO/. Neste arquivo de agora em diante vai registrar todos os prompts e retornos para ser a memoria de todos os procedimentos executados neste app. A analise mostre na tela para decidir proximos passos.

**Retorno resumido**

- Projeto localizado em `/opt/FXTAO`.
- Ambiente sem repositorio `git` inicializado nesse diretorio.
- Stack identificada:
  - Frontend React/Vite.
  - Backend Node/Express com Prisma.
  - Postgres em container Docker.
- Containers em execucao:
  - `fxtao_web`
  - `fxtao`
  - `fxtao_db`
- Publicacao externa operacional em `https://allora.tao.fx4.com.br/` com resposta HTTP `200`.
- Backend operacional em `http://127.0.0.1:3000/health` com resposta `{\"status\":\"ok\"}`.
- `nginx` local em `http://127.0.0.1/` retorna `404` fora do host configurado, comportamento coerente com virtual host por dominio.
- Banco com poucos dados de negocio:
  - `users`: 5
  - `taos`: 1
  - `tao_installments`: 0
  - `tao_additives`: 0
  - `tao_approvers`: 0
  - `tao_attachments`: 0
  - `tao_contacts`: 0
  - `tao_team_members`: 0
- Unico TAO encontrado:
  - Projeto `HIK`
  - `status = 5`
  - `approval_status = draft`
- Indicadores calculaveis no estado atual:
  - Obras ativas: 0
  - Obras entregues: 1
  - Performance media: 100%
  - Demais KPIs financeiros estao zerados ou sem base de dados suficiente.
- Risco relevante encontrado:
  - Ha historico de falha de SSO e indicio de divergencia entre schema Prisma e banco (`users.auth_provider` ausente), visto em logs do deploy.

**Arquivos alterados**

- `/opt/FXTAO/IA_mem.md`

**Comandos e fontes locais relevantes**

- `docker ps`
- `docker stats --no-stream`
- `curl https://allora.tao.fx4.com.br/`
- `curl http://127.0.0.1:3000/health`
- `docker exec fxtao_db psql ...`
- `/etc/nginx/sites-available/allora.tao.fx4.com.br`
- `/opt/FXTAO/deploy/docker-compose.vps.yml`
- `/opt/FXTAO/src/pages/Dashboard.jsx`

**Proximos passos sugeridos**

- Verificar login real no frontend e fluxo SSO.
- Conferir migrations do Prisma versus schema atual do banco.
- Popular base minima de homologacao para que o dashboard reflita indicadores reais.
- Revisar observabilidade basica: healthcheck para API/web e logs centralizados.

### 2026-03-23 15:56 America/Sao_Paulo

**Prompt**

Quero apenas que esteja apto a dar continuidade em evolucoes e correcoes na plataforma sem quebrar a aplicacao e faca backup de todos os arquivos eventualmente tocados pois estamos em producao.
Primeiro item que vamos alterar: em menu relatorios, o conteudo nao estava coerente com a TAO `HIK` finalizada.
Criar tambem uma secao `Visualizar Relatorio` ao lado de `Geral`, `Financeiro` e `Aprovacoes`, permitindo consultar a obra e visualizar um relatorio pronto para imprimir ou gerar PDF.
Executar as correcoes e implementacoes com cuidado maximo com os dados.

**Retorno resumido**

- Backups criados antes das edicoes em:
  - `/opt/FXTAO/backups/20260323-1538-reports`
- Causa raiz identificada:
  - os componentes de relatorio consumiam `/resources/taos`, endpoint inexistente no backend atual;
  - a listagem correta usa `/taos`, por isso a obra `HIK` aparecia na tela principal e nao nos relatorios.
- Correcoes implementadas:
  - nova camada de dados de relatorio para buscar todas as TAOs pelo endpoint correto e normalizar status;
  - correcao das abas `Geral`, `Financeiro` e `Aprovacoes`;
  - adicao da nova aba `Visualizar Relatorio`;
  - habilitacao do botao `Exportar Dados` para baixar um snapshot JSON dos dados de relatorio.
- Novo comportamento:
  - a obra `HIK` finalizada passa a refletir nos indicadores do menu Relatorios;
  - a aba `Visualizar Relatorio` permite selecionar a obra, visualizar um relatorio consolidado e usar `Imprimir / PDF`;
  - nenhuma alteracao foi feita em dados do banco.
- Validacao executada:
  - build do frontend validado com sucesso em container temporario isolado de `node:20-alpine`, sem alterar os containers de producao.

**Arquivos alterados**

- `/opt/FXTAO/src/pages/Reports.jsx`
- `/opt/FXTAO/src/components/reports/ReportGeneral.jsx`
- `/opt/FXTAO/src/components/reports/ReportFinancial.jsx`
- `/opt/FXTAO/src/components/reports/ReportApprovals.jsx`
- `/opt/FXTAO/src/components/reports/ReportViewer.jsx`
- `/opt/FXTAO/src/components/reports/useReportData.js`
- `/opt/FXTAO/IA_mem.md`

**Observacoes**

- A validacao acusou apenas avisos de dependencias desatualizadas de browserslist/baseline mapping no ambiente temporario de build, sem erro de compilacao.
- Publicacao executada em producao:
  - backup da imagem anterior criado como `fxtao-web:backup-20260323-1602`;
  - `docker compose -f docker-compose.vps.yml up -d --build web` executado no deploy;
  - containers recriados e saudaveis apos a publicacao.
- Checks apos deploy:
  - `http://127.0.0.1:3000/health` respondeu `{\"status\":\"ok\"}`;
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`;
  - novo bundle publicado detectado no `index.html` com asset `index-C71JC9Bt.js`.

### 2026-03-23 16:28 America/Sao_Paulo

**Prompt**

Ao inves de `Finalizado`, mudar a linguagem/citacao para `Cadastrado`, por ficar mais coerente com o contexto.

**Retorno resumido**

- Backups criados antes das edicoes em:
  - `/opt/FXTAO/backups/20260323-1620-status-cadastrado`
- Ajustes realizados de nomenclatura do status final da TAO:
  - `Finalizado` -> `Cadastrado`
  - `Finalizadas` -> `Cadastradas`
  - `Entregue` / `Entregues` -> `Cadastrado` / `Cadastradas`
- Telas ajustadas:
  - lista de TAOs
  - formulario da TAO
  - relatorios
  - dashboard
- Logica de status e dados nao foram alterados; apenas textos exibidos ao usuario.

**Arquivos alterados**

- `/opt/FXTAO/src/pages/TaoList.jsx`
- `/opt/FXTAO/src/pages/TaoForm.jsx`
- `/opt/FXTAO/src/components/reports/useReportData.js`
- `/opt/FXTAO/src/components/reports/ReportGeneral.jsx`
- `/opt/FXTAO/src/pages/Dashboard.jsx`
- `/opt/FXTAO/IA_mem.md`

**Validacao e publicacao**

- Build validado em container temporario isolado com `node:20-alpine`.
- Backup da imagem web anterior criado como `fxtao-web:backup-20260323-1626`.
- Publicacao executada somente para o frontend com:
  - `docker compose -f docker-compose.vps.yml up -d --build --no-deps web`
- Verificacoes apos deploy:
  - `http://127.0.0.1:3000/health` respondeu `{\"status\":\"ok\"}`;
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`;
  - bundle novo publicado detectado no `index.html` com asset `index-BI43eav2.js`;
  - termo `Cadastrado` confirmado dentro do bundle publicado.

### 2026-03-23 16:49 America/Sao_Paulo

**Prompt**

O relatorio nao ficou profissional na renderizacao de impressao. Ajustar para ficar mais proximo da apresentacao em tela e contemplar as informacoes de todas as fases.

**Retorno resumido**

- Backups criados antes das edicoes em:
  - `/opt/FXTAO/backups/20260323-1638-report-print-redesign`
- O componente `Visualizar Relatorio` foi redesenhado para formato executivo, com:
  - cabecalho premium com status, emissao e trilha das fases;
  - cards de resumo;
  - secoes por fase (`Fase 0` a `Fase 5`);
  - tabelas estruturadas para parcelas, equipe, aditivos, compliance, contatos, anexos, historico e logs;
  - visual mais proximo da apresentacao em tela.
- A impressao recebeu tratamento dedicado:
  - preservacao de cores e blocos;
  - margens A4;
  - melhor controle de quebra de pagina;
  - tabelas com cabecalho repetivel e menos risco de cortes ruins.
- O relatorio agora contempla as fases:
  - cadastro e abertura;
  - contrato e financeiro;
  - recebiveis, parcelas e equipe;
  - aditivos;
  - compliance e obrigacoes;
  - documentos, contatos e fechamento.

**Arquivos alterados**

- `/opt/FXTAO/src/components/reports/ReportViewer.jsx`
- `/opt/FXTAO/src/index.css`
- `/opt/FXTAO/IA_mem.md`

**Validacao e publicacao**

- Build validado em container temporario isolado com `node:20-alpine`.
- Backup da imagem web anterior criado como `fxtao-web:backup-20260323-1648-report-print`.
- Publicacao executada somente para o frontend com:
  - `docker compose -f docker-compose.vps.yml up -d --build --no-deps web`
- Verificacoes apos deploy:
  - `http://127.0.0.1:3000/health` respondeu `{\"status\":\"ok\"}`;
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`;
  - bundle novo publicado detectado no `index.html` com asset `index-CgHlxLzm.js`;
  - termos do novo relatorio confirmados no bundle publicado (`Executive Report`, `Fase 5`).

### 2026-03-23 16:26 America/Sao_Paulo

**Prompt**

Estruturar a demanda de integracao do FXTAO com os apps RDO e FX31, considerando sincronizacao unidirecional `TAO -> Outras` para:
- dados da obra;
- dados financeiros da obra;
- equipe de obras;
- consulta com o nome das obras cadastradas;
- tudo com token e seguranca aplicada.

**Retorno resumido**

- Foi realizada leitura tecnica do backend e da documentacao funcional para basear a proposta em algo viavel no ambiente atual.
- A base de dados atual ja comporta os escopos desejados:
  - dados da obra a partir de `Tao`;
  - dados financeiros a partir dos campos financeiros e tributarios de `Tao`;
  - equipe a partir de `TaoTeamMember`;
  - consulta de obras a partir de `id`, `erp_number`, `project_name` e status.
- Recomendacao principal:
  - criar uma API de integracao versionada e separada da API transacional do app, com foco somente em leitura para consumo por `RDO` e `FX31`;
  - preferir `1 API` com `4 recursos/endpoints`, em vez de varias APIs desconectadas.
- Desenho recomendado:
  - namespace dedicado como `/api/v1/integrations`;
  - autenticacao propria para sistema-a-sistema, sem reaproveitar o JWT de usuario humano;
  - tokens por aplicacao consumidora, com escopo, expiracao, rotacao e auditoria;
  - sincronizacao por consulta (`pull`) na primeira fase, com webhooks/eventos em fase futura.
- Endpoints sugeridos:
  - `GET /api/v1/integrations/works`
  - `GET /api/v1/integrations/works/:id`
  - `GET /api/v1/integrations/works/:id/financial`
  - `GET /api/v1/integrations/works/:id/team`
  - `GET /api/v1/integrations/works/lookup`
- Regras recomendadas:
  - definir criterio de elegibilidade de sincronizacao, preferencialmente obras `status = 5` (`Cadastrado`) ou outro marcador explicito de prontidao;
  - expor `updated_at` da TAO e filtros como `erp_number`, `status`, `page`, `limit`;
  - considerar paginação e filtros desde a primeira versao.
- Gap tecnico relevante identificado:
  - `Tao` possui `updated_at`, mas tabelas como `TaoTeamMember`, `TaoInstallment` e `TaoAdditive` nao possuem timestamps de alteracao;
  - isso limita um sync incremental fino por subrecurso e precisa entrar no desenho da fase 2.
- Risco atual:
  - o backend existente autentica apenas usuarios via JWT comum e nao tem camada dedicada para integracoes externas.
- Nenhuma alteracao foi feita na aplicacao, containers ou banco; esta rodada foi somente de analise e estruturacao.

**Arquivos consultados**

- `/opt/FXTAO/backend/prisma/schema.prisma`
- `/opt/FXTAO/backend/src/app.js`
- `/opt/FXTAO/backend/src/controllers/taoController.js`
- `/opt/FXTAO/backend/src/controllers/resourceController.js`
- `/opt/FXTAO/backend/src/routes/taoRoutes.js`
- `/opt/FXTAO/backend/src/middlewares/authMiddleware.js`
- `/opt/FXTAO/FX_TAO_Documentacao_Tecnica (1).md`
- `/opt/FXTAO/implementation_plan.md`
- `/opt/FXTAO/task.md`
- `/opt/FXTAO/walkthrough.md`
- `/opt/FXTAO/IA_mem.md`

**Observacoes**

- Backup do arquivo de memoria criado antes da atualizacao em:
  - `/opt/FXTAO/backups/20260323-1705-integrations-planning/IA_mem.md.bak`

### 2026-03-23 16:46 America/Sao_Paulo

**Prompt**

Implementar a integracao com:
- HTTPS obrigatorio;
- allowlist de IP opcional;
- local em `Configuracoes` para cadastro dos IPs do `RDO`, `FX31` e `Generico`;
- flag para ligar/desligar o filtro de IP;
- manter cuidado maximo por se tratar de producao.

**Retorno resumido**

- Backups criados antes das edicoes em:
  - `/opt/FXTAO/backups/20260323-1735-integration-api`
- Foi implementada uma nova camada de integracao no backend, sem alterar schema do banco e sem tocar dados de obras.
- Nova API publicada:
  - `GET /api/v1/integrations/works`
  - `GET /api/v1/integrations/works/lookup`
  - `GET /api/v1/integrations/works/:id`
  - `GET /api/v1/integrations/works/:id/financial`
  - `GET /api/v1/integrations/works/:id/team`
- Seguranca implementada:
  - HTTPS obrigatorio nas rotas de integracao;
  - Bearer token por cliente de integracao;
  - filtro opcional de IP por cliente, controlado por configuracao;
  - escopos internos de leitura para `works`, `financial`, `team` e `lookup`;
  - administracao protegida por backend apenas para perfis elevados.
- Persistencia adotada:
  - configuracoes de integracao e metadados dos clientes gravados em `system_configs`;
  - nenhum migration foi executado em producao.
- Nova area em `Configuracoes` adicionada no frontend:
  - secao `Integracoes do Ecossistema`;
  - flag global `Ativar filtro por IP`;
  - cadastro de IPs por cliente (`RDO`, `FX31`, `Generico`);
  - habilitacao individual de cliente;
  - geracao e regeneracao de token por cliente;
  - exibicao do token completo apenas no momento da geracao.

**Arquivos alterados**

- `/opt/FXTAO/backend/src/app.js`
- `/opt/FXTAO/backend/src/services/integrationConfigService.js`
- `/opt/FXTAO/backend/src/middlewares/requireElevatedRole.js`
- `/opt/FXTAO/backend/src/middlewares/requireIntegrationScope.js`
- `/opt/FXTAO/backend/src/middlewares/integrationAuthMiddleware.js`
- `/opt/FXTAO/backend/src/controllers/integrationAdminController.js`
- `/opt/FXTAO/backend/src/controllers/integrationController.js`
- `/opt/FXTAO/backend/src/routes/integrationAdminRoutes.js`
- `/opt/FXTAO/backend/src/routes/integrationRoutes.js`
- `/opt/FXTAO/src/pages/Settings.jsx`
- `/opt/FXTAO/src/components/settings/IntegrationSettingsCard.jsx`
- `/opt/FXTAO/IA_mem.md`

**Validacao e publicacao**

- Validacao frontend em container temporario isolado com `node:20-alpine` executando `vite build`.
- Build Docker real concluido com sucesso para `api` e `web`.
- Backups das imagens anteriores criados como:
  - `fxtao-api:backup-20260323-1644-integrations`
  - `fxtao-web:backup-20260323-1644-integrations`
- Publicacao executada somente para `api` e `web` com:
  - `docker compose -f /opt/FXTAO/deploy/docker-compose.vps.yml up -d --no-deps api web`
- Verificacoes apos deploy:
  - `http://127.0.0.1:3000/health` respondeu `{\"status\":\"ok\"}`;
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`;
  - `https://allora.tao.fx4.com.br/api/v1/integrations/works` respondeu `401` sem token, confirmando autenticacao ativa;
  - `http://127.0.0.1:3000/api/v1/integrations/works` respondeu `426`, confirmando exigencia de HTTPS;
  - bundle novo publicado detectado no `index.html` com asset `index-mCHQDcd1.js`;
  - strings da nova tela confirmadas no bundle publicado (`Integracoes do Ecossistema`, `integration-admin`, `api/v1/integrations`).

**Observacoes**

- Durante a validacao temporaria do backend fora do Dockerfile oficial, o `npm ci` acusou dessincronizacao entre `backend/package.json` e `backend/package-lock.json`, e a validacao com Prisma exigiu o passo de build Docker real para reproduzir corretamente o ambiente `linux-musl`; isso nao impediu a validacao final nem a publicacao.

### 2026-03-23 16:56 America/Sao_Paulo

**Prompt**

Criar um prompt para ser usado em outro contexto de IA, por exemplo no RDO, para implementar o consumo das APIs de integracao do FXTAO, e neste contexto ja gravar o token que sera utilizado.

**Retorno resumido**

- Backups criados antes da rodada em:
  - `/opt/FXTAO/backups/20260323-1755-rdo-integration-prompt`
- Backup dos metadados de integracao antes da mudanca salvo em:
  - `/opt/FXTAO/backups/20260323-1755-rdo-integration-prompt/system_configs_integration_before.csv`
- O cliente de integracao `RDO` foi ativado no FXTAO e recebeu token proprio via servico interno da aplicacao.
- O prompt para uso em outro contexto de IA foi criado com:
  - contexto de negocio;
  - endpoints a consumir;
  - formato esperado das respostas;
  - requisitos tecnicos;
  - requisitos de seguranca;
  - base URL de producao;
  - token real do cliente `RDO`.
- O prompt foi salvo em:
  - `/opt/FXTAO/backups/20260323-1755-rdo-integration-prompt/PROMPT_RDO_COM_CONSUMO_FXTAO.md`

**Observacoes**

- Por seguranca, o token completo nao foi replicado nesta memoria operacional.
- Estado confirmado apos a geracao:
  - cliente `RDO` ativo;
  - `hasToken = true`;
  - preview registrado como `fxi_rdo_4189...e81a`;
  - `FX31` e `Generico` permaneceram inativos e sem token.

### 2026-03-23 17:31 America/Sao_Paulo

**Prompt**

A renderizacao de impressao do relatorio estava ruim e o layout/diagramacao do proprio relatorio nao agradou. Solicitação para redesenhar em uma linguagem mais proxima de relatorio formal, inspirada nas referencias enviadas, com impressao muito melhor.

**Retorno resumido**

- Backups criados antes das edicoes em:
  - `/opt/FXTAO/backups/20260323-1815-report-redesign-v2`
- O `Visualizar Relatorio` foi redesenhado para um formato mais editorial e tecnico, com:
  - cabecalho institucional limpo;
  - titulo de relatorio executivo sem hero escuro;
  - linha de destaque e metadados principais;
  - trilha de fases mais discreta;
  - secoes numeradas (`1` a `6`) em estilo de documento;
  - campos com diagramacao mais proxima de relatorio corporativo;
  - menos linguagem de dashboard e mais linguagem de documento.
- A impressao foi reestruturada para isolar somente o relatorio, escondendo o restante da interface do app durante o print.
- Regras de print melhoradas:
  - `@page` com margens mais adequadas;
  - ocultacao do chrome da aplicacao via `visibility`;
  - reducao de sombras, bordas exageradas e gradientes na impressao;
  - melhor controle de quebra de pagina em secoes, blocos e tabelas;
  - tabelas com cabecalho repetivel e espaciamento mais compacto para papel.

**Arquivos alterados**

- `/opt/FXTAO/src/components/reports/ReportViewer.jsx`
- `/opt/FXTAO/src/index.css`
- `/opt/FXTAO/IA_mem.md`

**Validacao e publicacao**

- Build do frontend validado em container temporario isolado com `node:20-alpine`.
- Backup da imagem web anterior criado como:
  - `fxtao-web:backup-20260323-1730-report-layout-v2`
- Publicacao executada somente para o frontend com:
  - `docker compose -f /opt/FXTAO/deploy/docker-compose.vps.yml up -d --build --no-deps web`
- Verificacoes apos deploy:
  - `http://127.0.0.1:3000/health` respondeu `{\"status\":\"ok\"}`;
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`;
  - novo bundle publicado detectado no `index.html` com asset `index-uZ6PavGR.js`;
  - strings do novo layout confirmadas no bundle publicado (`Relatório Executivo de Obra`, `Documento consolidado da TAO`, `Estrutura de Aprovação`).

### 2026-03-25 17:02 America/Sao_Paulo

**Prompt**

Conectar esta instancia ao repositorio `https://github.com/FX4Tec/FXTAO.git`, preservando o historico ja existente no GitHub, mas fazendo desta VPS a base principal por estar mais atualizada. Antes disso, gerar a credencial para ser adicionada como `deploy key` no repositorio.

**Retorno resumido**

- Foi confirmado que `/opt/FXTAO` ainda nao e um repositorio Git local.
- A consulta ao remoto via HTTPS exigiu autenticacao imediata, indicando que a conexao ao repositorio dependera da credencial correta.
- Foi identificado que o diretorio local contem artefatos sensiveis e operacionais que nao devem ir para o GitHub sem saneamento adicional, incluindo:
  - `backend/.env`
  - `deploy/.env`
  - `backups/`
  - `backend/uploads/`
  - dumps de banco e logs
- Foi gerada a credencial correta para `deploy key` do GitHub:
  - chave `SSH ED25519`, e nao token HTTP.
- Arquivos gerados no servidor:
  - chave privada: `/root/.ssh/fxtao_github_deploy`
  - chave publica: `/root/.ssh/fxtao_github_deploy.pub`
- Fingerprint da chave publica:
  - `SHA256:bR0ymUZVvBmyxzob1JI2bYxeYBGxy1l5OS7pafgvcnc`
- Cópia da chave publica salva para consulta em:
  - `/opt/FXTAO/backups/20260325-1702-git-connect/fxtao_github_deploy.pub`

**Observacoes**

- Antes de conectar e publicar o codigo para o GitHub, sera necessario ajustar o que entra no versionamento para evitar vazamento de segredos e artefatos de producao.
- O passo seguinte recomendado e:
  - adicionar a chave publica no repositorio GitHub como `Deploy key` com permissao de escrita;
  - depois conectar o repositório local, buscar o historico remoto e fazer um merge preservando a arvore atual da VPS como base.
