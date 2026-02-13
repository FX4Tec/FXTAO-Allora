import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ShieldAlert } from 'lucide-react';
import { toast } from "sonner";

export default function PermissionsManager() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        user_email: '',
        tao_id: '',
        level: '1',
        scope: 'tao'
    });

    // Fetch Users
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data
    });

    // Fetch Taos
    const { data: taosResponse } = useQuery({
        queryKey: ['taos-all'],
        queryFn: async () => (await api.get('/taos?limit=100')).data
    });
    const taos = taosResponse?.data || [];

    // Fetch Approvers
    const { data: approvers } = useQuery({
        queryKey: ['tao-approvers'],
        queryFn: async () => (await api.get('/resources/tao-approvers')).data
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/resources/tao-approvers', {
            ...data,
            level: Number(data.level)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['tao-approvers']);
            toast.success("Permissão adicionada com sucesso!");
            setFormData(prev => ({ ...prev, user_email: '', tao_id: '' }));
        },
        onError: (error) => toast.error("Erro ao adicionar permissão: " + (error.response?.data?.error || error.message))
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/resources/tao-approvers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['tao-approvers']);
            toast.success("Permissão removida!");
        },
        onError: () => toast.error("Erro ao remover permissão.")
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.user_email || !formData.tao_id) {
            toast.error("Selecione usuário e obra.");
            return;
        }
        createMutation.mutate(formData);
    };

    const getUserName = (email) => users?.find(u => u.email === email)?.full_name || email;
    const getTaoName = (id) => taos?.find(t => t.id === id)?.project_name || id;

    const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    Adicionar Nova Permissão
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <Label>Usuário</Label>
                        <select
                            value={formData.user_email}
                            onChange={e => setFormData({ ...formData, user_email: e.target.value })}
                            className={selectClass}
                        >
                            <option value="">Selecione...</option>
                            {(users || []).map(u => (
                                <option key={u.id} value={u.email}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Obra (TAO)</Label>
                        <select
                            value={formData.tao_id}
                            onChange={e => setFormData({ ...formData, tao_id: e.target.value })}
                            className={selectClass}
                        >
                            <option value="">Selecione...</option>
                            {(taos || []).map(t => (
                                <option key={t.id} value={t.id}>{t.project_name} (#{t.id.slice(-4)})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nível</Label>
                        <select
                            value={formData.level}
                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                            className={selectClass}
                        >
                            <option value="1">Nível 1 (Básico)</option>
                            <option value="2">Nível 2 (Gerência)</option>
                            <option value="3">Nível 3 (Diretoria)</option>
                        </select>
                    </div>
                    <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar
                    </Button>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Obra</TableHead>
                            <TableHead>Nível</TableHead>
                            <TableHead>Escopo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {approvers?.map((perm) => (
                            <TableRow key={perm.id}>
                                <TableCell className="font-medium">{getUserName(perm.user_email)}</TableCell>
                                <TableCell>{getTaoName(perm.tao_id)}</TableCell>
                                <TableCell>Nível {perm.level}</TableCell>
                                <TableCell>{perm.scope}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteMutation.mutate(perm.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!approvers || approvers.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-slate-500">
                                    Nenhuma permissão associada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
