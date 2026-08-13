import { useEffect, useState } from 'react';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Info, Unlock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const CLIENT_PORTAL_LINKS_PLACEHOLDER = "https://portal.cliente/empreendimento";

const AREA_MEASURE_OPTIONS = ['m2', 'ha', 'unidade'];
const APPROPRIATION_LEVEL_OPTIONS = ['Obra', 'Célula construtiva', 'Etapa', 'Subetapa', 'Serviço'];
const ENTERPRISE_NATURE_OPTIONS = ['Incorporação', 'Construção por Administração', 'Loteamento', 'Outro'];
const REAL_ESTATE_UNIT_OPTIONS = ['Apartamento', 'Casa', 'Sala Comercial', 'Lote', 'Outro'];

// ──────── Currency helpers ────────
const toBRL = (v) => {
  if (v == null || v === '' || isNaN(v)) return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseBRL = (str) => {
  if (!str) return null;
  // Remove thousands separators (.) and convert decimal comma to dot
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Formatted currency input: shows "100.000,00" when blurred, raw number when focused
function CurrencyInput({ value, onChange, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (!focused) {
      setLocalValue(toBRL(value));
    }
  }, [value, focused]);

  return (
    <Input
      {...props}
      className={`text-right font-mono ${className}`}
      value={focused ? localValue : toBRL(value)}
      onFocus={(e) => {
        setFocused(true);
        // Show raw number for easier editing
        setLocalValue(value != null && value !== '' ? String(value) : '');
        setTimeout(() => e.target.select(), 0);
      }}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseBRL(localValue);
        onChange(parsed);
      }}
    />
  );
}

// Smaller version for tax value columns
function TaxValueInput({ value, onChange, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (!focused) {
      setLocalValue(toBRL(value));
    }
  }, [value, focused]);

  return (
    <Input
      {...props}
      className={`flex-1 h-8 text-xs text-right font-mono ${className}`}
      value={focused ? localValue : toBRL(value)}
      onFocus={(e) => {
        setFocused(true);
        setLocalValue(value != null && value !== '' ? String(value) : '');
        setTimeout(() => e.target.select(), 0);
      }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        setFocused(false);
        onChange(parseBRL(localValue));
      }}
      placeholder="Valor"
    />
  );
}

export default function TaoStep1({ taoData, updateTao, canEdit }) {
  const { data: globalSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const res = await api.get('/resources/tao-global-settings');
      return res.data?.[0] || null;
    }
  });

  const isAuto = taoData.calculation_mode === 'auto';

  const handleChange = (field, value) => {
    updateTao({ ...taoData, [field]: value });
  };

  const financialConstructionCompanyText =
    taoData.financial_construction_company_text ??
    taoData.financial_company_payload?.legal_name ??
    taoData.financial_company?.legal_name ??
    '';

  const financialBusinessAreaText =
    taoData.financial_business_area_text ??
    taoData.financial_business_area_payload?.name ??
    taoData.financial_business_area?.name ??
    '';

  const defaultFinancialBankAccountText =
    taoData.default_financial_bank_account_text ??
    taoData.default_financial_bank_account?.description ??
    '';

  const billingIssueBankAccountText =
    taoData.billing_issue_bank_account_text ??
    taoData.billing_issue_bank_account?.description ??
    '';

  const handleAutoCalculation = () => {
    if (!isAuto || !globalSettings || !taoData.value_total_contract) return;

    // Apply default tax percentages if they are empty or if we want to force update (reactive)
    // Here we just update percentages and let values be calculated if logic existed, 
    // OR we calculate values directly here.

    const total = taoData.value_total_contract;
    const updates = {};

    // Taxes
    updates.tax_iss_collected_company_percent = globalSettings.default_iss_percent;
    updates.tax_iss_collected_company_value = (total * globalSettings.default_iss_percent) / 100;

    updates.tax_inss_collected_company_percent = globalSettings.default_inss_percent;
    updates.tax_inss_collected_company_value = (total * globalSettings.default_inss_percent) / 100;

    updates.tax_pis_percent = globalSettings.default_pis_percent;
    updates.tax_pis_value = (total * globalSettings.default_pis_percent) / 100;

    updates.tax_cofins_percent = globalSettings.default_cofins_percent;
    updates.tax_cofins_value = (total * globalSettings.default_cofins_percent) / 100;

    updates.tax_csll_percent = globalSettings.default_csll_percent;
    updates.tax_csll_value = (total * globalSettings.default_csll_percent) / 100;

    updates.tax_ir_percent = globalSettings.default_ir_percent;
    updates.tax_ir_value = (total * globalSettings.default_ir_percent) / 100;

    // Contract Splits
    if (globalSettings.default_consultancy_split_percent) {
      updates.value_billing_consultancy = (total * globalSettings.default_consultancy_split_percent) / 100;
    }
    if (globalSettings.default_construction_split_percent) {
      updates.value_billing_construction = (total * globalSettings.default_construction_split_percent) / 100;
    }

    // Update state
    updateTao({ ...taoData, ...updates });
  };

  // Trigger calculation when mode becomes auto or total changes (and mode is auto)
  useEffect(() => {
    if (isAuto && globalSettings) {
      handleAutoCalculation();
    }
  }, [taoData.calculation_mode, taoData.value_total_contract, globalSettings]);

  useEffect(() => {
    if (!taoData.appropriation_level) {
      handleChange('appropriation_level', 'Serviço');
    }
  }, [taoData.appropriation_level]);

  // Helper for currency formatting (display only)
  const formatCurrency = (value) => {
    return toBRL(value) || '0,00';
  };

  // Recalculate Tax Values when percentages change (optional logic, keeping it simple for now - just input binding)
  // In a real app, we might want useEffects to auto-calculate values based on a base amount.
  // For now, we'll assume manual entry or basic sync if needed.

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Row: Header Info & Calculation Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">OBRA:</span>
            <span className="text-slate-900 font-medium">{taoData.project_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ERP Nº:</span>
            <span className="font-mono text-slate-900">{taoData.erp_number}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            {isAuto ? <Calculator className="w-4 h-4 text-indigo-600" /> : <Unlock className="w-4 h-4 text-slate-500" />}
            <Label className="cursor-pointer font-medium text-sm" htmlFor="calc-mode">
              {isAuto ? 'Cálculo Automático' : 'Entrada Manual'}
            </Label>
          </div>
          <Switch
            id="calc-mode"
            checked={isAuto}
            onCheckedChange={(checked) => handleChange('calculation_mode', checked ? 'auto' : 'manual')}
            className="data-[state=checked]:bg-indigo-600"
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Contract Details & Taxes */}
        <div className="lg:col-span-7 space-y-6">

          {/* Regime & Dates */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Detalhes do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Regime de Contratação</Label>
                <Select
                  value={taoData.hiring_regime || ''}
                  onValueChange={(val) => handleChange('hiring_regime', val)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrada">Administrada</SelectItem>
                    <SelectItem value="Empreitada Global">Empreitada Global</SelectItem>
                    <SelectItem value="Empreitada Parcial">Empreitada Parcial</SelectItem>
                    <SelectItem value="Preço Máximo Garantido">Preço Máximo Garantido (PMG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Descrição (Opcional)</Label>
                <Input
                  value={taoData.contract_description || ''}
                  onChange={(e) => handleChange('contract_description', e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="pt-2">
                <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Prazo Total do Contrato</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Data Assinatura</Label>
                    <Input type="date" value={taoData.date_signature || ''} onChange={(e) => handleChange('date_signature', e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Mobilização</Label>
                    <Input type="date" value={taoData.date_mobilization || ''} onChange={(e) => handleChange('date_mobilization', e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Início Obra</Label>
                    <Input type="date" value={taoData.date_start || ''} onChange={(e) => handleChange('date_start', e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Término Obra</Label>
                    <Input type="date" value={taoData.date_end || ''} onChange={(e) => handleChange('date_end', e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prazo (dias)</Label>
                    <Input type="number" min="0" value={taoData.duration_days ?? ''} onChange={(e) => handleChange('duration_days', e.target.value ? Number(e.target.value) : null)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Segmento</Label>
                    <Input value={taoData.segment || ''} onChange={(e) => handleChange('segment', e.target.value)} disabled={!canEdit} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxes Matrix */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Impostos & Retenções</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Left Side Taxes */}
                <div className="space-y-3">
                  {/* ISS */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">ISS Retido Cliente</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_iss_retained_client_percent || ''}
                        onChange={(e) => handleChange('tax_iss_retained_client_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_iss_retained_client_value}
                        onChange={(v) => handleChange('tax_iss_retained_client_value', v)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">ISS Rec. Empresa</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_iss_collected_company_percent || ''}
                        onChange={(e) => handleChange('tax_iss_collected_company_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_iss_collected_company_value}
                        onChange={(v) => handleChange('tax_iss_collected_company_value', v)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* INSS */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">INSS Retido Cli.</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_inss_retained_client_percent || ''}
                        onChange={(e) => handleChange('tax_inss_retained_client_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_inss_retained_client_value}
                        onChange={(v) => handleChange('tax_inss_retained_client_value', v)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">INSS Rec. Emp.</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_inss_collected_company_percent || ''}
                        onChange={(e) => handleChange('tax_inss_collected_company_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_inss_collected_company_value}
                        onChange={(v) => handleChange('tax_inss_collected_company_value', v)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* COFINS / Abatimento / Retenção */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs truncate">COFINS Retido Cli.</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_cofins_retained_client_percent || ''}
                        onChange={(e) => handleChange('tax_cofins_retained_client_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_cofins_retained_client_value}
                        onChange={(v) => handleChange('tax_cofins_retained_client_value', v)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs">Abatimento Sinal</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_deduction_signal_percent || ''}
                        onChange={(e) => handleChange('tax_deduction_signal_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_deduction_signal_value}
                        onChange={(v) => handleChange('tax_deduction_signal_value', v)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-xs truncate">Retenção Contratual</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData.tax_contractual_retention_percent || ''}
                        onChange={(e) => handleChange('tax_contractual_retention_percent', parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData.tax_contractual_retention_value}
                        onChange={(v) => handleChange('tax_contractual_retention_value', v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side Taxes */}
                <div className="space-y-3">
                  {[
                    { label: 'CSLL', key: 'csll' },
                    { label: 'IR', key: 'ir' },
                    { label: 'PIS', key: 'pis' },
                    { label: 'COFINS', key: 'cofins' }
                  ].map((tax) => (
                    <div key={tax.key} className="flex items-center gap-2">
                      <Label className="w-16 text-xs">{tax.label}:</Label>
                      <Input
                        className="w-16 h-8 text-xs" placeholder="%"
                        type="number"
                        value={taoData[`tax_${tax.key}_percent`] || ''}
                        onChange={(e) => handleChange(`tax_${tax.key}_percent`, parseFloat(e.target.value))}
                      />
                      <span className="text-xs">% R$</span>
                      <TaxValueInput
                        value={taoData[`tax_${tax.key}_value`]}
                        onChange={(v) => handleChange(`tax_${tax.key}_value`, v)}
                      />
                    </div>
                  ))}
                </div>

              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-indigo-700 uppercase">
                Reforma Tributária
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-indigo-600">
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Reforma Tributária e Split Payment</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] space-y-4 overflow-y-auto text-sm leading-6 text-slate-700">
                      <p>Pela Reforma Tributária (EC 132/2023 e regulamentação posterior), o IVA brasileiro será um IVA Dual, composto por dois tributos principais:</p>
                      <div>
                        <p className="font-semibold text-slate-900">CBS (Contribuição sobre Bens e Serviços)</p>
                        <p>Competência da União (governo federal). Substitui principalmente PIS e Cofins.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">IBS (Imposto sobre Bens e Serviços)</p>
                        <p>Competência compartilhada entre estados e municípios. Substitui ICMS e ISS.</p>
                      </div>
                      <p>Além deles, existe o Imposto Seletivo (IS), que não faz parte do IVA e incidirá sobre produtos considerados prejudiciais à saúde ou ao meio ambiente.</p>
                      <div>
                        <p className="font-semibold text-slate-900">Cronograma de entrada em vigor</p>
                        <p>2026: fase de teste com alíquotas reduzidas da CBS e IBS.</p>
                        <p>2027: CBS passa a ser cobrada efetivamente e PIS/Cofins são extintos.</p>
                        <p>2029 a 2032: transição gradual de ICMS e ISS para o IBS.</p>
                        <p>2033: sistema plenamente implantado.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">E o Split Payment?</p>
                        <p>O split payment é o mecanismo que separa automaticamente o valor do imposto no momento do pagamento da operação, enviando a parcela do IBS e da CBS diretamente ao Fisco.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Situação atual (agosto/2026)</p>
                        <p>O plano inicial era começar junto com CBS e IBS em janeiro de 2027. Porém, o Comitê Gestor do IBS informou que o split payment não estará pronto em janeiro de 2027, devido à complexidade de implementação e à necessidade de adaptação do sistema financeiro.</p>
                        <p>A previsão divulgada é que, quando entrar em operação, ele comece de forma opcional e inicialmente para operações B2B (entre empresas).</p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Resumo executivo</p>
                        <p>IVA = CBS (Federal) + IBS (Estados e Municípios). CBS entra efetivamente em 2027. IBS substitui gradualmente ICMS e ISS até 2033. Split payment foi adiado e não entrará em vigor em janeiro de 2027; ainda não há uma data oficial definitiva para sua obrigatoriedade.</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <div className="space-y-1">
                <Label>CBS %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taoData.tax_cbs_percent ?? ''}
                  onChange={(e) => handleChange('tax_cbs_percent', e.target.value ? Number(e.target.value) : null)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>IBS %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taoData.tax_ibs_percent ?? ''}
                  onChange={(e) => handleChange('tax_ibs_percent', e.target.value ? Number(e.target.value) : null)}
                  disabled={!canEdit}
                />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <div>
                  <Label>Split Payment</Label>
                  <p className="text-xs text-slate-500">{taoData.split_payment_enabled ? 'Ativo' : 'Postergado'}</p>
                </div>
                <Switch
                  checked={taoData.split_payment_enabled || false}
                  onCheckedChange={(value) => handleChange('split_payment_enabled', value)}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Contract Values */}
        <div className="lg:col-span-5 space-y-6">

          {/* Contract Values */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/30">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-indigo-700 uppercase">
                Valores do Contrato
                {isAuto && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-indigo-600">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Fórmula do cálculo automático</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-sm leading-6 text-slate-700">
                        <p>Base de cálculo: Valor total da venda / contrato.</p>
                        <p>ISS Rec. Empresa = total × {globalSettings?.default_iss_percent ?? 0}%.</p>
                        <p>INSS Rec. Empresa = total × {globalSettings?.default_inss_percent ?? 0}%.</p>
                        <p>PIS = total × {globalSettings?.default_pis_percent ?? 0}%.</p>
                        <p>COFINS = total × {globalSettings?.default_cofins_percent ?? 0}%.</p>
                        <p>CSLL = total × {globalSettings?.default_csll_percent ?? 0}%.</p>
                        <p>IR = total × {globalSettings?.default_ir_percent ?? 0}%.</p>
                        <p>Fat. Empresa Consultoria = total × {globalSettings?.default_consultancy_split_percent ?? 0}%.</p>
                        <p>Fat. Empresa Construções = total × {globalSettings?.default_construction_split_percent ?? 0}%.</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">

              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
                <span className="font-bold text-indigo-900">TOTAL CONTRATO:</span>
                <span className="text-xl font-bold text-indigo-700">R$ {formatCurrency(taoData.value_total_contract)}</span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor total da venda / contrato</Label>
                <CurrencyInput value={taoData.value_total_contract} onChange={(value) => handleChange('value_total_contract', value)} disabled={!canEdit} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Faturamento DIRETO: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_billing_direct}
                    onChange={(v) => handleChange('value_billing_direct', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Fat. Empresa Consultoria: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_billing_consultancy}
                    onChange={(v) => handleChange('value_billing_consultancy', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Fat. Empresa Construções: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_billing_construction}
                    onChange={(v) => handleChange('value_billing_construction', v)}
                  />
                </div>

                <Separator className="my-2" />

                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Equipe Técnica: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_team_technical}
                    onChange={(v) => handleChange('value_team_technical', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Custo Obra: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_cost_construction}
                    onChange={(v) => handleChange('value_cost_construction', v)}
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Label className="w-40 text-xs text-right">Rateável 1: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_rateable_1}
                    onChange={(v) => handleChange('value_rateable_1', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Rateável 2: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_rateable_2}
                    onChange={(v) => handleChange('value_rateable_2', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right">Impostos: R$</Label>
                  <CurrencyInput
                    className="h-8"
                    value={taoData.value_taxes}
                    onChange={(v) => handleChange('value_taxes', v)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-40 text-xs text-right font-bold">B (Revenue): R$</Label>
                  <CurrencyInput
                    className="h-8 font-bold bg-indigo-50"
                    value={taoData.value_b_revenue}
                    onChange={(v) => handleChange('value_b_revenue', v)}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bonificação (%)</Label>
                  <Input type="number" step="0.01" value={taoData.bonus_percent ?? ''} onChange={(e) => handleChange('bonus_percent', e.target.value ? Number(e.target.value) : null)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Conversão para imposto (%)</Label>
                  <Input type="number" step="0.01" value={taoData.tax_conversion_percent ?? ''} onChange={(e) => handleChange('tax_conversion_percent', e.target.value ? Number(e.target.value) : null)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor mínimo de NF (R$)</Label>
                  <CurrencyInput value={taoData.minimum_invoice_amount} onChange={(value) => handleChange('minimum_invoice_amount', value)} disabled={!canEdit} />
                </div>
              </div>

              {/* Auto-calculate total for convenience */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    const total = (parseFloat(taoData.value_billing_direct) || 0) +
                      (parseFloat(taoData.value_billing_consultancy) || 0) +
                      (parseFloat(taoData.value_billing_construction) || 0);
                    handleChange('value_total_contract', total);
                  }}
                  disabled={!canEdit}
                >
                  Atualizar Total (Soma Faturamentos)
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Engenharia</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Tabela de Insumos/Serviços</Label>
                <Input
                  value={taoData.engineering_supply_services_table || ''}
                  onChange={(e) => handleChange('engineering_supply_services_table', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Nível de Apropriação</Label>
                <Select
                  value={taoData.appropriation_level || 'Serviço'}
                  onValueChange={(value) => handleChange('appropriation_level', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROPRIATION_LEVEL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Unidade de Medida da Área</Label>
                <Select
                  value={taoData.area_measure_unit || ''}
                  onValueChange={(value) => handleChange('area_measure_unit', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_MEASURE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Área da Obra</Label>
                <Input
                  type="number"
                  value={taoData.area_m2 || ''}
                  onChange={(e) => handleChange('area_m2', e.target.value ? parseFloat(e.target.value) : null)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Unidades Construtivas Previstas</Label>
                <Input
                  type="number"
                  value={taoData.planned_construction_units || ''}
                  onChange={(e) => handleChange('planned_construction_units', e.target.value ? parseInt(e.target.value, 10) : null)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>Haverá Orçamento</Label>
                <Switch checked={taoData.has_engineering_budget || false} onCheckedChange={(value) => handleChange('has_engineering_budget', value)} disabled={!canEdit} />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>Haverá Planejamento</Label>
                <Switch checked={taoData.has_engineering_planning || false} onCheckedChange={(value) => handleChange('has_engineering_planning', value)} disabled={!canEdit} />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>Acompanhamento Físico</Label>
                <Switch checked={taoData.has_physical_progress_tracking || false} onCheckedChange={(value) => handleChange('has_physical_progress_tracking', value)} disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Responsável de Engenharia</Label>
              <Input
                value={taoData.engineering_responsible_name || ''}
                onChange={(e) => handleChange('engineering_responsible_name', e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <Label>Empresa Construtora</Label>
              <Input
                value={financialConstructionCompanyText}
                onChange={(e) => handleChange('financial_construction_company_text', e.target.value)}
                placeholder="Digite a empresa construtora"
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Área de Negócio</Label>
                <Input
                  value={financialBusinessAreaText}
                  onChange={(e) => handleChange('financial_business_area_text', e.target.value)}
                  placeholder="Digite a área de negócio"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Responsável Financeiro</Label>
                <Input
                  value={taoData.financial_responsible_name || ''}
                  onChange={(e) => handleChange('financial_responsible_name', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Conta Corrente Padrão</Label>
                <Input
                  value={defaultFinancialBankAccountText}
                  onChange={(e) => handleChange('default_financial_bank_account_text', e.target.value)}
                  placeholder="Digite a conta corrente padrão"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Conta para Emissão de Boletos</Label>
                <Input
                  value={billingIssueBankAccountText}
                  onChange={(e) => handleChange('billing_issue_bank_account_text', e.target.value)}
                  placeholder="Digite a conta de boletos"
                  disabled={!canEdit}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Fiscal / Contábil</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>RET</Label>
                <Switch checked={taoData.is_ret_regime || false} onCheckedChange={(value) => handleChange('is_ret_regime', value)} disabled={!canEdit} />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>Gera SPED / EFD Contribuições</Label>
                <Switch checked={taoData.generates_sped_efd_contributions || false} onCheckedChange={(value) => handleChange('generates_sped_efd_contributions', value)} disabled={!canEdit} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Natureza do Empreendimento</Label>
                <Select
                  value={taoData.enterprise_nature || ''}
                  onValueChange={(value) => handleChange('enterprise_nature', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTERPRISE_NATURE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo de Unidade Vendida</Label>
                <Select
                  value={taoData.real_estate_unit_type || ''}
                  onValueChange={(value) => handleChange('real_estate_unit_type', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REAL_ESTATE_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Responsável Fiscal / Contábil</Label>
              <Input
                value={taoData.fiscal_responsible_name || ''}
                onChange={(e) => handleChange('fiscal_responsible_name', e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Observações Fiscais</Label>
              <Input
                value={taoData.fiscal_notes || ''}
                onChange={(e) => handleChange('fiscal_notes', e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Comercial / Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Entrega das Chaves</Label>
                <Input
                  type="date"
                  value={taoData.keys_delivery_date || ''}
                  onChange={(e) => handleChange('keys_delivery_date', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>VGV</Label>
                <CurrencyInput
                  value={taoData.gross_sales_value}
                  onChange={(value) => handleChange('gross_sales_value', value)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Agrupamento de Unidades</Label>
                <Input
                  value={taoData.units_grouping || ''}
                  onChange={(e) => handleChange('units_grouping', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                <Label>Usa Portal do Cliente</Label>
                <Switch checked={taoData.uses_client_portal || false} onCheckedChange={(value) => handleChange('uses_client_portal', value)} disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Links do Empreendimento no Portal</Label>
              <Input
                value={taoData.client_portal_links || ''}
                onChange={(e) => handleChange('client_portal_links', e.target.value)}
                placeholder={CLIENT_PORTAL_LINKS_PLACEHOLDER}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Responsável Comercial</Label>
              <Input
                value={taoData.commercial_responsible_name || ''}
                onChange={(e) => handleChange('commercial_responsible_name', e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
