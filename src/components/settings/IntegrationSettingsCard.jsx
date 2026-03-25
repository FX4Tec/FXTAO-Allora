import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, KeyRound, RefreshCw, Server, Shield } from 'lucide-react';

import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const buildFormState = (settings) => ({
  ipFilterEnabled: Boolean(settings?.ipFilterEnabled),
  clients: (settings?.clients || []).reduce((accumulator, client) => {
    accumulator[client.key] = {
      key: client.key,
      label: client.label,
      active: Boolean(client.active),
      allowedIps: (client.allowedIps || []).join('\n'),
      hasToken: Boolean(client.hasToken),
      tokenPreview: client.tokenPreview || null,
      lastRotatedAt: client.lastRotatedAt || null,
      scopes: client.scopes || [],
    };

    return accumulator;
  }, {}),
});

const parseIpText = (value) =>
  String(value || '')
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatDateTime = (value) => {
  if (!value) return 'Ainda nao gerado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('pt-BR');
};

export default function IntegrationSettingsCard() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState({ ipFilterEnabled: false, clients: {} });
  const [freshTokens, setFreshTokens] = useState({});
  const [rotatingClientKey, setRotatingClientKey] = useState(null);

  const integrationSettingsQuery = useQuery({
    queryKey: ['integrationSettings'],
    queryFn: async () => {
      const res = await api.get('/integration-admin/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (integrationSettingsQuery.data) {
      setFormState(buildFormState(integrationSettingsQuery.data));
    }
  }, [integrationSettingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/integration-admin/settings', payload);
      return res.data;
    },
    onSuccess: (result) => {
      setFormState(buildFormState(result));
      queryClient.invalidateQueries(['integrationSettings']);
      toast.success('Politica de integracao salva com sucesso.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao salvar configuracoes de integracao.');
    },
  });

  const rotateTokenMutation = useMutation({
    mutationFn: async (clientKey) => {
      const res = await api.post(`/integration-admin/clients/${clientKey}/regenerate-token`);
      return res.data;
    },
    onMutate: (clientKey) => {
      setRotatingClientKey(clientKey);
    },
    onSuccess: (result) => {
      setFreshTokens((current) => ({
        ...current,
        [result.client.key]: result.token,
      }));
      queryClient.invalidateQueries(['integrationSettings']);
      toast.success(`Novo token do ${result.client.label} gerado. Copie agora, ele nao sera exibido novamente.`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao gerar token de integracao.');
    },
    onSettled: () => {
      setRotatingClientKey(null);
    },
  });

  const handleClientFieldChange = (clientKey, field, value) => {
    setFormState((current) => ({
      ...current,
      clients: {
        ...current.clients,
        [clientKey]: {
          ...current.clients[clientKey],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = () => {
    const payload = {
      ipFilterEnabled: Boolean(formState.ipFilterEnabled),
      clients: Object.values(formState.clients).map((client) => ({
        key: client.key,
        active: Boolean(client.active),
        allowedIps: parseIpText(client.allowedIps),
      })),
    };

    saveMutation.mutate(payload);
  };

  const handleCopyToken = async (clientKey) => {
    const token = freshTokens[clientKey];

    if (!token) {
      toast.info('Gere um novo token para copiar o valor completo.');
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(token);
      } else {
        window.prompt('Copie o token abaixo:', token);
      }

      toast.success('Token copiado para a area de transferencia.');
    } catch (_error) {
      window.prompt('Copie o token abaixo:', token);
    }
  };

  if (integrationSettingsQuery.isLoading && !integrationSettingsQuery.data) {
    return (
      <Card className="border-slate-200 shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Server className="w-5 h-5" />
            Integracoes do Ecossistema
          </CardTitle>
          <CardDescription>Carregando configuracoes de integracao...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (integrationSettingsQuery.isError) {
    return (
      <Card className="border-slate-200 shadow-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="w-5 h-5" />
            Integracoes do Ecossistema
          </CardTitle>
          <CardDescription>
            Nao foi possivel carregar as configuracoes da API de integracao.
          </CardDescription>
        </CardHeader>
        <CardFooter className="bg-slate-50 border-t border-slate-100">
          <Button variant="outline" onClick={() => integrationSettingsQuery.refetch()}>
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const clientEntries = Object.values(formState.clients);

  return (
    <Card className="border-slate-200 shadow-sm md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-700">
          <Server className="w-5 h-5" />
          Integracoes do Ecossistema
        </CardTitle>
        <CardDescription>
          Gerencie a API unidirecional do FXTAO para RDO, FX31 e consumidores genericos. O consumo externo exige HTTPS e Bearer token.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">HTTPS obrigatorio</Badge>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                  API /api/v1/integrations
                </Badge>
              </div>
              <p className="text-sm text-indigo-900">
                Ative o filtro de IP para exigir, alem do token, que cada cliente consuma a integracao a partir dos IPs cadastrados.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white px-4 py-3">
              <Switch
                id="integration-ip-filter"
                checked={Boolean(formState.ipFilterEnabled)}
                onCheckedChange={(checked) =>
                  setFormState((current) => ({ ...current, ipFilterEnabled: checked }))
                }
              />
              <div>
                <Label htmlFor="integration-ip-filter" className="text-sm font-semibold text-slate-900">
                  Ativar filtro por IP
                </Label>
                <p className="text-xs text-slate-500">
                  Quando desligado, a seguranca continua por token e HTTPS.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {clientEntries.map((client) => (
            <div key={client.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{client.label}</h3>
                  <p className="text-sm text-slate-500">
                    Cliente de integracao dedicado para o ecossistema FX4.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={client.active ? 'default' : 'outline'} className={client.active ? 'bg-green-600 hover:bg-green-600' : ''}>
                    {client.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
                <div>
                  <Label htmlFor={`client-active-${client.key}`} className="text-sm font-semibold text-slate-900">
                    Habilitar cliente
                  </Label>
                  <p className="text-xs text-slate-500">
                    Permite o consumo com token valido para este cliente.
                  </p>
                </div>
                <Switch
                  id={`client-active-${client.key}`}
                  checked={Boolean(client.active)}
                  onCheckedChange={(checked) => handleClientFieldChange(client.key, 'active', checked)}
                />
              </div>

              <div className="mt-4 space-y-2">
                <Label htmlFor={`allowed-ips-${client.key}`}>IPs permitidos</Label>
                <Textarea
                  id={`allowed-ips-${client.key}`}
                  value={client.allowedIps}
                  onChange={(event) => handleClientFieldChange(client.key, 'allowedIps', event.target.value)}
                  rows={6}
                  placeholder={'Um IP por linha\nEx.: 177.10.10.20\nEx.: 177.10.10.0/24'}
                  className="resize-y"
                />
                <p className="text-xs text-slate-500">
                  Separe por linha, virgula ou ponto e virgula. Suporta IP exato e CIDR IPv4.
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  Token de integracao
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {client.hasToken
                    ? `Token configurado: ${client.tokenPreview || 'token-configurado'}`
                    : 'Nenhum token gerado para este cliente.'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ultima rotacao: {formatDateTime(client.lastRotatedAt)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(client.scopes || []).map((scope) => (
                    <Badge key={scope} variant="outline" className="border-slate-200 text-slate-600">
                      {scope}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => rotateTokenMutation.mutate(client.key)}
                    disabled={rotatingClientKey === client.key}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${rotatingClientKey === client.key ? 'animate-spin' : ''}`} />
                    {client.hasToken ? 'Regenerar token' : 'Gerar token'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopyToken(client.key)}
                    disabled={!freshTokens[client.key]}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar token novo
                  </Button>
                </div>

                {freshTokens[client.key] && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Copie agora
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-amber-900">
                      {freshTokens[client.key]}
                    </p>
                    <p className="mt-2 text-xs text-amber-700">
                      O valor completo aparece apenas nesta tela, nesta sessao, logo apos a geracao.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="justify-end gap-2 border-t border-slate-100 bg-slate-50">
        <Button
          type="button"
          variant="outline"
          onClick={() => integrationSettingsQuery.refetch()}
          disabled={integrationSettingsQuery.isFetching}
        >
          Atualizar
        </Button>
        <Button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          Salvar Integracoes
        </Button>
      </CardFooter>
    </Card>
  );
}
