# FXTAO Public Map

Plugin WordPress para exibir o mapa público de obras de um cliente FXTAO SaaS.

## Configuração

1. Instale a pasta `fxtao-public-map` em `wp-content/plugins/`.
2. Ative o plugin no WordPress.
3. Acesse `Configurações > FXTAO Public Map`.
4. Informe:
   - URL base da API: `https://fxtao.fx4.com.br/api/public`
   - ID/slug do cliente: por exemplo `cinci`
   - Bearer token do cliente de integração `Mapa público de obras`
5. Publique uma página com o shortcode `[fxtao_public_map]`.

O token fica armazenado no servidor WordPress e não é enviado para o navegador.
