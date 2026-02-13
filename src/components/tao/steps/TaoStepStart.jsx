import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import TaoApprovalSetup from '../TaoApprovalSetup';
import { getAddressByCep } from '@/services/viacep';
import { getCoordinates } from '@/services/geocoding';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

export default function TaoStepStart({ taoData, updateTao, bankAccounts, canEdit }) {
  const handleChange = (field, value) => {
    updateTao({ ...taoData, [field]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <TaoApprovalSetup taoId={taoData.id} canEdit={canEdit} />

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
                <span className="text-xs text-slate-500">Empresa Consultoria</span>
              </div>
              <Switch
                checked={taoData.contract_company_consultancy || false}
                onCheckedChange={(checked) => handleChange('contract_company_consultancy', checked)}
              />
              <span className="text-sm font-medium">
                {taoData.contract_company_consultancy ? 'Sim' : 'Não'}
              </span>
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="erp_number" className="whitespace-nowrap font-bold">ERP Nº:</Label>
                <Input
                  id="erp_number"
                  value={taoData.erp_number || ''}
                  onChange={(e) => handleChange('erp_number', e.target.value)}
                  className="font-mono text-center text-lg"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="area_m2" className="whitespace-nowrap font-bold">ÁREA:</Label>
                <Input
                  id="area_m2"
                  type="number"
                  value={taoData.area_m2 || ''}
                  onChange={(e) => handleChange('area_m2', parseFloat(e.target.value))}
                  className="text-right"
                />
                <span className="font-bold text-slate-600">m²</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Billing Data */}
        <div className="space-y-6">
          <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase tracking-wider">Dados de Faturamento</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Razão Social</Label>
                <Input
                  value={taoData.billing_company_name || ''}
                  onChange={(e) => handleChange('billing_company_name', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input
                  value={taoData.billing_address || ''}
                  onChange={(e) => handleChange('billing_address', e.target.value)}
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
                        } catch (error) {
                          toast.error("Erro ao buscar CEP: " + error.message);
                        }
                      }
                    }}
                    maxLength={9}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input
                    value={taoData.billing_neighborhood || ''}
                    onChange={(e) => handleChange('billing_neighborhood', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={taoData.billing_city || ''}
                    onChange={(e) => handleChange('billing_city', e.target.value)}
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label>UF</Label>
                  <Select
                    value={taoData.billing_state || ''}
                    onValueChange={(val) => handleChange('billing_state', val)}
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
                  />
                </div>
                <div className="space-y-1">
                  <Label>I.M.</Label>
                  <Input
                    value={taoData.billing_im || ''}
                    onChange={(e) => handleChange('billing_im', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <Label>DRM</Label>
                  <Input
                    value={taoData.billing_drm || ''}
                    onChange={(e) => handleChange('billing_drm', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ</Label>
                  <Input
                    value={taoData.billing_cnpj || ''}
                    onChange={(e) => handleChange('billing_cnpj', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Label className="text-slate-500">Não Estabelecido:</Label>
                <Switch
                  checked={taoData.billing_not_established || false}
                  onCheckedChange={(val) => handleChange('billing_not_established', val)}
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
                <Label>Endereço</Label>
                <Input
                  value={taoData.construction_address || ''}
                  onChange={(e) => handleChange('construction_address', e.target.value)}
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
                />
              </div>
              <div className="space-y-1">
                <Label>Bairro</Label>
                <Input
                  value={taoData.construction_neighborhood || ''}
                  onChange={(e) => handleChange('construction_neighborhood', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 space-y-1">
                  <Label>Cidade</Label>
                  <Input
                    value={taoData.construction_city || ''}
                    onChange={(e) => handleChange('construction_city', e.target.value)}
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label>UF</Label>
                  <Select
                    value={taoData.construction_state || ''}
                    onValueChange={(val) => handleChange('construction_state', val)}
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
                        } catch (error) {
                          toast.error("Erro ao buscar coordenadas.");
                        }
                      }}
                      type="button"
                    >
                      Buscar Auto
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="any"
                    value={taoData.latitude || ''}
                    onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                    placeholder="-23.5505"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={taoData.longitude || ''}
                    onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                    placeholder="-46.6333"
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
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input
                  value={taoData.manager_address || ''}
                  onChange={(e) => handleChange('manager_address', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input
                  className="w-1/2"
                  value={taoData.manager_phone || ''}
                  onChange={(e) => handleChange('manager_phone', e.target.value)}
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