import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleHelp, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const parseFileName = (contentDisposition, fallbackName) => {
  if (!contentDisposition) return fallbackName;

  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallbackName;
};

const triggerBrowserDownload = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export default function TaoTransferCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [format, setFormat] = useState('xlsx');
  const [lastImportSummary, setLastImportSummary] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  const downloadMutation = useMutation({
    mutationFn: async ({ endpoint, fallbackName }) => {
      const response = await api.get(endpoint, {
        params: { format },
        responseType: 'blob',
      });

      const fileName = parseFileName(response.headers['content-disposition'], fallbackName);
      return {
        blob: response.data,
        fileName,
      };
    },
    onSuccess: ({ blob, fileName }) => {
      triggerBrowserDownload(blob, fileName);
      toast.success('Download iniciado com sucesso.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Falha ao gerar o arquivo.');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/tao-transfer/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    },
    onSuccess: (result) => {
      setLastImportSummary(result);
      queryClient.invalidateQueries(['taos']);
      toast.success(
        `Importação concluída: ${result.taosCreated} TAO(s) criada(s), ${result.taosUpdated} atualizada(s).`
      );

      if (result.errors?.length) {
        toast.warning(`Importação concluída com ${result.errors.length} ocorrência(s). Revise o resumo abaixo.`);
      }

      setSelectedFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Falha ao importar o arquivo.');
    },
  });

  const handleTemplateDownload = () => {
    downloadMutation.mutate({
      endpoint: '/tao-transfer/template',
      fallbackName: `fxtao-mascara-importacao.${format}`,
    });
  };

  const handleExport = () => {
    downloadMutation.mutate({
      endpoint: '/tao-transfer/export',
      fallbackName: `fxtao-export.${format}`,
    });
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    importMutation.mutate(file);
  };

  const isDownloading = downloadMutation.isPending;
  const isImporting = importMutation.isPending;

  if (user && !['admin', 'director'].includes(user.role)) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-sm md:col-span-2">
      <CardHeader>
        <HoverCard openDelay={120} closeDelay={120}>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <HoverCardTrigger asChild>
              <span className="inline-flex cursor-help items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-indigo-50/80">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Importação/exportação TAO</span>
                <CircleHelp className="h-4 w-4 text-indigo-500" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-[520px] max-w-[90vw] border-indigo-100 bg-white/95 p-5 text-sm text-slate-700 shadow-xl">
              <div className="space-y-3">
                <p className="font-semibold text-slate-900">Como preencher a planilha</p>
                <p>
                  Baixe a máscara e mantenha os títulos das colunas exatamente como vieram no arquivo. Eles já correspondem aos campos do formulário da TAO.
                </p>
                <p>
                  Cada linha representa uma TAO completa. Os contatos, colaboradores fixos, documentos de faturamento e checklist inicial já aparecem como colunas próprias na mesma linha.
                </p>
                <p>
                  Para atualizar uma TAO já existente, mantenha preenchido o <strong>ID TAO</strong> ou o <strong>Codigo da obra</strong>. Para cadastrar uma nova, basta informar a <strong>Sigla/nome da obra</strong> e os demais dados que tiver disponíveis.
                </p>
                <p>
                  Se algum bloco ainda não estiver preenchido, deixe essas colunas em branco. A importação atualiza os dados informados e mantém o restante como está no sistema.
                </p>
              </div>
            </HoverCardContent>
          </CardTitle>
        </HoverCard>
        <CardDescription>
          Gere a máscara de importação, exporte TAOs e importe a estrutura Allora completa em uma linha por obra, com contatos, colaboradores, checklist inicial e documentação de faturamento.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">TAO + Colaboradores</Badge>
                <Badge variant="outline" className="border-indigo-200 text-indigo-700">
                  Importação em lote
                </Badge>
              </div>
              <p className="text-sm text-indigo-950">
                Use o mesmo formato selecionado para baixar a máscara e exportar os dados atuais. Para importar, envie um arquivo `.xlsx` ou `.csv` com os mesmos cabeçalhos da máscara.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Formato do arquivo
              </Label>
              <ToggleGroup type="single" value={format} onValueChange={(value) => value && setFormat(value)}>
                <ToggleGroupItem value="xlsx" aria-label="Selecionar XLSX">
                  XLSX
                </ToggleGroupItem>
                <ToggleGroupItem value="csv" aria-label="Selecionar CSV">
                  CSV
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Button
            variant="outline"
            className="justify-start gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={handleTemplateDownload}
            disabled={isDownloading || isImporting}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Baixar Máscara
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-2 border-slate-200"
            onClick={handleExport}
            disabled={isDownloading || isImporting}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Exportar TAOs
          </Button>

          <Button
            className="justify-start gap-2 bg-indigo-600 hover:bg-indigo-700"
            onClick={handlePickFile}
            disabled={isDownloading || isImporting}
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Importar Arquivo
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={handleFileSelected}
        />

        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Arquivo selecionado:</span>{' '}
            {selectedFileName || 'Nenhum arquivo enviado nesta sessão.'}
          </p>
          <p className="mt-2">
            A planilha já inclui blocos para <strong>Contatos</strong>, <strong>Engº Responsavel</strong>, <strong>Mestre de Obra</strong>, <strong>documentação de faturamento</strong> e <strong>checklist inicial</strong>.
          </p>
        </div>

        {lastImportSummary && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                {lastImportSummary.processedTaos} TAO(s) processada(s)
              </Badge>
              <Badge variant="outline">{lastImportSummary.taosCreated} criada(s)</Badge>
              <Badge variant="outline">{lastImportSummary.taosUpdated} atualizada(s)</Badge>
              <Badge variant="outline">{lastImportSummary.contactsUpdated} contato(s) sincronizado(s)</Badge>
              <Badge variant="outline">{lastImportSummary.teamMembersUpdated} colaborador(es) sincronizado(s)</Badge>
              <Badge variant="outline">{lastImportSummary.documentsUpdated} documento(s) sincronizado(s)</Badge>
              <Badge variant="outline">{lastImportSummary.checklistItemsUpdated} item(ns) de checklist sincronizado(s)</Badge>
            </div>

            {lastImportSummary.errors?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-amber-700">
                  Ocorrências encontradas na importação:
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  {lastImportSummary.errors.slice(0, 5).map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                  {lastImportSummary.errors.length > 5 && (
                    <p>Mais {lastImportSummary.errors.length - 5} ocorrência(s) no retorno da API.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
        Recomendação: sempre baixe a máscara primeiro e valide os cabeçalhos antes de importar em produção.
      </CardFooter>
    </Card>
  );
}
