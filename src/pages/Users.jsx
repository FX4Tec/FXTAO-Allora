import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, User as UserIcon } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';

export default function Users() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'user',
        is_active: true,
        can_view_restricted_tao_fields: false,
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            return res.data;
        }
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success("Usuário criado com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => toast.error(error.response?.data?.error || "Erro ao criar usuário")
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success("Usuário atualizado com sucesso!");
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => toast.error(error.response?.data?.error || "Erro ao atualizar usuário")
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success("Usuário excluído com sucesso!");
        },
        onError: (error) => toast.error("Erro ao excluir usuário")
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            const { password, ...rest } = formData;
            const dataToUpdate = password ? formData : rest;
            updateMutation.mutate({ id: editingUser.id, data: dataToUpdate });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name || '',
            email: user.email,
            password: '', // Don't fill password
            role: user.role,
            is_active: user.is_active !== undefined ? user.is_active : true,
            can_view_restricted_tao_fields: Boolean(user.can_view_restricted_tao_fields),
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setEditingUser(null);
        setFormData({
            full_name: '',
            email: '',
            password: '',
            role: 'user',
            is_active: true,
            can_view_restricted_tao_fields: false,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Usuários</h1>
                    <p className="text-slate-500 mt-1">Administre o acesso ao sistema.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-5 h-5 mr-2" />
                            Novo Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                    disabled={editingUser?.auth_provider === 'microsoft'}
                                    className={editingUser?.auth_provider === 'microsoft' ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingUser}
                                    required
                                    className={!!editingUser ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha {editingUser && '(Deixe em branco para manter)'}</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    disabled={editingUser?.auth_provider === 'microsoft'}
                                    placeholder={editingUser?.auth_provider === 'microsoft' ? 'Gerenciado pela Microsoft' : ''}
                                    className={editingUser?.auth_provider === 'microsoft' ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active">Usuário Ativo</Label>
                            </div>
                            <div className="flex items-start space-x-3 rounded-lg border border-slate-200 p-3">
                                <Switch
                                    id="can_view_restricted_tao_fields"
                                    checked={formData.can_view_restricted_tao_fields}
                                    onCheckedChange={(checked) => setFormData({ ...formData, can_view_restricted_tao_fields: checked })}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="can_view_restricted_tao_fields">Pode consultar dados restritos da TAO</Label>
                                    <p className="text-xs text-slate-500">
                                        Libera a aba de financeiro restrito e os dados sensíveis vinculados ao fork Allora.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Perfil</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={val => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">Usuário</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="director">Diretor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Perfil</TableHead>
                            <TableHead>Dados Restritos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24">Carregando...</TableCell></TableRow>
                        ) : users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <div className="p-2 bg-slate-100 rounded-full">
                                        <UserIcon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    {user.full_name || 'Sem nome'}
                                    {user.auth_provider === 'microsoft' && (
                                        <img
                                            src="https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png"
                                            alt="Microsoft Logo"
                                            className="h-4 ml-2"
                                            title="Usuário Microsoft 365"
                                        />
                                    )}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'director' ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-700'}`}>
                                        {user.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                                        ${user.can_view_restricted_tao_fields ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {user.can_view_restricted_tao_fields ? 'LIBERADO' : 'BLOQUEADO'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                                        ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.is_active ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-slate-500">
                                    {format(new Date(user.created_at), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} title="Editar">
                                            <Pencil className="w-4 h-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} title="Excluir">
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
