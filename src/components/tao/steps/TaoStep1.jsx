import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Lock, Unlock } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

export default function TaoStep1({ taoData, updateTao }) {
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

  // Helper for currency formatting (display only)
  const formatCurrency = (value) => {
    return toBRL(value) || '0,00';
  };

  // Helper for tax calculation
  const calculateTaxValue = (baseValue, percent) => {
    if (!baseValue || !percent) return 0;
    return (baseValue * percent) / 100;
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
                />
              </div>

              <div className="pt-2">
                <Label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Prazo Total do Contrato</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Data Assinatura</Label>
                    <Input type="date" value={taoData.date_signature || ''} onChange={(e) => handleChange('date_signature', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Mobilização</Label>
                    <Input type="date" value={taoData.date_mobilization || ''} onChange={(e) => handleChange('date_mobilization', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Início Obra</Label>
                    <Input type="date" value={taoData.date_start || ''} onChange={(e) => handleChange('date_start', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data Término Obra</Label>
                    <Input type="date" value={taoData.date_end || ''} onChange={(e) => handleChange('date_end', e.target.value)} />
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
        </div>

        {/* RIGHT COLUMN: Contract Values & OME */}
        <div className="lg:col-span-5 space-y-6">

          {/* OME Section */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">OME - Ordem de Modificação de Escopo</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Procedimento será:</Label>
                <Input
                  value={taoData.ome_procedure || ''}
                  onChange={(e) => handleChange('ome_procedure', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label>Faturamento:</Label>
                <Switch
                  checked={taoData.ome_billing_company || false}
                  onCheckedChange={(checked) => handleChange('ome_billing_company', checked)}
                />
                <span className="text-sm text-slate-600">{taoData.ome_billing_company ? 'Empresa' : 'Outro'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contract Values */}
          <Card className="border-slate-200 shadow-sm bg-slate-50/30">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Valores do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">

              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4">
                <span className="font-bold text-indigo-900">TOTAL CONTRATO:</span>
                <span className="text-xl font-bold text-indigo-700">R$ {formatCurrency(taoData.value_total_contract)}</span>
              </div>

              {/* Helper input for Total (since it might be calculated, but let's allow manual override for now as per request "persist all fields") */}
              <div className="hidden">
                {/* Hidden input just to ensure we have a way to set it if needed via UI, or we trust the display above */}
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
                  />
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
                >
                  Atualizar Total (Soma Faturamentos)
                </Button>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}