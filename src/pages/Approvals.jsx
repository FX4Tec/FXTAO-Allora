import { useState } from 'react';
import api from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, FileText, Check } from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Approvals() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch TAOs needing approval
    const { data: taos } = useQuery({
        queryKey: ['taosForApproval'],
        queryFn: async () => {
            const res = await api.get('/taos', { params: { approval_status: 'pending', limit: 200 } });
            return res.data?.data || [];
        },
    });

    // Fetch Additives needing approval
    const { data: additives } = useQuery({
        queryKey: ['additivesForApproval'],
        queryFn: async () => {
            const res = await api.get('/resources/tao-additives', { params: { approval_status: 'pending' } });
            return res.data || [];
        },
    });

    // Fetch All Approvers config to check if current user is the pending approver
    const { data: myApproverConfigs } = useQuery({
        queryKey: ['myApproverConfigs', user?.email],
        queryFn: async () => {
            const res = await api.get('/resources/tao-approvers', { params: { user_email: user?.email } });
            return res.data || [];
        },
        enabled: !!user?.email
    });

    // Filter items where the current user is the NEXT approver
    const pendingTaos = taos?.filter(t => {
        // Basic filter: check if user is configured as an approver for this TAO at the NEXT level
        const config = myApproverConfigs?.find(c => c.tao_id === t.id && (c.scope === 'tao' || c.scope === 'both'));
        return config && config.level === (t.current_approval_level || 0) + 1;
    }) || [];

    const pendingAdditives = additives?.filter(a => {
        const config = myApproverConfigs?.find(c => c.tao_id === a.tao_id && (c.scope === 'additive' || c.scope === 'both'));
        return config && config.level === (a.current_approval_level || 0) + 1;
    }) || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Central de Aprovações</h1>
                <p className="text-slate-500">Gerencie pendências de aprovação de Obras e Aditivos.</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">Pendentes ({pendingTaos.length + pendingAdditives.length})</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-6">
                    {pendingTaos.length === 0 && pendingAdditives.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                            <h3 className="text-lg font-medium text-slate-900">Tudo em dia!</h3>
                            <p className="text-slate-500">Você não possui aprovações pendentes no momento.</p>
                        </div>
                    )}

                    {pendingTaos.map(tao => (
                        <ApprovalCard
                            key={tao.id}
                            item={tao}
                            type="tao"
                            user={user}
                            onSuccess={() => queryClient.invalidateQueries()}
                        />
                    ))}

                    {pendingAdditives.map(additive => (
                        <ApprovalCard
                            key={additive.id}
                            item={additive}
                            type="additive"
                            user={user}
                            onSuccess={() => queryClient.invalidateQueries()}
                        />
                    ))}
                </TabsContent>

                <TabsContent value="history">
                    <ApprovalHistory user={user} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ApprovalCard({ item, type, user, onSuccess }) {
    const [comment, setComment] = useState('');
    const [action, setAction] = useState(null); // 'approve' | 'reject'

    const title = type === 'tao' ? `Aprovação de Obra: ${item.project_name}` : `Aditivo de Contrato`;
    const subtitle = type === 'tao' ? `ERP: ${item.erp_number}` : `Valor: R$ ${Number(item.value).toLocaleString('pt-BR')}`;

    const mutation = useMutation({
        mutationFn: async ({ status }) => {
            if (type === 'tao') {
                return api.post(`/taos/${item.id}/decision`, { action: status, comments: comment });
            }

            await api.post('/resources/tao-approval-history', {
                reference_id: item.id,
                reference_type: type,
                approver_email: user.email,
                action: status,
                level: (item.current_approval_level || 0) + 1,
                comments: comment
            });

            const resourcePath = '/resources/tao-additives';

            if (status === 'rejected') {
                return api.put(`${resourcePath}/${item.id}`, {
                    approval_status: 'rejected',
                });
            } else {
                // Fetch all approvers to determine if this is the last level
                const res = await api.get('/resources/tao-approvers', {
                    params: { tao_id: type === 'tao' ? item.id : item.tao_id }
                });
                const approvers = res.data || [];

                // My config
                const myConfigs = approvers.filter(c => c.user_email === user.email && (c.scope === type || c.scope === 'both' || (type === 'tao' && c.scope === 'tao') || (type === 'additive' && c.scope === 'additive')));
                const myLevel = myConfigs[0]?.level || (item.current_approval_level + 1);

                // Max level for this scope
                const relevantApprovers = approvers.filter(c => c.scope === type || c.scope === 'both');
                const maxLevel = relevantApprovers.length > 0 ? Math.max(...relevantApprovers.map(c => c.level)) : 0;

                const newStatus = myLevel >= maxLevel ? 'approved' : 'pending';

                await api.put(`${resourcePath}/${item.id}`, {
                    current_approval_level: myLevel,
                    approval_status: newStatus
                });

                // --- Notification Logic ---
                try {
                    // Fetch fresh item to get created_by
                    const freshRes = await api.get(`${resourcePath}/${item.id}`);
                    const freshItem = freshRes.data;

                    if (freshItem?.created_by) {
                        // We need the email of the creator. 
                        // The 'created_by' field in Tao/Additive is a User ID (String).
                        // We need to fetch the User to get the email? 
                        // Or maybe we can notify by ID if Notification resource supports it?
                        // Schema says Notification.user_email is relation to User.email.
                        // So we need the email.
                        // We can fetch user by ID.

                        // NOTE: Tao.created_by_id corresponds to User.id. 
                        // But TaoApprover.user_email corresponds to User.email.
                        // We should fetch the user to get email.
                        // For MVP let's assume we can notify.
                        // Wait, schema says Tao.created_by is User relation.
                        // If we include it in query we get it.
                        // Our generic 'get' doesn't support 'include' yet unless we modify queries.
                        // Let's modify resourceController later or do a separate fetch if needed.

                        // Workaround: We will fetch the user explicitly.
                        const userRes = await api.get(`/resources/users/${freshItem.created_by_id}`);
                        const creatorEmail = userRes.data?.email;

                        if (creatorEmail) {
                            const statusMsg = status === 'approved' ? 'Aprovado' : 'Rejeitado';
                            const notifTitle = type === 'tao' ? freshItem.project_name : `Aditivo: ${freshItem.description}`;
                            const link = `/TaoForm?id=${type === 'tao' ? item.id : freshItem.tao_id}`;

                            await api.post('/resources/notifications', {
                                user_email: creatorEmail,
                                title: `Status: ${notifTitle}`,
                                message: `Sua solicitação foi ${statusMsg} por ${user.email}.\nComentários: ${comment || 'Sem comentários'}`,
                                link: link,
                                is_read: false,
                                type: status === 'approved' ? 'success' : 'error'
                            });

                            console.log(`[Mock Email] To: ${creatorEmail}, Subject: FX TAO - Status: ${notifTitle}, Body: Sua solicitação foi ${statusMsg}...`);
                        }
                    }
                } catch (e) {
                    console.error("Notification error", e);
                }
            }
        },
        onSuccess: () => {
            toast.success(action === 'approve' ? "Aprovado com sucesso!" : "Rejeitado.");
            onSuccess();
        }
    });

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader>
                <div className="flex justify-between">
                    <div>
                        <Badge variant="outline" className="mb-2 capitalize">{type === 'tao' ? 'Obra' : 'Aditivo'}</Badge>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{subtitle}</CardDescription>
                        {type === 'additive' && <div className="text-sm text-slate-500 mt-1">{item.description}</div>}
                    </div>
                    {type === 'tao' && (
                        <Button asChild variant="outline" size="sm">
                            <Link to={`${createPageUrl('TaoForm')}?id=${item.id}`}>
                                <FileText className="w-4 h-4 mr-2" /> Ver Detalhes
                            </Link>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="Adicione um comentário (opcional)..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="bg-slate-50"
                />
            </CardContent>
            <CardFooter className="flex justify-end gap-3 bg-slate-50/50 border-t border-slate-100 p-4">
                <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { setAction('reject'); mutation.mutate({ status: 'rejected' }); }}
                    disabled={mutation.isPending}
                >
                    Rejeitar
                </Button>
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => { setAction('approve'); mutation.mutate({ status: 'approved' }); }}
                    disabled={mutation.isPending}
                >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar
                </Button>
            </CardFooter>
        </Card>
    );
}

function ApprovalHistory({ user }) {
    const { data: history } = useQuery({
        queryKey: ['approvalHistory', user?.email],
        queryFn: async () => {
            // Ideally backend supports sorting via '?sort=-created_date'
            const res = await api.get('/resources/tao-approval-history', { params: { sort: '-created_at' } });
            // Sort client side as backup if backend doesn't support generic sort yet
            return (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        },
    });

    return (
        <div className="space-y-4">
            {history?.map(h => (
                <div key={h.id} className="flex items-start gap-4 p-4 bg-white border rounded-lg">
                    <div className={`p-2 rounded-full ${h.action === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {h.action === 'approved' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                        <p className="font-medium text-sm">
                            <span className="font-bold">{h.approver_email}</span> {h.action === 'approved' ? 'aprovou' : 'rejeitou'} {h.reference_type === 'tao' ? 'Obra' : 'Aditivo'}
                        </p>
                        <p className="text-xs text-slate-500">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        {h.comments && <p className="text-sm text-slate-700 mt-2 bg-slate-50 p-2 rounded">"{h.comments}"</p>}
                    </div>
                </div>
            ))}
            {!history?.length && <div className="text-center text-slate-400 py-8">Nenhum histórico encontrado.</div>}
        </div>
    );
}
