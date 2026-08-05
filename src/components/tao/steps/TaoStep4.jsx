import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Paperclip, File, Image as ImageIcon, ExternalLink } from 'lucide-react';

// Extracted outside to avoid re-creation on every render (which causes focus loss)
function ComplianceRow({ label, statusField, textField, dateField, dateLabel, taoData, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-3 border-b border-slate-50 last:border-0">
      <div className="md:col-span-3 flex flex-col justify-center">
        <Label className="text-sm font-medium text-slate-700 mb-1">{label}</Label>
        <div className="flex items-center gap-2">
          <Switch
            checked={taoData[statusField] || false}
            onCheckedChange={(checked) => onChange(statusField, checked)}
          />
          <span className="text-xs text-slate-500">{taoData[statusField] ? 'Contratada' : 'Não contratada'}</span>
        </div>
      </div>

      <div className={dateField ? "md:col-span-5" : "md:col-span-9"}>
        <Input
          value={taoData[textField] || ''}
          onChange={(e) => onChange(textField, e.target.value)}
          placeholder="Descrição / Detalhes..."
          className="bg-white"
        />
      </div>

      {dateField && (
        <div className="md:col-span-4 flex items-center gap-2">
          <Label className="text-xs text-slate-500 whitespace-nowrap w-24 text-right">{dateLabel || 'Previsão:'}</Label>
          <div className="relative flex-1">
            <Input
              type="date"
              value={taoData[dateField] || ''}
              onChange={(e) => onChange(dateField, e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaoStep4({ taoData, updateTao, canEdit }) {
  const taoId = taoData.id;

  // Fetch attachments for modal
  const { data: attachments } = useQuery({
    queryKey: ['taoAttachments', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-attachments', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });
  const handleChange = (field, value) => {
    updateTao({ ...taoData, [field]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">OBRA:</span>
            <span className="text-slate-900 font-medium">{taoData.project_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">ERP Nº:</span>
            <span className="font-mono text-slate-900">{taoData.erp_number}</span>
          </div>
        </div>

        {/* Attachment Modal Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Paperclip className="w-4 h-4" />
              Visualizar Anexos ({attachments?.length || 0})
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Anexos da Obra</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto py-4">
              {attachments?.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">Nenhum anexo disponível.</div>
              ) : (
                attachments?.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        {att.file_type?.includes('image') ? (
                          <ImageIcon className="w-4 h-4 text-indigo-500" />
                        ) : (
                          <File className="w-4 h-4 text-indigo-500" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-slate-700 truncate">{att.file_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{att.file_type?.split('/')[1] || 'FILE'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => window.open(att.file_url, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <fieldset disabled={!canEdit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 disabled:opacity-75">
        {/* Main Compliance Form */}
        <div className="lg:col-span-12 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Escopo e Projetos</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">

              {/* Header Switch */}
              <div className="flex items-center gap-4 mb-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <Label className="font-bold text-indigo-900">Projetos Responsabilidade:</Label>
                <Switch
                  checked={taoData.ome_billing_company || false}
                  onCheckedChange={(checked) => handleChange('ome_billing_company', checked)}
                />
                <span className="font-medium text-indigo-700">
                  {taoData.ome_billing_company ? 'Empresa' : 'Cliente'}
                </span>
              </div>

              <ComplianceRow
                label="Projeto Legal"
                statusField="scope_project_legal_status"
                textField="scope_project_legal_text"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="Projetos Executivos"
                statusField="scope_project_executive_status"
                textField="scope_project_executive_text"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="Alvará de execução"
                statusField="scope_permit_execution_status"
                textField="scope_permit_execution_text"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="CNO"
                statusField="scope_cno_status"
                textField="scope_cno_text"
                taoData={taoData}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Seguros e Licenças</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <ComplianceRow
                label="Seguro Garantia"
                statusField="insurance_guarantee_status"
                textField="insurance_guarantee_text"
                dateField="insurance_guarantee_date"
                dateLabel="Performance até:"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="Seguro de Obra"
                statusField="insurance_construction_status"
                textField="insurance_construction_text"
                dateField="insurance_construction_date"
                dateLabel="Performance até:"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="AVCB"
                statusField="avcb_status"
                textField="avcb_text"
                dateField="avcb_date"
                dateLabel="Emissão:"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="CND ISS"
                statusField="cnd_iss_status"
                textField="cnd_iss_text"
                dateField="cnd_iss_date"
                dateLabel="Emissão:"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="CND INSS"
                statusField="cnd_inss_status"
                textField="cnd_inss_text"
                dateField="cnd_inss_date"
                dateLabel="Emissão:"
                taoData={taoData}
                onChange={handleChange}
              />
              <ComplianceRow
                label="Habite-se"
                statusField="habite_se_status"
                textField="habite_se_text"
                dateField="habite_se_date"
                dateLabel="Emissão:"
                taoData={taoData}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label>Obrigações</Label>
                <Input
                  value={taoData.obligations_text || ''}
                  onChange={(e) => handleChange('obligations_text', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Multas</Label>
                <Input
                  value={taoData.fines_text || ''}
                  onChange={(e) => handleChange('fines_text', e.target.value)}
                  placeholder="Conforme edital..."
                />
              </div>
              <div className="space-y-1">
                <Label>Medições</Label>
                <Input
                  value={taoData.measurements_text || ''}
                  onChange={(e) => handleChange('measurements_text', e.target.value)}
                  placeholder="Ex: Medição MENSAL"
                />
              </div>
            </CardContent>
          </Card>
        </div>



      </fieldset>
    </div>
  );
}
