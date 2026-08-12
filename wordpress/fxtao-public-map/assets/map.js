(function () {
    const config = window.FXTAOPublicMap || {};

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

    const buildPopup = (obra) => {
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

    const initMap = async (container) => {
        const status = container.querySelector('.fxtao-public-map__status');
        const map = L.map(container).setView([
            Number(config.defaultLatitude || -23.55052),
            Number(config.defaultLongitude || -46.63331),
        ], Number(config.defaultZoom || 11));

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        try {
            const response = await fetch(config.endpoint, {
                headers: { Accept: 'application/json' },
            });
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Falha ao carregar obras.');
            }

            const bounds = [];
            payload.data.forEach((obra) => {
                const latitude = Number(obra.latitude);
                const longitude = Number(obra.longitude);
                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

                L.marker([latitude, longitude]).addTo(map).bindPopup(buildPopup(obra));
                bounds.push([latitude, longitude]);
            });

            if (bounds.length) {
                map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
                status.remove();
                return;
            }

            status.textContent = 'Nenhuma obra com coordenadas públicas para exibir.';
        } catch (error) {
            status.textContent = error.message || 'Falha ao carregar o mapa.';
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.fxtao-public-map').forEach(initMap);
    });
}());
