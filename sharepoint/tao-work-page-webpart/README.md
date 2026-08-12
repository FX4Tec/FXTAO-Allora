# FX TAO - Página da Obra

Web Part SPFx/React para apresentar, em cada página de obra do SharePoint, os dados da TAO selecionada. O identificador é configurado nas propriedades da própria Web Part, permitindo reutilizar o mesmo pacote em todas as páginas.

## Propriedades da Web Part

Configure estes campos no painel lateral da Web Part dentro da página SharePoint.

| Grupo | Propriedade | Campo interno | Obrigatório | Valor recomendado |
| --- | --- | --- | --- | --- |
| Obra e API | Título | `title` | Não | `Dados da TAO` |
| Obra e API | Código ERP, código da obra ou ID da TAO | `taoIdentifier` | Sim | ID interno da TAO, final curto do ID, código ERP ou código da obra. Ex.: `271d` |
| Obra e API | URL base da API FX TAO | `apiBaseUrl` | Sim | `https://fxtao.fx4.com.br` |
| Obra e API | URI do recurso Entra ID | `apiResourceUri` | Sim | Application ID URI da API criada no Entra. Ex.: `api://<application-client-id>` |
| Obra e API | URL do portal FX TAO | `taoPortalBaseUrl` | Não | `https://fxtao.fx4.com.br` ou a URL direta do cliente |
| Obra e API | Exibir status da TAO | `showStatus` | Não | Ative quando quiser mostrar o status no cabeçalho |
| Obra e API | Exibir centros de custo | `showCostCenters` | Não | Ative quando a obra tiver centros de custo publicados |
| Obra e API | Atualização automática (minutos) | `refreshMinutes` | Não | `15`; use `0` para desativar |
| Campos | Campos visíveis (CSV) | `visibleFieldsCsv` | Não | Vazio usa a ordem padrão; ou informe chaves separadas por vírgula |
| Campos | Campos ocultos (CSV) | `hiddenFieldsCsv` | Não | Chaves que devem ficar ocultas |
| Campos | JSON de campos | `fieldsJson` | Não | JSON para reordenar, renomear ou desabilitar campos |
| Visual | Cor do cabeçalho | `headerBackgroundColor` | Não | `#263547` |
| Visual | Cor do texto do cabeçalho | `headerTextColor` | Não | `#ffffff` |
| Visual | Cor de destaque do cabeçalho | `headerAccentColor` | Não | `#f5b94d` |
| Visual | Cor dos valores dos dados | `dataTextColor` | Não | `#20242a` |
| Visual | Cor dos rótulos dos dados | `dataLabelColor` | Não | `#69727d` |
| Visual | Cor de fundo do quadro | `panelBackgroundColor` | Não | `#ffffff` |
| Visual | Usar imagem no fundo do quadro | `panelBackgroundUseImage` | Não | Ative apenas se houver imagem pública/permitida |
| Visual | URL da imagem de fundo | `panelBackgroundImageUrl` | Não | URL HTTPS da imagem |
| Visual | Transparência do fundo (%) | `panelBackgroundOpacity` | Não | `85` |

## Campos disponíveis para CSV/JSON

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

## Registro de aplicativo Entra ID e configuração SaaS

1. No Microsoft Entra, crie ou selecione um App Registration chamado `FX TAO API`.
2. Em **Expose an API**, defina o **Application ID URI**. Guarde esse valor para usar no FXTAO SaaS e na Web Part.
3. Ainda em **Expose an API**, crie o escopo delegado `access_as_user`.
4. No manifesto do aplicativo, confirme `accessTokenAcceptedVersion` como `2`.
5. No FXTAO SaaS, entre no cliente correto pelo acesso assistido.
6. Abra **Configurações > Webpart SharePoint FXTAO**.
7. Preencha **Tenant ID Microsoft**, **Client ID da API FX TAO**, **Application ID URI**, escopo `access_as_user` e **Origens SharePoint permitidas**.
8. Em **Origens SharePoint permitidas**, use somente a origem raiz do SharePoint, sem caminho. Ex.: `https://empresa.sharepoint.com`.
9. Salve a configuração e habilite a integração.
10. Faça upload do pacote `.sppkg` no App Catalog do SharePoint.
11. Se aparecer uma solicitação antiga/inválida em **SharePoint Admin Center > Advanced > API access**, rejeite-a antes de reenviar o pacote corrigido.
12. Reenvie o pacote `.sppkg` se necessário para gerar a solicitação correta `FX TAO API / access_as_user`.
13. Aprove a permissão `FX TAO API / access_as_user` em **API access**.
14. Edite a página da obra, adicione a Web Part **FX TAO - Página da Obra** e preencha as propriedades da seção **Obra e API**.
15. Publique a página e teste com um usuário Microsoft 365 autorizado no tenant.

Nenhum segredo de cliente é armazenado na Web Part. O SPFx obtém o token delegado por meio de `AadHttpClient`.

## Checklist de troubleshooting

- **Mensagem `Failed to fetch`**: confirme HTTPS válido no FXTAO, CORS com a origem SharePoint do cliente e `Application ID URI` idêntico no FXTAO e na Web Part.
- **Solicitação de API inválida no SharePoint Admin**: rejeite a solicitação, confirme o App Registration `FX TAO API`, o escopo `access_as_user`, gere/reenviar o `.sppkg` e aprove a nova solicitação.
- **Sem solicitações pendentes em API access**: confirme se o pacote `.sppkg` foi reenviado após o App Registration estar correto.
- **Token recusado**: confira Tenant ID, audience/Application ID URI, escopo `access_as_user` e, se usado, os Client IDs autorizados.
- **Obra não encontrada**: use ID da TAO, código ERP, código da obra ou final curto do ID que exista no cliente SaaS selecionado.

## Build

Requer Node.js `>=22.14.0 <23.0.0`.

```bash
npm install
npm run build
```

O pacote é gerado em `sharepoint/solution/fxtao-work-page.sppkg` dentro deste projeto.

## Publicação

1. Enviar o `.sppkg` ao App Catalog do tenant.
2. No SharePoint Admin Center, abrir **Advanced > API access** e aprovar `FX TAO API / access_as_user`.
3. Adicionar **FX TAO - Página da Obra** à página de cada obra.
4. Configurar `taoIdentifier`, `apiBaseUrl`, `apiResourceUri` e, opcionalmente, `taoPortalBaseUrl`.
5. Ajustar campos visíveis/ocultos e visual conforme necessidade da página.
6. Publicar a página e validar o acesso com um usuário comum.

## Desenvolvimento local

Configure a página de teste em `config/serve.json` e execute:

```bash
npm start
```

Chamadas com `AadHttpClient` exigem contexto autenticado do SharePoint; não use segredo ou token fixo para contornar a autenticação.
