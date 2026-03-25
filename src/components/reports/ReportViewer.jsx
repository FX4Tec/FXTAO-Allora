import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDateValue,
  getApprovalStatusLabel,
  getStatusLabel,
  normalizeStatus,
  toNumber,
  useReportResourceList,
  useReportTaoDetail,
} from './useReportData';

const PHASES = [
  { id: 'start', title: 'Cadastro', subtitle: 'Dados iniciais da obra' },
  { id: '1', title: 'Contrato', subtitle: 'Estrutura comercial e fiscal' },
  { id: '2', title: 'Recebíveis', subtitle: 'Parcelas e equipe' },
  { id: '3', title: 'Aditivos', subtitle: 'Complementos de contrato' },
  { id: '4', title: 'Compliance', subtitle: 'Escopo e obrigações' },
  { id: '5', title: 'Fechamento', subtitle: 'Contatos e anexos' },
];

const INSTALLMENT_TYPE_LABELS = {
  direct: 'Direto',
  consultancy: 'Consultoria',
  construction: 'Construção',
};

const APPROVAL_SCOPE_LABELS = {
  both: 'TAO e Aditivos',
  tao: 'Apenas TAO',
  additive: 'Apenas Aditivos',
};

const ADDITIVE_STATUS_LABELS = {
  draft: 'Rascunho',
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

function formatTextValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatCurrencyValue(value) {
  return value === null || value === undefined || value === '' ? '-' : formatCurrency(value);
}

function formatPercentValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return `${toNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatDateTimeValue(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pt-BR');
}

function formatBooleanValue(value, truthy = 'Sim', falsy = 'Não') {
  return value ? truthy : falsy;
}

function getStatusBadgeClass(status) {
  return {
    start: 'bg-slate-100 text-slate-700 border-slate-200',
    '1': 'bg-blue-100 text-blue-700 border-blue-200',
    '2': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    '3': 'bg-violet-100 text-violet-700 border-violet-200',
    '4': 'bg-amber-100 text-amber-700 border-amber-200',
    '5': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[normalizeStatus(status)] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function getApprovalBadgeClass(status) {
  return {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatBankAccount(account) {
  if (!account) {
    return '-';
  }

  const pieces = [account.description, account.bank_name].filter(Boolean);

  if (account.agency) {
    pieces.push(`Ag. ${account.agency}`);
  }

  if (account.account_number) {
    pieces.push(`Conta ${account.account_number}`);
  }

  return pieces.join(' | ');
}

function ReportField({ label, value, className }) {
  return (
    <div className={cn('report-field rounded-[18px] border border-slate-200 bg-white p-4', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-3 text-sm font-medium leading-6 text-slate-900 whitespace-pre-line">
        {formatTextValue(value)}
      </div>
    </div>
  );
}

function SummaryBox({ label, value, note }) {
  return (
    <div className="report-kpi rounded-[18px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-[28px] font-bold tracking-tight text-slate-950">{formatTextValue(value)}</p>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function SectionBanner({ number, title, description }) {
  return (
    <div className="report-section-banner mb-6 rounded-r-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
            {number}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-950">{title}</h3>
            {description && <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubsectionTitle({ title, description }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-800">{title}</h4>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function TextPanel({ title, value, placeholder = 'Sem informação cadastrada.', className }) {
  return (
    <div className={cn('report-card rounded-[18px] border border-slate-200 bg-white p-5', className)}>
      <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-800">{title}</h4>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {value || placeholder}
      </p>
    </div>
  );
}

function DataTable({ columns, rows, emptyMessage }) {
  return (
    <div className="report-table-wrap overflow-x-auto rounded-[18px] border border-slate-200 bg-white">
      <table className="report-data-table min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn(
                  'border-b border-slate-200 bg-slate-100 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id || row.key || index} className="border-b border-slate-100 last:border-b-0">
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={cn('align-top px-4 py-3 text-sm text-slate-700', column.cellClassName)}
                  >
                    {column.render ? column.render(row) : formatTextValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PhaseStrip({ currentStatus }) {
  const currentIndex = PHASES.findIndex((phase) => phase.id === currentStatus);

  return (
    <div className="report-phase-strip grid grid-cols-2 gap-3 lg:grid-cols-6">
      {PHASES.map((phase, index) => {
        const completed = currentIndex >= index;

        return (
          <div
            key={phase.id}
            className={cn(
              'rounded-[18px] border px-4 py-3',
              completed ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold',
                  completed
                    ? 'border-blue-200 bg-blue-700 text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-500'
                )}
              >
                {completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-900">{phase.title}</p>
                <p className="text-xs leading-5 text-slate-500">{phase.subtitle}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentSection({ number, title, description, children }) {
  return (
    <section className="report-document-section space-y-6 rounded-[24px] border border-slate-200 bg-white p-6">
      <SectionBanner number={number} title={title} description={description} />
      <div className="space-y-6">{children}</div>
    </section>
  );
}

export default function ReportViewer({ taos = [] }) {
  const [selectedTaoId, setSelectedTaoId] = useState('');

  useEffect(() => {
    if (!selectedTaoId && taos.length > 0) {
      setSelectedTaoId(taos[0].id);
    }
  }, [selectedTaoId, taos]);

  const selectedSummary = useMemo(
    () => taos.find((tao) => tao.id === selectedTaoId),
    [selectedTaoId, taos]
  );

  const { data: tao, isLoading } = useReportTaoDetail(selectedTaoId);
  const { data: bankAccounts = [] } = useReportResourceList('bank-accounts');
  const { data: approvalHistory = [] } = useReportResourceList('tao-approval-history');

  const bankAccountMap = useMemo(
    () => new Map(bankAccounts.map((account) => [account.id, account])),
    [bankAccounts]
  );

  const currentStatus = normalizeStatus(selectedSummary?.status);
  const totalInstallments = tao?.installments?.reduce((sum, item) => sum + toNumber(item.value), 0) || 0;
  const totalInstallmentsPaid = tao?.installments
    ?.filter((item) => item.is_paid)
    .reduce((sum, item) => sum + toNumber(item.value), 0) || 0;
  const totalAdditives = tao?.additives?.reduce((sum, item) => sum + toNumber(item.value), 0) || 0;
  const activeApprovers = tao?.approvers?.length || 0;
  const additiveIds = new Set((tao?.additives || []).map((item) => item.id));

  const filteredHistory = approvalHistory
    .filter((entry) => (
      (entry.reference_type === 'tao' && entry.reference_id === tao?.id) ||
      (entry.reference_type === 'additive' && additiveIds.has(entry.reference_id))
    ))
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));

  const consultancyBankAccount = bankAccountMap.get(tao?.bank_account_consultancy_id);
  const constructionBankAccount = bankAccountMap.get(tao?.bank_account_construction_id);

  const taxRows = [
    { label: 'PIS', percent: tao?.tax_pis_percent, value: tao?.tax_pis_value },
    { label: 'COFINS', percent: tao?.tax_cofins_percent, value: tao?.tax_cofins_value },
    { label: 'CSLL', percent: tao?.tax_csll_percent, value: tao?.tax_csll_value },
    { label: 'IR', percent: tao?.tax_ir_percent, value: tao?.tax_ir_value },
    { label: 'ISS Retido pelo Cliente', percent: tao?.tax_iss_retained_client_percent, value: tao?.tax_iss_retained_client_value },
    { label: 'ISS Recolhido pela Empresa', percent: tao?.tax_iss_collected_company_percent, value: tao?.tax_iss_collected_company_value },
    { label: 'INSS Retido pelo Cliente', percent: tao?.tax_inss_retained_client_percent, value: tao?.tax_inss_retained_client_value },
    { label: 'INSS Recolhido pela Empresa', percent: tao?.tax_inss_collected_company_percent, value: tao?.tax_inss_collected_company_value },
    { label: 'COFINS Retido pelo Cliente', percent: tao?.tax_cofins_retained_client_percent, value: tao?.tax_cofins_retained_client_value },
    { label: 'Dedução de Sinal', percent: tao?.tax_deduction_signal_percent, value: tao?.tax_deduction_signal_value },
    { label: 'Retenção Contratual', percent: tao?.tax_contractual_retention_percent, value: tao?.tax_contractual_retention_value },
  ].filter((row) => row.percent !== null || row.value !== null);

  const complianceRows = [
    {
      item: 'Projeto Legal',
      status: formatBooleanValue(tao?.scope_project_legal_status, 'Contratado', 'Não contratado'),
      details: tao?.scope_project_legal_text,
    },
    {
      item: 'AVCB',
      status: formatBooleanValue(tao?.avcb_status, 'Ativo', 'Não informado'),
      details: tao?.avcb_text,
    },
    {
      item: 'Habite-se',
      status: formatBooleanValue(tao?.habite_se_status, 'Ativo', 'Não informado'),
      details: '-',
    },
  ];

  if (taos.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-slate-500">
          Nenhuma obra encontrada para gerar relatório.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="report-screen-shell space-y-6">
      <Card className="print:hidden">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Visualizar Relatório</p>
            <p className="text-sm text-slate-500">
              Documento executivo com diagramação de relatório, pronto para leitura em tela, impressão e PDF.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="w-full md:min-w-[320px]">
              <Select value={selectedTaoId} onValueChange={setSelectedTaoId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione uma obra" />
                </SelectTrigger>
                <SelectContent>
                  {taos.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / PDF
            </Button>
            {selectedSummary && (
              <Button asChild variant="outline">
                <Link to={`${createPageUrl('TaoForm')}?id=${selectedSummary.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Abrir TAO
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <article className="report-document report-print-root overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <header className="report-document-header border-b border-slate-200 bg-white px-6 py-6 md:px-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[32px] font-semibold tracking-tight text-slate-400">FX TAO</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-700">
                    Relatório Executivo de Obra
                  </p>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {selectedSummary?.project_name || 'Relatório da Obra'}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600">
                    Documento consolidado da TAO com visão por etapa, pronto para apresentação, impressão e geração em PDF.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:min-w-[360px]">
                <div className="grid grid-cols-2 gap-3">
                  <ReportField label="ERP" value={selectedSummary?.erp_number} />
                  <ReportField label="Emissão" value={formatDateValue(new Date())} />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="report-field rounded-[18px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status da Obra</p>
                    <div className="mt-3">
                      <Badge className={cn('border text-sm', getStatusBadgeClass(selectedSummary?.status))}>
                        {getStatusLabel(selectedSummary?.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="report-field rounded-[18px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Fluxo de Aprovação</p>
                    <div className="mt-3">
                      <Badge className={cn('border text-sm', getApprovalBadgeClass(tao?.approval_status))}>
                        {getApprovalStatusLabel(tao?.approval_status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[2px] w-full bg-gradient-to-r from-slate-900 via-blue-700 to-slate-200" />

            <PhaseStrip currentStatus={currentStatus} />
          </div>
        </header>

        {isLoading || !tao ? (
          <div className="p-12 text-center text-slate-500">Carregando dados da obra...</div>
        ) : (
          <div className="report-document-body space-y-6 bg-slate-50/70 p-6 md:p-8 print:bg-white">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryBox label="Contrato Total" value={formatCurrency(tao.value_total_contract)} />
              <SummaryBox label="Parcelas" value={`${tao.installments?.length || 0}`} note={formatCurrency(totalInstallments)} />
              <SummaryBox label="Aditivos" value={formatCurrency(totalAdditives)} />
              <SummaryBox label="Aprovadores" value={`${activeApprovers}`} />
            </div>

            <DocumentSection
              number="1"
              title="Cadastro e Abertura"
              description="Dados-base da obra, identificação principal, endereços, gestão e estrutura inicial de aprovação."
            >
              <div className="space-y-4">
                <SubsectionTitle title="Identificação da TAO" description="Referências principais do cadastro e do autor da abertura." />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <ReportField label="Obra" value={tao.project_name} />
                  <ReportField label="ID TAO" value={tao.id ? `#${tao.id.slice(-4)}` : '-'} />
                  <ReportField label="ERP" value={tao.erp_number} />
                  <ReportField label="Criado por" value={tao.created_by?.full_name || tao.created_by?.email} />
                  <ReportField label="Segmento" value={tao.segment} />
                  <ReportField label="Tipo de Projeto" value={tao.project_type} />
                  <ReportField label="Área" value={tao.area_m2 ? `${tao.area_m2} m²` : '-'} />
                  <ReportField label="Contrato Consultoria" value={formatBooleanValue(tao.contract_company_consultancy)} />
                  <ReportField label="Data de Criação" value={formatDateTimeValue(tao.created_at)} />
                  <ReportField label="Última Atualização" value={formatDateTimeValue(tao.updated_at)} />
                  <ReportField label="Latitude" value={tao.latitude} />
                  <ReportField label="Longitude" value={tao.longitude} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <SubsectionTitle title="Endereço de Faturamento" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportField label="Razão Social" value={tao.billing_company_name} />
                    <ReportField label="CNPJ" value={tao.billing_cnpj} />
                    <ReportField label="Endereço" value={tao.billing_address} />
                    <ReportField label="Bairro" value={tao.billing_neighborhood} />
                    <ReportField label="Cidade" value={tao.billing_city} />
                    <ReportField label="UF" value={tao.billing_state} />
                    <ReportField label="CEP" value={tao.billing_zip} />
                    <ReportField label="Não Estabelecido" value={formatBooleanValue(tao.billing_not_established)} />
                    <ReportField label="Inscrição Estadual" value={tao.billing_ie} />
                    <ReportField label="Inscrição Municipal" value={tao.billing_im} />
                    <ReportField label="DRM" value={tao.billing_drm} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SubsectionTitle title="Obra, Gestão e Bancos" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportField label="Endereço da Obra" value={tao.construction_address} />
                    <ReportField label="Bairro da Obra" value={tao.construction_neighborhood} />
                    <ReportField label="Cidade da Obra" value={tao.construction_city} />
                    <ReportField label="UF da Obra" value={tao.construction_state} />
                    <ReportField label="CEP da Obra" value={tao.construction_zip} />
                    <ReportField label="Empresa Gestora" value={tao.manager_company_name} />
                    <ReportField label="Endereço da Gestão" value={tao.manager_address} />
                    <ReportField label="Telefone da Gestão" value={tao.manager_phone} />
                    <ReportField label="Conta Consultoria" value={formatBankAccount(consultancyBankAccount)} />
                    <ReportField label="Conta Construção" value={formatBankAccount(constructionBankAccount)} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Estrutura de Aprovação" />
                <DataTable
                  emptyMessage="Nenhum aprovador configurado para esta obra."
                  rows={tao.approvers || []}
                  columns={[
                    { header: 'Nível', render: (row) => <span className="font-semibold text-slate-900">{row.level}</span>, cellClassName: 'w-24' },
                    { header: 'Aprovador', render: (row) => row.user_email || '-' },
                    { header: 'Escopo', render: (row) => APPROVAL_SCOPE_LABELS[row.scope] || row.scope },
                  ]}
                />
              </div>
            </DocumentSection>

            <DocumentSection
              number="2"
              title="Contrato e Financeiro"
              description="Estrutura contratual, valores, cronograma macro e composição tributária da obra."
            >
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <SubsectionTitle title="Detalhes do Contrato" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportField label="Regime de Contratação" value={tao.hiring_regime} />
                    <ReportField label="Modo de Cálculo" value={tao.calculation_mode === 'auto' ? 'Automático' : 'Manual'} />
                    <ReportField label="Assinatura" value={formatDateValue(tao.date_signature)} />
                    <ReportField label="Mobilização" value={formatDateValue(tao.date_mobilization)} />
                    <ReportField label="Início da Obra" value={formatDateValue(tao.date_start)} />
                    <ReportField label="Término da Obra" value={formatDateValue(tao.date_end)} />
                  </div>
                </div>

                <TextPanel title="Descrição Contratual" value={tao.contract_description} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryBox label="Faturamento Direto" value={formatCurrency(tao.value_billing_direct)} />
                <SummaryBox label="Consultoria" value={formatCurrency(tao.value_billing_consultancy)} />
                <SummaryBox label="Construção" value={formatCurrency(tao.value_billing_construction)} />
                <SummaryBox label="Impostos Totais" value={formatCurrency(tao.value_taxes)} />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Composição Financeira" />
                <DataTable
                  emptyMessage="Nenhuma composição financeira disponível."
                  rows={[
                    { key: 'contract', label: 'Contrato Total', value: tao.value_total_contract },
                    { key: 'direct', label: 'Faturamento Direto', value: tao.value_billing_direct },
                    { key: 'consultancy', label: 'Faturamento Consultoria', value: tao.value_billing_consultancy },
                    { key: 'construction', label: 'Faturamento Construção', value: tao.value_billing_construction },
                    { key: 'team', label: 'Equipe Técnica', value: tao.value_team_technical },
                    { key: 'cost', label: 'Custo de Construção', value: tao.value_cost_construction },
                    { key: 'rate1', label: 'Rateável 1', value: tao.value_rateable_1 },
                    { key: 'rate2', label: 'Rateável 2', value: tao.value_rateable_2 },
                    { key: 'brevenue', label: 'B Revenue', value: tao.value_b_revenue },
                  ].filter((row) => row.value !== null && row.value !== undefined && row.value !== '')}
                  columns={[
                    { header: 'Indicador', key: 'label' },
                    { header: 'Valor', render: (row) => <span className="font-semibold text-slate-900">{formatCurrencyValue(row.value)}</span>, cellClassName: 'w-52 text-right' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Estrutura Tributária" />
                <DataTable
                  emptyMessage="Nenhum tributo informado."
                  rows={taxRows}
                  columns={[
                    { header: 'Tributo', key: 'label' },
                    { header: 'Percentual', render: (row) => formatPercentValue(row.percent), cellClassName: 'w-40 text-right' },
                    { header: 'Valor', render: (row) => <span className="font-semibold text-slate-900">{formatCurrencyValue(row.value)}</span>, cellClassName: 'w-44 text-right' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <TextPanel title="Procedimento OME" value={tao.ome_procedure} />
                <TextPanel
                  title="Responsabilidade de Projetos"
                  value={tao.ome_billing_company ? 'Empresa responsável pelos projetos.' : 'Cliente responsável pelos projetos.'}
                />
              </div>
            </DocumentSection>

            <DocumentSection
              number="3"
              title="Recebíveis e Equipe"
              description="Cronograma financeiro das parcelas e quadro operacional vinculado à obra."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryBox label="Parcelas Cadastradas" value={`${tao.installments?.length || 0}`} />
                <SummaryBox label="Valor em Parcelas" value={formatCurrency(totalInstallments)} />
                <SummaryBox label="Recebido" value={formatCurrency(totalInstallmentsPaid)} />
                <SummaryBox label="Equipe" value={`${tao.team_members?.length || 0}`} />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Parcelas" />
                <DataTable
                  emptyMessage="Nenhuma parcela cadastrada para esta obra."
                  rows={tao.installments || []}
                  columns={[
                    { header: 'Descrição', key: 'description' },
                    { header: 'Tipo', render: (row) => INSTALLMENT_TYPE_LABELS[row.type] || row.type, cellClassName: 'w-36' },
                    { header: 'Vencimento', render: (row) => formatDateValue(row.due_date), cellClassName: 'w-32' },
                    {
                      header: 'Status',
                      render: (row) => (
                        <span className={cn(
                          'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                          row.is_paid ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-amber-200 bg-amber-100 text-amber-700'
                        )}>
                          {row.is_paid ? 'Pago' : 'Pendente'}
                        </span>
                      ),
                      cellClassName: 'w-32',
                    },
                    { header: 'Pagamento', render: (row) => formatDateValue(row.paid_date), cellClassName: 'w-32' },
                    { header: 'Valor', render: (row) => <span className="font-semibold text-slate-900">{formatCurrencyValue(row.value)}</span>, cellClassName: 'w-40 text-right' },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Equipe da Obra" />
                <DataTable
                  emptyMessage="Nenhum membro de equipe cadastrado."
                  rows={tao.team_members || []}
                  columns={[
                    { header: 'Nome', key: 'name' },
                    { header: 'Função', render: (row) => row.role || '-', cellClassName: 'w-40' },
                    { header: 'Tipo', render: (row) => row.team_type || '-', cellClassName: 'w-40' },
                    { header: 'Contato', render: (row) => row.email || '-', cellClassName: 'w-56' },
                  ]}
                />
              </div>
            </DocumentSection>

            <DocumentSection
              number="4"
              title="Aditivos"
              description="Acompanhamento dos complementos contratuais com status, data e valor."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryBox label="Quantidade" value={`${tao.additives?.length || 0}`} />
                <SummaryBox label="Aprovados" value={`${tao.additives?.filter((item) => item.approval_status === 'approved').length || 0}`} />
                <SummaryBox label="Pendentes" value={`${tao.additives?.filter((item) => item.approval_status === 'pending').length || 0}`} />
                <SummaryBox label="Valor Total" value={formatCurrency(totalAdditives)} />
              </div>

              <DataTable
                emptyMessage="Nenhum aditivo cadastrado para esta obra."
                rows={tao.additives || []}
                columns={[
                  { header: 'ID', render: (row) => `#${row.id.slice(-4)}`, cellClassName: 'w-24 font-mono text-xs text-slate-500' },
                  { header: 'Descrição', key: 'description' },
                  {
                    header: 'Status',
                    render: (row) => (
                      <span className={cn(
                        'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                        row.approval_status === 'approved' && 'border-emerald-200 bg-emerald-100 text-emerald-700',
                        row.approval_status === 'rejected' && 'border-red-200 bg-red-100 text-red-700',
                        row.approval_status === 'pending' && 'border-amber-200 bg-amber-100 text-amber-700',
                        !row.approval_status && 'border-slate-200 bg-slate-100 text-slate-700'
                      )}>
                        {ADDITIVE_STATUS_LABELS[row.approval_status] || row.approval_status || 'Rascunho'}
                      </span>
                    ),
                    cellClassName: 'w-36',
                  },
                  { header: 'Data', render: (row) => formatDateValue(row.approval_date), cellClassName: 'w-32' },
                  { header: 'Valor', render: (row) => <span className="font-semibold text-slate-900">{formatCurrencyValue(row.value)}</span>, cellClassName: 'w-40 text-right' },
                ]}
              />
            </DocumentSection>

            <DocumentSection
              number="5"
              title="Compliance e Obrigações"
              description="Itens técnico-legais, licenças e cláusulas operacionais relevantes da TAO."
            >
              <div className="space-y-4">
                <SubsectionTitle title="Checklist de Compliance" />
                <DataTable
                  emptyMessage="Nenhum item de compliance informado."
                  rows={complianceRows}
                  columns={[
                    { header: 'Item', key: 'item' },
                    { header: 'Status', key: 'status', cellClassName: 'w-44' },
                    { header: 'Detalhes', render: (row) => row.details || '-', cellClassName: 'w-[45%]' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ReportField label="Projeto Legal" value={formatBooleanValue(tao.scope_project_legal_status, 'Contratado', 'Não contratado')} />
                <ReportField label="AVCB" value={formatBooleanValue(tao.avcb_status, 'Ativo', 'Não informado')} />
                <ReportField label="Habite-se" value={formatBooleanValue(tao.habite_se_status, 'Ativo', 'Não informado')} />
                <ReportField label="Projetos por Conta da Empresa" value={formatBooleanValue(tao.ome_billing_company)} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <TextPanel title="Projeto Legal" value={tao.scope_project_legal_text} />
                <TextPanel title="AVCB" value={tao.avcb_text} />
                <TextPanel title="Obrigações / Multas / Medições" value={[tao.obligations_text, tao.fines_text, tao.measurements_text].filter(Boolean).join('\n\n')} />
              </div>
            </DocumentSection>

            <DocumentSection
              number="6"
              title="Documentos e Fechamento"
              description="Links, contatos, anexos e histórico operacional de suporte ao fechamento da obra."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryBox label="Contatos" value={`${tao.contacts?.length || 0}`} />
                <SummaryBox label="Anexos" value={`${tao.attachments?.length || 0}`} />
                <SummaryBox label="Histórico de Aprovação" value={`${filteredHistory.length}`} />
                <SummaryBox label="SharePoint" value={tao.sharepoint_url ? 'Disponível' : 'Não informado'} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <SubsectionTitle title="SharePoint e Observações" />
                  <div className="report-card rounded-[18px] border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">URL SharePoint</p>
                        <p className="break-all text-sm text-slate-600">{formatTextValue(tao.sharepoint_url)}</p>
                      </div>
                      {tao.sharepoint_url && (
                        <Button asChild variant="outline" size="sm" className="print:hidden">
                          <a href={tao.sharepoint_url} target="_blank" rel="noreferrer">
                            Abrir
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  <TextPanel title="Observações Gerais" value={tao.observations_general} />
                </div>

                <div className="space-y-4">
                  <SubsectionTitle title="Contatos da Obra" />
                  <DataTable
                    emptyMessage="Nenhum contato cadastrado."
                    rows={tao.contacts || []}
                    columns={[
                      { header: 'Nome', key: 'name' },
                      { header: 'Cargo', render: (row) => row.role || '-', cellClassName: 'w-40' },
                      { header: 'Email', render: (row) => row.email || '-', cellClassName: 'w-56' },
                      { header: 'Telefone', render: (row) => row.phone || '-', cellClassName: 'w-36' },
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Anexos" />
                <DataTable
                  emptyMessage="Nenhum anexo cadastrado."
                  rows={tao.attachments || []}
                  columns={[
                    { header: 'Arquivo', render: (row) => row.file_name || '-', cellClassName: 'font-medium text-slate-900' },
                    { header: 'Tipo', render: (row) => row.file_type || '-', cellClassName: 'w-56' },
                    {
                      header: 'Link',
                      render: (row) => (
                        row.file_url ? (
                          <a
                            href={row.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-blue-700 hover:underline print:text-slate-700"
                          >
                            Abrir arquivo
                            <ArrowUpRight className="h-3.5 w-3.5 print:hidden" />
                          </a>
                        ) : '-'
                      ),
                      cellClassName: 'w-44',
                    },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <SubsectionTitle title="Histórico de Aprovação" />
                  <DataTable
                    emptyMessage="Nenhum evento de aprovação registrado."
                    rows={filteredHistory}
                    columns={[
                      { header: 'Data', render: (row) => formatDateTimeValue(row.created_at), cellClassName: 'w-44' },
                      { header: 'Responsável', render: (row) => row.approver_email || '-', cellClassName: 'w-52' },
                      { header: 'Ação', render: (row) => row.action || '-', cellClassName: 'w-28' },
                      { header: 'Nível', render: (row) => row.level ?? '-', cellClassName: 'w-20 text-center' },
                      { header: 'Comentários', render: (row) => row.comments || '-', cellClassName: 'w-[35%]' },
                    ]}
                  />
                </div>

                <div className="space-y-4">
                  <SubsectionTitle title="Logs do Processo" />
                  <DataTable
                    emptyMessage="Nenhum log registrado."
                    rows={tao.logs || []}
                    columns={[
                      { header: 'Data', render: (row) => formatDateTimeValue(row.created_at), cellClassName: 'w-44' },
                      { header: 'Usuário', render: (row) => row.user_email || '-', cellClassName: 'w-52' },
                      { header: 'Ação', render: (row) => row.action || '-', cellClassName: 'w-24' },
                      { header: 'Detalhes', render: (row) => row.details || '-', cellClassName: 'w-[40%]' },
                    ]}
                  />
                </div>
              </div>
            </DocumentSection>
          </div>
        )}
      </article>
    </div>
  );
}
