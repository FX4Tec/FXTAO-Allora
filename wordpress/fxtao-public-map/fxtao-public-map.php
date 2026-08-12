<?php
/**
 * Plugin Name: FXTAO Public Map
 * Description: Exibe no WordPress um componente de mapa de obras ativas do FXTAO SaaS, com token protegido no servidor.
 * Version: 1.1.0
 * Author: FX4 Tecnologia
 */

if (!defined('ABSPATH')) {
    exit;
}

final class FXTAO_Public_Map_Plugin
{
    private const OPTION_KEY = 'fxtao_public_map_settings';
    private const REST_NAMESPACE = 'fxtao-public-map/v1';

    public static function init(): void
    {
        add_action('admin_menu', [self::class, 'registerSettingsPage']);
        add_action('admin_init', [self::class, 'registerSettings']);
        add_action('rest_api_init', [self::class, 'registerRestRoutes']);
        add_shortcode('fxtao_public_map', [self::class, 'renderShortcode']);
    }

    public static function registerSettingsPage(): void
    {
        add_options_page(
            'FXTAO Public Map',
            'FXTAO Public Map',
            'manage_options',
            'fxtao-public-map',
            [self::class, 'renderSettingsPage']
        );
    }

    public static function registerSettings(): void
    {
        register_setting('fxtao_public_map', self::OPTION_KEY, [
            'type' => 'array',
            'sanitize_callback' => [self::class, 'sanitizeSettings'],
            'default' => self::defaultSettings(),
        ]);
    }

    public static function registerRestRoutes(): void
    {
        register_rest_route(self::REST_NAMESPACE, '/works', [
            'methods' => 'GET',
            'permission_callback' => '__return_true',
            'callback' => [self::class, 'proxyWorks'],
        ]);
    }

    public static function sanitizeSettings($settings): array
    {
        $settings = is_array($settings) ? $settings : [];

        return [
            'api_base_url' => esc_url_raw($settings['api_base_url'] ?? 'https://fxtao.fx4.com.br/api/public'),
            'tenant_slug' => sanitize_title($settings['tenant_slug'] ?? ''),
            'bearer_token' => sanitize_text_field($settings['bearer_token'] ?? ''),
            'portal_base_url' => esc_url_raw($settings['portal_base_url'] ?? 'https://fxtao.fx4.com.br'),
            'default_work_filter' => sanitize_text_field($settings['default_work_filter'] ?? ''),
            'active_only' => !empty($settings['active_only']) ? '1' : '0',
            'show_selector' => empty($settings['show_selector']) ? '0' : '1',
            'default_latitude' => sanitize_text_field($settings['default_latitude'] ?? '-23.55052'),
            'default_longitude' => sanitize_text_field($settings['default_longitude'] ?? '-46.63331'),
            'default_zoom' => max(1, min(18, absint($settings['default_zoom'] ?? 11))),
            'cache_seconds' => max(0, min(3600, absint($settings['cache_seconds'] ?? 300))),
        ];
    }

    public static function renderSettingsPage(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = self::settings();
        ?>
        <div class="wrap">
            <h1>FXTAO Public Map</h1>
            <p>Configure o cliente FXTAO SaaS, a obra padrão e o token do cliente de integração <strong>Mapa público de obras</strong>.</p>
            <form method="post" action="options.php">
                <?php settings_fields('fxtao_public_map'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="fxtao_api_base_url">URL base da API</label></th>
                        <td><input id="fxtao_api_base_url" class="regular-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[api_base_url]" value="<?php echo esc_attr($settings['api_base_url']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_tenant_slug">ID/slug do cliente</label></th>
                        <td><input id="fxtao_tenant_slug" class="regular-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[tenant_slug]" value="<?php echo esc_attr($settings['tenant_slug']); ?>" placeholder="cinci" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_default_work_filter">Obra padrão</label></th>
                        <td>
                            <input id="fxtao_default_work_filter" class="regular-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[default_work_filter]" value="<?php echo esc_attr($settings['default_work_filter']); ?>" placeholder="Nome, ERP ou identificador da obra" />
                            <p class="description">Opcional. Se vazio, o componente exibe todas as obras ativas publicadas do cliente.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_portal_base_url">Link do FXTAO</label></th>
                        <td>
                            <input id="fxtao_portal_base_url" class="regular-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[portal_base_url]" value="<?php echo esc_attr($settings['portal_base_url']); ?>" placeholder="https://fxtao.fx4.com.br" />
                            <p class="description">Usado no botão “Abrir no FXTAO” do componente.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_bearer_token">Bearer token</label></th>
                        <td><input id="fxtao_bearer_token" class="regular-text" type="password" autocomplete="off" name="<?php echo esc_attr(self::OPTION_KEY); ?>[bearer_token]" value="<?php echo esc_attr($settings['bearer_token']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row">Comportamento</th>
                        <td>
                            <label><input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[active_only]" value="1" <?php checked($settings['active_only'], '1'); ?> /> Mostrar somente obras ativas</label><br />
                            <label><input type="checkbox" name="<?php echo esc_attr(self::OPTION_KEY); ?>[show_selector]" value="1" <?php checked($settings['show_selector'], '1'); ?> /> Exibir seletor de obras no componente</label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Centro padrão</th>
                        <td>
                            <input class="small-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[default_latitude]" value="<?php echo esc_attr($settings['default_latitude']); ?>" placeholder="-23.55052" />
                            <input class="small-text" name="<?php echo esc_attr(self::OPTION_KEY); ?>[default_longitude]" value="<?php echo esc_attr($settings['default_longitude']); ?>" placeholder="-46.63331" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_default_zoom">Zoom padrão</label></th>
                        <td><input id="fxtao_default_zoom" class="small-text" type="number" min="1" max="18" name="<?php echo esc_attr(self::OPTION_KEY); ?>[default_zoom]" value="<?php echo esc_attr($settings['default_zoom']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="fxtao_cache_seconds">Cache em segundos</label></th>
                        <td><input id="fxtao_cache_seconds" class="small-text" type="number" min="0" max="3600" name="<?php echo esc_attr(self::OPTION_KEY); ?>[cache_seconds]" value="<?php echo esc_attr($settings['cache_seconds']); ?>" /></td>
                    </tr>
                </table>
                <?php submit_button('Salvar configurações'); ?>
            </form>
            <h2>Shortcodes</h2>
            <p>Mapa padrão do cliente configurado: <code>[fxtao_public_map]</code></p>
            <p>Mapa de uma obra específica: <code>[fxtao_public_map obra="CASA ATLÂNTICA"]</code></p>
            <p>Mapa com cliente/URL explícitos: <code>[fxtao_public_map cliente="cinci" fxtao_url="https://fxtao.fx4.com.br" seletor="true"]</code></p>
        </div>
        <?php
    }

    public static function renderShortcode($atts): string
    {
        $atts = shortcode_atts([
            'height' => '520px',
            'cliente' => '',
            'tenant' => '',
            'obra' => '',
            'fxtao_url' => '',
            'somente_ativas' => '',
            'seletor' => '',
        ], $atts, 'fxtao_public_map');

        wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
        wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);
        wp_enqueue_style('fxtao-public-map', plugins_url('assets/map.css', __FILE__), [], '1.0.0');
        wp_enqueue_script('fxtao-public-map', plugins_url('assets/map.js', __FILE__), ['leaflet'], '1.0.0', true);

        $settings = self::settings();
        wp_localize_script('fxtao-public-map', 'FXTAOPublicMap', [
            'endpoint' => esc_url_raw(rest_url(self::REST_NAMESPACE . '/works')),
            'defaultLatitude' => (float) $settings['default_latitude'],
            'defaultLongitude' => (float) $settings['default_longitude'],
            'defaultZoom' => (int) $settings['default_zoom'],
        ]);

        $height = preg_match('/^\d+(px|vh|rem|em|%)$/', (string) $atts['height']) ? $atts['height'] : '520px';
        $tenant = sanitize_title($atts['cliente'] ?: $atts['tenant'] ?: $settings['tenant_slug']);
        $workFilter = sanitize_text_field($atts['obra'] ?: $settings['default_work_filter']);
        $portalUrl = esc_url_raw($atts['fxtao_url'] ?: $settings['portal_base_url']);
        $activeOnly = self::normalizeBooleanAttribute($atts['somente_ativas'], $settings['active_only'] === '1');
        $showSelector = self::normalizeBooleanAttribute($atts['seletor'], $settings['show_selector'] === '1');

        return sprintf(
            '<div class="fxtao-public-map-shell" data-tenant="%s" data-work="%s" data-portal-url="%s" data-active-only="%s" data-show-selector="%s"><div class="fxtao-public-map-toolbar"><select class="fxtao-public-map__select" aria-label="Selecionar obra"></select><a class="fxtao-public-map__portal" href="%s" target="_blank" rel="noopener">Abrir no FXTAO</a></div><div class="fxtao-public-map" style="height:%s"><div class="fxtao-public-map__status">Carregando obras...</div></div></div>',
            esc_attr($tenant),
            esc_attr($workFilter),
            esc_url($portalUrl),
            $activeOnly ? '1' : '0',
            $showSelector ? '1' : '0',
            esc_url($portalUrl),
            esc_attr($height)
        );
    }

    public static function proxyWorks(WP_REST_Request $request): WP_REST_Response
    {
        $settings = self::settings();
        $tenantSlug = sanitize_title($request->get_param('tenant') ?: $settings['tenant_slug']);
        $workFilter = sanitize_text_field($request->get_param('obra') ?: $settings['default_work_filter']);
        $activeOnly = self::normalizeBooleanAttribute($request->get_param('active_only'), $settings['active_only'] === '1');
        $portalUrl = esc_url_raw($request->get_param('portal_url') ?: $settings['portal_base_url']);

        if (empty($settings['api_base_url']) || empty($tenantSlug) || empty($settings['bearer_token'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Plugin FXTAO Public Map sem URL, tenant ou token configurado.',
            ], 400);
        }

        $cacheKey = 'fxtao_public_map_' . md5($settings['api_base_url'] . '|' . $tenantSlug);
        $cachedPayload = get_transient($cacheKey);
        if (is_array($cachedPayload)) {
            return new WP_REST_Response(self::filterPayload($cachedPayload, $workFilter, $activeOnly, $portalUrl), 200);
        }

        $url = trailingslashit($settings['api_base_url']) . rawurlencode($tenantSlug) . '/obras/mapa';
        $response = wp_remote_get($url, [
            'timeout' => 15,
            'headers' => [
                'Authorization' => 'Bearer ' . $settings['bearer_token'],
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => $response->get_error_message(),
            ], 502);
        }

        $statusCode = (int) wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($body)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Resposta inválida da API FXTAO.',
            ], 502);
        }

        if ($statusCode >= 200 && $statusCode < 300 && (int) $settings['cache_seconds'] > 0) {
            set_transient($cacheKey, $body, (int) $settings['cache_seconds']);
        }

        return new WP_REST_Response(self::filterPayload($body, $workFilter, $activeOnly, $portalUrl), $statusCode);
    }

    private static function settings(): array
    {
        return wp_parse_args(get_option(self::OPTION_KEY, []), self::defaultSettings());
    }

    private static function defaultSettings(): array
    {
        return [
            'api_base_url' => 'https://fxtao.fx4.com.br/api/public',
            'tenant_slug' => '',
            'bearer_token' => '',
            'portal_base_url' => 'https://fxtao.fx4.com.br',
            'default_work_filter' => '',
            'active_only' => '1',
            'show_selector' => '1',
            'default_latitude' => '-23.55052',
            'default_longitude' => '-46.63331',
            'default_zoom' => 11,
            'cache_seconds' => 300,
        ];
    }

    private static function normalizeBooleanAttribute($value, bool $fallback): bool
    {
        if ($value === '' || $value === null) {
            return $fallback;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'sim', 'yes', 'on'], true);
    }

    private static function normalizeComparable($value): string
    {
        $normalized = remove_accents(strtolower((string) $value));
        return preg_replace('/\s+/', ' ', trim($normalized));
    }

    private static function workMatches(array $work, string $filter): bool
    {
        if ($filter === '') return true;

        $needle = self::normalizeComparable($filter);
        foreach (['external_id', 'nome', 'url_publica'] as $key) {
            if (strpos(self::normalizeComparable($work[$key] ?? ''), $needle) !== false) {
                return true;
            }
        }

        return false;
    }

    private static function filterPayload(array $payload, string $workFilter, bool $activeOnly, string $portalUrl): array
    {
        $works = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $works = array_values(array_filter($works, function ($work) use ($workFilter, $activeOnly) {
            if (!is_array($work)) return false;
            if ($activeOnly && in_array($work['status'] ?? '', ['cancelada', 'concluida'], true)) return false;
            return self::workMatches($work, $workFilter);
        }));

        $payload['data'] = $works;
        $payload['meta'] = array_merge(is_array($payload['meta'] ?? null) ? $payload['meta'] : [], [
            'filtered_total' => count($works),
            'portal_url' => $portalUrl,
            'work_filter' => $workFilter,
            'active_only' => $activeOnly,
        ]);

        return $payload;
    }
}

FXTAO_Public_Map_Plugin::init();
