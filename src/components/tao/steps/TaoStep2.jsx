import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Search, Calendar, DollarSign, User, Mail, Briefcase, CheckCircle2, Circle } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { toast } from "sonner";

// ──────── Currency helpers ────────
const toBRL = (v) => {
  if (v == null || v === '' || isNaN(v)) return '';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseBRL = (str) => {
  if (!str && str !== 0) return null;
  if (typeof str === 'number') return str;
  const cleaned = String(str).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

function CurrencyInput({ value, onChange, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (!focused) setLocalValue(toBRL(value));
  }, [value, focused]);

  return (
    <Input
      {...props}
      className={`text-right font-mono ${className}`}
      value={focused ? localValue : toBRL(value)}
      onFocus={(e) => {
        setFocused(true);
        setLocalValue(value != null && value !== '' ? String(value) : '');
        setTimeout(() => e.target.select(), 0);
      }}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        setFocused(false);
        onChange(parseBRL(localValue));
      }}
    />
  );
}

export default function TaoStep2({ taoData, updateTao }) {
  const queryClient = useQueryClient();
  const taoId = taoData.id;

  // --- Installments State & Logic ---
  const [newInstallment, setNewInstallment] = useState({ description: '', due_date: '', value: '', type: 'direct' });

  const { data: installments, isLoading: isLoadingInstallments } = useQuery({
    queryKey: ['taoInstallments', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-installments', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });

  const createInstallmentMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-installments', { ...data, tao_id: taoId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoInstallments', taoId]);
      setNewInstallment({ description: '', due_date: '', value: '', type: 'direct' });
      toast.success("Parcela adicionada");
    },
    onError: (err) => {
      console.error('Erro ao criar parcela:', err);
      toast.error('Erro ao criar parcela: ' + (err?.response?.data?.error || err.message));
    }
  });

  const updateInstallmentMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/resources/tao-installments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoInstallments', taoId]);
      toast.success("Parcela atualizada");
    },
    onError: (err) => {
      console.error('Erro ao atualizar parcela:', err);
      toast.error('Erro ao atualizar parcela: ' + (err?.response?.data?.error || err.message));
    }
  });

  const deleteInstallmentMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-installments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoInstallments', taoId]);
      toast.success("Parcela removida");
    },
    onError: (err) => {
      console.error('Erro ao remover parcela:', err);
      toast.error('Erro ao remover parcela: ' + (err?.response?.data?.error || err.message));
    }
  });

  const handleAddInstallment = () => {
    if (!newInstallment.description || !newInstallment.value) {
      toast.error("Preencha descrição e valor");
      return;
    }
    if (!newInstallment.due_date) {
      toast.error("Preencha a data de vencimento");
      return;
    }
    const payload = {
      description: newInstallment.description,
      type: newInstallment.type || 'direct',
      value: parseBRL(newInstallment.value),
      due_date: newInstallment.due_date ? new Date(newInstallment.due_date).toISOString() : null
    };
    createInstallmentMutation.mutate(payload);
  };

  const togglePaid = (inst) => {
    updateInstallmentMutation.mutate({
      id: inst.id,
      data: {
        is_paid: !inst.is_paid,
        paid_date: !inst.is_paid ? new Date().toISOString().split('T')[0] : null
      }
    });
  };

  // --- Team State & Logic ---
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '', team_type: 'Equipe Obra' });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['taoTeam', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-team-members', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });

  const createMemberMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-team-members', { ...data, tao_id: taoId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoTeam', taoId]);
      setNewMember({ name: '', role: '', email: '', team_type: 'Equipe Obra' });
      toast.success("Membro adicionado");
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-team-members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoTeam', taoId]);
      toast.success("Membro removido");
    }
  });

  const handleAddMember = () => {
    if (!newMember.name) {
      toast.error("Preencha o nome");
      return;
    }
    createMemberMutation.mutate(newMember);
  };

  const filteredTeam = teamMembers?.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!taoId) {
    return <div className="p-10 text-center text-slate-500">Salve o TAO primeiro para adicionar parcelas e equipe.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">OBRA:</span>
          <span className="text-slate-900 font-medium">{taoData.project_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">ERP Nº:</span>
          <span className="font-mono text-slate-900">{taoData.erp_number}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Installments & Conditions */}
        <div className="space-y-6">

          {/* Installments Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Parcelas</CardTitle>
            </CardHeader>

            {/* Add Installment Form */}
            <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={newInstallment.description}
                  onChange={(e) => setNewInstallment({ ...newInstallment, description: e.target.value })}
                  placeholder="Ex: Entrada"
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={newInstallment.type}
                  onValueChange={(val) => setNewInstallment({ ...newInstallment, type: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direto</SelectItem>
                    <SelectItem value="consultancy">Consultoria</SelectItem>
                    <SelectItem value="construction">Construção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Vencimento</Label>
                <Input
                  type="date"
                  value={newInstallment.due_date}
                  onChange={(e) => setNewInstallment({ ...newInstallment, due_date: e.target.value })}
                  className="h-8 text-sm p-1"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Valor (R$)</Label>
                <CurrencyInput
                  value={newInstallment.value}
                  onChange={(v) => setNewInstallment({ ...newInstallment, value: v })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-1">
                <Button size="sm" className="w-full h-8 bg-indigo-600 hover:bg-indigo-700" onClick={handleAddInstallment}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Installments List */}
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[30px]">Pago?</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor R$</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments?.map((inst) => (
                    <TableRow key={inst.id} className={inst.is_paid ? "bg-green-50/50" : ""}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${inst.is_paid ? 'text-green-600' : 'text-slate-300 hover:text-green-600'}`}
                          onClick={() => togglePaid(inst)}
                          title={inst.is_paid ? `Pago em ${inst.paid_date}` : "Marcar como pago"}
                        >
                          {inst.is_paid ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-xs">{inst.description}</TableCell>
                      <TableCell className="text-xs capitalize text-slate-500">{inst.type}</TableCell>
                      <TableCell className="text-xs">
                        {inst.due_date ? format(new Date(inst.due_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {toBRL(inst.value)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteInstallmentMutation.mutate(inst.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!installments || installments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        Nenhuma parcela cadastrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Payment Conditions */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Valores Faturamento Direto e Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Textarea
                className="min-h-[150px] resize-none"
                placeholder="Descreva as condições de pagamento..."
                value={taoData.payment_conditions || ''}
                onChange={(e) => updateTao({ ...taoData, payment_conditions: e.target.value })}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="w-16 text-xs">Info 1:</Label>
                  <Input
                    className="flex-1 h-8"
                    value={taoData.info_1 || ''}
                    onChange={(e) => updateTao({ ...taoData, info_1: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-16 text-xs">Info 2:</Label>
                  <Input
                    className="flex-1 h-8"
                    value={taoData.info_2 || ''}
                    onChange={(e) => updateTao({ ...taoData, info_2: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Team */}
        <div className="space-y-6">
          <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Equipe Empresa</CardTitle>
            </CardHeader>

            <div className="p-4 space-y-4 flex-1 flex flex-col">

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar membro..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Add Member Form */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      className="h-8"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cargo</Label>
                    <Input
                      className="h-8"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">E-mail</Label>
                    <Input
                      className="h-8"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Equipe</Label>
                    <Select
                      value={newMember.team_type}
                      onValueChange={(val) => setNewMember({ ...newMember, team_type: val })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Equipe Obra">Equipe Obra</SelectItem>
                        <SelectItem value="Equipe Apoio">Equipe Apoio</SelectItem>
                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAddMember}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Membro
                </Button>
              </div>

              {/* Team List */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
                <div className="overflow-auto flex-1 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Equipe</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeam.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-mono text-xs text-slate-500">#{member.id.slice(-4)}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{member.name}</span>
                              <span className="text-xs text-slate-500">{member.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {member.team_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteMemberMutation.mutate(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}