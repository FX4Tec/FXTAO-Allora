(function () {
  const clamp = (value) => Math.min(100, Math.max(0, Number(value || 0)));
  const parsePixelHeight = (value) => {
    const match = String(value || '').trim().match(/^(\d+)px$/i);
    return match ? Number(match[1]) : null;
  };
  const wrapperClass = (config) => [
    config.card === false ? 'fxtao-progress-body' : 'fxtao-progress-card',
    config.compact ? 'fxtao-progress-card--compact' : '',
  ].filter(Boolean).join(' ');

  const endpointUrl = (config, refresh) => {
    const params = new URLSearchParams({
      tenant: config.tenant || '',
      obra: config.workRef || '',
      tipo: config.chartType || 'bar',
      titulo: config.title || 'Evolução da Obra',
      fxtao_url: config.fxtaoUrl || '',
    });

    if (refresh) params.set('refresh', '1');
    return `${config.endpoint}?${params.toString()}`;
  };

  const ajaxEndpointUrl = (config, refresh) => {
    const params = new URLSearchParams({
      action: 'fxtao_progress_chart',
      tenant: config.tenant || '',
      obra: config.workRef || '',
      tipo: config.chartType || 'bar',
      titulo: config.title || 'Evolução da Obra',
      fxtao_url: config.fxtaoUrl || '',
    });

    if (refresh) params.set('refresh', '1');
    return `${config.ajaxEndpoint}?${params.toString()}`;
  };

  const renderBar = (items, config) => {
    const visibleItems = config.showZeros === false
      ? items.filter((item) => clamp(item.percentage) > 0)
      : items;

    if (!visibleItems.length) {
      return '<p class="fxtao-progress-empty">Nenhum tópico com percentual publicado para esta obra.</p>';
    }

    const requestedHeight = parsePixelHeight(config.height);
    const titleReserve = config.showTitle === false ? 0 : 58;
    const availableHeight = requestedHeight ? Math.max(120, requestedHeight - titleReserve) : null;
    const rowCount = Math.max(1, visibleItems.length);
    const dynamicGap = availableHeight ? Math.max(3, Math.min(9, Math.floor(availableHeight / rowCount * 0.16))) : null;
    const dynamicRowHeight = availableHeight ? Math.max(15, Math.min(28, Math.floor((availableHeight - (rowCount - 1) * dynamicGap) / rowCount))) : null;
    const dynamicFontSize = dynamicRowHeight ? Math.max(10, Math.min(15, Math.floor(dynamicRowHeight * 0.48))) : null;
    const heightStyle = [
      availableHeight ? `height:${availableHeight}px` : '',
      dynamicRowHeight ? `--fxtao-progress-row-height:${dynamicRowHeight}px` : '',
      dynamicGap ? `--fxtao-progress-row-gap:${dynamicGap}px` : '',
      dynamicFontSize ? `--fxtao-progress-font-size:${dynamicFontSize}px` : '',
    ].filter(Boolean).join(';');

    return `
    <div class="fxtao-progress-bars" style="${heightStyle}">
      ${visibleItems.map((item) => {
        const percent = clamp(item.percentage);
        const percentLabel = `${percent}%`;
        const rowClass = [
          percent === 0 ? 'fxtao-progress-row--zero' : '',
          percent > 0 && percent < 12 ? 'fxtao-progress-row--low' : '',
        ].filter(Boolean).join(' ');
        return `
          <div class="fxtao-progress-row${rowClass ? ` ${rowClass}` : ''}">
            <div class="fxtao-progress-label" title="${escapeHtml(item.topic)}">${escapeHtml(item.topic)}</div>
            <div class="fxtao-progress-track" role="img" aria-label="${escapeHtml(item.topic)}: ${percentLabel}">
              <div class="fxtao-progress-fill" style="width:${percent}%">
                <span class="fxtao-progress-value fxtao-progress-value--inside">${percentLabel}</span>
              </div>
              <span class="fxtao-progress-value fxtao-progress-value--outside">${percentLabel}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  };

  const renderVertical = (items) => `
    <div class="fxtao-progress-vertical">
      ${items.map((item) => {
        const percent = clamp(item.percentage);
        return `
          <div class="fxtao-progress-column">
            <div class="fxtao-progress-column-track"><div style="height:${percent}%"></div></div>
            <strong>${percent}%</strong>
            <span>${escapeHtml(item.topic)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  const renderDonut = (items) => {
    const average = items.length ? Math.round(items.reduce((sum, item) => sum + clamp(item.percentage), 0) / items.length) : 0;
    return `
      <div class="fxtao-progress-donut-wrap">
        <div class="fxtao-progress-donut" style="--progress:${average}"><span>${average}%</span></div>
        <div class="fxtao-progress-donut-items">
          ${items.map((item) => `<p><strong>${escapeHtml(item.topic)}</strong><span>${clamp(item.percentage)}%</span></p>`).join('')}
        </div>
      </div>
    `;
  };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const renderChart = (element, payload, config) => {
    const items = payload?.data?.items || [];
    const title = payload?.title || config.title || 'Evolução da Obra';
    const chartType = payload?.chart_type || config.chartType || 'bar';
    const titleMarkup = config.showTitle === false ? '' : `<h2>${escapeHtml(title)}</h2>`;
    const footerMarkup = config.showFooter === false ? '' : renderFooter(config, payload);

    if (!items.length) {
      element.innerHTML = `<div class="${wrapperClass(config)}">${titleMarkup}<p class="fxtao-progress-empty">Nenhum tópico publicado para esta obra.</p>${footerMarkup}</div>`;
      return;
    }

    const body = chartType === 'vertical' ? renderVertical(items) : chartType === 'donut' ? renderDonut(items) : renderBar(items, config);
    element.innerHTML = `<div class="${wrapperClass(config)}">${titleMarkup}${body}${footerMarkup}</div>`;
  };

  const renderFooter = (config, payload) => {
    const updated = payload?.last_update ? new Date(payload.last_update).toLocaleString() : '';
    const link = config.showLink === false || !config.fxtaoUrl ? '' : `<a href="${escapeHtml(config.fxtaoUrl)}" target="_blank" rel="noopener">Abrir FXTAO</a>`;
    const button = config.showRefreshButton ? '<button type="button" class="fxtao-progress-refresh">Atualizar agora</button>' : '';
    return `<div class="fxtao-progress-footer"><span>${updated ? `Atualizado em ${escapeHtml(updated)}` : ''}</span><div>${link}${button}</div></div>`;
  };

  const loadChart = async (element, config, refresh) => {
    element.classList.add('is-loading');
    try {
      let response = await fetch(endpointUrl(config, refresh), { credentials: 'same-origin' });
      let contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && config.ajaxEndpoint) {
        response = await fetch(ajaxEndpointUrl(config, refresh), { credentials: 'same-origin' });
        contentType = response.headers.get('content-type') || '';
      }
      const payload = contentType.includes('application/json') ? await response.json() : null;
      if (!payload) throw new Error('Resposta inválida do WordPress/servidor. Limpe o cache do LiteSpeed/Cloudflare e reinstale o plugin atualizado.');
      if (!response.ok || payload.success === false) throw new Error(payload.message || 'Falha ao carregar dados.');
      renderChart(element, payload, config);
    } catch (error) {
      const titleMarkup = config.showTitle === false ? '' : `<h2>${escapeHtml(config.title || 'Evolução da Obra')}</h2>`;
      const footerMarkup = config.showFooter === false ? '' : renderFooter(config, null);
      element.innerHTML = `<div class="${wrapperClass(config)}">${titleMarkup}<p class="fxtao-progress-error">${escapeHtml(error.message)}</p>${footerMarkup}</div>`;
    } finally {
      element.classList.remove('is-loading');
    }
  };

  const init = (element) => {
    if (element.dataset.ready === '1') return;
    element.dataset.ready = '1';

    const config = JSON.parse(element.dataset.config || '{}');
    loadChart(element, config, true);

    element.addEventListener('click', (event) => {
      if (event.target.matches('.fxtao-progress-refresh')) {
        loadChart(element, config, true);
      }
    });

    const minutes = Number(config.refreshMinutes || 0);
    if (minutes > 0) {
      window.setInterval(() => loadChart(element, config, true), minutes * 60 * 1000);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.fxtao-progress-chart').forEach(init);
  });
}());
