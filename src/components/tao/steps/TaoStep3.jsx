import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
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

// Status configuration
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  { value: 'rejected', label: 'Prejuízo', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
];

const getStatusConfig = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

export default function TaoStep3({ taoData, updateTao, canEdit }) {
  const queryClient = useQueryClient();
  const taoId = taoData.id;

  // --- Additives State & Logic ---
  const [newAdditive, setNewAdditive] = useState({ description: '', approval_date: '', value: '' });
  const [selectedAdditive, setSelectedAdditive] = useState(null);

  const { data: additives, isLoading } = useQuery({
    queryKey: ['taoAdditives', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-additives', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });

  const createAdditiveMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-additives', {
      ...data,
      tao_id: taoId,
      approval_status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoAdditives', taoId]);
      setNewAdditive({ description: '', approval_date: '', value: '' });
      toast.success("Aditivo solicitado (Pendente Aprovação)");
    },
    onError: (err) => {
      console.error('Erro ao criar aditivo:', err);
      toast.error('Erro ao criar aditivo: ' + (err?.response?.data?.error || err.message));
    }
  });

  const updateAdditiveMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/resources/tao-additives/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoAdditives', taoId]);
      setSelectedAdditive(null);
      toast.success("Status do aditivo atualizado");
    },
    onError: (err) => {
      console.error('Erro ao atualizar aditivo:', err);
      toast.error('Erro ao atualizar aditivo: ' + (err?.response?.data?.error || err.message));
    }
  });

  const deleteAdditiveMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-additives/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoAdditives', taoId]);
      toast.success("Aditivo removido");
    },
    onError: (err) => {
      console.error('Erro ao remover aditivo:', err);
      toast.error('Erro ao remover aditivo: ' + (err?.response?.data?.error || err.message));
    }
  });

  const handleAddAdditive = () => {
    if (!newAdditive.description || !newAdditive.value) {
      toast.error("Preencha descrição e valor");
      return;
    }
    const payload = {
      description: newAdditive.description,
      value: parseBRL(newAdditive.value),
      approval_date: newAdditive.approval_date ? new Date(newAdditive.approval_date).toISOString() : null
    };
    createAdditiveMutation.mutate(payload);
  };

  const handleStatusChange = (newStatus) => {
    if (!selectedAdditive) return;
    updateAdditiveMutation.mutate({
      id: selectedAdditive.id,
      data: { approval_status: newStatus }
    });
  };

  const totalAdditives = additives?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

  if (!taoId) {
    return <div className="p-10 text-center text-slate-500">Salve o TAO primeiro para adicionar aditivos.</div>;
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

      <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Aditivos</CardTitle>
        </CardHeader>

        {/* Add Additive Form */}
        {canEdit && (
          <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Input
                value={newAdditive.description}
                onChange={(e) => setNewAdditive({ ...newAdditive, description: e.target.value })}
                placeholder="Descrição do aditivo..."
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs">Data Aprovação</Label>
              <Input
                type="date"
                value={newAdditive.approval_date}
                onChange={(e) => setNewAdditive({ ...newAdditive, approval_date: e.target.value })}
              />
            </div>
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">Valor Aprovado (R$)</Label>
              <CurrencyInput
                value={newAdditive.value}
                onChange={(v) => setNewAdditive({ ...newAdditive, value: v })}
              />
            </div>
            <div className="md:col-span-1">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleAddAdditive}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Additives List */}
        <div className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[100px]">ID Aditivo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Data Aprovação</TableHead>
                <TableHead className="text-right w-[150px]">Valor Aprovado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {additives?.map((item) => {
                const statusCfg = getStatusConfig(item.approval_status);
                return (
                  <TableRow key={item.id} className={item.approval_status === 'rejected' ? 'text-red-600' : ''}>
                    <TableCell
                      className={`font-mono text-xs cursor-pointer hover:underline ${item.approval_status === 'rejected' ? 'text-red-600' : 'text-indigo-600'}`}
                      onClick={() => setSelectedAdditive(item)}
                    >
                      #{item.id.slice(-4)}
                    </TableCell>
                    <TableCell
                      className={`font-medium cursor-pointer ${item.approval_status === 'rejected' ? 'text-red-600 hover:text-red-800' : 'hover:text-indigo-600'}`}
                      onClick={() => setSelectedAdditive(item)}
                    >
                      {item.description}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.color}`}
                        onClick={() => setSelectedAdditive(item)}
                      >
                        {statusCfg.label}
                      </span>
                    </TableCell>
                    <TableCell className={item.approval_status === 'rejected' ? 'text-red-600' : ''}>
                      {item.approval_date ? format(new Date(item.approval_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-mono font-medium ${item.approval_status === 'rejected' ? 'text-red-600' : ''}`}>
                      {item.approval_status === 'rejected' ? '-' : ''} R$ {toBRL(item.value)}
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteAdditiveMutation.mutate(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!additives || additives.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-12">
                    Nenhum aditivo cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Total */}
        <CardFooter className="bg-indigo-600 text-white p-4 flex justify-between items-center">
          <span className="font-medium opacity-90">TOTAL DE ADITIVOS</span>
          <span className="text-xl font-bold">R$ {toBRL(totalAdditives)}</span>
        </CardFooter>
      </Card>

      {/* Status Change Modal */}
      <Dialog open={!!selectedAdditive} onOpenChange={(open) => !open && setSelectedAdditive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Alterar Status do Aditivo
            </DialogTitle>
          </DialogHeader>
          {selectedAdditive && (
            <div className="space-y-5 pt-2">
              {/* Additive info */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">ID:</span>
                  <span className="font-mono text-sm text-slate-700">#{selectedAdditive.id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Descrição:</span>
                  <span className="text-sm text-slate-900 font-medium">{selectedAdditive.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Valor:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">R$ {toBRL(selectedAdditive.value)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Status atual:</span>
                  {(() => {
                    const cfg = getStatusConfig(selectedAdditive.approval_status);
                    return <span className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${cfg.color}`}>{cfg.label}</span>;
                  })()}
                </div>
              </div>

              {/* Status buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Selecione o novo status:</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = selectedAdditive.approval_status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(opt.value)}
                        disabled={updateAdditiveMutation.isPending}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                          ${isActive
                            ? `${opt.color} border-current shadow-sm`
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                        `}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? '' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold uppercase ${isActive ? '' : 'text-slate-500'}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}