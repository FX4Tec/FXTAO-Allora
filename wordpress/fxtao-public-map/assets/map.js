(function () {
    const config = window.FXTAOPublicMap || {};
    const markerLayers = new WeakMap();

    const statusLabel = {
        planejada: 'Planejada',
        em_andamento: 'Em andamento',
        pausada: 'Pausada',
        concluida: 'Concluída',
        cancelada: 'Cancelada',
    };

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const buildPopup = (obra, popupMode) => {
        if (popupMode === 'name') {
            return `<strong>${escapeHtml(obra.nome)}</strong>`;
        }

        if (popupMode === 'name_status') {
            return [
                `<strong>${escapeHtml(obra.nome)}</strong>`,
                obra.status ? `<span>Status: ${escapeHtml(statusLabel[obra.status] || obra.status)}</span>` : '',
            ].filter(Boolean).join('<br>');
        }

        const address = [
            obra.endereco,
            obra.numero,
            obra.bairro,
            obra.cidade,
            obra.uf,
        ].filter(Boolean).join(', ');

        return [
            `<strong>${escapeHtml(obra.nome)}</strong>`,
            obra.cliente ? `<span>${escapeHtml(obra.cliente)}</span>` : '',
            obra.status ? `<span>Status: ${escapeHtml(statusLabel[obra.status] || obra.status)}</span>` : '',
            address ? `<span>${escapeHtml(address)}</span>` : '',
            obra.url_publica ? `<a href="${escapeHtml(obra.url_publica)}" target="_blank" rel="noopener">Ver detalhes</a>` : '',
        ].filter(Boolean).join('<br>');
    };

    const workIdentifier = (obra) => String(obra.external_id || obra.nome || '');

    const buildEndpoint = (shell) => {
        const endpoint = new URL(config.endpoint, window.location.origin);
        const tenant = shell.dataset.tenant || '';
        const work = shell.dataset.work || '';

        if (tenant) endpoint.searchParams.set('tenant', tenant);
        if (work) endpoint.searchParams.set('obra', work);
        endpoint.searchParams.set('active_only', shell.dataset.activeOnly === '1' ? '1' : '0');
        endpoint.searchParams.set('fresh', '1');
        endpoint.searchParams.set('_ts', String(Date.now()));

        return endpoint.toString();
    };

    const clearMarkers = (map) => {
        const layers = markerLayers.get(map) || [];
        layers.forEach((layer) => map.removeLayer(layer));
        markerLayers.set(map, []);
    };

    const renderMarkers = (shell, map, works, status) => {
        clearMarkers(map);
        const bounds = [];
        const layers = [];
        const popupMode = shell.dataset.popupMode || 'complete';

        works.forEach((obra) => {
            const latitude = Number(obra.latitude);
            const longitude = Number(obra.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

            const marker = L.marker([latitude, longitude]).addTo(map).bindPopup(buildPopup(obra, popupMode));
            layers.push(marker);
            bounds.push([latitude, longitude]);
        });

        markerLayers.set(map, layers);

        if (bounds.length) {
            map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
            status.hidden = true;
            return;
        }

        status.hidden = false;
        status.textContent = 'Nenhuma obra ativa com coordenadas públicas para exibir.';
    };

    const populateSelector = (shell, works, map, status) => {
        const toolbar = shell.querySelector('.fxtao-public-map-toolbar');
        const select = shell.querySelector('.fxtao-public-map__select');
        const shouldShow = shell.dataset.showSelector === '1' && works.length > 1;
        const selectedBeforeRefresh = select.value;
        if (toolbar) toolbar.hidden = !shouldShow;
        select.hidden = !shouldShow;
        select.innerHTML = '';

        if (!shouldShow) return;

        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Todas as obras ativas';
        select.appendChild(allOption);

        works.forEach((obra) => {
            const option = document.createElement('option');
            option.value = workIdentifier(obra);
            option.textContent = obra.nome || workIdentifier(obra);
            select.appendChild(option);
        });

        if (selectedBeforeRefresh && works.some((obra) => workIdentifier(obra) === selectedBeforeRefresh)) {
            select.value = selectedBeforeRefresh;
        }

        select.onchange = () => {
            const selected = select.value;
            renderMarkers(
                shell,
                map,
                selected ? works.filter((obra) => workIdentifier(obra) === selected) : works,
                status
            );
        };
    };

    const loadWorks = async (shell, map, status) => {
        try {
            const response = await fetch(buildEndpoint(shell), {
                headers: { Accept: 'application/json' },
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Falha ao carregar obras.');
            }

            const works = Array.isArray(payload.data) ? payload.data : [];
            populateSelector(shell, works, map, status);
            const select = shell.querySelector('.fxtao-public-map__select');
            renderMarkers(
                shell,
                map,
                select && select.value ? works.filter((obra) => workIdentifier(obra) === select.value) : works,
                status
            );
        } catch (error) {
            status.hidden = false;
            status.textContent = error.message || 'Falha ao carregar o mapa.';
        }
    };

    const initMap = async (shell) => {
        const container = shell.querySelector('.fxtao-public-map');
        const status = shell.querySelector('.fxtao-public-map__status');
        const map = L.map(container).setView([
            Number(config.defaultLatitude || -23.55052),
            Number(config.defaultLongitude || -46.63331),
        ], Number(config.defaultZoom || 11));

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        await loadWorks(shell, map, status);

        const refreshSeconds = Number(shell.dataset.refreshSeconds || 0);
        if (Number.isFinite(refreshSeconds) && refreshSeconds > 0) {
            window.setInterval(() => loadWorks(shell, map, status), refreshSeconds * 1000);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.fxtao-public-map-shell').forEach(initMap);
    });
}());
