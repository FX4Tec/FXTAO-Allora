import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Database, Globe2, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const statusLabel = {
  active: 'Ativo',
  suspended: 'Suspenso',
  pending: 'Pendente',
};

export default function SaasAdmin() {
  const queryClient = useQueryClient();

  const { data: context } = useQuery({
    queryKey: ['saasContext'],
    queryFn: async () => {
      const res = await api.get('/saas/context');
      return res.data;
    },
  });

  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ['saasTenants'],
    queryFn: async () => {
      const res = await api.get('/saas/tenants');
      return res.data || [];
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['saasPlans'],
    queryFn: async () => {
      const res = await api.get('/saas/plans');
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

  const bootstrapMutation = useMutation({
    mutationFn: async () => api.post('/saas/bootstrap'),
    onSuccess: () => {
      toast.success('Catalogo SaaS sincronizado.');
      queryClient.invalidateQueries(['saasTenants']);
      queryClient.invalidateQueries(['saasPlans']);
      queryClient.invalidateQueries(['saasAuditLogs']);
      queryClient.invalidateQueries(['saasContext']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.details || 'Falha ao sincronizar catalogo SaaS.');
    },
  });

  const activeTenants = tenants.filter((tenant) => tenant.operational_status === 'active').length;
  const activePlans = plans.filter((plan) => plan.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Painel SaaS FX4</h1>
          <p className="text-sm text-slate-500">
            Governanca de clientes, dominios, planos e segregacao por banco.
          </p>
        </div>
        <Button
          className="bg-slate-900 hover:bg-slate-800"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sincronizar Engetec
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Building2 className="h-4 w-4" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-slate-500">{activeTenants} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Database className="h-4 w-4" />
              Estrategia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Banco por tenant</div>
            <p className="text-xs text-slate-500">Opcao B ativa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Planos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-slate-500">{activePlans} ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Activity className="h-4 w-4" />
              Tenant Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="truncate text-lg font-bold">{context?.tenant?.display_name || 'Nao identificado'}</div>
            <p className="truncate text-xs text-slate-500">{context?.tenant?.primary_domain || context?.tenant?.slug}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clientes SaaS</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SSO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTenants ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">Carregando clientes...</TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-500">Nenhum cliente cadastrado.</TableCell>
                </TableRow>
              ) : tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{tenant.display_name}</div>
                    <div className="text-xs text-slate-500">{tenant.legal_name || tenant.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-slate-400" />
                      <span>{tenant.primary_domain || tenant.domains?.[0]?.hostname || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tenant.database_label || 'tenant-db'}</TableCell>
                  <TableCell>{tenant.plan_code || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusLabel[tenant.operational_status] || tenant.operational_status}</Badge>
                  </TableCell>
                  <TableCell>{tenant.microsoft_login_enabled ? 'Microsoft ativo' : 'Login local'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auditoria Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Acao</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">Sem eventos de auditoria.</TableCell>
                </TableRow>
              ) : auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{log.user_email || '-'}</TableCell>
                  <TableCell>{log.tenant?.display_name || '-'}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
