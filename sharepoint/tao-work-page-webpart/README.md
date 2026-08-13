# FX TAO - Página da Obra

Web Part SPFx/React para apresentar dados da TAO em páginas de obra do SharePoint. A autenticação usa Microsoft Entra ID com token delegado do usuário conectado no SharePoint, sem segredo salvo na Web Part.

## Fluxo completo de implantação

A ordem é importante. Primeiro registre a API `FX TAO API` no Microsoft Entra, depois configure o cliente no FXTAO SaaS, depois instale o pacote no catálogo do SharePoint e aprove a permissão da API.

## 1. Registrar a API `FX TAO API` no Microsoft Entra

1. Acesse `https://entra.microsoft.com` com uma conta administradora do tenant Microsoft 365 do cliente.
2. Abra **Identity > Applications > App registrations**.
3. Clique em **New registration**.
4. Em **Name**, informe exatamente `FX TAO API`.
5. Em **Supported account types**, selecione **Accounts in this organizational directory only**.
6. Não informe Redirect URI para este registro de API da Web Part.
7. Clique em **Register**.
8. Na tela **Overview**, copie:
   - **Application (client) ID**: será usado como `Client ID da API FX TAO`.
   - **Directory (tenant) ID**: será usado como `Tenant ID Microsoft da webpart`.
9. Abra **Expose an API**.
10. Clique em **Set** ao lado de **Application ID URI**.
11. Use o valor sugerido `api://<Application (client) ID>` ou defina outro URI válido do tenant. Guarde exatamente esse valor.
12. Ainda em **Expose an API**, clique em **Add a scope**.
13. Preencha o escopo:
   - **Scope name**: `access_as_user`
   - **Who can consent**: `Admins and users` ou `Admins only`, conforme política do cliente.
   - **Admin consent display name**: `Acessar FX TAO como usuário conectado`
   - **Admin consent description**: `Permite que a Web Part do SharePoint acesse dados autorizados do FX TAO em nome do usuário conectado.`
   - **User consent display name**: `Acessar FX TAO`
   - **User consent description**: `Permite acessar dados autorizados do FX TAO.`
   - **State**: `Enabled`
14. Clique em **Add scope**.
15. Abra **Manifest**.
16. Confirme ou ajuste `accessTokenAcceptedVersion` para `2`.
17. Salve o manifesto.
18. Não crie Client Secret para esta Web Part. O fluxo SPFx usa token delegado via `AadHttpClient`.

## 2. Configurar o cliente no FXTAO SaaS

1. Acesse `https://fxtao.fx4.com.br` com superadmin FX4.
2. Entre em **Painel SaaS FX4**.
3. Abra o cliente correto em **Abrir configurações do cliente**.
4. Vá até **Webpart SharePoint FXTAO**.
5. Habilite **Integração da webpart habilitada**.
6. Preencha:
   - **Tenant ID Microsoft da webpart**: Directory (tenant) ID copiado do Entra.
   - **Client ID da API FX TAO**: Application (client) ID do registro `FX TAO API`.
   - **Application ID URI / URI do recurso Entra ID**: valor configurado em **Expose an API**. Ex.: `api://<client-id>`.
   - **Escopo obrigatório**: `access_as_user`.
   - **Origens SharePoint permitidas**: origem raiz do SharePoint, sem caminho. Ex.: `https://cincieng.sharepoint.com`.
   - **Client IDs SPFx permitidos**: deixe vazio, salvo se houver uma política explícita de restringir o cliente SPFx.
7. Salve em **Salvar Webpart SharePoint**.
8. Confirme que a origem SharePoint não contém caminho como `/sites/...`; deve ser apenas protocolo e domínio.

## 3. Criar ou validar o App Catalog do SharePoint

1. Acesse o **SharePoint Admin Center** do tenant.
2. Abra **More features > Apps > App Catalog** ou **Active sites > App catalog**, conforme a experiência exibida no tenant.
3. Se o App Catalog não existir, clique para criar um novo catálogo.
4. Aguarde o provisionamento do site de catálogo. Pode levar alguns minutos.
5. Abra a biblioteca **Apps for SharePoint**.
6. Confirme que você tem permissão para fazer upload de pacotes `.sppkg`.

## 4. Instalar a Web Part no catálogo

1. Baixe o pacote `fxtao-work-page.sppkg` pelo FXTAO SaaS em **Configurações > Plugins, Webparts e Manuais de Implantação**.
2. No App Catalog, faça upload do arquivo `fxtao-work-page.sppkg` em **Apps for SharePoint**.
3. Quando o SharePoint perguntar, habilite a implantação para os sites necessários.
4. Se o pacote já existia antes do registro correto da API, substitua/reenvie o `.sppkg` para gerar uma nova solicitação de permissão.
5. O pacote contém a solicitação `FX TAO API / access_as_user` em `webApiPermissionRequests`.

## 5. Aprovar a permissão da API no SharePoint

1. No **SharePoint Admin Center**, abra **Advanced > API access**.
2. Expanda **Pending requests**.
3. Localize a solicitação:
   - **API name**: `FX TAO API`
   - **Permission**: `access_as_user`
   - **Package**: `fxtao-work-page-client-side-solution`
4. Se houver solicitação antiga ou inválida, rejeite-a primeiro.
5. Selecione a solicitação correta e clique em **Approve**.
6. Após aprovar, ela deve aparecer em **Approved requests**.
7. Se não aparecer solicitação pendente:
   - Confirme que o App Registration chama `FX TAO API`.
   - Confirme que o escopo `access_as_user` existe e está habilitado.
   - Confirme que o `.sppkg` foi reenviado após corrigir o registro da API.
   - Aguarde alguns minutos e atualize a página **API access**.

## 6. Usar a Web Part na página da obra

1. Abra o site SharePoint onde está a página da obra.
2. Edite a página.
3. Adicione a Web Part **FX TAO - Página da Obra**.
4. Abra o painel de propriedades da Web Part.
5. Preencha os campos da seção **Obra e API**.
6. Publique a página.
7. Teste com um usuário Microsoft 365 autorizado no FXTAO e no tenant correto.

## 7. Propriedades da Web Part

| Grupo | Propriedade | Campo interno | Obrigatório | Valor recomendado |
| --- | --- | --- | --- | --- |
| Obra e API | Título | `title` | Não | `Dados da TAO` |
| Obra e API | Código ERP, código da obra ou ID da TAO | `taoIdentifier` | Sim | ID interno, final curto do ID, código ERP ou código da obra. Ex.: `271d` |
| Obra e API | URL base da API FX TAO | `apiBaseUrl` | Sim | `https://fxtao.fx4.com.br` |
| Obra e API | URI do recurso Entra ID | `apiResourceUri` | Sim | Mesmo Application ID URI configurado no Entra e no FXTAO SaaS. Ex.: `api://<client-id>` |
| Obra e API | URL do portal FX TAO | `taoPortalBaseUrl` | Não | `https://fxtao.fx4.com.br` ou URL direta do cliente |
| Obra e API | Exibir status da TAO | `showStatus` | Não | Ative se quiser exibir o selo de status |
| Obra e API | Exibir centros de custo | `showCostCenters` | Não | Ative se houver centros publicados |
| Obra e API | Atualização automática (minutos) | `refreshMinutes` | Não | `15`; use `0` para desativar |
| Campos | Campos visíveis (CSV) | `visibleFieldsCsv` | Não | Vazio usa a ordem padrão; ou informe chaves separadas por vírgula |
| Campos | Campos ocultos (CSV) | `hiddenFieldsCsv` | Não | Chaves separadas por vírgula |
| Campos | JSON de campos | `fieldsJson` | Não | JSON para reordenar, renomear ou desabilitar campos |
| Visual | Cor do cabeçalho | `headerBackgroundColor` | Não | `#263547` |
| Visual | Cor do texto do cabeçalho | `headerTextColor` | Não | `#ffffff` |
| Visual | Cor de destaque do cabeçalho | `headerAccentColor` | Não | `#f5b94d` |
| Visual | Cor dos valores dos dados | `dataTextColor` | Não | `#20242a` |
| Visual | Cor dos rótulos dos dados | `dataLabelColor` | Não | `#69727d` |
| Visual | Cor de fundo do quadro | `panelBackgroundColor` | Não | `#ffffff` |
| Visual | Usar imagem no fundo do quadro | `panelBackgroundUseImage` | Não | Ative apenas se houver imagem HTTPS permitida |
| Visual | URL da imagem de fundo | `panelBackgroundImageUrl` | Não | URL HTTPS da imagem |
| Visual | Transparência do fundo (%) | `panelBackgroundOpacity` | Não | `85` |

## 8. Campos disponíveis para CSV/JSON

Use estas chaves em `visibleFieldsCsv`, `hiddenFieldsCsv` ou `fieldsJson`.

| Chave | Rótulo padrão | Origem do dado |
| --- | --- | --- |
| `clientName` | Cliente | Cliente/contratante da TAO |
| `architecture` | Arquitetura | Dados técnicos da obra |
| `areaM2` | Dimensões | Área da obra em m² |
| `projectType` | Tipo de obra | Tipo de obra/empreendimento |
| `street` | Local | Endereço da obra |
| `neighborhood` | Bairro | Bairro da obra |
| `zipCode` | CEP | CEP da obra |
| `cityState` | Cidade | Município e UF |
| `complement` | Complemento | Complemento do endereço |
| `companyName` | Empresa | Empresa responsável |
| `companyCode` | Código empresa | Código da empresa no cadastro |
| `clientCode` | Código cliente | Código do cliente no cadastro |
| `clientCostCenters` | CC cliente | Centros de custo do cliente |
| `companyCostCenters` | CC empresa | Centros de custo da empresa |
| `segment` | Segmento | Segmento da TAO |
| `contractType` | Tipo de contrato | Regime/tipo de contrato |
| `startDate` | Data de início | Data inicial da obra |
| `endDate` | Data de entrega | Data final/entrega |

Exemplo de `visibleFieldsCsv`:

```text
clientName,areaM2,segment,startDate,endDate
```

Exemplo de `hiddenFieldsCsv`:

```text
architecture,clientCode,companyCode
```

Exemplo de `fieldsJson`:

```json
[
  { "key": "clientName", "label": "Cliente", "enabled": true },
  { "key": "areaM2", "label": "Área privativa", "enabled": true },
  { "key": "startDate", "label": "Início previsto", "enabled": true },
  { "key": "companyCode", "enabled": false }
]
```

## 9. Checklist de validação

1. O App Registration `FX TAO API` existe no tenant correto.
2. O escopo `access_as_user` está habilitado em **Expose an API**.
3. `accessTokenAcceptedVersion` está como `2` no manifesto.
4. O FXTAO SaaS tem Tenant ID, Client ID, Application ID URI e origem SharePoint corretos.
5. A origem SharePoint permitida está no formato `https://empresa.sharepoint.com`, sem `/sites/...`.
6. O pacote `.sppkg` foi enviado ao App Catalog após o registro da API estar correto.
7. A permissão `FX TAO API / access_as_user` foi aprovada em **SharePoint Admin Center > Advanced > API access**.
8. Na Web Part, `URL base da API FX TAO` está como `https://fxtao.fx4.com.br`.
9. Na Web Part, `URI do recurso Entra ID` está idêntico ao Application ID URI do Entra e do FXTAO.
10. O identificador da obra existe no cliente SaaS selecionado.

## 10. Troubleshooting

- **Failed to fetch**: confira HTTPS válido, CORS com a origem SharePoint permitida, Application ID URI idêntico e permissão `FX TAO API / access_as_user` aprovada.
- **Solicitação de API inválida**: rejeite a solicitação, corrija o App Registration, reenvie o `.sppkg` e aprove a nova solicitação.
- **Sem solicitação pendente em API access**: reenvie o `.sppkg` depois de criar o escopo `access_as_user`; confira se o nome do recurso no pacote é `FX TAO API`.
- **Token recusado**: confira Tenant ID, audience/Application ID URI, escopo `access_as_user` e Client IDs permitidos, se usados.
- **Obra não encontrada**: use ID da TAO, código ERP, código da obra ou final curto do ID pertencente ao cliente atual.

## Build

Requer Node.js `>=22.14.0 <23.0.0`.

```bash
npm install
npm run build
```

O pacote é gerado em `sharepoint/solution/fxtao-work-page.sppkg` dentro deste projeto.

## Desenvolvimento local

Configure a página de teste em `config/serve.json` e execute:

```bash
npm start
```

Chamadas com `AadHttpClient` exigem contexto autenticado do SharePoint; não use segredo ou token fixo para contornar a autenticação.

## 11. Modo flexível / Layout Seiji

A partir da versão `1.1.0`, a mesma Web Part mantém o layout clássico e adiciona modos flexíveis sem quebrar páginas existentes.

### Propriedades novas

| Propriedade | Campo interno | Uso |
| --- | --- | --- |
| Modo de layout | `layoutMode` | `classic`, `overlay` ou `minimal` |
| Exibir cabeçalho interno | `showHeader` | Desative para layouts sobre imagem/fundo da página |
| Exibir link para abrir o FX TAO | `showPortalLink` | Desative para páginas públicas/institucionais |
| Remover borda, fundo e sombra externos | `transparentShell` | Remove o cartão externo da webpart |
| Alinhamento dos campos | `fieldAlignment` | `left`, `center` ou `right` |
| Largura dos rótulos | `fieldLabelWidth` | Usado no modo clássico/grid |
| Tamanho da fonte | `fieldFontSize` | Fonte dos campos em px |
| Altura da linha | `fieldLineHeight` | Espaçamento vertical relativo |
| Espaço entre linhas | `fieldGap` | Espaçamento horizontal/linhas em px |
| Padding interno | `contentPadding` | Espaçamento interno do bloco |
| Largura máxima | `maxWidth` | `0` usa a largura total; outro valor limita em px |
| CSS customizado | `customCss` | Ajustes finos por CSS quando necessário |

### Setup para reproduzir o layout Seiji

Use estas propriedades:

| Campo | Valor |
| --- | --- |
| Modo de layout | `Overlay transparente / Seiji` |
| Exibir cabeçalho interno | `Não` |
| Exibir link para abrir o FX TAO | `Não` |
| Remover borda, fundo e sombra externos | `Sim` |
| Alinhamento dos campos | `Centralizado` |
| Tamanho da fonte dos campos | `31` |
| Altura da linha dos campos | `1.32` |
| Espaço entre linhas | `0` |
| Padding interno | `0` ou `8` |
| Largura máxima | `0` ou a largura desejada |
| Cor dos valores dos dados | `#ffffff` |
| Cor dos rótulos dos dados | `#ffffff` |
| Cor de fundo do quadro | `#000000` |
| Transparência do fundo | `0` para transparente quando a página já possui imagem/fundo |

Campos visíveis CSV:

```text
erpNumber,companyCostCenters,companyName,architecture,street,areaM2,contractMonths,startDate,endDate
```

JSON de campos:

```json
[
  { "key": "erpNumber", "label": "N° ERP", "enabled": true },
  { "key": "companyCostCenters", "label": "C.C. Associados", "enabled": true },
  { "key": "companyName", "label": "Gerenciadora", "fallback": "-", "enabled": true },
  { "key": "architecture", "label": "Arquitetura", "enabled": true },
  { "key": "street", "label": "Localização", "enabled": true },
  { "key": "areaM2", "label": "Área Construída", "enabled": true },
  { "key": "contractMonths", "label": "Prazo Contratual", "type": "dateDiffMonths", "from": "startDate", "to": "endDate", "suffix": "meses", "enabled": true },
  { "key": "startDate", "label": "Data de Início", "enabled": true },
  { "key": "endDate", "label": "Data de Finalização", "enabled": true }
]
```

### Campos manuais e calculados

O `fieldsJson` aceita campos adicionais sem alterar o modelo da TAO.

Campo manual:

```json
{ "label": "Gerenciadora", "type": "manual", "value": "-", "enabled": true }
```

Campo calculado por datas:

```json
{ "key": "contractMonths", "label": "Prazo Contratual", "type": "dateDiffMonths", "from": "startDate", "to": "endDate", "suffix": "meses", "enabled": true }
```

Campo por template:

```json
{ "label": "Endereço", "type": "template", "template": "{street} - {cityState}", "fallback": "-", "enabled": true }
```

### Versionamento de downloads

O FXTAO SaaS passa a disponibilizar:

- `fxtao-work-page.sppkg`: versão atual recomendada.
- `fxtao-work-page-1.1.0.sppkg`: versão flexível com modo overlay.
- `fxtao-work-page-1.0.0.sppkg`: versão clássica compatível com o modelo atual.

A versão `1.1.0` preserva a mesma solution ID e Web Part ID, portanto atualiza o pacote sem exigir recriar as Web Parts existentes. Páginas antigas continuam no layout clássico porque os novos campos têm defaults compatíveis.
