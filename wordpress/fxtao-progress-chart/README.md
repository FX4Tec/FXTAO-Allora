# FXTAO Progress Chart

Plugin WordPress para exibir a evolução de obra cadastrada no FXTAO SaaS.

## Instalação

1. No WordPress, acesse `Plugins > Adicionar novo > Enviar plugin`.
2. Envie `fxtao-progress-chart.zip`.
3. Clique em `Instalar agora` e depois `Ativar`.
4. Acesse `Configurações > FXTAO Progress Chart`.

## Configuração

1. Informe `URL base da API`: `https://fxtao.fx4.com.br/api/public`.
   - Se preencher apenas `https://fxtao.fx4.com.br`, a versão `1.3.3` normaliza automaticamente para `https://fxtao.fx4.com.br/api/public`.
   - Não use a URL do portal sem `/api/public` em versões anteriores, pois o WordPress tentará ler HTML como JSON.
2. Informe o `Slug do cliente`, por exemplo `cinci`.
3. Informe a `Obra padrão`: ID, ERP, slug público ou nome da obra.
4. Cole o Bearer token gerado no FXTAO para o cliente de integração `Gráfico público de evolução da obra`.
5. Escolha o tipo de gráfico. O padrão é `Barra horizontal`.
6. Defina o período de atualização em minutos.
7. Mantenha o botão `Atualizar agora` habilitado se quiser refresh manual na página.

## Preparação no FXTAO

1. Acesse o tenant correto no FXTAO SaaS.
2. Abra `Configurações > Integrações do Ecossistema`.
3. Habilite `Gráfico público de evolução da obra` e gere um token exclusivo para esse cliente.
4. Abra a TAO da obra, vá ao item 5 e marque `Publicar gráfico desta obra`.
5. Cadastre os tópicos e percentuais no quadro `Evolução da Obra para WordPress`.

## Shortcodes

```text
[fxtao_progress_chart]
[fxtao_progress_chart obra="APARTAMENTO LG"]
[fxtao_progress_chart cliente="cinci" obra="APARTAMENTO LG" tipo="bar"]
[fxtao_progress_chart tipo="vertical" atualizacao_minutos="5"]
[fxtao_progress_chart tipo="donut" titulo="Resumo da Obra"]
[fxtao_progress_chart cliente="cinci" obra="APARTAMENTO LG" tipo="bar" mostrar_titulo="false" rodape="false" botao="false" link="false" cartao="false"]
[fxtao_progress_chart_grafico cliente="cinci" obra="APARTAMENTO LG" tipo="bar"]
[fxtao_progress_chart_grafico cliente="cinci" obra="017" tipo="bar" atualizacao_minutos="1"]
[fxtao_progress_chart_grafico cliente="cinci" obra="017" tipo="bar" compacto="true" mostrar_zeros="true"]
[fxtao_progress_chart_grafico cliente="cinci" obra="017" tipo="bar" compacto="true" mostrar_zeros="false" altura="420px"]
[fxtao_progress_chart_grafico cliente="cinci" obra="017" tipo="bar" cartao="true" mostrar_titulo="true" titulo="Evolução da Obra" compacto="true" mostrar_zeros="true" altura="300px" atualizacao_minutos="30"]
```

Use `fxtao_progress_chart_grafico` quando quiser somente o gráfico, sem título, cartão, rodapé, botão ou link.

### Atributos visuais

- `compacto="true"`: reduz padding, altura das barras e espaçamentos para encaixar melhor em páginas institucionais.
- `mostrar_zeros="true"`: exibe tópicos com `0%` de forma discreta. Use `false` para ocultar tópicos zerados.
- `altura="420px"`: compacta linhas, fontes e espaçamentos para caber na altura informada. Use `auto` para altura natural.
- `mostrar_titulo="true"`: exibe o título com tipografia própria do plugin. No shortcode `fxtao_progress_chart_grafico`, o padrão é `false`.

## Segurança

- O token nunca é enviado ao navegador; o frontend chama o proxy REST interno do WordPress.
- Se o REST do WordPress for bloqueado pela hospedagem/cache, o plugin usa fallback seguro via `admin-ajax.php`.
- Use um token por cliente e rotacione em caso de suspeita de exposição.
- A API FXTAO só retorna dados da obra quando o tenant e a obra estão publicados para gráfico público.
- Não reutilize o token de mapa para o gráfico; cada integração tem escopo próprio.
