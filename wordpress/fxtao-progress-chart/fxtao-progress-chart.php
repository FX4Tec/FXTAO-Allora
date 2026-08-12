<?php
/**
 * Plugin Name: FXTAO Progress Chart
 * Description: Exibe a evolução de obra cadastrada no FXTAO SaaS por cliente e obra, com token protegido no servidor.
 * Version: 1.2.0
 * Author: FX4 Tecnologia
 * Text Domain: fxtao-progress-chart
 */

if (!defined('ABSPATH')) {
    exit;
}

final class FXTAO_Progress_Chart_Plugin
{
    private const OPTION_KEY = 'fxtao_progress_chart_settings';
    private const REST_NAMESPACE = 'fxtao-progress-chart/v1';

    public static function init(): void
    {
        add_action('admin_menu', [self::class, 'adminMenu']);
        add_action('admin_init', [self::class, 'registerSettings']);
        add_action('rest_api_init', [self::class, 'registerRestRoutes']);
        add_action('wp_ajax_fxtao_progress_chart', [self::class, 'ajaxProgress']);
        add_action('wp_ajax_nopriv_fxtao_progress_chart', [self::class, 'ajaxProgress']);
        add_shortcode('fxtao_progress_chart', [self::class, 'renderShortcode']);
        add_shortcode('fxtao_progress_chart_grafico', [self::class, 'renderChartOnlyShortcode']);
        add_action('wp_enqueue_scripts', [self::class, 'registerAssets']);
    }

    public static function activate(): void
    {
        if (!get_option(self::OPTION_KEY)) {
            add_option(self::OPTION_KEY, self::defaultSettings());
        }
    }

    private static function defaultSettings(): array
    {
        return [
            'api_base_url' => 'https://fxtao.fx4.com.br/api/public',
            'tenant_slug' => '',
            'work_ref' => '',
            'token' => '',
            'fxtao_url' => 'https://fxtao.fx4.com.br',
            'chart_type' => 'bar',
            'refresh_minutes' => 10,
            'show_refresh_button' => true,
            'title' => 'Evolução da Obra',
        ];
    }

    private static function settings(): array
    {
        return wp_parse_args(get_option(self::OPTION_KEY, []), self::defaultSettings());
    }

    public static function registerAssets(): void
    {
        wp_register_style(
            'fxtao-progress-chart',
            plugins_url('assets/chart.css', __FILE__),
            [],
            '1.2.0'
        );

        wp_register_script(
            'fxtao-progress-chart',
            plugins_url('assets/chart.js', __FILE__),
            [],
            '1.2.0',
            true
        );
    }

    public static function adminMenu(): void
    {
        add_options_page(
            'FXTAO Progress Chart',
            'FXTAO Progress Chart',
            'manage_options',
            'fxtao-progress-chart',
            [self::class, 'renderSettingsPage']
        );
    }

    public static function registerSettings(): void
    {
        register_setting('fxtao_progress_chart', self::OPTION_KEY, [
            'type' => 'array',
            'sanitize_callback' => [self::class, 'sanitizeSettings'],
            'default' => self::defaultSettings(),
        ]);
    }

    public static function sanitizeSettings($input): array
    {
        $input = is_array($input) ? $input : [];
        $settings = self::defaultSettings();
        $chartType = sanitize_key($input['chart_type'] ?? $settings['chart_type']);

        return [
            'api_base_url' => esc_url_raw(rtrim((string)($input['api_base_url'] ?? $settings['api_base_url']), '/')),
            'tenant_slug' => sanitize_key($input['tenant_slug'] ?? ''),
            'work_ref' => sanitize_text_field($input['work_ref'] ?? ''),
            'token' => sanitize_text_field($input['token'] ?? ''),
            'fxtao_url' => esc_url_raw(rtrim((string)($input['fxtao_url'] ?? $settings['fxtao_url']), '/')),
            'chart_type' => in_array($chartType, ['bar', 'vertical', 'donut'], true) ? $chartType : 'bar',
            'refresh_minutes' => max(1, min(1440, absint($input['refresh_minutes'] ?? $settings['refresh_minutes']))),
            'show_refresh_button' => !empty($input['show_refresh_button']),
            'title' => sanitize_text_field($input['title'] ?? $settings['title']),
        ];
    }

    public static function renderSettingsPage(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = self::settings();
        ?>
        <div class="wrap fxtao-progress-admin">
            <h1>FXTAO Progress Chart</h1>
            <p>Configure o gráfico público de evolução da obra. O token fica salvo apenas no servidor WordPress.</p>

            <form method="post" action="options.php">
                <?php settings_fields('fxtao_progress_chart'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="fxtao_api_base_url">URL base da API</label></th>
                        <td><input class="regular-text" id="fxtao_api_base_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[api_base_url]" value="<?php echo esc_attr($settings['api_base_url']); ?>" placeholder="https://fxtao.fx4.com.br/api/public" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_tenant_slug">Slug do cliente</label></th>
                        <td><input class="regular-text" id="fxtao_tenant_slug" name="<?php echo esc_attr(self::OPTION_KEY); ?>[tenant_slug]" value="<?php echo esc_attr($settings['tenant_slug']); ?>" placeholder="cinci" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_work_ref">Obra padrão</label></th>
                        <td><input class="regular-text" id="fxtao_work_ref" name="<?php echo esc_attr(self::OPTION_KEY); ?>[work_ref]" value="<?php echo esc_attr($settings['work_ref']); ?>" placeholder="ID, ERP, slug público ou nome da obra" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_token">Bearer token</label></th>
                        <td><input class="regular-text" id="fxtao_token" type="password" autocomplete="off" name="<?php echo esc_attr(self::OPTION_KEY); ?>[token]" value="<?php echo esc_attr($settings['token']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_url">Link do FXTAO</label></th>
                        <td><input class="regular-text" id="fxtao_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[fxtao_url]" value="<?php echo esc_attr($settings['fxtao_url']); ?>" placeholder="https://fxtao.fx4.com.br" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_chart_type">Tipo de gráfico</label></th>
                        <td>
                            <select id="fxtao_chart_type" name="<?php echo esc_attr(self::OPTION_KEY); ?>[chart_type]">
                                <option value="bar" <?php selected($settings['chart_type'], 'bar'); ?>>Barra horizontal (padrão)</option>
                                <option value="vertical" <?php selected($settings['chart_type'], 'vertical'); ?>>Barras verticais</option>
                                <option value="donut" <?php selected($settings['chart_type'], 'donut'); ?>>Resumo circular</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_refresh_minutes">Atualização automática</label></th>
                        <td><input id="fxtao_refresh_minutes" type="number" min="1" max="1440" name="<?php echo esc_attr(self::OPTION_KEY); ?>[refresh_minutes]" value="<?php echo esc_attr($settings['refresh_minutes']); ?>" /> minutos</td>
                    </tr>
                    <tr>
                        <th scope="row">Botão manual</th>
                        <td><label><input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[show_refresh_button]" value="1" <?php checked($settings['show_refresh_button']); ?> /> Exibir botão Atualizar agora</label></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_title">Título</label></th>
                        <td><input class="regular-text" id="fxtao_title" name="<?php echo esc_attr(self::OPTION_KEY); ?>[title]" value="<?php echo esc_attr($settings['title']); ?>" /></td>
                    </tr>
                </table>
                <?php submit_button('Salvar configuração'); ?>
            </form>

            <h2>Manual rápido</h2>
            <ol>
                <li>No FXTAO SaaS, entre no cliente correto e abra <strong>Configurações &gt; Integrações</strong>.</li>
                <li>Habilite o cliente <strong>Gráfico público de evolução da obra</strong> e gere um Bearer token exclusivo.</li>
                <li>Na TAO, vá ao item 5, marque <strong>Publicar gráfico desta obra</strong> e cadastre tópicos e percentuais.</li>
                <li>Neste plugin, informe URL da API, slug do cliente, obra padrão, token e intervalo de atualização.</li>
                <li>Insira o shortcode na página: <code>[fxtao_progress_chart]</code>.</li>
            </ol>
            <p>Shortcodes úteis:</p>
            <pre>[fxtao_progress_chart]
[fxtao_progress_chart obra="APARTAMENTO LG"]
[fxtao_progress_chart cliente="cinci" obra="APARTAMENTO LG" tipo="bar"]
[fxtao_progress_chart tipo="vertical" atualizacao_minutos="5"]
[fxtao_progress_chart_grafico cliente="cinci" obra="APARTAMENTO LG" tipo="bar"]</pre>
        </div>
        <?php
    }

    public static function registerRestRoutes(): void
    {
        register_rest_route(self::REST_NAMESPACE, '/progress', [
            'methods' => 'GET',
            'callback' => [self::class, 'restProgress'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function restProgress(WP_REST_Request $request): WP_REST_Response
    {
        try {
            return self::doRestProgress($request);
        } catch (Throwable $error) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Falha interna no plugin FXTAO Progress Chart.',
                'details' => $error->getMessage(),
            ], 500);
        }
    }

    public static function ajaxProgress(): void
    {
        $request = new WP_REST_Request('GET', '/' . self::REST_NAMESPACE . '/progress');
        foreach ($_GET as $key => $value) {
            if ($key === 'action') {
                continue;
            }
            $request->set_param(sanitize_key($key), is_scalar($value) ? wp_unslash($value) : $value);
        }

        $response = self::restProgress($request);
        $status = method_exists($response, 'get_status') ? $response->get_status() : 200;
        status_header($status);
        wp_send_json($response->get_data(), $status);
    }

    private static function doRestProgress(WP_REST_Request $request): WP_REST_Response
    {
        $settings = self::settings();
        $tenantSlug = sanitize_key($request->get_param('tenant') ?: $settings['tenant_slug']);
        $workRef = sanitize_text_field($request->get_param('obra') ?: $settings['work_ref']);
        $refresh = self::booleanAttribute($request->get_param('refresh'), false);

        if (!$tenantSlug || !$workRef || empty($settings['token'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Configure tenant, obra e token no plugin FXTAO Progress Chart.',
            ], 400);
        }

        $cacheKey = 'fxtao_progress_chart_' . md5($settings['api_base_url'] . '|' . $tenantSlug . '|' . $workRef . '|' . $request->get_param('tipo'));
        if (!$refresh) {
            $cached = get_transient($cacheKey);
            if ($cached) {
                return new WP_REST_Response($cached, 200);
            }
        }

        $url = trailingslashit($settings['api_base_url']) . rawurlencode($tenantSlug) . '/obras/' . rawurlencode($workRef) . '/progresso';
        $response = wp_remote_get($url, [
            'timeout' => 12,
            'headers' => [
                'Accept' => 'application/json',
                'Authorization' => 'Bearer ' . $settings['token'],
                'User-Agent' => 'FXTAO Progress Chart WordPress Plugin/1.1.1',
            ],
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $response->get_error_message(),
            ], 502);
        }

        $status = wp_remote_retrieve_response_code($response);
        $rawBody = wp_remote_retrieve_body($response);
        $body = json_decode($rawBody, true);
        if ($status < 200 || $status >= 300 || !is_array($body)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => is_array($body) && !empty($body['message']) ? $body['message'] : 'Falha ao consultar FXTAO SaaS.',
                'status' => $status,
            ], 502);
        }

        $payload = [
            'success' => true,
            'chart_type' => sanitize_key($request->get_param('tipo') ?: $settings['chart_type']),
            'title' => sanitize_text_field($request->get_param('titulo') ?: $settings['title']),
            'fxtao_url' => esc_url_raw($request->get_param('fxtao_url') ?: $settings['fxtao_url']),
            'data' => $body['data'] ?? [],
            'last_update' => $body['last_update'] ?? null,
        ];

        set_transient($cacheKey, $payload, max(60, (int)$settings['refresh_minutes'] * 60));
        return new WP_REST_Response($payload, 200);
    }

    public static function renderShortcode($atts): string
    {
        return self::renderChartShortcode($atts, false);
    }

    public static function renderChartOnlyShortcode($atts): string
    {
        return self::renderChartShortcode($atts, true);
    }

    private static function renderChartShortcode($atts, bool $chartOnly): string
    {
        $settings = self::settings();
        $atts = shortcode_atts([
            'cliente' => $settings['tenant_slug'],
            'obra' => $settings['work_ref'],
            'tipo' => $settings['chart_type'],
            'titulo' => $settings['title'],
            'atualizacao_minutos' => $settings['refresh_minutes'],
            'fxtao_url' => $settings['fxtao_url'],
            'mostrar_titulo' => $chartOnly ? 'false' : 'true',
            'titulo_visivel' => $chartOnly ? 'false' : 'true',
            'rodape' => $chartOnly ? 'false' : 'true',
            'botao' => $chartOnly ? 'false' : ($settings['show_refresh_button'] ? 'true' : 'false'),
            'link' => $chartOnly ? 'false' : 'true',
            'cartao' => $chartOnly ? 'false' : 'true',
        ], $atts, 'fxtao_progress_chart');

        wp_enqueue_style('fxtao-progress-chart');
        wp_enqueue_script('fxtao-progress-chart');

        $elementId = 'fxtao-progress-chart-' . wp_generate_uuid4();
        $config = [
            'endpoint' => esc_url_raw(rest_url(self::REST_NAMESPACE . '/progress')),
            'ajaxEndpoint' => esc_url_raw(admin_url('admin-ajax.php')),
            'tenant' => sanitize_key($atts['cliente']),
            'workRef' => sanitize_text_field($atts['obra']),
            'chartType' => sanitize_key($atts['tipo']),
            'title' => sanitize_text_field($atts['titulo']),
            'refreshMinutes' => max(1, absint($atts['atualizacao_minutos'])),
            'showTitle' => self::booleanAttribute($atts['mostrar_titulo'], true)
                && self::booleanAttribute($atts['titulo_visivel'], true)
                && self::booleanAttribute($atts['titulo'], true),
            'showFooter' => self::booleanAttribute($atts['rodape'], true),
            'showRefreshButton' => self::booleanAttribute($atts['botao'], (bool)$settings['show_refresh_button']),
            'showLink' => self::booleanAttribute($atts['link'], true),
            'card' => self::booleanAttribute($atts['cartao'], true),
            'fxtaoUrl' => esc_url_raw($atts['fxtao_url']),
        ];

        return sprintf(
            '<div id="%1$s" class="fxtao-progress-chart" data-config="%2$s"><div class="fxtao-progress-loading">Carregando evolução da obra...</div></div>',
            esc_attr($elementId),
            esc_attr(wp_json_encode($config))
        );
    }

    private static function booleanAttribute($value, bool $fallback): bool
    {
        if ($value === '' || $value === null) {
            return $fallback;
        }

        return in_array(strtolower((string)$value), ['1', 'true', 'sim', 'yes', 'on'], true);
    }
}

register_activation_hook(__FILE__, ['FXTAO_Progress_Chart_Plugin', 'activate']);
FXTAO_Progress_Chart_Plugin::init();
