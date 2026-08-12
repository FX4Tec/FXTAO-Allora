import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PermissionsManager from '@/components/PermissionsManager';
import { Settings as SettingsIcon, Calculator, Save, ShieldAlert, List as LogsIcon, KeyRound, ShieldCheck, UserCircle, Globe2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import IntegrationSettingsCard from '@/components/settings/IntegrationSettingsCard';
import TaoTransferCard from '@/components/settings/TaoTransferCard';
import PluginDownloadsGuide from '@/components/settings/PluginDownloadsGuide';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const queryClient = useQueryClient();
  const { user, assistedTenant } = useAuth();
  const isCentralFx4Mode = user?.role === 'admin' && !assistedTenant;
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [tenantSettings, setTenantSettings] = useState({
    primary_domain: '',
    app_subdomain: '',
    local_login_enabled: true,
    microsoft_login_enabled: false,
    microsoft_sso: {
      authority_tenant_id: '',
      client_id: '',
      client_secret: '',
      redirect_uri: '',
      allowed_domains: '',
      is_enabled: false,
      has_client_secret: false,
    },
  });

  // Fetch System Configs
  const { data: systemConfigs } = useQuery({
    queryKey: ['systemConfigs'],
    queryFn: async () => {
      const res = await api.get('/resources/system-configs');
      return res.data || [];
    },
    enabled: !isCentralFx4Mode,
  });

  const { data: saasTenantSettings } = useQuery({
    queryKey: ['saasTenantSettings'],
    queryFn: async () => {
      const res = await api.get('/saas/tenant-settings');
      return res.data || null;
    },
    enabled: !isCentralFx4Mode,
  });

  useEffect(() => {
    if (systemConfigs) {
      const logoConfig = systemConfigs.find(c => c.key === 'client_logo_url');
      if (logoConfig) {
        setClientLogoUrl(logoConfig.value);
      }
    }
  }, [systemConfigs]);

  useEffect(() => {
    if (!saasTenantSettings?.tenant) return;

    const sso = saasTenantSettings.microsoft_sso || {};
    setTenantSettings({
      primary_domain: saasTenantSettings.tenant.primary_domain || '',
      app_subdomain: saasTenantSettings.tenant.app_subdomain || '',
      local_login_enabled: saasTenantSettings.tenant.local_login_enabled !== false,
      microsoft_login_enabled: Boolean(saasTenantSettings.tenant.microsoft_login_enabled),
      microsoft_sso: {
        authority_tenant_id: sso.authority_tenant_id || '',
        client_id: sso.client_id || '',
        client_secret: '',
        redirect_uri: sso.redirect_uri || '',
        allowed_domains: (sso.allowed_domains || []).join(', '),
        is_enabled: Boolean(sso.is_enabled),
        has_client_secret: Boolean(sso.has_client_secret),
      },
    });
  }, [saasTenantSettings]);

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

  const tenantSettingsMutation = useMutation({
    mutationFn: async () => api.put('/saas/tenant-settings', {
      primary_domain: tenantSettings.primary_domain,
      app_subdomain: tenantSettings.app_subdomain,
      local_login_enabled: tenantSettings.local_login_enabled,
      microsoft_login_enabled: tenantSettings.microsoft_login_enabled,
      branding_logo_url: clientLogoUrl,
      microsoft_sso: tenantSettings.microsoft_sso,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['saasTenantSettings']);
      toast.success('Configurações SaaS do cliente salvas com sucesso.');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error?.response?.data?.details || 'Falha ao salvar configurações SaaS.');
    },
  });

  const updateTenantSetting = (key, value) => {
    setTenantSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSsoSetting = (key, value) => {
    setTenantSettings(prev => ({
      ...prev,
      microsoft_sso: { ...prev.microsoft_sso, [key]: value },
    }));
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
    },
    enabled: !isCentralFx4Mode,
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

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    }),
    onSuccess: () => {
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Senha atualizada com sucesso.');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || 'Falha ao atualizar senha.');
    },
  });

  const canChangePassword = passwordForm.current_password
    && passwordForm.new_password.length >= 8
    && passwordForm.new_password === passwordForm.confirm_password;

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isCentralFx4Mode) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-700">Configurações</p>
          <h1 className="text-3xl font-bold text-slate-950">Meu acesso e perfil</h1>
          <p className="text-slate-500">Consultar status do usuário, tenant ativo, perfil aplicado e trocar senha.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-700" />
              Status do usuário conectado
            </CardTitle>
            <CardDescription>Esta sessão está na administração central da FX4, sem cliente selecionado.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Perfil</p>
              <p className="mt-2 text-lg font-bold text-slate-950">Master admin FX4</p>
              <p className="text-sm text-slate-500">Sessão direta do usuário</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Empresa cliente ativa</p>
              <p className="mt-2 text-lg font-bold text-slate-950">Nenhuma empresa selecionada</p>
              <p className="text-sm text-slate-500">Painel SaaS FX4</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Usuário</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{user?.full_name || 'Administrador FX4'}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <div className="rounded-lg border bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-700">Escopo autorizado</p>
              <p className="mt-2 text-lg font-bold text-slate-950">Acesso central da plataforma FX4</p>
              <p className="text-sm text-slate-500">Para ver dados, use acesso assistido no Painel SaaS.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-700" />
              Troca de senha
            </CardTitle>
            <CardDescription>Atualize a credencial local da sua conta central sem acessar dados de cliente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Senha atual</Label>
                <Input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <Input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirmar nova senha</Label>
                <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
              </div>
            </div>
            <Button disabled={!canChangePassword || passwordMutation.isPending} onClick={() => passwordMutation.mutate()}>
              <Save className="mr-2 h-4 w-4" /> Atualizar senha
            </Button>
          </CardContent>
        </Card>

        <PluginDownloadsGuide />

        <Card className="border-blue-100 bg-blue-50/60 shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6 text-sm text-blue-900">
            <UserCircle className="mt-0.5 h-5 w-5" />
            <p>Como administrador central, o menu fica limitado a Configurações e Painel SaaS FX4. O acesso aos dados de Allora, CYMZ ou outro cliente acontece somente por ação explícita de acesso assistido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        <TaoTransferCard />

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

        <Card className="border-blue-100 shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Globe2 className="w-5 h-5" />
              Acesso Direto e Microsoft Entra SSO
            </CardTitle>
            <CardDescription>
              Defina o domínio exclusivo deste cliente e as credenciais Microsoft Entra usadas somente neste tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>URL direta do cliente</Label>
                <Input
                  placeholder="allora.fxtao.fx4.com.br"
                  value={tenantSettings.primary_domain}
                  onChange={(e) => updateTenantSetting('primary_domain', e.target.value)}
                />
                <p className="text-xs text-slate-500">Ao acessar este host, o login já carrega logo/contexto deste cliente.</p>
              </div>
              <div className="space-y-2">
                <Label>Alias/Subdomínio adicional</Label>
                <Input
                  placeholder="tao.cliente.com.br"
                  value={tenantSettings.app_subdomain}
                  onChange={(e) => updateTenantSetting('app_subdomain', e.target.value)}
                />
                <p className="text-xs text-slate-500">Opcional. Também será registrado como domínio do tenant no catálogo SaaS.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={tenantSettings.local_login_enabled}
                  onChange={(e) => updateTenantSetting('local_login_enabled', e.target.checked)}
                />
                Login local habilitado
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={tenantSettings.microsoft_login_enabled}
                  onChange={(e) => {
                    updateTenantSetting('microsoft_login_enabled', e.target.checked);
                    updateSsoSetting('is_enabled', e.target.checked);
                  }}
                />
                Microsoft SSO habilitado
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Microsoft Tenant ID</Label>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={tenantSettings.microsoft_sso.authority_tenant_id}
                  onChange={(e) => updateSsoSetting('authority_tenant_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Microsoft Client ID</Label>
                <Input
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={tenantSettings.microsoft_sso.client_id}
                  onChange={(e) => updateSsoSetting('client_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder={tenantSettings.microsoft_sso.has_client_secret ? 'Secret já cadastrado; preencha só para trocar' : 'Cole o Value do secret do Entra'}
                  value={tenantSettings.microsoft_sso.client_secret}
                  onChange={(e) => updateSsoSetting('client_secret', e.target.value)}
                />
                {tenantSettings.microsoft_sso.has_client_secret && (
                  <p className="text-xs text-emerald-700">Secret armazenado de forma criptografada. O valor não é exibido.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Redirect URI</Label>
                <Input
                  placeholder="https://allora.fxtao.fx4.com.br/api/v1/auth/microsoft/callback"
                  value={tenantSettings.microsoft_sso.redirect_uri}
                  onChange={(e) => updateSsoSetting('redirect_uri', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Domínios de e-mail permitidos</Label>
                <Input
                  placeholder="alloraconstrutora.com.br, alloraconstrutora.onmicrosoft.com"
                  value={tenantSettings.microsoft_sso.allowed_domains}
                  onChange={(e) => updateSsoSetting('allowed_domains', e.target.value)}
                />
                <p className="text-xs text-slate-500">Separe por vírgula. Se vazio, qualquer domínio aceito pelo app Microsoft poderá autenticar usuários cadastrados.</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Cadastre esta Redirect URI no Microsoft Entra em <strong>Authentication</strong>. Em produção, use HTTPS e mantenha o secret protegido.
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100">
            <Button className="ml-auto bg-blue-700 hover:bg-blue-800" onClick={() => tenantSettingsMutation.mutate()} disabled={tenantSettingsMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {tenantSettingsMutation.isPending ? 'Salvando...' : 'Salvar Acesso e SSO'}
            </Button>
          </CardFooter>
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
