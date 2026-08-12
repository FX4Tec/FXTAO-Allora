# FXTAO Public Map

Plugin WordPress para inserir um componente de mapa de obras ativas conectado ao FXTAO SaaS.

O token de conexão fica armazenado no servidor WordPress e não é enviado ao navegador. A página pública consome apenas um endpoint proxy do próprio WordPress.

## Requisitos

- WordPress 6.x ou superior.
- Permissão de administrador no WordPress.
- Cliente/tenant criado no FXTAO SaaS.
- Token ativo da integração `Mapa público de obras` no tenant do FXTAO.
- Obras com latitude/longitude e publicação pública habilitada no FXTAO.

## Instalação

1. Baixe o arquivo `fxtao-public-map.zip`.
2. No WordPress, acesse `Plugins > Adicionar novo > Enviar plugin`.
3. Envie o `.zip`, clique em `Instalar agora` e depois em `Ativar`.
4. Acesse `Configurações > FXTAO Public Map`.

## Configuração

Preencha:

- `URL base da API`: normalmente `https://fxtao.fx4.com.br/api/public`.
- `ID/slug do cliente`: exemplo `cinci`, `allora` ou `cymz`.
- `Obra padrão`: opcional; aceita nome, ERP ou identificador da obra.
- `Bearer token`: token da integração `Mapa público de obras`.
- `Mostrar somente obras ativas`: recomendado manter marcado.
- `Exibir seletor de obras`: mostra uma lista para alternar entre obras no componente.
- `Refresh automático em segundos`: recarrega os dados do mapa sem atualizar a página; use `0` para desativar.

## Shortcodes

Mapa padrão configurado no plugin:

```text
[fxtao_public_map]
```

Mapa de uma obra específica:

```text
[fxtao_public_map obra="CASA ATLÂNTICA"]
```

Mapa apontando explicitamente para um cliente:

```text
[fxtao_public_map cliente="cinci" seletor="true"]
```

Mapa sem seletor, exibindo somente os marcadores:

```text
[fxtao_public_map cliente="cinci" seletor="false"]
```

Mapa sem seletor e com refresh a cada 60 segundos:

```text
[fxtao_public_map cliente="cinci" seletor="false" refresh="60"]
```

Altura customizada:

```text
[fxtao_public_map height="640px"]
```

## Segurança e segregação

- O token fica salvo nas opções do WordPress.
- O navegador chama apenas `/wp-json/fxtao-public-map/v1/works`.
- O WordPress repassa a chamada para `https://fxtao.fx4.com.br/api/public/{cliente}/obras/mapa`.
- O FXTAO valida o token dentro da base segregada do cliente informado.
- Outros clientes não conseguem acessar dados se o token não pertencer ao tenant correto.

## Publicação de obras

Para uma obra aparecer no mapa:

1. A obra precisa ter latitude e longitude.
2. A obra precisa estar publicada para o mapa público no FXTAO.
3. A obra precisa atender ao filtro de status ativo, quando habilitado.
