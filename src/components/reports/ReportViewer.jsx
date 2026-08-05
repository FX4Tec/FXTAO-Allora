import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText, Printer } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  formatDateValue,
  getApprovalStatusLabel,
  getStatusLabel,
  normalizeStatus,
  useReportTaoDetail,
} from './useReportData';

const REPORT_BLOCKS = [
  { id: 'dados-iniciais', title: 'Dados iniciais', subtitle: 'Identificação, responsáveis e endereços' },
  { id: 'faturamento', title: 'Faturamento', subtitle: 'Cadastro fiscal e documentos' },
  { id: 'contratacao', title: 'Contratação', subtitle: 'Modelo comercial e rotina financeira' },
  { id: 'financeiro-restrito', title: 'Financeiro restrito', subtitle: 'Campos sensíveis Allora', restricted: true },
  { id: 'operacional', title: 'Operacional', subtitle: 'Checklist inicial de obra' },
  { id: 'outros', title: 'Outros', subtitle: 'Documentos, anexos e aprovação' },
];

function formatTextValue(value) {
  return value === null || value === undefined || value === '' ? '-' : value;
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return formatTextValue(value);
  }

  return `R$ ${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercentValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return formatTextValue(value);
  }

  return `${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatDateTimeValue(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('pt-BR');
}

function formatBooleanValue(value, truthy = 'Sim', falsy = 'Não') {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

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

function ReportField({ label, value, className }) {
  return (
    <div className={cn('report-field rounded-[18px] border border-slate-200 bg-white p-4', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <div className="mt-3 whitespace-pre-line text-sm font-medium leading-6 text-slate-900">
        {formatTextValue(value)}
      </div>
    </div>
  );
}

function SummaryBox({ label, value, note }) {
  return (
    <div className="report-kpi rounded-[18px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-[24px] font-bold tracking-tight text-slate-950">{formatTextValue(value)}</p>
      {note ? <p className="mt-2 text-xs text-slate-500">{note}</p> : null}
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
            {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
        </div>
      </div>
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

function SubsectionTitle({ title, description }) {
  return (
    <div className="space-y-1">
      <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-800">{title}</h4>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
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

function BlockStrip({ canViewRestricted }) {
  const blocks = REPORT_BLOCKS.filter((block) => canViewRestricted || !block.restricted);

  return (
    <div className="report-phase-strip grid grid-cols-2 gap-3 lg:grid-cols-6">
      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-[18px] border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-blue-700 text-xs font-bold text-white">
              {index + 1}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-slate-900">{block.title}</p>
              <p className="text-xs leading-5 text-slate-500">{block.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportViewer({ taos = [] }) {
  const { user } = useAuth();
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
  const canViewRestricted = Boolean(user?.can_view_restricted_tao_fields);

  const directBillingDocuments = tao?.direct_billing_document_items || [];
  const initialChecklistItems = tao?.initial_checklist_items || [];
  const checkedChecklistCount = initialChecklistItems.filter((item) => item.is_checked).length;
  const checkedDocumentsCount = directBillingDocuments.filter((item) => item.is_checked).length;

  const clientContact = (tao?.contacts || []).find((contact) => contact.role === 'Contato Cliente');
  const managerContact = (tao?.contacts || []).find((contact) => contact.role === 'Gerenciador');
  const architectureContact = (tao?.contacts || []).find((contact) => contact.role === 'Arquitetura');
  const reportContact = (tao?.contacts || []).find((contact) => contact.role === 'Contato para envio de relatorios');
  const copyContact = (tao?.contacts || []).find((contact) => contact.role === 'Com copia');
  const engineer = (tao?.team_members || []).find((member) => member.role === 'Engº Responsavel');
  const master = (tao?.team_members || []).find((member) => member.role === 'Mestre de Obra');

  const documentRows = directBillingDocuments.map((item) => ({
    key: item.document_key,
    audience: item.audience,
    document: item.document_label,
    status: item.is_checked ? 'Marcado' : 'Não marcado',
    notes: item.notes || '-',
  }));

  const checklistRows = initialChecklistItems.map((item) => ({
    key: item.item_key,
    item: item.item_label,
    category: item.category,
    status: item.is_checked ? 'Concluído' : 'Pendente',
    selected_option: item.selected_option || '-',
    notes: item.notes || '-',
  }));

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
              Documento executivo alinhado ao formulário Allora, pronto para leitura em tela, impressão e PDF.
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
            {selectedSummary ? (
              <Button asChild variant="outline">
                <Link to={`${createPageUrl('TaoForm')}?id=${selectedSummary.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Abrir TAO
                </Link>
              </Button>
            ) : null}
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
                    Relatório executivo Allora
                  </p>
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {selectedSummary?.project_name || 'Relatório da Obra'}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600">
                    Documento consolidado com a nova estrutura da TAO Allora, organizado por blocos operacionais e pronto para apresentação.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:min-w-[360px]">
                <div className="grid grid-cols-2 gap-3">
                  <ReportField label="Codigo da obra" value={selectedSummary?.erp_number} />
                  <ReportField label="Emissão" value={formatDateValue(new Date())} />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="report-field rounded-[18px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status da TAO</p>
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

            <BlockStrip canViewRestricted={canViewRestricted} />
          </div>
        </header>

        {isLoading || !tao ? (
          <div className="p-12 text-center text-slate-500">Carregando dados da obra...</div>
        ) : (
          <div className="report-document-body space-y-6 bg-slate-50/70 p-6 md:p-8 print:bg-white">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryBox label="Centro de Custo" value={tao.center_cost_client} />
              <SummaryBox label="Modelo de Faturamento" value={tao.billing_model} />
              <SummaryBox label="Modelo de Contratação" value={tao.hiring_regime} />
              <SummaryBox
                label="Checklist Inicial"
                value={`${checkedChecklistCount}/${initialChecklistItems.length || 0}`}
                note={`${checkedDocumentsCount} documento(s) de faturamento marcado(s)`}
              />
            </div>

            <DocumentSection
              number="1"
              title="Dados iniciais da obra"
              description="Identificação principal, responsáveis, equipe-base e dados operacionais de abertura."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <ReportField label="Sigla/nome da obra" value={tao.project_name} />
                <ReportField label="Codigo da obra" value={tao.erp_number} />
                <ReportField label="CENTRO DE CUSTO" value={tao.center_cost_client} />
                <ReportField label="Codigo centro de custo Allora" value={tao.center_cost_allora} />
                <ReportField label="Projeto #" value={tao.project_code} />
                <ReportField label="Nº Proposta" value={tao.proposal_number} />
                <ReportField label="Empresa" value={tao.company_code} />
                <ReportField label="Grupo" value={tao.project_group} />
                <ReportField label="Data inicio de obra" value={formatDateValue(tao.date_start)} />
                <ReportField label="Termino previsto" value={formatDateValue(tao.date_end)} />
                <ReportField label="Data de inicio real" value={formatDateValue(tao.actual_start_date)} />
                <ReportField label="Data de termino real" value={formatDateValue(tao.actual_end_date)} />
                <ReportField label="Tempo de obra" value={tao.duration_months ? `${tao.duration_months} mês(es)` : '-'} />
                <ReportField label="Criado por" value={tao.created_by?.full_name || tao.created_by?.email} />
                <ReportField label="Criado em" value={formatDateTimeValue(tao.created_at)} />
                <ReportField label="Última atualização" value={formatDateTimeValue(tao.updated_at)} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                  <SubsectionTitle title="Equipe e responsáveis" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportField label="Contato Cliente" value={[clientContact?.name, clientContact?.email, clientContact?.phone].filter(Boolean).join('\n')} />
                    <ReportField label="Gerenciador" value={tao.has_manager ? [managerContact?.name, managerContact?.email, managerContact?.phone].filter(Boolean).join('\n') : 'Não'} />
                    <ReportField label="Arquitetura" value={tao.has_architecture ? [architectureContact?.name, architectureContact?.email, architectureContact?.phone].filter(Boolean).join('\n') : 'Não'} />
                    <ReportField label="Engº Responsavel" value={[engineer?.name, engineer?.email, engineer?.team_type].filter(Boolean).join('\n')} />
                    <ReportField label="Mestre de Obra" value={[master?.name, master?.email, master?.team_type].filter(Boolean).join('\n')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SubsectionTitle title="Local e complementos" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ReportField label="Local" value={tao.construction_address} />
                    <ReportField label="Cidade" value={tao.construction_city} />
                    <ReportField label="UF" value={tao.construction_state} />
                    <ReportField label="CEP" value={tao.construction_zip} />
                    <ReportField label="Outros centros de custo + codigo da empresa" value={tao.extra_center_costs_client} className="md:col-span-2" />
                  </div>
                </div>
              </div>
            </DocumentSection>

            <DocumentSection
              number="2"
              title="Modelo de faturamento"
              description="Dados cadastrais de faturamento e documentação exigida para o processo comercial."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ReportField label="Nome / Razao Social" value={tao.billing_company_name} />
                <ReportField label="CNPJ/CPF" value={tao.billing_cnpj} />
                <ReportField label="Modelo de Faturamento" value={tao.billing_model} />
                <ReportField label="Endereco completo" value={tao.billing_address} className="md:col-span-2" />
                <ReportField label="Restricao de entrega" value={formatBooleanValue(tao.has_delivery_restriction)} />
                <ReportField label="Restricao de entrega - Quais" value={tao.delivery_restriction_notes} className="md:col-span-3" />
                <ReportField label="Bairro" value={tao.billing_neighborhood} />
                <ReportField label="Cidade do faturamento" value={tao.billing_city} />
                <ReportField label="Estado" value={tao.billing_state} />
                <ReportField label="CEP do faturamento" value={tao.billing_zip} />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Documentação para faturamento direto" description="Itens consolidados da nova estrutura Allora para cliente PF e cliente PJ." />
                <DataTable
                  emptyMessage="Nenhum item de documentação disponível."
                  rows={documentRows}
                  columns={[
                    { header: 'Público', key: 'audience', cellClassName: 'w-40' },
                    { header: 'Documento', key: 'document' },
                    { header: 'Status', key: 'status', cellClassName: 'w-32' },
                    { header: 'Observações', key: 'notes', cellClassName: 'w-[35%]' },
                  ]}
                />
              </div>
            </DocumentSection>

            <DocumentSection
              number="3"
              title="Modelo de contratação"
              description="Estrutura comercial da obra, rotina de relatórios e condicionantes operacionais do contrato."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ReportField label="Modelo de Contratacao orcamento" value={tao.budget_model} />
                <ReportField label="Modelo de Contratacao" value={tao.hiring_regime} />
                <ReportField label="Detalhe da Contratacao" value={tao.hiring_regime_detail} />
                <ReportField label="Periodo de envio de relatorios" value={tao.report_frequency} />
                <ReportField label="Necessidade de envio fisico" value={formatBooleanValue(tao.requires_physical_delivery)} />
                <ReportField label="Endereco de envio fisico" value={tao.physical_delivery_address} />
                <ReportField label="Data de corte para emissao de notas fiscais" value={formatBooleanValue(tao.has_invoice_cutoff)} />
                <ReportField label="Qual dia" value={tao.invoice_cutoff_day} />
                <ReportField label="Prazo para equipe de obras enviar as notas ao financeiro" value={tao.notes_to_finance_deadline} />
                <ReportField label="Dia de envio do relatorio ao cliente" value={tao.report_send_day} />
                <ReportField label="Data de pagamento a partir do envio do relatorio" value={tao.payment_after_report_terms} className="md:col-span-2" />
                <ReportField label="Programacao financeira" value={tao.financial_schedule_notes} className="md:col-span-3" />
              </div>

              {tao.budget_model === 'Preco Fechado' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SummaryBox label="Valor final negociado" value={formatCurrencyValue(tao.value_total_contract)} />
                  <ReportField label="Forma de Pagamento" value={tao.payment_terms_text} />
                </div>
              ) : null}

              {tao.hiring_regime === 'Administracao' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReportField label="Programacao de envio financeiro" value={tao.admin_financial_schedule_text} />
                  <ReportField label="Observacoes Administracao" value={tao.admin_notes} />
                </div>
              ) : null}
            </DocumentSection>

            {canViewRestricted ? (
              <DocumentSection
                number="4"
                title="Financeiro restrito"
                description="Campos sensíveis da Allora exibidos somente para usuários autorizados."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <ReportField label="% ADM sobre orcamento" value={formatPercentValue(tao.restricted_admin_percent)} />
                  <ReportField label="Imposto: incluso ou calcular sobre o percentual" value={tao.restricted_tax_mode} />
                  <ReportField label="ADM fixa ao mes com imposto" value={formatCurrencyValue(tao.restricted_admin_monthly_value)} />
                  <ReportField label="Equipe ao mes com imposto" value={formatCurrencyValue(tao.restricted_team_monthly_value)} />
                  <ReportField label="Flag possui orcamento" value={formatBooleanValue(tao.has_budget_sheet, 'Possui orcamento', 'Nao possui orcamento')} />
                  <ReportField label="Adm total prevista com imposto" value={formatCurrencyValue(tao.restricted_admin_total_estimated)} />
                  <ReportField label="Equipe total prevista com imposto" value={formatCurrencyValue(tao.value_team_technical)} />
                  <ReportField label="Valor mensal do engenheiro com imposto" value={formatCurrencyValue(tao.restricted_engineer_monthly_value)} />
                  <ReportField label="Valor mensal do mestre com imposto" value={formatCurrencyValue(tao.restricted_master_monthly_value)} />
                  <ReportField label="Custo de obra estimado" value={formatCurrencyValue(tao.value_cost_construction)} />
                  <ReportField label="Valor estimado total da obra" value={formatCurrencyValue(tao.value_total_contract)} />
                  <ReportField label="Cliente aceita reembolsos" value={formatBooleanValue(tao.accepts_reimbursements)} />
                  <ReportField label="Observacao sobre reembolsos" value={tao.accepts_reimbursements_notes} className="md:col-span-2" />
                  <ReportField label="Cliente aceita pagamentos de excecao fora do prazo" value={formatBooleanValue(tao.accepts_exception_payments)} />
                  <ReportField label="Observacao sobre excecoes" value={tao.accepts_exception_payments_notes} className="md:col-span-2" />
                  <ReportField label="Adm sobre itens especiais" value={tao.restricted_special_items_admin_text} className="md:col-span-3" />
                  <ReportField label="Observacoes Financeiro Restrito" value={tao.restricted_notes} className="md:col-span-3" />
                  <ReportField label="Envio de relatorios" value={tao.reports_delivery_notes} className="md:col-span-3" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReportField label="Contato para envio de relatorios" value={[reportContact?.name, reportContact?.email, reportContact?.phone].filter(Boolean).join('\n')} />
                  <ReportField label="Com copia" value={[copyContact?.name, copyContact?.email, copyContact?.phone].filter(Boolean).join('\n')} />
                </div>
              </DocumentSection>
            ) : null}

            <DocumentSection
              number={canViewRestricted ? '5' : '4'}
              title="Operacional registro de obra"
              description="Checklist inicial consolidado conforme a estrutura da planilha operacional Allora."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <ReportField label="Cliente" value={tao.project_name} />
                <ReportField label="Empresa" value={tao.company_code} />
                <ReportField label="Centro de custo Allora" value={tao.center_cost_allora} />
                <ReportField label="Necessidade de CNO" value={formatBooleanValue(tao.requires_cno)} />
                <ReportField label="CNO Nº" value={tao.obra_cno} />
                <ReportField label="SFOBRAS" value={tao.obra_sfobras} />
              </div>

              <DataTable
                emptyMessage="Nenhum item de checklist disponível."
                rows={checklistRows}
                columns={[
                  { header: 'Item', key: 'item' },
                  { header: 'Categoria', key: 'category', cellClassName: 'w-44' },
                  { header: 'Status', key: 'status', cellClassName: 'w-28' },
                  { header: 'Opção', key: 'selected_option', cellClassName: 'w-36' },
                  { header: 'Observações', key: 'notes', cellClassName: 'w-[35%]' },
                ]}
              />
            </DocumentSection>

            <DocumentSection
              number={canViewRestricted ? '6' : '5'}
              title="Outros e documentos"
              description="Fechamento do cadastro, documentação complementar, anexos e configuração de aprovação."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <SummaryBox label="Aprovadores" value={`${tao.approvers?.length || 0}`} />
                <SummaryBox label="Anexos" value={`${tao.attachments?.length || 0}`} />
                <SummaryBox label="Checklist marcado" value={`${checkedChecklistCount}`} />
                <SummaryBox label="Documentos marcados" value={`${checkedDocumentsCount}`} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <ReportField label="Contrato com o cliente" value={tao.client_contract_status} />
                <ReportField label="Data de assinatura" value={formatDateValue(tao.date_signature)} />
                <ReportField label="Seguro de obra" value={tao.work_insurance_status} />
                <ReportField label="Vigencia da apolice" value={tao.work_insurance_validity} />
                <ReportField label="ART" value={tao.art_status} />
                <ReportField label="URL SharePoint" value={tao.sharepoint_url} />
                <ReportField label="Observacoes gerais" value={tao.observations_general} className="md:col-span-3" />
              </div>

              <div className="space-y-4">
                <SubsectionTitle title="Configuração de aprovação" />
                <DataTable
                  emptyMessage="Nenhum aprovador configurado para esta obra."
                  rows={tao.approvers || []}
                  columns={[
                    { header: 'Nível', render: (row) => <span className="font-semibold text-slate-900">{row.level}</span>, cellClassName: 'w-24' },
                    { header: 'Aprovador', render: (row) => row.user_email || '-' },
                    { header: 'Escopo', render: (row) => row.scope || '-', cellClassName: 'w-32' },
                  ]}
                />
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
            </DocumentSection>
          </div>
        )}
      </article>
    </div>
  );
}
