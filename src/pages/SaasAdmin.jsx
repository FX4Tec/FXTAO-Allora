import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Building2,
  Database,
  Globe2,
  Pencil,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const emptyForm = {
  id: null,
  slug: '',
  legal_name: '',
  display_name: '',
  plan_code: 'enterprise',
  primary_domain: '',
  operational_status: 'active',
  local_login_enabled: true,
  microsoft_login_enabled: false,
};

const planCopy = {
  essential: {
    title: 'Essencial',
    description: 'Obras, suprimentos e relatórios operacionais.',
    users: '10',
    companies: '2',
    reports: '2',
  },
  professional: {
    title: 'Profissional',
    description: 'Gestão financeira, drillthrough integral e relatórios agendados.',
    users: '40',
    companies: '10',
    reports: '15',
  },
  enterprise: {
    title: 'Corporativo',
    description: 'Portfólio multiempresa, controladoria, SSO e governança avançada.',
    users: 'Ilimitado',
    companies: 'Ilimitado',
    reports: 'Ilimitado',
  },
};

const statusLabel = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
};

const normalizeForm = (tenant) => ({
  id: tenant?.id || null,
  slug: tenant?.slug || '',
  legal_name: tenant?.legal_name || '',
  display_name: tenant?.display_name || '',
  plan_code: tenant?.plan_code || 'enterprise',
  primary_domain: tenant?.primary_domain || '',
  operational_status: tenant?.operational_status || 'active',
  local_login_enabled: tenant?.local_login_enabled !== false,
  microsoft_login_enabled: Boolean(tenant?.microsoft_login_enabled),
});

export default function SaasAdmin() {
  const queryClient = useQueryClient();
  const { startAssistedAccess } = useAuth();
  const [form, setForm] = React.useState(emptyForm);
  const [showForm, setShowForm] = React.useState(false);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['saasTenants'],
    queryFn: async () => {
      const res = await api.get('/saas/tenants');
      return res.data || [];
    },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['saasAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/saas/audit-logs');
      return res.data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug.trim().toLowerCase(),
        legal_name: form.legal_name.trim(),
        display_name: form.display_name.trim(),
        plan_code: form.plan_code,
        primary_domain: form.primary_domain.trim().toLowerCase() || null,
        operational_status: form.operational_status,
        local_login_enabled: form.local_login_enabled,
        microsoft_login_enabled: form.microsoft_login_enabled,
      };

      if (form.id) return api.put(`/saas/tenants/${form.id}`, payload);
      return api.post('/saas/tenants', payload);
    },
    onSuccess: () => {
      toast.success(form.id ? 'Cliente SaaS atualizado.' : 'Cliente SaaS criado.');
      setShowForm(false);
      setForm(emptyForm);
      queryClient.invalidateQueries(['saasTenants']);
      queryClient.invalidateQueries(['saasAuditLogs']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.details || error?.response?.data?.error || 'Falha ao salvar cliente.');
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (tenant) => {
    setForm(normalizeForm(tenant));
    setShowForm(true);
  };

  const canSave = form.slug.trim().length >= 2 && form.display_name.trim().length >= 2;
  const activeTenants = tenants.filter((tenant) => tenant.operational_status === 'active').length;
  const connectedTenants = tenants.filter((tenant) => tenant.stats?.database_status === 'connected').length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-700">Painel SaaS FX4</p>
        <h1 className="text-3xl font-bold text-slate-950">Clientes SaaS e Planos</h1>
        <p className="text-slate-500">Administrar clientes, planos, bancos segregados e acesso assistido da FX4.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Object.entries(planCopy).map(([code, plan]) => (
          <Card key={code}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.title}</CardTitle>
                <Badge variant="outline">{code === 'enterprise' ? 'Corporativo' : 'Plano'}</Badge>
              </div>
              <p className="text-sm text-slate-500">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Usuários</span><strong>{plan.users}</strong></div>
              <div className="flex justify-between"><span>Empresas</span><strong>{plan.companies}</strong></div>
              <div className="flex justify-between"><span>Relatórios agendados</span><strong>{plan.reports}</strong></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><Building2 className="mb-2 h-5 w-5 text-blue-700" /><div className="text-2xl font-bold">{tenants.length}</div><p className="text-xs text-slate-500">clientes cadastrados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><Activity className="mb-2 h-5 w-5 text-emerald-700" /><div className="text-2xl font-bold">{activeTenants}</div><p className="text-xs text-slate-500">clientes ativos</p></CardContent></Card>
        <Card><CardContent className="pt-6"><Database className="mb-2 h-5 w-5 text-indigo-700" /><div className="text-2xl font-bold">{connectedTenants}</div><p className="text-xs text-slate-500">bancos conectados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><ShieldCheck className="mb-2 h-5 w-5 text-amber-700" /><div className="text-2xl font-bold">Opção B</div><p className="text-xs text-slate-500">banco por cliente</p></CardContent></Card>
      </div>

      {showForm && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>{form.id ? 'Editar cliente SaaS' : 'Novo cliente SaaS'}</CardTitle>
            <p className="text-sm text-slate-500">Cadastre ou atualize o tenant comercial da plataforma.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="allora" /></div>
            <div><Label>Razão social</Label><Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} /></div>
            <div><Label>Nome fantasia</Label><Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
            <div>
              <Label>Plano</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.plan_code} onChange={(e) => setForm({ ...form, plan_code: e.target.value })}>
                <option value="essential">Essencial</option>
                <option value="professional">Profissional</option>
                <option value="enterprise">Corporativo</option>
              </select>
            </div>
            <div><Label>Domínio principal</Label><Input value={form.primary_domain || ''} onChange={(e) => setForm({ ...form, primary_domain: e.target.value })} placeholder="tao.cliente.com.br" /></div>
            <div>
              <Label>Situação</Label>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={form.operational_status} onChange={(e) => setForm({ ...form, operational_status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.local_login_enabled} onChange={(e) => setForm({ ...form, local_login_enabled: e.target.checked })} /> Login local habilitado</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.microsoft_login_enabled} onChange={(e) => setForm({ ...form, microsoft_login_enabled: e.target.checked })} /> Microsoft SSO habilitado</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>{form.id ? 'Salvar cliente' : 'Criar cliente'}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Clientes SaaS</CardTitle>
            <p className="text-sm text-slate-500">Visível exclusivamente para a administração FX4.</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Novo cliente</Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {isLoading ? <p className="text-slate-500">Carregando clientes...</p> : tenants.map((tenant) => (
            <Card key={tenant.id} className="border-slate-200">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">{tenant.display_name}</h3>
                    <p className="text-sm text-slate-500">{tenant.legal_name || tenant.slug}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700">{statusLabel[tenant.operational_status] || tenant.operational_status}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Plano</span><strong>{planCopy[tenant.plan_code]?.title || tenant.plan_code}</strong></div>
                  <div className="flex justify-between"><span>Banco</span><strong>{tenant.stats?.database_status || 'pendente'}</strong></div>
                  <div className="flex justify-between"><span>Usuários vinculados</span><strong>{tenant.stats?.users_count ?? 0}</strong></div>
                  <div className="flex justify-between"><span>TAOs / Obras</span><strong>{tenant.stats?.taos_count ?? 0}</strong></div>
                  <div className="flex items-center gap-2 text-slate-500"><Globe2 className="h-4 w-4" /> {tenant.primary_domain || 'Sem domínio próprio'}</div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => openEdit(tenant)}><Pencil className="mr-2 h-4 w-4" /> Editar cliente e plano</Button>
                <Button className="w-full" variant="outline" onClick={() => startAssistedAccess(tenant, 'Settings')}>Abrir configurações do cliente</Button>
                <Button className="w-full" variant="outline" onClick={() => startAssistedAccess(tenant, 'Users')}><Users className="mr-2 h-4 w-4" /> Abrir usuários do cliente</Button>
                <Button className="w-full bg-blue-700 hover:bg-blue-800" onClick={() => startAssistedAccess(tenant, 'TaoList')}>Acessar dados do cliente</Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Auditoria Recente</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {auditLogs.slice(0, 8).map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">{log.action}</span>
              <span className="text-slate-500">{log.user_email || '-'}</span>
              <span className="text-slate-500">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
              <Badge variant="outline">{log.result}</Badge>
            </div>
          ))}
          {!auditLogs.length && <p className="text-sm text-slate-500">Sem eventos de auditoria.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
