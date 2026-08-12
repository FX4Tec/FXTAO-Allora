# FX TAO - Página da Obra

Web Part SPFx/React para apresentar, em cada página de obra do SharePoint, os dados da TAO selecionada. O identificador é configurado nas propriedades da própria Web Part, permitindo reutilizar o mesmo pacote em todas as páginas.

## Propriedades

- **Identificador da TAO**: UUID, código ERP ou código da obra.
- **URL base da API**: origem HTTPS pública do FX TAO.
- **URI do recurso Entra ID**: Application ID URI da API, por exemplo `api://<client-id>`.
- **URL do portal TAO**: habilita o link para o cadastro completo.
- **Status da TAO**: selo opcional no cabeçalho da Web Part.
- **Centros de custo**: bloco opcional.
- **Campos visíveis/ocultos**: seleção rápida por CSV.
- **JSON de campos**: reordena, renomeia e habilita/desabilita campos.
- **Tema do cabeçalho**: cores do fundo, texto e destaque.
- **Tema do quadro**: cor sólida ou imagem com transparência configurável.
- **Tema dos dados**: cores dos rótulos e dos valores.
- **Atualização automática**: intervalo de 0 a 60 minutos; zero desativa.

## Campos disponíveis para configuração

- `clientName`
- `architecture`
- `areaM2`
- `projectType`
- `street`
- `neighborhood`
- `zipCode`
- `cityState`
- `complement`
- `companyName`
- `companyCode`
- `clientCode`
- `clientCostCenters`
- `companyCostCenters`
- `segment`
- `contractType`
- `startDate`
- `endDate`

## Registro de aplicativo Entra ID e configuração SaaS

1. Criar/selecionar um registro para a API com nome de exibição `FX TAO API`.
2. Em **Expose an API**, definir o Application ID URI e criar o escopo delegado `access_as_user`.
3. Configurar a versão de token de acesso como 2 no manifesto do aplicativo.
4. No FXTAO SaaS, acessar o cliente correto em **Configurações > Webpart SharePoint FXTAO**.
5. Informar **Tenant ID Microsoft**, **Client ID da API**, **Application ID URI**, escopo `access_as_user` e a origem SharePoint permitida, por exemplo `https://cincieng.sharepoint.com`.
6. Habilitar a integração e salvar.
7. Opcionalmente restringir o `azp`/`appid` em **Client IDs autorizados a chamar a API**.

Nenhum segredo de cliente é armazenado na Web Part. O SPFx obtém o token delegado por meio de `AadHttpClient`.

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
4. Configurar o identificador correspondente àquela obra e as URLs da API/portal.
5. Publicar a página e validar o acesso com um usuário comum.

## Desenvolvimento local

Configure a página de teste em `config/serve.json` e execute:

```bash
npm start
```

Chamadas com `AadHttpClient` exigem contexto autenticado do SharePoint; não use segredo ou token fixo para contornar a autenticação.
