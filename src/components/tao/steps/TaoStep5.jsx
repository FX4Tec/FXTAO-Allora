import React, { useState } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Search, Paperclip, ExternalLink, File, Image as ImageIcon, X } from 'lucide-react';
import { toast } from "sonner";

export default function TaoStep5({ taoData, updateTao, canEdit }) {
  const queryClient = useQueryClient();
  const taoId = taoData.id;
  const [uploading, setUploading] = useState(false);

  // --- Contacts State & Logic ---
  const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '' });
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  const { data: contacts } = useQuery({
    queryKey: ['taoContacts', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-contacts', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-contacts', { ...data, tao_id: taoId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoContacts', taoId]);
      setNewContact({ name: '', role: '', email: '', phone: '' });
      toast.success("Contato adicionado");
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoContacts', taoId]);
      toast.success("Contato removido");
    }
  });

  // --- Attachments Logic ---
  const { data: attachments } = useQuery({
    queryKey: ['taoAttachments', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-attachments', { params: { tao_id: taoId } });
      return res.data || [];
    },
    enabled: !!taoId,
  });

  const createAttachmentMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-attachments', { ...data, tao_id: taoId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoAttachments', taoId]);
      toast.success("Arquivo anexado");
    }
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-attachments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoAttachments', taoId]);
      toast.success("Anexo removido");
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.file_url) {
        await createAttachmentMutation.mutateAsync({
          file_name: file.name,
          file_url: res.data.file_url,
          file_type: file.type
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  if (!taoId) {
    return <div className="p-10 text-center text-slate-500">Salve o TAO primeiro.</div>;
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

      {/* Sharepoint URL */}
      <div className="flex items-center gap-4">
        <Label className="whitespace-nowrap font-bold text-slate-700">URL SHAREPOINT:</Label>
        <Input
          value={taoData.sharepoint_url || ''}
          onChange={(e) => updateTao({ ...taoData, sharepoint_url: e.target.value })}
          placeholder="https://sharepoint.com/..."
          className="bg-white"
          disabled={!canEdit}
        />
        {taoData.sharepoint_url && (
          <Button variant="outline" size="icon" onClick={() => window.open(taoData.sharepoint_url, '_blank')}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">

        {/* Left Column: Observations */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1">
              <Textarea
                className="h-full resize-none border-0 focus-visible:ring-0 p-0"
                placeholder="Digite suas observações aqui..."
                value={taoData.observations_general || ''}
                onChange={(e) => updateTao({ ...taoData, observations_general: e.target.value })}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Contacts */}
        <div className="lg:col-span-5 flex flex-col gap-6 h-full">
          <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Contatos</CardTitle>
              {canEdit && (
                <Button size="sm" className="h-7 w-7 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsContactFormOpen(!isContactFormOpen)}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>

            {/* Add Contact Form (Collapsible) */}
            {isContactFormOpen && (
              <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nome" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Cargo" value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="h-8 text-xs" />
                  <Input placeholder="Telefone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="h-8 text-xs" />
                </div>
                <Button size="sm" className="w-full h-8 bg-indigo-600" onClick={() => createContactMutation.mutate(newContact)}>Salvar Contato</Button>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.role}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span>{c.email}</span>
                          <span className="text-slate-500">{c.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteContactMutation.mutate(c.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column: Attachments */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-indigo-700 uppercase">Anexos</CardTitle>
              {canEdit && (
                <label className="cursor-pointer">
                  <div className="h-7 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1 transition-colors">
                    {uploading ? '...' : 'Upload'}
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </CardHeader>

            <div className="flex-1 overflow-auto p-2 space-y-2">
              {attachments?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-4">
                  <Paperclip className="w-8 h-8 mb-2 opacity-50" />
                  <p>Arraste arquivos ou clique em Upload</p>
                </div>
              )}

              {attachments?.map((att) => (
                <div key={att.id} className="group flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      {att.file_type?.includes('image') ? (
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <File className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-700 truncate hover:text-indigo-600 hover:underline block">
                        {att.file_name}
                      </a>
                      <span className="text-[10px] text-slate-400 uppercase">{att.file_type?.split('/')[1] || 'FILE'}</span>
                    </div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteAttachmentMutation.mutate(att.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}