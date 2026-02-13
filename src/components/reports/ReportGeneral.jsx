import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2, Building2, MapPin } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportGeneral() {
  const { data: taos, isLoading } = useQuery({
    queryKey: ['reports-general'],
    queryFn: async () => {
      const res = await api.get('/resources/taos');
      // Handle both direct array and paginated response
      const data = res.data;
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      return Array.isArray(data) ? data : [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  // Data Processing
  const totalProjects = taos?.length || 0;

  const statusCount = taos?.reduce((acc, curr) => {
    const status = curr.status === '5' ? 'Finalizado' :
      curr.status === 'start' ? 'Início' :
        `Etapa ${curr.status}`;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCount || {}).map(([name, value]) => ({ name, value }));

  const typeCount = taos?.reduce((acc, curr) => {
    const type = curr.project_type || 'Não definido';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(typeCount || {}).map(([name, value]) => ({ name, value }));

  const segmentCount = taos?.reduce((acc, curr) => {
    const segment = curr.segment || 'Não definido';
    acc[segment] = (acc[segment] || 0) + 1;
    return acc;
  }, {});

  const segmentData = Object.entries(segmentCount || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Obras Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {statusCount?.['Finalizado'] || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {totalProjects - (statusCount?.['Finalizado'] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle>Status das Obras</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" name="Quantidade" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[350px]">
          <CardHeader>
            <CardTitle>Distribuição por Segmento</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listagem Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taos?.map((tao) => (
                <TableRow key={tao.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{tao.project_name}</span>
                      <span className="text-xs text-slate-500">ERP: {tao.erp_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tao.segment}</TableCell>
                  <TableCell>{tao.project_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {tao.construction_city || '-'} / {tao.construction_state || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${tao.status === '5' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {tao.status === '5' ? 'Finalizado' : `Etapa ${tao.status}`}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}