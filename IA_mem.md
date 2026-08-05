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

### 2026-03-25 17:10 America/Sao_Paulo

**Prompt**

Com a `deploy key` ja instalada no GitHub, conectar esta instancia ao repositorio `git@github.com:FX4Tec/FXTAO.git`, preservar o historico existente do repositório e publicar o estado atual desta VPS Allora como a nova referencia da `main`, sem mexer nos arquivos funcionais da aplicacao em producao.

**Retorno resumido**

- O diretorio `/opt/FXTAO` foi inicializado como repositorio Git local.
- O remoto `origin` foi configurado para:
  - `git@github.com:FX4Tec/FXTAO.git`
- A conexao SSH com a `deploy key` funcionou e a branch remota `main` foi buscada com sucesso.
- Historico remoto preservado:
  - `0561ed5` `Finalize production deployment setup and apply Deep Link fixes`
  - `020c528` `Add production deployment files`
  - `8b91d1f` `Initial commit`
- Para proteger producao e segredos sem alterar os arquivos do projeto, foram aplicadas exclusoes apenas em `.git/info/exclude`, cobrindo:
  - `backups/`
  - `backend/.env`
  - `deploy/.env`
  - `backend/node_modules/`
  - `backend/uploads/`
- O estado atual desta VPS foi commitado por cima da `origin/main`, preservando o historico remoto, com o commit:
  - `ef628bf` `chore: sync Allora VPS production state`
- O push para o GitHub foi concluido com sucesso e a `main` remota passou a apontar para este commit.

**Validacao final**

- `git status --short --branch` retornou:
  - `## main...origin/main`
- `git log --oneline --decorate -3` retornou:
  - `ef628bf (HEAD -> main, origin/main) chore: sync Allora VPS production state`
  - `0561ed5 Finalize production deployment setup and apply Deep Link fixes`
  - `020c528 Add production deployment files`

**Observacoes**

- Nenhum arquivo funcional da aplicacao em producao foi alterado para realizar a conexao com o GitHub; a operacao concentrou-se em metadados Git e exclusoes locais de versionamento.
- Backup do arquivo de memoria criado antes desta atualizacao em:
  - `/opt/FXTAO/backups/20260325-1710-git-push/IA_mem.md.bak`

### 2026-03-25 17:29 America/Sao_Paulo

**Prompt**

Criar um prompt para orientar outra instancia do Codex IA a realizar automaticamente o deploy do FX TAO da empresa CINCI em uma nova VPS Ubuntu 24.04, usando o repositorio Git, Docker, Nginx e HTTPS, considerando que a VPS hospedara tambem `FX31` e `FXRDO`.

**Retorno resumido**

- Foi analisada a estrutura real de deploy atualmente usada no FX TAO para embasar o prompt:
  - `deploy/docker-compose.vps.yml`
  - `deploy/backend.Dockerfile`
  - `deploy/frontend.prod.Dockerfile`
  - `/etc/nginx/sites-available/allora.tao.fx4.com.br`
- Foram mapeadas as variaveis de ambiente essenciais do app:
  - `COMPOSE_PROJECT_NAME`
  - `DATABASE_URL`
  - `FRONTEND_URL`
  - `JWT_SECRET`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_REDIRECT_URI`
  - `MICROSOFT_TENANT_ID`
  - `PORT`
  - `POSTGRES_DB`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_USER`
  - `VITE_API_URL`
- Tambem foi confirmado que:
  - o endpoint interno de health da API e `/health`;
  - o proxy publico atual usa `location /`, `location /api/` e `location /uploads/`;
  - o repositorio nao apresenta uma pasta versionada de `migrations` do Prisma, exigindo cautela no bootstrap do banco em uma VPS nova.
- Foi criado um prompt operacional completo, orientado a automacao segura do deploy, contemplando:
  - diagnostico inicial da VPS;
  - instalacao idempotente de dependencias;
  - clone do Git com credencial ja existente;
  - criacao de `.env`;
  - estrategia de portas para coexistir com `FX31` e `FXRDO`;
  - bootstrap seguro do banco;
  - subida via Docker Compose;
  - configuracao de Nginx e Certbot;
  - validacoes finais e entrega resumida.
- O prompt foi salvo em:
  - `/opt/FXTAO/backups/20260325-172918-cinci-deploy-prompt/PROMPT_DEPLOY_AUTOMATICO_FXTAO_CINCI.md`

**Observacoes**

- Nenhum arquivo de codigo da aplicacao foi alterado nesta etapa.
- Backup do arquivo de memoria criado antes desta atualizacao em:
  - `/opt/FXTAO/backups/20260325-172918-cinci-deploy-prompt/IA_mem.md.bak`

### 2026-03-26 16:48 America/Sao_Paulo

**Prompt**

Verificar se o servico do FX TAO em producao esta ativo e identificar por que o usuario recebe `Request failed with status code 500` ao cadastrar ou avancar no cadastro de uma nova TAO, com cuidado total por se tratar de base de producao.

**Retorno resumido**

- O servico foi confirmado como ativo:
  - container `fxtao_web`: `Up`
  - container `fxtao`: `Up`
  - container `fxtao_db`: `Up (healthy)`
  - `http://127.0.0.1:3000/health` respondeu `HTTP 200` com `{"status":"ok"}`
  - `https://allora.tao.fx4.com.br/` respondeu `HTTP 200`
- O erro observado nao e indisponibilidade do servico; e uma falha de validacao no backend durante o salvamento da TAO.
- Logs do backend identificaram repetidamente o mesmo erro:
  - `Failed to update TAO: PrismaClientValidationError`
  - `Invalid value for argument date_start: premature end of input. Expected ISO-8601 DateTime.`
- A causa raiz esta no fluxo de datas da etapa de contrato:
  - o frontend envia os campos `date_signature`, `date_mobilization`, `date_start` e `date_end` como string simples de input HTML, por exemplo `2024-09-25`
  - isso ocorre em `/opt/FXTAO/src/components/tao/steps/TaoStep1.jsx`
  - o backend repassa esses valores diretamente ao Prisma sem conversao em `/opt/FXTAO/backend/src/controllers/taoController.js`
  - no schema Prisma, esses campos sao `DateTime? @db.Date`, em `/opt/FXTAO/backend/prisma/schema.prisma`
- O frontend mostra a mensagem generica `Request failed with status code 500` porque o `onError` da mutacao usa apenas `err.message`, sem exibir o `details` retornado pela API.

**Observacoes**

- O problema parece ocorrer especialmente ao atualizar uma TAO existente ao avancar para a etapa com datas, nao por queda geral do sistema.
- Nenhuma alteracao foi aplicada no codigo nem nos dados nesta rodada; a atuacao ficou restrita a verificacao, leitura de logs e analise do codigo.
- Backup do arquivo de memoria criado antes desta atualizacao em:
  - `/opt/FXTAO/backups/20260326-164833-tao-500-analysis/IA_mem.md.bak`

### 2026-03-26 16:55 America/Sao_Paulo

**Prompt**

Resolver o erro de producao ao salvar ou avancar uma TAO quando ha datas preenchidas, com backup dos arquivos tocados e o minimo risco para a base.

**Retorno resumido**

- Foi criado backup previo dos arquivos alterados em:
  - `/opt/FXTAO/backups/20260326-165126-tao-date-fix/taoController.js.bak`
  - `/opt/FXTAO/backups/20260326-165126-tao-date-fix/TaoForm.jsx.bak`
- Correcao aplicada no backend em `/opt/FXTAO/backend/src/controllers/taoController.js`:
  - normalizacao dos campos `date_signature`, `date_mobilization`, `date_start` e `date_end`;
  - conversao automatica de strings `YYYY-MM-DD` para `Date` valida antes do Prisma;
  - tratamento de data invalida com resposta `400` em vez de falha generica interna.
- Correcao aplicada no frontend em `/opt/FXTAO/src/pages/TaoForm.jsx`:
  - normalizacao das datas recebidas da API para o formato aceito pelo `input type="date"`;
  - uso da mensagem detalhada da API no toast de erro, quando existir.
- Publicacao realizada apenas dos servicos afetados:
  - `docker compose -f /opt/FXTAO/deploy/docker-compose.vps.yml up -d --build --no-deps api web`
- Validacoes apos deploy:
  - `fxtao`, `fxtao_web` e `fxtao_db` ativos;
  - `http://127.0.0.1:3000/health` respondeu `200`;
  - `https://allora.tao.fx4.com.br/` respondeu `200`;
  - `docker exec fxtao node -e "require('/app/src/controllers/taoController'); console.log('taoController loaded')"` executou com sucesso;
  - logs recentes da API sem erro de bootstrap.

**Observacoes**

- Nenhum dado de producao foi alterado manualmente para validar a correcao; a verificacao foi feita por build, subida dos containers, healthcheck e carga do controller em runtime.
- Backup do arquivo de memoria criado antes desta atualizacao em:
  - `/opt/FXTAO/backups/20260326-165126-tao-date-fix/IA_mem.md.bak`

### 2026-03-27 15:20 America/Sao_Paulo

**Prompt**

Criar no menu Configuracoes um quadro chamado `Importação/exportação TAO`, com:
- toggle para selecao de formato `xlsx` ou `csv`;
- botao para baixar a mascara de importacao;
- botao para exportar os dados atuais das TAOs;
- botao para importar arquivo;
contemplando os dados principais da TAO e os colaboradores vinculados a cada obra.

**Retorno resumido**

- Foi criado backup previo dos arquivos existentes alterados em:
  - `/opt/FXTAO/backups/20260327-151059-tao-transfer/app.js.bak`
  - `/opt/FXTAO/backups/20260327-151059-tao-transfer/Settings.jsx.bak`
  - `/opt/FXTAO/backups/20260327-151059-tao-transfer/backend.package.json.bak`
  - `/opt/FXTAO/backups/20260327-151059-tao-transfer/backend.package-lock.json.bak`
- Foi adicionada a infraestrutura backend dedicada para transferencia de TAOs:
  - rota `/api/v1/tao-transfer`
  - controller `/opt/FXTAO/backend/src/controllers/taoTransferController.js`
  - route file `/opt/FXTAO/backend/src/routes/taoTransferRoutes.js`
- Endpoints implementados:
  - `GET /api/v1/tao-transfer/template?format=xlsx|csv`
  - `GET /api/v1/tao-transfer/export?format=xlsx|csv`
  - `POST /api/v1/tao-transfer/import`
- A importacao/exportacao contempla:
  - campos principais da entidade `Tao`;
  - colaboradores da obra via colunas `team_member_name`, `team_member_role`, `team_member_email` e `team_member_type`;
  - uma linha por colaborador, repetindo os dados da TAO.
- A importacao foi implementada de forma nao destrutiva:
  - cria ou atualiza TAOs;
  - cria ou atualiza colaboradores;
  - nao exclui automaticamente registros existentes omitidos no arquivo.
- A rota foi protegida por autenticacao e perfil elevado (`admin` ou `director`).
- Foi criada a interface em Configuracoes:
  - componente `/opt/FXTAO/src/components/settings/TaoTransferCard.jsx`
  - integracao em `/opt/FXTAO/src/pages/Settings.jsx`
- A dependencia `xlsx` foi adicionada apenas ao backend.
- Publicacao realizada apenas dos servicos afetados:
  - `docker compose -f /opt/FXTAO/deploy/docker-compose.vps.yml up -d --build --no-deps api web`

**Validacao**

- `http://127.0.0.1:3000/health` respondeu `200`
- `https://allora.tao.fx4.com.br/` respondeu `200`
- `GET /api/v1/tao-transfer/template?format=csv` respondeu `200` e gerou `fxtao-mascara-importacao.csv`
- `GET /api/v1/tao-transfer/export?format=csv` respondeu `200` e gerou `fxtao-export-2026-03-27.csv`
- `POST /api/v1/tao-transfer/import` sem arquivo respondeu `400` com `Nenhum arquivo foi enviado.`

**Observacoes**

- A validacao dos novos endpoints foi feita com token temporario de admin gerado localmente apenas para teste, sem exposicao do segredo e sem alterar dados da base.
- Backup do arquivo de memoria criado antes desta atualizacao em:
  - `/opt/FXTAO/backups/20260327-151059-tao-transfer/IA_mem.md.bak`

---

## 2026-03-27 15:49 BRT - Ajuste de labels da mascara de importacao TAO

**Solicitacao**

- Substituir os nomes tecnicos dos campos na mascara de importacao por labels amigaveis, equivalentes aos campos do formulario da aplicacao.
- Quando possivel, usar apenas o label; manter compatibilidade com importacoes antigas.
- Exibir uma ajuda grande em hover no proprio titulo do quadro `Importacao/exportacao TAO`, com linguagem para usuario leigo explicando como preencher o arquivo.

**Arquivos alterados**

- `/opt/FXTAO/backend/src/controllers/taoTransferController.js`
- `/opt/FXTAO/src/components/settings/TaoTransferCard.jsx`

**Backups**

- `/opt/FXTAO/backups/20260327-154137-tao-transfer-labels/TaoTransferCard.jsx.bak`
- `/opt/FXTAO/backups/20260327-154137-tao-transfer-labels/taoTransferController.js.bak`
- `/opt/FXTAO/backups/20260327-1549-tao-transfer-tooltip-refine/TaoTransferCard.jsx.bak`
- `/opt/FXTAO/backups/20260327-1549-tao-transfer-tooltip-refine/taoTransferController.js.bak`
- `/opt/FXTAO/backups/20260327-1549-tao-transfer-tooltip-refine/IA_mem.md.bak`

**Implementacao**

- A geracao da mascara e da exportacao passou a usar labels amigaveis no cabecalho, como:
  - `Obra`
  - `ERP Nº`
  - `Data Inicio Obra`
  - `Colaborador - Nome`
- O importador foi mantido retrocompativel:
  - aceita os nomes tecnicos antigos;
  - aceita os novos labels amigaveis;
  - aceita tambem o formato `Label (field_name)`.
- O hover de ajuda foi ampliado e passou a abrir ao passar o mouse sobre o proprio titulo do quadro, com orientacoes de preenchimento em linguagem simples.
- Os ultimos textos tecnicos visiveis no card foram ajustados para nomes amigaveis dos campos de colaborador.
- Mensagens de erro do backend foram refinadas para linguagem mais amigavel ao usuario.
- Foi feito um refinamento estrutural final no componente do titulo do card para manter o HTML do frontend consistente, seguido de nova publicacao apenas do servico `web`.

**Publicacao**

- Publicacao realizada apenas dos servicos afetados:
  - `docker compose -f /opt/FXTAO/deploy/docker-compose.vps.yml up -d --build --no-deps api web`

**Validacao**

- Containers apos publicacao:
  - `fxtao_web` ativo
  - `fxtao` ativo
  - `fxtao_db` ativo e saudavel
- `http://127.0.0.1:3000/health` respondeu `200`
- `https://allora.tao.fx4.com.br/` respondeu `200`
- `GET /api/v1/tao-transfer/template?format=csv` retornou cabecalho amigavel iniciando por:
  - `ID TAO,Obra,Segmento,Tipo de Projeto,Etapa da TAO,...`
- `GET /api/v1/tao-transfer/export?format=csv` tambem retornou cabecalho amigavel equivalente.

**Observacoes**

- Nenhum dado da base foi alterado durante a validacao.
- A validacao autenticada foi feita com token temporario gerado apenas localmente para teste.

---

## 2026-04-10 13:00 BRT - Planejamento de readequacao da TAO para fork Allora

**Solicitacao**

- Identificar os formularios atuais de preenchimento da TAO e suas fases.
- Localizar os materiais de aderencia da Allora.
- Gerar backup preventivo da base de dados antes de qualquer futura mudanca estrutural.
- Estruturar um plano de acao para readequar a TAO com base apenas no documento `TAO.docx` e na planilha `CHECK_LIST_INICIAL_DE_OBRA (1).xlsx`.
- Considerar campos marcados como `restrito` em uma aba separada, com controle de acesso por flag no usuario.
- Nao remover campos da base existente e reaproveitar campos correlatos sempre que possivel.

**Arquivos e artefatos analisados**

- `/opt/FXTAO/src/pages/TaoForm.jsx`
- `/opt/FXTAO/src/components/tao/TaoStepper.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStepStart.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStep1.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStep2.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStep3.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStep4.jsx`
- `/opt/FXTAO/src/components/tao/steps/TaoStep5.jsx`
- `/opt/FXTAO/backend/prisma/schema.prisma`
- `/opt/FXTAO/aderenciaAllora/TAO.docx`
- `/opt/FXTAO/aderenciaAllora/CHECK_LIST_INICIAL_DE_OBRA (1).xlsx`

**Mapeamento atual da TAO**

- Estrutura atual do formulario:
  - `start`: dados iniciais
  - `1`: contrato
  - `2`: financeiro
  - `3`: aditivos
  - `4`: compliance
  - `5`: cadastrado / fechamento
- Componentes atuais:
  - `TaoStepStart`: obra, ERP, area, faturamento, endereco da obra, gerenciadora, dados bancarios
  - `TaoStep1`: regime de contratacao, descricao, datas, impostos, OME, valores do contrato
  - `TaoStep2`: parcelas, condicoes de pagamento, equipe da empresa
  - `TaoStep3`: aditivos
  - `TaoStep4`: escopo, projetos, seguros, licencas, obrigacoes, multas e medicoes
  - `TaoStep5`: SharePoint, observacoes, contatos e anexos

**Leitura dos materiais Allora**

- `TAO.docx` trouxe os blocos:
  - dados do Sienge / codigos de obra e centro de custo
  - dados do projeto e do cliente
  - dados da obra
  - faturamento
  - financeiro geral
  - financeiro restrito
  - outros itens contratuais e operacionais
- `CHECK_LIST_INICIAL_DE_OBRA (1).xlsx` trouxe um modelo operacional com:
  - identificacao da obra, cliente e responsaveis
  - local, datas, proposta e arquitetura
  - restricoes de entrega
  - modelo de faturamento
  - documentacoes de faturamento
  - modelo de contratacao e relatorios
  - bloco administrativo
  - checklist operacional de abertura de obra

**Backup preventivo**

- Backup da base gerado com sucesso em:
  - `/opt/FXTAO/backups/20260410-125728-db-backup-before-allora-tao-redesign/fxtao_db.dump`

**Observacoes**

- Nenhum arquivo de codigo foi alterado nesta etapa.
- Nenhum dado da base foi modificado; foi gerado apenas backup preventivo.

---

## 2026-04-10 13:12 BRT - Matriz de aderencia da TAO Allora

**Solicitacao**

- Prosseguir na linha de readequacao da TAO para o fork Allora.
- Consolidar uma matriz de aderencia entre:
  - estrutura atual da TAO;
  - `TAO.docx`;
  - `CHECK_LIST_INICIAL_DE_OBRA (1).xlsx`.

**Arquivo criado**

- `/opt/FXTAO/aderenciaAllora/MATRIZ_ADERENCIA_TAO_ALLORA.md`

**Conteudo consolidado**

- restricoes tecnicas atuais do fluxo da TAO;
- proposta de novas fases do formulario Allora;
- estrategia para retirar `Aditivos` do fluxo principal sem perder funcionalidade;
- proposta de aba restrita com controle por flag no usuario;
- matriz de mapeamento de campos:
  - reaproveitamento direto;
  - reaproveitamento com novo label;
  - uso de relacoes existentes (`TaoContact`, `TaoTeamMember`, `TaoAttachment`, `TaoInstallment`);
  - novos campos provaveis;
  - proposta de nova relacao para checklist inicial;
- lista de decisoes de negocio que ainda precisam ser fechadas antes da implementacao.

**Backups**

- `/opt/FXTAO/backups/20260410-1312-allora-matriz/IA_mem.md.bak`

**Observacoes**

- Nenhum codigo funcional da aplicacao foi alterado nesta etapa.
- O trabalho ficou apenas em planejamento estruturado e documentacao tecnica para orientar a implementacao do fork Allora.

---

## 2026-04-10 14:26 BRT - Revisao da estrutura do formulario Allora

**Solicitacao**

- Rever a proposta anterior de fases da TAO Allora.
- Preservar os labels da documentacao Allora.
- Considerar um formulario estruturalmente mais proximo da planilha `CHECK_LIST_INICIAL_DE_OBRA`.
- Registrar as decisoes de negocio ja fechadas.

**Arquivo atualizado**

- `/opt/FXTAO/aderenciaAllora/MATRIZ_ADERENCIA_TAO_ALLORA.md`

**Ajustes consolidados**

- A proposta deixou de tratar o fork Allora como wizard de 6 fases visiveis.
- O novo direcionamento passou a ser:
  - formulario unico;
  - blocos visuais verticais;
  - leitura semelhante a planilha;
  - labels na linguagem Allora;
  - bloco restrito separado por permissao.
- Estrutura proposta em blocos:
  - Dados iniciais da obra
  - Modelo de faturamento
  - Modelo de contratacao
  - Para Preco Fechado
  - Para Administracao
  - Financeiro restrito
  - Operacional registro de obra
  - Outros e documentos
- As decisoes de negocio fechadas foram refletidas na matriz:
  - `Codigo da obra` usando o core de `ERP Nº`
  - `Cliente` sem novo campo escalar independente
  - `Valor estimado total da obra` ligado a `value_total_contract`
  - `Equipe total prevista com imposto` ligada a `value_team_technical` com tooltip
  - `Documentacoes de faturamento direto` como checklist relacional
  - `Compliance` removido do fork Allora

**Backups**

- `/opt/FXTAO/backups/20260410-1415-allora-structure-rethink/MATRIZ_ADERENCIA_TAO_ALLORA.md.bak`
- `/opt/FXTAO/backups/20260410-1426-allora-ux-structure/IA_mem.md.bak`

**Observacoes**

- Nenhum codigo funcional foi alterado nesta etapa.
- O trabalho permaneceu em nivel de planejamento e definicao de estrutura para a futura implementacao do fork Allora.

---

## 2026-04-10 14:40 BRT - Tabela executiva final da TAO Allora

**Solicitacao**

- Prosseguir apos aprovacao da nova estrutura Allora.
- Gerar a tabela executiva final de implementacao, campo por campo, com:
  - label Allora
  - destino tecnico
  - reaproveitamento
  - obrigatoriedade
  - restricao
  - observacoes de implementacao

**Arquivo criado**

- `/opt/FXTAO/aderenciaAllora/TABELA_EXECUTIVA_IMPLEMENTACAO_TAO_ALLORA.md`

**Conteudo consolidado**

- regras aprovadas de negocio para o fork Allora;
- estrutura visual final em formulario unico por blocos;
- definicao de campos espelho para manter o layout sem duplicar persistencia;
- tabela executiva detalhada por bloco:
  - Dados iniciais da obra
  - Modelo de faturamento
  - Modelo de contratacao
  - Para Preco Fechado
  - Para Administracao
  - Financeiro restrito
  - Operacional registro de obra
  - Outros e documentos
- proposta de novos campos em `users`;
- proposta de novas relacoes:
  - checklist de faturamento direto
  - checklist operacional inicial
- ordem recomendada de implementacao.

**Backups**

- `/opt/FXTAO/backups/20260410-1415-allora-structure-rethink/MATRIZ_ADERENCIA_TAO_ALLORA.md.bak`
- `/opt/FXTAO/backups/20260410-1426-allora-ux-structure/IA_mem.md.bak`

**Observacoes**

- Nenhum codigo funcional da aplicacao foi alterado nesta etapa.
- O material produzido passa a ser a referencia executiva para iniciar a fase de implementacao do fork Allora.


## 2026-04-10 16:18 BRT - Rollout Allora TAO finalizado

Prompt do usuário:
Implementar integralmente o fork Allora da TAO até a solução finalizada e funcional, com cuidado de produção.

Resumo do que foi feito:
- Mantida a base existente e aplicada evolução aditiva no schema Prisma para suportar a estrutura Allora.
- Criada flag de usuário `can_view_restricted_tao_fields` para controle da aba de dados restritos.
- Reestruturada a tela principal da TAO em formulário único por blocos, alinhado ao checklist inicial de obra da Allora.
- Mantida persistência segura no backend com sanitização de campos e contatos restritos.
- Ajustada a gestão de usuários para administrar a nova flag de dados restritos.
- Refeita a importação/exportação TAO para o modelo Allora, em uma linha por TAO, com contatos, colaboradores fixos, documentação de faturamento e checklist inicial planificados.
- Atualizado o relatório executivo para refletir a estrutura Allora e removidos histórico de aprovação e logs do processo da apresentação.
- Criados/ajustados artefatos de apoio em `aderenciaAllora/` e constantes de configuração Allora.

Backups gerados nesta etapa:
- `/opt/FXTAO/backups/20260410-1605-allora-finalize/`
- `/opt/FXTAO/backups/20260410-1608-before-allora-rollout/fxtao_db_pre_allora_rollout.dump`
- imagens Docker de backup: `fxtao-api:backup-20260410-1610-allora` e `fxtao-web:backup-20260410-1610-allora`

Validações executadas:
- `docker build` do backend com sucesso.
- `docker build` do frontend com sucesso.
- `Prisma validate` com schema válido.
- `Prisma db push --skip-generate` aplicado com sucesso na base de produção.
- `docker compose up -d --build --no-deps api web` executado com sucesso.
- Healthcheck API `200` em `http://127.0.0.1:3000/health`.
- Domínio `https://allora.tao.fx4.com.br/` respondendo `200`.
- Template CSV autenticado da importação/exportação retornando a nova estrutura Allora.
- API `/api/v1/users` retornando o novo campo `can_view_restricted_tao_fields`.

Observações:
- Nenhum dado existente da TAO foi removido.
- A evolução foi aditiva e preservou a base atual.
- A nova estrutura de relatório e importação/exportação já está publicada.
