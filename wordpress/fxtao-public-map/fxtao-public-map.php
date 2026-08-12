<?php
/**
 * Plugin Name: FXTAO Public Map
 * Description: Exibe no WordPress o mapa público de obras de um tenant FXTAO SaaS, sem expor o token no navegador.
 * Version: 1.0.0
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
            <p>Configure o tenant/cliente FXTAO e o token do cliente de integração <strong>Mapa público de obras</strong>.</p>
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
                        <th scope="row"><label for="fxtao_bearer_token">Bearer token</label></th>
                        <td><input id="fxtao_bearer_token" class="regular-text" type="password" autocomplete="off" name="<?php echo esc_attr(self::OPTION_KEY); ?>[bearer_token]" value="<?php echo esc_attr($settings['bearer_token']); ?>" /></td>
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
            <p>Use o shortcode <code>[fxtao_public_map]</code> na página desejada.</p>
        </div>
        <?php
    }

    public static function renderShortcode($atts): string
    {
        $atts = shortcode_atts([
            'height' => '520px',
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

        return sprintf(
            '<div class="fxtao-public-map" style="height:%s"><div class="fxtao-public-map__status">Carregando obras...</div></div>',
            esc_attr($height)
        );
    }

    public static function proxyWorks(WP_REST_Request $request): WP_REST_Response
    {
        $settings = self::settings();
        if (empty($settings['api_base_url']) || empty($settings['tenant_slug']) || empty($settings['bearer_token'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Plugin FXTAO Public Map sem URL, tenant ou token configurado.',
            ], 400);
        }

        $cacheKey = 'fxtao_public_map_' . md5($settings['api_base_url'] . '|' . $settings['tenant_slug']);
        $cachedPayload = get_transient($cacheKey);
        if (is_array($cachedPayload)) {
            return new WP_REST_Response($cachedPayload, 200);
        }

        $url = trailingslashit($settings['api_base_url']) . rawurlencode($settings['tenant_slug']) . '/obras/mapa';
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

        return new WP_REST_Response($body, $statusCode);
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
            'default_latitude' => '-23.55052',
            'default_longitude' => '-46.63331',
            'default_zoom' => 11,
            'cache_seconds' => 300,
        ];
    }
}

FXTAO_Public_Map_Plugin::init();
