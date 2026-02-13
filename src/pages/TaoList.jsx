import React from 'react';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  MoreHorizontal,
  ArrowRight,
  Pencil,
  Trash2
} from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";

export default function TaoList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['taos'],
    queryFn: async () => {
      const response = await api.get('/taos');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/taos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taos']);
      toast.success("TAO excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    }
  });

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este TAO? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate(id);
    }
  };

  const taos = responseData?.data || [];
  const meta = responseData?.meta;

  const statusColors = {
    start: "bg-slate-100 text-slate-700",
    "1": "bg-blue-100 text-blue-700",
    "2": "bg-indigo-100 text-indigo-700",
    "3": "bg-purple-100 text-purple-700",
    "4": "bg-orange-100 text-orange-700",
    "5": "bg-green-100 text-green-700",
    // Handle raw Prisma enum values
    step1: "bg-blue-100 text-blue-700",
    step2: "bg-indigo-100 text-indigo-700",
    step3: "bg-purple-100 text-purple-700",
    step4: "bg-orange-100 text-orange-700",
    step5: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    start: "Início",
    "1": "Contrato",
    "2": "Financeiro",
    "3": "Aditivos",
    "4": "Compliance",
    "5": "Finalizado",
    // Handle raw Prisma enum values
    step1: "Contrato",
    step2: "Financeiro",
    step3: "Aditivos",
    step4: "Compliance",
    step5: "Finalizado",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Termo de Abertura de Obra (TAO)</h1>
          <p className="text-slate-500 mt-1">Gerencie todas as obras e contratos em um só lugar.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
          <Link to={createPageUrl('TaoForm')}>
            <Plus className="w-5 h-5 mr-2" />
            Novo TAO
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar por nome da obra, ID ou ERP..." className="pl-9 bg-white" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>ERP Nº</TableHead>
              <TableHead>Regime</TableHead>
              <TableHead>Data Criação</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  Carregando obras...
                </TableCell>
              </TableRow>
            ) : taos?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  Nenhum TAO encontrado. Clique em "Novo TAO" para começar.
                </TableCell>
              </TableRow>
            ) : (
              taos?.map((tao) => (
                <TableRow key={tao.id} className="hover:bg-slate-50 cursor-pointer group">
                  <TableCell className="font-mono text-slate-500">#{tao.id.slice(-4)}</TableCell>
                  <TableCell className="font-medium text-slate-900">
                    <Link to={`${createPageUrl('TaoForm')}?id=${tao.id}`} className="hover:underline">
                      {tao.project_name}
                    </Link>
                  </TableCell>
                  <TableCell>{tao.erp_number || '-'}</TableCell>
                  <TableCell>{tao.hiring_regime || '-'}</TableCell>
                  <TableCell className="text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {tao.created_date ? format(new Date(tao.created_date), 'dd/MM/yyyy') : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[tao.status] || "bg-slate-100"}>
                      {statusLabels[tao.status] || tao.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Editar">
                        <Link to={`${createPageUrl('TaoForm')}?id=${tao.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>

                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                          onClick={() => handleDelete(tao.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}