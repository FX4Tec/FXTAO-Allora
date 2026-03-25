import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PermissionsManager from '@/components/PermissionsManager';
import { Settings as SettingsIcon, Calculator, Save, ShieldAlert, List as LogsIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import IntegrationSettingsCard from '@/components/settings/IntegrationSettingsCard';

export default function Settings() {
  const queryClient = useQueryClient();
  const [clientLogoUrl, setClientLogoUrl] = useState('');

  // Fetch System Configs
  const { data: systemConfigs } = useQuery({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const res = await api.get('/resources/system-configs');
      return res.data || [];
    }
  });

  useEffect(() => {
    if (systemConfigs) {
      const logoConfig = systemConfigs.find(c => c.key === 'client_logo_url');
      if (logoConfig) {
        setClientLogoUrl(logoConfig.value);
      }
    }
  }, [systemConfigs]);

  const logoMutation = useMutation({
    mutationFn: async (url) => {
      const logoConfig = systemConfigs?.find(c => c.key === 'client_logo_url');
      if (logoConfig) {
        return api.put(`/resources/system-configs/${logoConfig.id}`, { value: url });
      } else {
        return api.post('/resources/system-configs', { key: 'client_logo_url', value: url });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['systemConfigs']);
      toast.success("Logo atualizado com sucesso!");
    }
  });

  const handleSaveLogo = () => {
    logoMutation.mutate(clientLogoUrl);
  };

  const [settings, setSettings] = useState({
    default_iss_percent: 5,
    default_inss_percent: 11,
    default_pis_percent: 0.65,
    default_cofins_percent: 3,
    default_csll_percent: 1,
    default_ir_percent: 1.5,
    default_consultancy_split_percent: 10,
    default_construction_split_percent: 90
  });

  const { data: existingSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const res = await api.get('/resources/tao-global-settings');
      return res.data?.[0] || null;
    }
  });

  useEffect(() => {
    if (existingSettings) {
      // Filter out ID and other metadata for the form state, or just merge?
      // existingSettings contains all fields. We just need to ensure the numbers are set.
      setSettings(prev => ({
        ...prev,
        ...existingSettings
      }));
    }
  }, [existingSettings]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean data before sending? 
      // We should only send the fields we want to update.
      // But let's send what we have in state.
      // And we need to ensure numbers are numbers.

      const payload = {
        default_iss_percent: Number(data.default_iss_percent),
        default_inss_percent: Number(data.default_inss_percent),
        default_pis_percent: Number(data.default_pis_percent),
        default_cofins_percent: Number(data.default_cofins_percent),
        default_csll_percent: Number(data.default_csll_percent),
        default_ir_percent: Number(data.default_ir_percent),
        default_consultancy_split_percent: Number(data.default_consultancy_split_percent),
        default_construction_split_percent: Number(data.default_construction_split_percent),
      };

      if (existingSettings?.id) {
        return api.put(`/resources/tao-global-settings/${existingSettings.id}`, payload);
      } else {
        return api.post('/resources/tao-global-settings', { ...payload, setting_name: 'default' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['globalSettings']);
      toast.success("Configurações salvas com sucesso!");
    }
  });

  const handleSave = () => {
    mutation.mutate(settings);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value })); // Keep as string for input, convert on save
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Calculator className="w-5 h-5" />
              Regras de Cálculo (Padrão)
            </CardTitle>
            <CardDescription>
              Defina as porcentagens padrão para impostos e distribuição de valores.
              Estas regras serão aplicadas quando o modo "Automático" estiver ativado na obra.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 border-b pb-2">Impostos Padrão (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ISS</Label>
                  <Input
                    type="number"
                    value={settings.default_iss_percent}
                    onChange={(e) => handleChange('default_iss_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>INSS</Label>
                  <Input
                    type="number"
                    value={settings.default_inss_percent}
                    onChange={(e) => handleChange('default_inss_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>PIS</Label>
                  <Input
                    type="number"
                    value={settings.default_pis_percent}
                    onChange={(e) => handleChange('default_pis_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>COFINS</Label>
                  <Input
                    type="number"
                    value={settings.default_cofins_percent}
                    onChange={(e) => handleChange('default_cofins_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CSLL</Label>
                  <Input
                    type="number"
                    value={settings.default_csll_percent}
                    onChange={(e) => handleChange('default_csll_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IR</Label>
                  <Input
                    type="number"
                    value={settings.default_ir_percent}
                    onChange={(e) => handleChange('default_ir_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 border-b pb-2">Distribuição do Contrato (%)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Consultoria</Label>
                  <Input
                    type="number"
                    value={settings.default_consultancy_split_percent}
                    onChange={(e) => handleChange('default_consultancy_split_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Construção</Label>
                  <Input
                    type="number"
                    value={settings.default_construction_split_percent}
                    onChange={(e) => handleChange('default_construction_split_percent', e.target.value)}
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button className="bg-indigo-600 hover:bg-indigo-700 ml-auto" onClick={handleSave} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <SettingsIcon className="w-5 h-5" />
              Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm mb-4">
              O sistema FX TAO utiliza estas configurações para automatizar cálculos quando a opção "Automático" é selecionada no cadastro da obra.
              Valores podem ser sempre ajustados manualmente em cada obra individualmente se necessário, bastando alterar o modo para "Manual".
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
              <p>Versão do Sistema: 1.0.3</p>
              <p>Módulo de Cálculo: Ativo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <ShieldAlert className="w-5 h-5" />
              Permissões de Acesso por Obra
            </CardTitle>
            <CardDescription>
              Associe usuários a obras específicas definindo nível de aprovação e acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionsManager />
          </CardContent>
        </Card>

        <IntegrationSettingsCard />

        {/* Client Logo Config */}
        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <SettingsIcon className="w-5 h-5" />
              Personalização do Cliente
            </CardTitle>
            <CardDescription>Configure o logotipo do cliente para exibição no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Logo do Cliente</Label>
              <div className="flex gap-4">
                <Input
                  placeholder="https://exemplo.com/logo.png"
                  value={clientLogoUrl}
                  onChange={(e) => setClientLogoUrl(e.target.value)}
                />
                <Button onClick={handleSaveLogo} disabled={logoMutation.isPending}>
                  {logoMutation.isPending ? 'Salvando...' : 'Salvar Logo'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Este logo será exibido na tela de login e no menu lateral.
              </p>
              {clientLogoUrl && (
                <div className="mt-4 p-4 border rounded bg-slate-50 flex justify-center">
                  <img src={clientLogoUrl} alt="Preview" className="max-h-20 max-w-full object-contain" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ViaCEP Integration */}
        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              Integração de CEP (ViaCEP)
            </CardTitle>
            <CardDescription>
              O sistema utiliza a API pública ViaCEP para auto-preenchimento de endereços. Esta integração é gratuita e não requer configuração adicional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Integração Ativa</p>
                <p className="text-xs text-green-600">viacep.com.br</p>
              </div>
            </div>

            <div className="mt-4">
              <Label>Testar integração:</Label>
              <div className="flex gap-2 mt-1">
                <Input placeholder="Digite um CEP" id="test-cep" />
                <Button onClick={async () => {
                  const input = document.getElementById('test-cep');
                  const val = input.value;
                  if (!val) return;
                  try {
                    const { getAddressByCep } = await import('@/services/viacep');
                    const data = await getAddressByCep(val);
                    toast.success(`Encontrado: ${data.logradouro}, ${data.localidade}-${data.uf}`);
                  } catch (e) {
                    toast.error("Erro: " + e.message);
                  }
                }} className="bg-green-600 hover:bg-green-700">
                  Testar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="border-slate-200 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <LogsIcon className="w-5 h-5" />
              Logs de Alterações
            </CardTitle>
            <CardDescription>Histórico de modificações sensíveis no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <LogsViewer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LogsViewer() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['taoLogs'],
    queryFn: async () => {
      // Sort by created_at desc
      const res = await api.get('/resources/tao-logs');
      const sorted = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return sorted;
    },
  });

  if (isLoading) return <div>Carregando logs...</div>;
  if (!logs || logs.length === 0) return <div className="text-sm text-slate-500">Nenhum log registrado.</div>;

  return (
    <div className="max-h-[400px] overflow-auto border rounded-md">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-700 font-medium border-b sticky top-0">
          <tr>
            <th className="p-3">Data</th>
            <th className="p-3">Usuário</th>
            <th className="p-3">Ação</th>
            <th className="p-3">Detalhes</th>
            <th className="p-3">ID Ref.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="p-3 whitespace-nowrap text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="p-3 font-medium">{log.user_email}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold
                                    ${log.action === 'create' ? 'bg-green-100 text-green-700' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'}`}>
                  {log.action}
                </span>
              </td>
              <td className="p-3 text-slate-600 max-w-xs truncate" title={JSON.stringify(log.details)}>
                {/* details might be JSON or string */}
                {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
              </td>
              <td className="p-3 font-mono text-xs text-slate-400">
                {log.tao_id?.slice(-4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
