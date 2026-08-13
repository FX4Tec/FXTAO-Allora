import api from '@/services/api';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import TaoApprovalSetup from '../TaoApprovalSetup';
import { getAddressByCep } from '@/services/viacep';
import { getCoordinates } from '@/services/geocoding';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

const REGISTRATION_TYPE_OPTIONS = [
  { value: 'SOMENTE_OBRA', label: 'Somente Obra' },
  { value: 'OBRA_E_CENTRO_CUSTO', label: 'Obra e Centro de Custo' },
  { value: 'SOMENTE_CENTRO_CUSTO', label: 'Somente Centro de Custo' },
  { value: 'CENTRO_CUSTO_ASSOCIADO_OBRA', label: 'Centro de Custo Associado à Obra' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'PESSOA_JURIDICA', label: 'Pessoa Jurídica' },
  { value: 'PESSOA_FISICA', label: 'Pessoa Física' },
  { value: 'OUTROS', label: 'Outros' },
];

const REGISTRATION_TYPE_REQUIREMENTS = {
  SOMENTE_OBRA: 'Permite abertura apenas da obra. Centro de custo e empresa financeira nao sao obrigatorios.',
  OBRA_E_CENTRO_CUSTO: 'Exige empresa responsavel, area de negocio e um centro de custo principal.',
  SOMENTE_CENTRO_CUSTO: 'Fluxo financeiro sem estrutura de orcamento. Requer ao menos um centro de custo.',
  CENTRO_CUSTO_ASSOCIADO_OBRA: 'Exige obra principal vinculada, empresa responsavel e ao menos um centro de custo.',
};

const createEmptyQuickCostCenter = () => ({
  cost_center_code: '',
  name: '',
  linked_document: '',
  purpose: 'CLIENTE',
  is_primary: false,
  participates_financial: false,
  participates_budget: false,
  participates_supplies: false,
  participates_measurements: false,
});

export default function TaoStepStart({ taoData, updateTao, bankAccounts, canEdit }) {
  const handleChange = (field, value) => {
    updateTao({ ...taoData, [field]: value });
  };

  const parseNumericInput = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const { data: parentTaos = [], isLoading: isLoadingParentTaos } = useQuery({
    queryKey: ['taoParentCandidates'],
    queryFn: async () => {
      const res = await api.get('/taos', { params: { limit: 200 } });
      return (res.data?.data || []).filter((item) => item.id !== taoData.id);
    },
  });

  const { data: businessAreas = [] } = useQuery({
    queryKey: ['businessAreas'],
    queryFn: async () => {
      const res = await api.get('/resources/business-areas');
      return res.data || [];
    },
  });

  const isLoadingLookups = isLoadingParentTaos;

  const currentCompanyPayload = {
    legal_name: taoData.responsible_company_payload?.legal_name || taoData.responsible_company?.legal_name || '',
    trade_name: taoData.responsible_company_payload?.trade_name || taoData.responsible_company?.trade_name || '',
    document: taoData.responsible_company_payload?.document || taoData.responsible_company?.document || '',
  };

  const currentClientPayload = {
    name: taoData.client_payload?.name || taoData.client?.name || '',
    client_type: taoData.client_payload?.client_type || taoData.client?.client_type || '',
    document: taoData.client_payload?.document || taoData.client?.document || '',
  };

  const updateCompanyPayload = (field, value) => {
    updateTao({
      ...taoData,
      responsible_company_id: null,
      responsible_company_payload: {
        ...currentCompanyPayload,
        [field]: value,
      },
    });
  };

  const updateClientPayload = (field, value) => {
    updateTao({
      ...taoData,
      client_id: null,
      client_payload: {
        ...currentClientPayload,
        [field]: value,
      },
    });
  };

  const updateFinancialBusinessAreaPayload = (field, value) => {
    updateTao({
      ...taoData,
      financial_business_area_id: null,
      financial_business_area_payload: {
        ...(taoData.financial_business_area_payload || {}),
        [field]: value,
      },
    });
  };

  const handleCostCentersChange = (nextCostCenters) => {
    updateTao({
      ...taoData,
      cost_centers: nextCostCenters,
    });
  };

  const quickCostCenter = taoData.quick_cost_center_form || createEmptyQuickCostCenter();

  const setQuickCostCenter = (field, value) => {
    updateTao({
      ...taoData,
      quick_cost_center_form: {
        ...quickCostCenter,
        [field]: value,
      },
    });
  };

  const handleAddQuickCostCenter = () => {
    if (!quickCostCenter.cost_center_code || !quickCostCenter.name) {
      toast.error('Preencha numero e descricao do centro de custo.');
      return;
    }

    const current = Array.isArray(taoData.cost_centers) ? taoData.cost_centers : [];
    const duplicated = current.some((item) => item.cost_center_code === quickCostCenter.cost_center_code && item.purpose === quickCostCenter.purpose);
    if (duplicated) {
      toast.error('Já existe um centro de custo com este número e finalidade.');
      return;
    }

    const next = [
      ...current.map((item) => ({
        ...item,
        is_primary: quickCostCenter.is_primary && item.purpose === quickCostCenter.purpose ? false : item.is_primary,
      })),
      quickCostCenter,
    ];

    updateTao({
      ...taoData,
      cost_centers: next,
      quick_cost_center_form: createEmptyQuickCostCenter(),
    });
  };

  const handleUpdateCostCenter = (index, field, value) => {
    const current = Array.isArray(taoData.cost_centers) ? taoData.cost_centers : [];
    const next = current.map((item, currentIndex) => {
      if (currentIndex !== index) {
        if (field === 'is_primary' && value === true && item.purpose === current[index]?.purpose) {
          return { ...item, is_primary: false };
        }
        return item;
      }

      return { ...item, [field]: value };
    });

    handleCostCentersChange(next);
  };

  const handleRemoveCostCenter = (indexToRemove) => {
    const current = Array.isArray(taoData.cost_centers) ? taoData.cost_centers : [];
    handleCostCentersChange(current.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <TaoApprovalSetup taoData={taoData} updateTao={updateTao} canEdit={canEdit} />

      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div className="space-y-2">
            <Label htmlFor="project_name" className="text-lg font-semibold text-slate-900">OBRA:</Label>
            <Input
              id="project_name"
              value={taoData.project_name || ''}
              onChange={(e) => handleChange('project_name', e.target.value)}
              className="text-lg h-12 border-slate-300 focus:border-indigo-500"
              placeholder="Nome do empreendimento"
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="md:col-span-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-500">ID TAO</Label>
            <div className="h-12 flex items-center px-4 bg-slate-100 rounded-md text-slate-500 font-mono">
              {taoData.id ? `#${taoData.id.slice(-4)}` : 'Novo'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Row */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex flex-col">
                <Label className="text-indigo-700 font-semibold mb-1">CONTRATO</Label>
                <span className="text-xs text-slate-500">Empresa consultoria</span>
              </div>
              <Switch
                checked={taoData.contract_company_consultancy || false}
                onCheckedChange={(checked) => handleChange('contract_company_consultancy', checked)}
                disabled={!canEdit}
              />
              <span className="text-sm font-medium">
                {taoData.contract_company_consultancy ? 'Sim' : 'Não'}
              </span>
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="erp_number" className="whitespace-nowrap font-bold">Código da Obra / ERP Nº:</Label>
                <Input
                  id="erp_number"
                  value={taoData.erp_number || ''}
                  onChange={(e) => handleChange('erp_number', e.target.value)}
                  className="font-mono text-center text-lg"
                  placeholder="Ex: OB-2026-001"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="area_m2" className="whitespace-nowrap font-bold">Área da Obra:</Label>
                <Input
                  id="area_m2"
                  type="number"
                  value={taoData.area_m2 || ''}
                  onChange={(e) => handleChange('area_m2', parseNumericInput(e.target.value))}
                  className="text-right"
                  disabled={!canEdit}
                />
                <span className="font-bold text-slate-600">m²</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Estrutura Sienge da TAO</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {isLoadingLookups && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando cadastros de apoio...
            </div>
          )}

          {taoData.registration_type && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <p className="text-sm font-medium text-indigo-900">
                Regras do tipo de registro selecionado
              </p>
              <p className="text-sm text-indigo-700">
                {REGISTRATION_TYPE_REQUIREMENTS[taoData.registration_type]}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Tipo de Registro</Label>
              <Select
                value={taoData.registration_type || ''}
                onValueChange={(value) => handleChange('registration_type', value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Data de Cadastro / Abertura</Label>
              <Input
                type="date"
                value={taoData.opening_date || ''}
                onChange={(e) => handleChange('opening_date', e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Situação da Obra</Label>
              <Input
                value={taoData.construction_situation || ''}
                onChange={(e) => handleChange('construction_situation', e.target.value)}
                placeholder="Ex: Em planejamento"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Registro Consistente</Label>
              <div className="h-10 rounded-md border border-slate-200 px-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {taoData.is_registration_consistent ? 'Sim' : 'Não'}
                </span>
                <Switch
                  checked={taoData.is_registration_consistent || false}
                  onCheckedChange={(checked) => handleChange('is_registration_consistent', checked)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Tipo de Obra / Empreendimento</Label>
              <Input
                value={taoData.project_type || ''}
                onChange={(e) => handleChange('project_type', e.target.value)}
                placeholder="Ex: Residencial vertical"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Responsável Técnico</Label>
              <Input
                value={taoData.technical_responsible_name || ''}
                onChange={(e) => handleChange('technical_responsible_name', e.target.value)}
                placeholder="Nome do responsável técnico"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1">
              <Label>Município</Label>
              <Input
                value={taoData.construction_city || ''}
                onChange={(e) => handleChange('construction_city', e.target.value)}
                placeholder="Município da obra"
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-800">Empresa Responsável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nome da Empresa</Label>
                    <Input
                      value={currentCompanyPayload.legal_name}
                      onChange={(e) => updateCompanyPayload('legal_name', e.target.value)}
                      placeholder="Razao social da empresa"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={currentCompanyPayload.trade_name}
                      onChange={(e) => updateCompanyPayload('trade_name', e.target.value)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Código da Empresa no Sienge</Label>
                    <Input value={taoData.company_code || ''} onChange={(e) => handleChange('company_code', e.target.value)} disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                  <Label>CNPJ/CPF</Label>
                  <Input
                    value={currentCompanyPayload.document}
                    onChange={(e) => updateCompanyPayload('document', e.target.value)}
                    placeholder="Documento da empresa"
                    disabled={!canEdit}
                  />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-800">Cliente / Contratante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nome do Cliente</Label>
                    <Input value={currentClientPayload.name} onChange={(e) => updateClientPayload('name', e.target.value)} placeholder="Nome do cliente ou contratante" disabled={!canEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label>Código do Cliente no Sienge</Label>
                    <Input value={taoData.client_code || ''} onChange={(e) => handleChange('client_code', e.target.value)} disabled={!canEdit} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Tipo de Cliente</Label>
                    <Select
                      value={currentClientPayload.client_type || ''}
                      onValueChange={(value) => updateClientPayload('client_type', value)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Documento</Label>
                    <Input
                      value={currentClientPayload.document}
                      onChange={(e) => updateClientPayload('document', e.target.value)}
                      placeholder="CNPJ ou CPF do cliente"
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Observações do vínculo cliente x obra</Label>
                  <Textarea
                    value={taoData.client_link_notes || ''}
                    onChange={(e) => handleChange('client_link_notes', e.target.value)}
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {taoData.registration_type === 'CENTRO_CUSTO_ASSOCIADO_OBRA' && (
            <div className="space-y-1">
              <Label>Obra Principal Vinculada</Label>
              <Select
                value={taoData.parent_tao_id || ''}
                onValueChange={(value) => handleChange('parent_tao_id', value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a obra principal..." />
                </SelectTrigger>
                <SelectContent>
                  {parentTaos.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.project_name} {item.erp_number ? `(${item.erp_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {taoData.registration_type === 'OBRA_E_CENTRO_CUSTO' && (
            <Card className="border-amber-200 bg-amber-50/40 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-amber-900">Dados financeiros obrigatórios para Obra e Centro de Custo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Área de Negócio</Label>
                  <Select
                    value={taoData.financial_business_area_id || ''}
                    onValueChange={(value) => updateTao({
                      ...taoData,
                      financial_business_area_id: value,
                      financial_business_area_payload: {},
                    })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área de negócio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {businessAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Nova Área de Negócio</Label>
                  <Input
                    value={taoData.financial_business_area_payload?.name || ''}
                    onChange={(e) => updateFinancialBusinessAreaPayload('name', e.target.value)}
                    placeholder="Preencha se a área ainda não existir"
                    disabled={!canEdit}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Data de Início da Obra</Label>
              <Input
                type="date"
                value={taoData.date_start || ''}
                onChange={(e) => handleChange('date_start', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1">
              <Label>Data de Término Prevista</Label>
              <Input
                type="date"
                value={taoData.date_end || ''}
                onChange={(e) => handleChange('date_end', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-1">
              <Label>Endereço de Entrega</Label>
              <Input
                value={taoData.delivery_address || ''}
                onChange={(e) => handleChange('delivery_address', e.target.value)}
                placeholder="Se diferente do endereço da obra"
                disabled={!canEdit}
              />
            </div>
          </div>

          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-800">Centros de Custo Associados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <Label>Número do CC</Label>
                  <Input
                    value={quickCostCenter.cost_center_code || ''}
                    onChange={(e) => setQuickCostCenter('cost_center_code', e.target.value)}
                    placeholder="Ex: CC-001"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <Label>Descrição</Label>
                  <Input
                    value={quickCostCenter.name || ''}
                    onChange={(e) => setQuickCostCenter('name', e.target.value)}
                    placeholder="Descricao do centro de custo"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label>CNPJ/CPF Vinculado</Label>
                  <Input
                    value={quickCostCenter.linked_document || ''}
                    onChange={(e) => setQuickCostCenter('linked_document', e.target.value)}
                    placeholder="Documento vinculado ao CC"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <Label>Finalidade</Label>
                  <Select value={quickCostCenter.purpose || 'CLIENTE'} onValueChange={(value) => setQuickCostCenter('purpose', value)} disabled={!canEdit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENTE">CC Cliente</SelectItem>
                      <SelectItem value="CONSTRUTORA">CC Empresa / CYMZ</SelectItem>
                      <SelectItem value="ADMINISTRACAO_OBRA">Administração da Obra</SelectItem>
                      <SelectItem value="OUTROS">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 space-y-1">
                  <Label>Principal</Label>
                  <div className="h-10 rounded-md border border-slate-200 px-3 flex items-center justify-center">
                    <Switch
                      checked={quickCostCenter.is_primary || false}
                      onCheckedChange={(checked) => setQuickCostCenter('is_primary', checked)}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleAddQuickCostCenter}
                    disabled={!canEdit}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {(taoData.cost_centers || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 text-center">
                    Nenhum centro de custo associado informado nesta etapa.
                  </div>
                ) : (
                  (taoData.cost_centers || []).map((costCenter, index) => (
                    <div key={`${costCenter.cost_center_code || 'cc'}-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-lg border border-slate-200 p-4">
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">Número do CC</Label>
                        <Input
                          value={costCenter.cost_center_code || ''}
                          onChange={(e) => handleUpdateCostCenter(index, 'cost_center_code', e.target.value)}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={costCenter.name || ''}
                          onChange={(e) => handleUpdateCostCenter(index, 'name', e.target.value)}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">CNPJ/CPF Vinculado</Label>
                        <Input
                          value={costCenter.linked_document || ''}
                          onChange={(e) => handleUpdateCostCenter(index, 'linked_document', e.target.value)}
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">Finalidade</Label>
                        <Select value={costCenter.purpose || 'CLIENTE'} onValueChange={(value) => handleUpdateCostCenter(index, 'purpose', value)} disabled={!canEdit}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENTE">CC Cliente</SelectItem>
                            <SelectItem value="CONSTRUTORA">CC Empresa / CYMZ</SelectItem>
                            <SelectItem value="ADMINISTRACAO_OBRA">Administração</SelectItem>
                            <SelectItem value="OUTROS">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs">Centro Principal</Label>
                        <div className="h-10 rounded-md border border-slate-200 px-3 flex items-center justify-between">
                          <span className="text-sm text-slate-600">{costCenter.is_primary ? 'Sim' : 'Nao'}</span>
                          <Switch
                            checked={costCenter.is_primary || false}
                            onCheckedChange={(checked) => handleUpdateCostCenter(index, 'is_primary', checked)}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveCostCenter(index)}
                          disabled={!canEdit}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Billing Data */}
        <div className="space-y-6">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Endereço de Cobrança / Faturamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Razão Social de Cobrança</Label>
                <Input
                  value={taoData.billing_company_name || ''}
                  onChange={(e) => handleChange('billing_company_name', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço de Cobrança</Label>
                <Input
                  value={taoData.billing_address || ''}
                  onChange={(e) => handleChange('billing_address', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>CEP</Label>
                  <Input
                    value={taoData.billing_zip || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      handleChange('billing_zip', val.replace(/^(\d{5})(\d{3})/, '$1-$2'));
                    }}
                    onBlur={async (e) => {
                      if (!canEdit) return;
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length === 8) {
                        try {
                          toast.info("Buscando CEP de Faturamento...");
                          const data = await getAddressByCep(val);

                          updateTao({
                            ...taoData,
                            billing_zip: e.target.value,
                            billing_address: data.logradouro,
                            billing_neighborhood: data.bairro,
                            billing_city: data.localidade,
                            billing_state: data.uf
                          });

                          toast.success("Endereço de Faturamento preenchido!", { duration: 2000 });
                        } catch (_error) {
                          toast.error("Erro ao buscar CEP: " + _error.message);
                        }
                      }
                    }}
                    maxLength={9}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input
                    value={taoData.billing_neighborhood || ''}
                    onChange={(e) => handleChange('billing_neighborhood', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={taoData.billing_city || ''}
                    onChange={(e) => handleChange('billing_city', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label>UF</Label>
                  <Select
                    value={taoData.billing_state || ''}
                    onValueChange={(val) => handleChange('billing_state', val)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>I.E.</Label>
                  <Input
                    value={taoData.billing_ie || ''}
                    onChange={(e) => handleChange('billing_ie', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label>I.M.</Label>
                  <Input
                    value={taoData.billing_im || ''}
                    onChange={(e) => handleChange('billing_im', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <Label>DRM</Label>
                  <Input
                    value={taoData.billing_drm || ''}
                    onChange={(e) => handleChange('billing_drm', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ</Label>
                  <Input
                    value={taoData.billing_cnpj || ''}
                    onChange={(e) => handleChange('billing_cnpj', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Número do IPTU</Label>
                  <Input value={taoData.billing_iptu_number || ''} onChange={(e) => handleChange('billing_iptu_number', e.target.value)} disabled={!canEdit} />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Label className="text-slate-500">Não Estabelecido:</Label>
                <Switch
                  checked={taoData.billing_not_established || false}
                  onCheckedChange={(val) => handleChange('billing_not_established', val)}
                  disabled={!canEdit}
                />
                <span className="text-sm">{taoData.billing_not_established ? 'Sim' : 'Não'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Construction Address & Manager */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Endereço da Obra</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Endereço da Obra</Label>
                <Input
                  value={taoData.construction_address || ''}
                  onChange={(e) => handleChange('construction_address', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>CEP</Label>
                <Input
                  className="w-1/2"
                  value={taoData.construction_zip || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    handleChange('construction_zip', val.replace(/^(\d{5})(\d{3})/, '$1-$2'));
                  }}
                  onBlur={async (e) => {
                    if (!canEdit) return;
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length === 8) {
                      try {
                        toast.info("Buscando dados do local...");

                        // 1. Buscando Endereço (ViaCEP)
                        const data = await getAddressByCep(val);

                        let updatedData = {
                          ...taoData,
                          construction_zip: e.target.value,
                          construction_address: data.logradouro,
                          construction_neighborhood: data.bairro,
                          construction_city: data.localidade,
                          construction_state: data.uf
                        };

                        // 2. Buscando Coordenadas (Nominatim) com endereço completo
                        toast.info("Buscando coordenadas...");
                        const fullAddress = `${data.logradouro}, ${data.localidade}, ${data.uf}`;
                        const coords = await getCoordinates(fullAddress);

                        if (coords) {
                          updatedData.latitude = coords.lat;
                          updatedData.longitude = coords.lng;
                          toast.success("Endereço e coordenadas atualizados!");
                        } else {
                          toast.warning("Endereço encontrado, mas coordenadas não localizadas.");
                        }

                        // Single update to prevent race conditions
                        updateTao(updatedData);

                      } catch (error) {
                        toast.error("Erro ao buscar dados: " + error.message);
                      }
                    }
                  }}
                  maxLength={9}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Bairro</Label>
                <Input
                  value={taoData.construction_neighborhood || ''}
                  onChange={(e) => handleChange('construction_neighborhood', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={taoData.construction_city || ''}
                    onChange={(e) => handleChange('construction_city', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label>UF</Label>
                  <Select
                    value={taoData.construction_state || ''}
                    onValueChange={(val) => handleChange('construction_state', val)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Latitude</Label>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                      onClick={async () => {
                        if (!taoData.construction_address || !taoData.construction_city) {
                          toast.error("Preencha Endereço e Cidade para buscar coordenadas.");
                          return;
                        }
                        try {
                          const address = `${taoData.construction_address}, ${taoData.construction_city}, ${taoData.construction_state || ''}`;
                          toast.info("Buscando coordenadas...");
                          const coords = await getCoordinates(address);
                          if (coords) {
                            updateTao({
                              ...taoData,
                              latitude: coords.lat,
                              longitude: coords.lng
                            });
                            toast.success("Coordenadas encontradas!");
                          } else {
                            toast.warning("Coordenadas não encontradas para este endereço.");
                          }
                        } catch {
                          toast.error("Erro ao buscar coordenadas.");
                        }
                      }}
                      type="button"
                      disabled={!canEdit}
                    >
                      Buscar Auto
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="any"
                    value={taoData.latitude || ''}
                    onChange={(e) => handleChange('latitude', parseNumericInput(e.target.value))}
                    placeholder="-23.5505"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={taoData.longitude || ''}
                    onChange={(e) => handleChange('longitude', parseNumericInput(e.target.value))}
                    placeholder="-46.6333"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Gerenciadora</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Razão Social</Label>
                <Input
                  value={taoData.manager_company_name || ''}
                  onChange={(e) => handleChange('manager_company_name', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input
                  value={taoData.manager_address || ''}
                  onChange={(e) => handleChange('manager_address', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input
                  className="w-1/2"
                  value={taoData.manager_phone || ''}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Banks Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Banco Empresa [Consultoria]: <span className="text-xs font-normal text-slate-500">(Bco - Nº - Ag - CC - PIX)</span></Label>
            <Select
              value={taoData.bank_account_consultancy_id || ''}
              onValueChange={(val) => handleChange('bank_account_consultancy_id', val)}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.filter(b => b.company_type === 'consultancy').map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Banco Empresa [Construções]: <span className="text-xs font-normal text-slate-500">(Bco - Nº - Ag - CC - PIX)</span></Label>
            <Select
              value={taoData.bank_account_construction_id || ''}
              onValueChange={(val) => handleChange('bank_account_construction_id', val)}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione a conta..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.filter(b => b.company_type === 'construction').map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
