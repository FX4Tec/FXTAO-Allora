import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportApprovals() {
  const { data: taos, isLoading } = useQuery({
    queryKey: ['reports-approvals-taos'],
    queryFn: async () => {
      const res = await api.get('/resources/taos');
      return res.data || [];
    },
  });

  const { data: additives } = useQuery({
    queryKey: ['reports-approvals-additives'],
    queryFn: async () => {
      const res = await api.get('/resources/tao-additives');
      return res.data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Statistics
  const pendingTaos = taos?.filter(t => t.approval_status === 'pending') || [];
  const approvedTaos = taos?.filter(t => t.approval_status === 'approved') || [];
  const rejectedTaos = taos?.filter(t => t.approval_status === 'rejected') || [];

  const pendingAdditives = additives?.filter(a => a.approval_status === 'pending') || [];
  const approvedAdditives = additives?.filter(a => a.approval_status === 'approved') || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-yellow-800">Pendentes de Aprovação</CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {pendingTaos.length + pendingAdditives.length}
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {pendingTaos.length} Obras, {pendingAdditives.length} Aditivos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-green-800">Aprovados</CardTitle>
            <ShieldCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {approvedTaos.length + approvedAdditives.length}
            </div>
            <p className="text-xs text-green-700 mt-1">
              {approvedTaos.length} Obras, {approvedAdditives.length} Aditivos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-red-800">Rejeitados</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {rejectedTaos.length}
            </div>
            <p className="text-xs text-red-700 mt-1">
              Necessitam revisão
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Obras em Aprovação / Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Obra</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Nível Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...pendingTaos, ...rejectedTaos, ...approvedTaos].slice(0, 5).map((tao) => (
                  <TableRow key={tao.id}>
                    <TableCell className="font-medium">{tao.project_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase
                        ${tao.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                          tao.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                        {tao.approval_status || 'draft'}
                      </span>
                    </TableCell>
                    <TableCell>{tao.current_approval_level || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aditivos em Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAdditives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500">Nenhum aditivo pendente.</TableCell>
                  </TableRow>
                ) : (
                  pendingAdditives.map((add) => (
                    <TableRow key={add.id}>
                      <TableCell className="font-medium">{add.description}</TableCell>
                      <TableCell>R$ {add.value?.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold uppercase">
                          Pendente
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}