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
  key: string;
  label?: string;
  enabled?: boolean;
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

const DEFAULT_FIELDS: IFieldDefinition[] = [
  { key: 'clientName', label: 'Cliente', group: 'project', value: (work) => displayValue(work.clientName) },
  { key: 'architecture', label: 'Arquitetura', group: 'project', value: (work) => displayValue(work.architecture) },
  { key: 'areaM2', label: 'Dimensões', group: 'project', value: (work) => work.areaM2 ? `${Number(work.areaM2).toLocaleString('pt-BR')} m²` : '—' },
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
  { key: 'endDate', label: 'Data de entrega', group: 'contract', value: (work) => formatDate(work.endDate) }
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
        key: String(item.key || '').trim(),
        label: typeof item.label === 'string' ? item.label.trim() : undefined,
        enabled: typeof item.enabled === 'boolean' ? item.enabled : undefined
      }))
      .filter((item) => item.key);
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
  const portalUrl = props.taoPortalBaseUrl
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
      const baseField = defaultFieldMap.get(override.key);
      if (!baseField) return;

      overrideResolved.push({
        ...baseField,
        label: override.label || baseField.label,
        enabled: override.enabled !== false
      });
    });
    orderedFields = overrideResolved;
  }

  const filteredFields = orderedFields
    .filter((field) => !hiddenFields.has(field.key))
    .filter((field) => props.showCostCenters || ['clientCostCenters', 'companyCostCenters'].indexOf(field.key) === -1)
    .filter((field) => field.enabled !== false);

  const groupedFields = filteredFields.reduce<Record<string, IFieldDefinition[]>>((acc, field) => {
    acc[field.group] = acc[field.group] || [];
    acc[field.group].push(field);
    return acc;
  }, {});

  const groupOrder = ['project', 'company', 'contract'].filter((group) => groupedFields[group]?.length > 0);
  const detailsStyle: React.CSSProperties = props.panelBackgroundUseImage && props.panelBackgroundImageUrl
    ? {
      backgroundImage: `linear-gradient(${hexToRgba(props.panelBackgroundColor, panelOpacity)}, ${hexToRgba(props.panelBackgroundColor, panelOpacity)}), url("${props.panelBackgroundImageUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
    : {
      backgroundColor: hexToRgba(props.panelBackgroundColor, panelOpacity)
    };
  const themeStyle: React.CSSProperties = {
    ['--fx-header-bg' as string]: props.headerBackgroundColor || '#263547',
    ['--fx-header-text' as string]: props.headerTextColor || '#ffffff',
    ['--fx-header-accent' as string]: props.headerAccentColor || '#f5b94d',
    ['--fx-data-text' as string]: props.dataTextColor || '#20242a',
    ['--fx-data-label' as string]: props.dataLabelColor || '#69727d'
  };

  return (
    <section className={styles.taoObra} style={themeStyle}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{props.title || 'Página da Obra'}</span>
          <h2>{displayValue(work.erpNumber || work.projectCode)} · {work.projectName}</h2>
        </div>
        {props.showStatus && <span className={styles.status}>{displayValue(work.statusLabel)}</span>}
      </header>

      <div className={styles.content}>
        <div className={styles.details} style={detailsStyle}>
          {groupOrder.map((group, groupIndex) => (
            <React.Fragment key={group}>
              {groupedFields[group].map((field) => (
                <DataRow
                  key={field.key}
                  label={field.label}
                  value={field.value(work, fieldContext)}
                />
              ))}
              {groupIndex < groupOrder.length - 1 && <div className={styles.separator} />}
            </React.Fragment>
          ))}
          {portalUrl && <a className={styles.portalLink} href={portalUrl} target="_blank" rel="noreferrer">Abrir cadastro completo no FX TAO</a>}
        </div>
      </div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value?: string }): React.ReactElement {
  return <div className={styles.dataRow}><span>{label}:</span><strong>{displayValue(value)}</strong></div>;
}
