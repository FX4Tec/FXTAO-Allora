import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatCurrency, toNumber, useReportResourceList, useReportTaos } from './useReportData';

export default function ReportFinancial() {
  const { data: taos = [], isLoading } = useReportTaos();
  const { data: additives = [] } = useReportResourceList('tao-additives');

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Aggregations
  const totalContract = taos.reduce((sum, item) => sum + toNumber(item.value_total_contract), 0);
  const totalTaxes = taos.reduce((sum, item) => sum + toNumber(item.value_taxes), 0);

  const additivesByProject = additives.reduce((acc, add) => {
    acc[add.tao_id] = (acc[add.tao_id] || 0) + toNumber(add.value);
    return acc;
  }, {});

  const totalAdditives = Object.values(additivesByProject).reduce((sum, val) => sum + val, 0);
  const additivesPercentage = totalContract > 0 ? (totalAdditives / totalContract) * 100 : 0;

  const projectFinancials = taos.map((tao) => ({
    name: tao.project_name,
    contract: toNumber(tao.value_total_contract),
    additives: additivesByProject[tao.id] || 0,
    total: toNumber(tao.value_total_contract) + (additivesByProject[tao.id] || 0)
  })).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Valor Total Contratado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalContract)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total em Aditivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalAdditives)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {additivesPercentage.toFixed(2)}% do valor inicial
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Impostos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalTaxes)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle>Top 10 Obras por Valor (Contrato + Aditivos)</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectFinancials} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} fontSize={10} />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="contract" name="Contrato Inicial" stackId="a" fill="#4f46e5" />
              <Bar dataKey="additives" name="Aditivos" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead className="text-right">Contrato Inicial</TableHead>
                <TableHead className="text-right">Aditivos</TableHead>
                <TableHead className="text-right">Total Geral</TableHead>
                <TableHead className="text-right">Impostos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taos?.map((tao) => {
                const adds = additivesByProject[tao.id] || 0;
                const total = toNumber(tao.value_total_contract) + adds;
                return (
                  <TableRow key={tao.id}>
                    <TableCell className="font-medium">{tao.project_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tao.value_total_contract)}</TableCell>
                    <TableCell className="text-right text-amber-600">{formatCurrency(adds)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(tao.value_taxes)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
