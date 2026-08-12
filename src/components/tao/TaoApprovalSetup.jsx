import React, { useState } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from "sonner";

export default function TaoApprovalSetup({ taoData = {}, updateTao, canEdit }) {
    const queryClient = useQueryClient();
    const taoId = taoData.id;
    const [newApprover, setNewApprover] = useState({ user_email: '', level: 1, scope: 'both' });

    const { data: approvers } = useQuery({
        queryKey: ['taoApprovers', taoId],
        queryFn: async () => {
            const res = await api.get('/resources/tao-approvers');
            const all = res.data || [];
            return all.filter(a => a.tao_id === taoId).sort((a, b) => a.level - b.level);
        },
        enabled: !!taoId,
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/resources/tao-approvers', { ...data, tao_id: taoId }),
        onSuccess: () => {
            queryClient.invalidateQueries(['taoApprovers', taoId]);
            queryClient.invalidateQueries(['tao', taoId]);
            setNewApprover({ user_email: '', level: 1, scope: 'both' });
            toast.success("Aprovador adicionado");
        }
    });

    const updateApprovalFlowMutation = useMutation({
        mutationFn: (enabled) => api.put(`/taos/${taoId}`, {
            approval_flow_enabled: enabled,
            ...(enabled ? {} : { approval_status: 'draft', current_approval_level: 0 }),
        }),
        onSuccess: (response) => {
            updateTao?.({
                ...taoData,
                approval_flow_enabled: Boolean(response.data?.approval_flow_enabled),
                approval_status: response.data?.approval_status || taoData.approval_status || 'draft',
                current_approval_level: response.data?.current_approval_level ?? taoData.current_approval_level ?? 0,
                tao_lifecycle_status: response.data?.tao_lifecycle_status ?? taoData.tao_lifecycle_status ?? null,
            });
            queryClient.invalidateQueries(['tao', taoId]);
            toast.success(response.data?.approval_flow_enabled ? "Hierarquia de aprovação ativada." : "Hierarquia de aprovação desativada.");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.details || error?.response?.data?.error || "Erro ao atualizar hierarquia de aprovação.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/resources/tao-approvers/${id}`),
        onSuccess: (_result, deletedId) => {
            const remainingRelevant = sortedApprovers
                .filter((approver) => approver.id !== deletedId)
                .some((approver) => ['tao', 'both'].includes(approver.scope));
            if (!remainingRelevant && taoData.approval_flow_enabled) {
                updateTao?.({
                    ...taoData,
                    approval_flow_enabled: false,
                    approval_status: 'draft',
                    current_approval_level: 0,
                });
            }
            queryClient.invalidateQueries(['taoApprovers', taoId]);
            queryClient.invalidateQueries(['tao', taoId]);
            toast.success("Aprovador removido");
        }
    });

    const sortedApprovers = approvers || [];
    const hasApprovalApprover = sortedApprovers.some((approver) => ['tao', 'both'].includes(approver.scope));
    const approvalFlowEnabled = Boolean(taoData.approval_flow_enabled) && hasApprovalApprover;

    if (!taoId) return null;

    return (
        <Card className="border-slate-200 shadow-sm mt-6">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        <div>
                            <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Hierarquia de Aprovação</CardTitle>
                            <p className="mt-1 text-xs text-slate-500">
                                Ative somente quando a obra realmente exigir aprovação formal.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="text-right">
                            <Label className="text-sm font-semibold text-slate-900">Fluxo ativo</Label>
                            <p className="text-xs text-slate-500">
                                {hasApprovalApprover ? 'Disponível para envio à aprovação' : 'Cadastre um aprovador primeiro'}
                            </p>
                        </div>
                        <Switch
                            checked={approvalFlowEnabled}
                            disabled={!canEdit || !hasApprovalApprover || updateApprovalFlowMutation.isPending}
                            onCheckedChange={(checked) => {
                                if (checked && !hasApprovalApprover) {
                                    toast.error('Cadastre pelo menos um aprovador de TAO antes de ativar a hierarquia.');
                                    return;
                                }
                                updateApprovalFlowMutation.mutate(checked);
                            }}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

                {canEdit && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <Label className="text-xs">Email do Aprovador</Label>
                            <Input
                                value={newApprover.user_email}
                                onChange={(e) => setNewApprover({ ...newApprover, user_email: e.target.value })}
                                placeholder="ex: diretor@empresa.com"
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Nível (Ordem)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={newApprover.level}
                                onChange={(e) => setNewApprover({ ...newApprover, level: parseInt(e.target.value) })}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Escopo</Label>
                            <Select
                                value={newApprover.scope}
                                onValueChange={(val) => setNewApprover({ ...newApprover, scope: val })}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="both">TAO e Aditivos</SelectItem>
                                    <SelectItem value="tao">Apenas TAO</SelectItem>
                                    <SelectItem value="additive">Apenas Aditivos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 h-8"
                            onClick={() => {
                                if (!newApprover.user_email) return toast.error("Informe o email");
                                createMutation.mutate(newApprover);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Adicionar
                        </Button>
                    </div>
                )}

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Nível</TableHead>
                            <TableHead>Aprovador</TableHead>
                            <TableHead>Escopo</TableHead>
                            {canEdit && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedApprovers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-slate-500 py-4">
                                    Nenhum aprovador configurado. A hierarquia só poderá ser ativada após cadastrar um aprovador.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedApprovers.map(app => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-bold text-center">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs mx-auto border border-slate-200">
                                            {app.level}
                                        </div>
                                    </TableCell>
                                    <TableCell>{app.user_email}</TableCell>
                                    <TableCell className="capitalize">
                                        {app.scope === 'both' ? 'TAO e Aditivos' : app.scope === 'tao' ? 'Apenas TAO' : 'Apenas Aditivos'}
                                    </TableCell>
                                    {canEdit && (
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                onClick={() => deleteMutation.mutate(app.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
