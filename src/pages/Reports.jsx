import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown, Printer } from 'lucide-react';
import ReportGeneral from '../components/reports/ReportGeneral';
import ReportFinancial from '../components/reports/ReportFinancial';
import ReportApprovals from '../components/reports/ReportApprovals';
import ReportViewer from '../components/reports/ReportViewer';
import { useReportResourceList, useReportTaos } from '../components/reports/useReportData';

export default function Reports() {
  const [activeTab, setActiveTab] = useState("general");
  const { data: taos = [] } = useReportTaos();
  const { data: additives = [] } = useReportResourceList('tao-additives');
  const { data: installments = [] } = useReportResourceList('tao-installments');

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    const snapshot = {
      exported_at: new Date().toISOString(),
      taos,
      additives,
      installments,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json;charset=utf-8',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fxtao-relatorios-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios Gerenciais</h1>
          <p className="text-slate-500 mt-1">Análise detalhada de obras, finanças e aprovações.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
          </Button>
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExportData}>
            <FileDown className="w-4 h-4 mr-2" /> Exportar Dados
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[620px] md:grid-cols-4 print:hidden">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          <TabsTrigger value="viewer">Visualizar Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <ReportGeneral />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <ReportFinancial />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <ReportApprovals />
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          <ReportViewer taos={taos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
