import React, { useState } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Edit2, Plus, Trash2, Paperclip, ExternalLink, File, Image as ImageIcon, X } from 'lucide-react';
import { toast } from "sonner";

export default function TaoStep5({ taoData, updateTao, canEdit }) {
  const queryClient = useQueryClient();
  const taoId = taoData.id;
  const [uploading, setUploading] = useState(false);
  const [newProgressItem, setNewProgressItem] = useState({ topic: '', percentage: '' });
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [editingProgressItem, setEditingProgressItem] = useState({ topic: '', percentage: '', sort_order: 0, is_active: true });

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

  // --- Public Progress Chart Logic ---
  const { data: progressTopics = [] } = useQuery({
    queryKey: ['taoProgressTopics', taoId],
    queryFn: async () => {
      const res = await api.get('/resources/tao-progress-topics', { params: { tao_id: taoId } });
      return (res.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
    enabled: !!taoId,
  });

  const normalizePercentage = (value) => {
    const numericValue = Number(String(value ?? '').replace(',', '.'));
    if (!Number.isFinite(numericValue)) return 0;
    return Math.min(100, Math.max(0, numericValue));
  };

  const createProgressMutation = useMutation({
    mutationFn: (data) => api.post('/resources/tao-progress-topics', {
      tao_id: taoId,
      topic: data.topic.trim(),
      percentage: normalizePercentage(data.percentage),
      sort_order: progressTopics.length,
      is_active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoProgressTopics', taoId]);
      setNewProgressItem({ topic: '', percentage: '' });
      toast.success("Item de evolução adicionado");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Erro ao adicionar item de evolução.");
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/resources/tao-progress-topics/${id}`, {
      topic: data.topic.trim(),
      percentage: normalizePercentage(data.percentage),
      sort_order: Number(data.sort_order || 0),
      is_active: data.is_active !== false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoProgressTopics', taoId]);
      setEditingProgressId(null);
      toast.success("Item de evolução atualizado");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || "Erro ao atualizar item de evolução.");
    },
  });

  const deleteProgressMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/tao-progress-topics/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taoProgressTopics', taoId]);
      toast.success("Item de evolução removido");
    },
  });

  const startProgressEdit = (item) => {
    setEditingProgressId(item.id);
    setEditingProgressItem({
      topic: item.topic || '',
      percentage: item.percentage ?? '',
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== false,
    });
  };

  const canCreateProgress = canEdit && newProgressItem.topic.trim().length >= 2;

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

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase text-indigo-700">
                <BarChart3 className="h-4 w-4" />
                Evolução da Obra para WordPress
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre tópicos e percentuais exibidos no plugin público, segregado por cliente e obra.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(taoData.is_public_progress_enabled)}
                onChange={(e) => updateTao({ ...taoData, is_public_progress_enabled: e.target.checked })}
                disabled={!canEdit}
              />
              Publicar gráfico desta obra
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {canEdit && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_auto]">
              <Input
                placeholder="Tópico: Fundação, Estrutura, Pintura..."
                value={newProgressItem.topic}
                onChange={(e) => setNewProgressItem({ ...newProgressItem, topic: e.target.value })}
              />
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="% avanço"
                value={newProgressItem.percentage}
                onChange={(e) => setNewProgressItem({ ...newProgressItem, percentage: e.target.value })}
              />
              <Button
                disabled={!canCreateProgress || createProgressMutation.isPending}
                onClick={() => createProgressMutation.mutate(newProgressItem)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Tópico</TableHead>
                  <TableHead className="w-[150px]">Percentual</TableHead>
                  <TableHead className="w-[110px]">Ordem</TableHead>
                  <TableHead className="w-[90px]">Ativo</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressTopics.map((item) => {
                  const isEditing = editingProgressId === item.id;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input value={editingProgressItem.topic} onChange={(e) => setEditingProgressItem({ ...editingProgressItem, topic: e.target.value })} />
                        ) : (
                          <span className="font-medium">{item.topic}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" min="0" max="100" value={editingProgressItem.percentage} onChange={(e) => setEditingProgressItem({ ...editingProgressItem, percentage: e.target.value })} />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full bg-[#8b341f]" style={{ width: `${normalizePercentage(item.percentage)}%` }} />
                            </div>
                            <span>{normalizePercentage(item.percentage)}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input type="number" value={editingProgressItem.sort_order} onChange={(e) => setEditingProgressItem({ ...editingProgressItem, sort_order: e.target.value })} />
                        ) : item.sort_order}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <input type="checkbox" checked={editingProgressItem.is_active} onChange={(e) => setEditingProgressItem({ ...editingProgressItem, is_active: e.target.checked })} />
                        ) : item.is_active !== false ? 'Sim' : 'Não'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEdit && isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => updateProgressMutation.mutate({ id: item.id, data: editingProgressItem })}>Salvar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingProgressId(null)}>Cancelar</Button>
                          </div>
                        ) : canEdit ? (
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startProgressEdit(item)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteProgressMutation.mutate(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!progressTopics.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      Nenhum tópico cadastrado. Adicione linhas como Fundação, Estrutura, Pintura e seus percentuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-slate-500">
            O plugin WordPress só consome esta lista quando a publicação estiver habilitada e o token do cliente tiver escopo de gráfico.
          </p>
        </CardContent>
      </Card>

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
