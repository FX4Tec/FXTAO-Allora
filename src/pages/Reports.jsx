import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Printer, BarChart3, DollarSign, CheckSquare } from 'lucide-react';
import ReportGeneral from '../components/reports/ReportGeneral';
import ReportFinancial from '../components/reports/ReportFinancial';
import ReportApprovals from '../components/reports/ReportApprovals';

export default function Reports() {
  const [activeTab, setActiveTab] = useState("general");

  const handlePrint = () => {
    window.print();
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
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700">
            <FileDown className="w-4 h-4 mr-2" /> Exportar Dados
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full md:w-[400px] grid-cols-3 print:hidden">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
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
      </Tabs>
    </div>
  );
}