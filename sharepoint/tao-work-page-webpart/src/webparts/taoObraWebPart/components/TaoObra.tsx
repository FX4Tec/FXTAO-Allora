import * as React from 'react';
import { AadHttpClient } from '@microsoft/sp-http';
import styles from './TaoObra.module.scss';
import type { ITaoObraProps } from './ITaoObraProps';

interface ICostCenter {
  id: string;
  code: string;
  name: string;
  purpose: string;
  isPrimary: boolean;
}

interface IWorkData {
  id: string;
  erpNumber?: string;
  projectCode?: string;
  projectName: string;
  clientCode?: string;
  clientName?: string;
  companyCode?: string;
  companyName?: string;
  architecture?: string;
  areaM2?: number;
  statusLabel?: string;
  segment?: string;
  projectType?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  address: {
    street?: string;
    neighborhood?: string;
    zipCode?: string;
    city?: string;
    state?: string;
    complement?: string;
  };
  costCenters: ICostCenter[];
  updatedAt: string;
}

interface IFieldDefinition {
  key: string;
  label: string;
  group: string;
  value: (work: IWorkData, context: IFieldContext) => string;
}

interface IFieldOverride {
  key?: string;
  label?: string;
  enabled?: boolean;
  value?: string | number;
  template?: string;
  type?: string;
  from?: string;
  to?: string;
  suffix?: string;
  fallback?: string;
}

interface IResolvedField extends IFieldDefinition {
  enabled?: boolean;
}

interface IFieldContext {
  clientCostCenters: ICostCenter[];
  companyCostCenters: ICostCenter[];
}

const displayValue = (value?: string | number): string => value === undefined || value === null || value === '' ? '—' : String(value);
const formatDate = (value?: string): string => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value)) : '—';
const formatArea = (value?: number): string => value ? `${Number(value).toLocaleString('pt-BR')} m²` : '—';

const DEFAULT_FIELDS: IFieldDefinition[] = [
  { key: 'erpNumber', label: 'N° ERP', group: 'project', value: (work) => displayValue(work.erpNumber || work.projectCode) },
  { key: 'projectCode', label: 'Código da obra', group: 'project', value: (work) => displayValue(work.projectCode) },
  { key: 'projectName', label: 'Obra', group: 'project', value: (work) => displayValue(work.projectName) },
  { key: 'clientName', label: 'Cliente', group: 'project', value: (work) => displayValue(work.clientName) },
  { key: 'architecture', label: 'Arquitetura', group: 'project', value: (work) => displayValue(work.architecture) },
  { key: 'areaM2', label: 'Dimensões', group: 'project', value: (work) => formatArea(work.areaM2) },
  { key: 'projectType', label: 'Tipo de obra', group: 'project', value: (work) => displayValue(work.projectType) },
  { key: 'street', label: 'Local', group: 'project', value: (work) => displayValue(work.address.street) },
  { key: 'neighborhood', label: 'Bairro', group: 'project', value: (work) => displayValue(work.address.neighborhood) },
  { key: 'zipCode', label: 'CEP', group: 'project', value: (work) => displayValue(work.address.zipCode) },
  { key: 'cityState', label: 'Cidade', group: 'project', value: (work) => displayValue([work.address.city, work.address.state].filter(Boolean).join(' / ')) },
  { key: 'complement', label: 'Complemento', group: 'project', value: (work) => displayValue(work.address.complement) },
  { key: 'companyName', label: 'Empresa', group: 'company', value: (work) => displayValue(work.companyName) },
  { key: 'companyCode', label: 'Código empresa', group: 'company', value: (work) => displayValue(work.companyCode) },
  { key: 'clientCode', label: 'Código cliente', group: 'company', value: (work) => displayValue(work.clientCode) },
  { key: 'clientCostCenters', label: 'CC cliente', group: 'company', value: (_work, context) => displayValue(context.clientCostCenters.map((item) => item.code).join(', ')) },
  { key: 'companyCostCenters', label: 'CC empresa', group: 'company', value: (_work, context) => displayValue(context.companyCostCenters.map((item) => item.code).join(', ')) },
  { key: 'segment', label: 'Segmento', group: 'contract', value: (work) => displayValue(work.segment) },
  { key: 'contractType', label: 'Tipo de contrato', group: 'contract', value: (work) => displayValue(work.contractType) },
  { key: 'startDate', label: 'Data de início', group: 'contract', value: (work) => formatDate(work.startDate) },
  { key: 'endDate', label: 'Data de entrega', group: 'contract', value: (work) => formatDate(work.endDate) },
  { key: 'contractMonths', label: 'Prazo Contratual', group: 'contract', value: (work) => formatMonthsBetween(work.startDate, work.endDate, 'meses') }
];

const normalizeCsvList = (value: string): string[] =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseFieldOverrides = (value: string): IFieldOverride[] => {
  if (!value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
      .map((item) => ({
        key: typeof item.key === 'string' ? item.key.trim() : undefined,
        label: typeof item.label === 'string' ? item.label.trim() : undefined,
        enabled: typeof item.enabled === 'boolean' ? item.enabled : undefined,
        value: typeof item.value === 'string' || typeof item.value === 'number' ? item.value : undefined,
        template: typeof item.template === 'string' ? item.template : undefined,
        type: typeof item.type === 'string' ? item.type.trim() : undefined,
        from: typeof item.from === 'string' ? item.from.trim() : undefined,
        to: typeof item.to === 'string' ? item.to.trim() : undefined,
        suffix: typeof item.suffix === 'string' ? item.suffix.trim() : undefined,
        fallback: typeof item.fallback === 'string' ? item.fallback : undefined
      }))
      .filter((item) => item.key || item.label || item.template || item.value !== undefined);
  } catch {
    return [];
  }
};

const hexToRgba = (color: string, alpha: number): string => {
  const normalized = String(color || '').trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
    return `rgba(255,255,255,${alpha})`;
  }

  const hex = normalized.length === 4
    ? normalized.replace(/^#(.)(.)(.)$/i, '#$1$1$2$2$3$3')
    : normalized;

  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const fieldValueByKey = (work: IWorkData, context: IFieldContext, key: string): string => {
  const field = DEFAULT_FIELDS.find((item) => item.key === key);
  return field ? field.value(work, context) : '—';
};

const rawValueByKey = (work: IWorkData, context: IFieldContext, key: string): string => {
  switch (key) {
    case 'erpNumber': return displayValue(work.erpNumber || work.projectCode);
    case 'projectCode': return displayValue(work.projectCode);
    case 'projectName': return displayValue(work.projectName);
    case 'clientName': return displayValue(work.clientName);
    case 'architecture': return displayValue(work.architecture);
    case 'areaM2': return work.areaM2 ? Number(work.areaM2).toLocaleString('pt-BR') : '—';
    case 'street': return displayValue(work.address.street);
    case 'cityState': return displayValue([work.address.city, work.address.state].filter(Boolean).join(' / '));
    case 'companyName': return displayValue(work.companyName);
    case 'clientCostCenters': return displayValue(context.clientCostCenters.map((item) => item.code).join(', '));
    case 'companyCostCenters': return displayValue(context.companyCostCenters.map((item) => item.code).join(', '));
    case 'startDate': return formatDate(work.startDate);
    case 'endDate': return formatDate(work.endDate);
    case 'contractMonths': return formatMonthsBetween(work.startDate, work.endDate, 'meses');
    default: return fieldValueByKey(work, context, key);
  }
};

const templateValue = (template: string, work: IWorkData, context: IFieldContext, fallback = '—'): string => {
  const rendered = template.replace(/\{([a-zA-Z0-9_.-]+)\}/g, (_match, key: string) => {
    const value = rawValueByKey(work, context, key);
    return value === '—' ? '' : value;
  }).trim();
  return rendered || fallback;
};

const parseDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

function formatMonthsBetween(from?: string, to?: string, suffix = 'meses'): string {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return '—';

  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() >= start.getUTCDate()) months += 1;
  months = Math.max(months, 0);
  return `${months} ${suffix || 'meses'}`;
}

const resolveDateSource = (work: IWorkData, context: IFieldContext, source?: string): string | undefined => {
  if (!source) return undefined;
  if (source === 'startDate') return work.startDate;
  if (source === 'endDate') return work.endDate;
  const resolved = rawValueByKey(work, context, source);
  return resolved === '—' ? undefined : resolved;
};

const resolveOverrideField = (override: IFieldOverride, defaultFieldMap: Map<string, IFieldDefinition>): IResolvedField | undefined => {
  const baseField = override.key ? defaultFieldMap.get(override.key) : undefined;
  const key = override.key || `custom-${override.label || override.template || 'field'}`;
  const label = override.label || baseField?.label || '';

  if (override.type === 'manual') {
    return {
      key,
      label,
      group: baseField?.group || 'custom',
      enabled: override.enabled !== false,
      value: () => displayValue(override.value)
    };
  }

  if (override.type === 'template' || override.template) {
    return {
      key,
      label,
      group: baseField?.group || 'custom',
      enabled: override.enabled !== false,
      value: (work, context) => templateValue(override.template || '', work, context, override.fallback)
    };
  }

  if (override.type === 'dateDiffMonths') {
    return {
      key,
      label,
      group: baseField?.group || 'contract',
      enabled: override.enabled !== false,
      value: (work, context) => formatMonthsBetween(resolveDateSource(work, context, override.from), resolveDateSource(work, context, override.to), override.suffix || 'meses')
    };
  }

  if (!baseField) return undefined;

  return {
    ...baseField,
    label: override.label || baseField.label,
    enabled: override.enabled !== false,
    value: (work, context) => {
      const resolved = baseField.value(work, context);
      return resolved === '—' && override.fallback !== undefined ? override.fallback : resolved;
    }
  };
};

export default function TaoObra(props: ITaoObraProps): React.ReactElement<ITaoObraProps> {
  const [work, setWork] = React.useState<IWorkData>();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>();

  const loadWork = React.useCallback(async (): Promise<void> => {
    if (!props.taoIdentifier || !props.apiBaseUrl || !props.apiResourceUri) {
      setLoading(false);
      setError('Configure o identificador da obra, a URL da API e o recurso Entra ID nas propriedades da Web Part.');
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const client = await props.aadHttpClientFactory.getClient(props.apiResourceUri);
      const endpoint = `${props.apiBaseUrl.replace(/\/$/, '')}/api/v1/sharepoint/works/${encodeURIComponent(props.taoIdentifier.trim())}`;
      const response = await client.get(endpoint, AadHttpClient.configurations.v1);
      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(responseBody || `Falha HTTP ${response.status}`);
      }
      setWork(await response.json() as IWorkData);
    } catch (requestError) {
      setWork(undefined);
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar a obra.');
    } finally {
      setLoading(false);
    }
  }, [props.aadHttpClientFactory, props.apiBaseUrl, props.apiResourceUri, props.taoIdentifier]);

  React.useEffect(() => {
    const refresh = (): void => {
      loadWork().catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível atualizar a obra.');
      });
    };
    refresh();
    if (!props.refreshMinutes || props.refreshMinutes <= 0) return undefined;
    const timer = window.setInterval(refresh, props.refreshMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadWork, props.refreshMinutes]);

  if (loading) return <section className={styles.state}>Carregando dados da obra…</section>;
  if (error) return <section className={`${styles.state} ${styles.error}`}><strong>Integração TAO indisponível</strong><span>{error}</span></section>;
  if (!work) return <section className={styles.state}>Obra não encontrada.</section>;

  const clientCostCenters = work.costCenters.filter((item) => item.purpose === 'CLIENTE');
  const companyCostCenters = work.costCenters.filter((item) => item.purpose === 'CONSTRUTORA');
  const fieldContext: IFieldContext = { clientCostCenters, companyCostCenters };
  const portalUrl = props.taoPortalBaseUrl && props.showPortalLink
    ? `${props.taoPortalBaseUrl.replace(/\/$/, '')}/TaoForm?id=${encodeURIComponent(work.id)}`
    : undefined;
  const panelOpacity = Math.min(Math.max((props.panelBackgroundOpacity ?? 85) / 100, 0), 1);
  const visibleFields = normalizeCsvList(props.visibleFieldsCsv);
  const hiddenFields = new Set(normalizeCsvList(props.hiddenFieldsCsv));
  const fieldOverrides = parseFieldOverrides(props.fieldsJson);
  const defaultFieldMap = new Map(DEFAULT_FIELDS.map((field) => [field.key, field]));

  let orderedFields: IResolvedField[] = [...DEFAULT_FIELDS];
  if (visibleFields.length > 0) {
    const visibleResolved: IResolvedField[] = [];
    visibleFields.forEach((key) => {
      const field = defaultFieldMap.get(key);
      if (field) visibleResolved.push(field);
    });
    orderedFields = visibleResolved;
  }

  if (fieldOverrides.length > 0) {
    const overrideResolved: IResolvedField[] = [];
    fieldOverrides.forEach((override) => {
      const resolved = resolveOverrideField(override, defaultFieldMap);
      if (resolved) overrideResolved.push(resolved);
    });
    orderedFields = overrideResolved;
  }

  const filteredFields = orderedFields
    .filter((field) => !hiddenFields.has(field.key))
    .filter((field) => props.showCostCenters || ['clientCostCenters', 'companyCostCenters'].indexOf(field.key) === -1)
    .filter((field) => field.enabled !== false);

  const groupedFields = filteredFields.reduce<Record<string, IResolvedField[]>>((acc, field) => {
    acc[field.group] = acc[field.group] || [];
    acc[field.group].push(field);
    return acc;
  }, {});

  const layoutMode = props.layoutMode || 'classic';
  const groupOrder = layoutMode === 'overlay'
    ? Object.keys(groupedFields)
    : ['project', 'company', 'contract', 'custom'].filter((group) => groupedFields[group]?.length > 0);
  const shellClasses = [styles.taoObra];
  if (layoutMode === 'overlay') shellClasses.push(styles.overlay);
  if (layoutMode === 'minimal') shellClasses.push(styles.minimal);
  if (props.transparentShell || layoutMode === 'overlay') shellClasses.push(styles.transparentShell);

  const detailsStyle: React.CSSProperties = props.panelBackgroundUseImage && props.panelBackgroundImageUrl
    ? {
      backgroundImage: `linear-gradient(${hexToRgba(props.panelBackgroundColor, panelOpacity)}, ${hexToRgba(props.panelBackgroundColor, panelOpacity)}), url("${props.panelBackgroundImageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
    : {
      backgroundColor: layoutMode === 'overlay' && props.transparentShell ? 'transparent' : hexToRgba(props.panelBackgroundColor, panelOpacity)
    };
  const themeStyle: React.CSSProperties = {
    ['--fx-header-bg' as string]: props.headerBackgroundColor || '#263547',
    ['--fx-header-text' as string]: props.headerTextColor || '#ffffff',
    ['--fx-header-accent' as string]: props.headerAccentColor || '#f5b94d',
    ['--fx-data-text' as string]: props.dataTextColor || '#20242a',
    ['--fx-data-label' as string]: props.dataLabelColor || '#69727d',
    ['--fx-field-label-width' as string]: `${props.fieldLabelWidth ?? 118}px`,
    ['--fx-field-font-size' as string]: `${props.fieldFontSize ?? 14}px`,
    ['--fx-field-line-height' as string]: String(props.fieldLineHeight ?? 1.35),
    ['--fx-field-gap' as string]: `${props.fieldGap ?? 10}px`,
    ['--fx-content-padding' as string]: `${props.contentPadding ?? 24}px`,
    ['--fx-max-width' as string]: props.maxWidth && props.maxWidth > 0 ? `${props.maxWidth}px` : '100%'
  };

  return (
    <section className={shellClasses.join(' ')} style={themeStyle}>
      {props.customCss && <style>{props.customCss}</style>}
      {props.showHeader !== false && layoutMode !== 'overlay' && (
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>{props.title || 'Página da Obra'}</span>
            <h2>{displayValue(work.erpNumber || work.projectCode)} · {work.projectName}</h2>
          </div>
          {props.showStatus && <span className={styles.status}>{displayValue(work.statusLabel)}</span>}
        </header>
      )}

      <div className={`${styles.content} ${alignmentClass(props.fieldAlignment)}`}>
        <div className={styles.details} style={detailsStyle}>
          {groupOrder.map((group, groupIndex) => (
            <React.Fragment key={group}>
              {groupedFields[group].map((field) => (
                <DataRow
                  key={field.key}
                  label={field.label}
                  value={field.value(work, fieldContext)}
                  inline={layoutMode === 'overlay'}
                />
              ))}
              {layoutMode !== 'overlay' && groupIndex < groupOrder.length - 1 && <div className={styles.separator} />}
            </React.Fragment>
          ))}
          {portalUrl && <a className={styles.portalLink} href={portalUrl} target="_blank" rel="noreferrer">Abrir cadastro completo no FX TAO</a>}
        </div>
      </div>
    </section>
  );
}

function DataRow({ label, value, inline }: { label: string; value?: string; inline?: boolean }): React.ReactElement {
  return (
    <div className={inline ? `${styles.dataRow} ${styles.dataRowInline}` : styles.dataRow}>
      {label && <span>{label}:</span>}
      <strong>{displayValue(value)}</strong>
    </div>
  );
}

function alignmentClass(value?: string): string {
  if (value === 'center') return styles.alignCenter;
  if (value === 'right') return styles.alignRight;
  return styles.alignLeft;
}
