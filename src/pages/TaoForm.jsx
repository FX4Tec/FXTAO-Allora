import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, ArrowRight, Loader2, CheckCircle, Share2, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';

import TaoStepper from '../components/tao/TaoStepper';
import TaoStepStart from '../components/tao/steps/TaoStepStart';
import TaoStep1 from '../components/tao/steps/TaoStep1';
import TaoStep2 from '../components/tao/steps/TaoStep2';
import TaoStep3 from '../components/tao/steps/TaoStep3';
import TaoStep4 from '../components/tao/steps/TaoStep4';
import TaoStep5 from '../components/tao/steps/TaoStep5';

// Prisma returns enum names (step1, step2...) but frontend uses ('1', '2'...)
const normalizeTaoStatus = (status) => {
  const map = { step1: '1', step2: '2', step3: '3', step4: '4', step5: '5', start: 'start' };
  return map[status] || status;
};

export default function TaoForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();

  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState('start');
  const [formData, setFormData] = useState({});
  const [canEdit, setCanEdit] = useState(true);

  // Fetch TAO Data if ID exists
  const { data: existingTao, isLoading } = useQuery({
    queryKey: ['tao', id],
    queryFn: async () => {
      const res = await api.get(`/taos/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Check permissions logic
  useEffect(() => {
    if (!user || !existingTao) return;
    const isAdmin = user.role === 'admin' || user.role === 'director';
    const isLocked = (existingTao.status === '5' || existingTao.approval_status === 'approved' || existingTao.approval_status === 'pending');
    setCanEdit(isAdmin || !isLocked);
  }, [user, existingTao]);

  // Fetch Bank Accounts (needed for Step Start)
  const { data: bankAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const res = await api.get('/resources/bank-accounts');
      return res.data;
    },
  });

  // Sync data when loaded
  useEffect(() => {
    if (existingTao) {
      const normalized = { ...existingTao, status: normalizeTaoStatus(existingTao.status) };
      setFormData(normalized);
      setCurrentStep(normalized.status || 'start');
    } else if (!id) {
      setFormData({ status: 'start' });
    }
  }, [existingTao, id]);

  const logMutation = useMutation({
    mutationFn: async (logData) => {
      return api.post('/resources/tao-logs', logData);
    }
  });

  const createNotification = async (email, title, message, link) => {
    try {
      await api.post('/resources/notifications', {
        user_email: email,
        title,
        message,
        link,
        is_read: false,
        type: 'info'
      });
      // Send Email mocked
      console.log(`[Mock Email] To: ${email}, Subject: ${title}, Body: ${message}`);
    } catch (e) {
      console.error("Failed to notify", e);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      let result;
      const isUpdate = !!id;

      if (isUpdate) {
        if (existingTao?.status === '5' && user?.role !== 'admin' && user?.role !== 'director') {
          throw new Error("TAO cadastrada. Apenas Administradores podem alterar.");
        }
        const res = await api.put(`/taos/${id}`, data);
        result = res.data;

        // Log Update
        logMutation.mutate({
          tao_id: id,
          user_email: user?.email || 'unknown',
          action: 'update',
          details: `Updated TAO fields: ${Object.keys(data).join(', ')}`
        });
      } else {
        if (!canEdit) throw new Error("Edição bloqueada. Aguardando aprovação ou cadastro concluído.");

        const res = await api.post('/taos', data);
        result = res.data;

        // Log Create
        logMutation.mutate({
          tao_id: result.id,
          user_email: user?.email || 'unknown',
          action: 'create',
          details: `Created TAO: ${data.project_name}`
        });
      }
      return result;
    },
    onSuccess: (savedData) => {
      const normalizedData = { ...savedData, status: normalizeTaoStatus(savedData.status) };
      toast.success("Dados salvos com sucesso!");
      queryClient.invalidateQueries(['taos']);

      if (!id && normalizedData.id) {
        navigate(`${createPageUrl('TaoForm')}?id=${normalizedData.id}`, { replace: true });
        setFormData(normalizedData);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao salvar dados.");
    }
  });

  const handleSave = async (targetStep = null) => {
    // Validation for required fields
    if (!formData.project_name || !formData.project_name.trim()) {
      toast.error("O nome da obra é obrigatório para salvar.");
      return;
    }

    const dataToSave = { ...formData };
    if (targetStep) {
      dataToSave.status = targetStep;
    }

    try {
      await mutation.mutateAsync(dataToSave);
      if (targetStep) {
        setCurrentStep(targetStep);
      }
    } catch (error) {
      console.error("Error saving TAO:", error);
      // Error handling is also done in mutation onError, but preventing step change here on error is good practice
    }
  };

  const handleNext = () => {
    const stepOrder = ['start', '1', '2', '3', '4', '5'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      handleSave(nextStep);
    } else {
      handleSave();
    }
  };

  const handleStepClick = (stepId) => {
    // Auto-save when switching steps manually
    if (id) {
      handleSave(stepId);
    } else {
      toast.warning("Salve o rascunho inicial antes de navegar.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const renderStep = () => {
    // Pass canEdit prop to steps so they can disable inputs if needed
    // Note: We'd need to update all steps to accept canEdit and disable inputs. 
    // For now, we are enforcing on Save, but UI feedback is good.
    // Let's pass it to StepStart where Approval Setup is.
    switch (currentStep) {
      case 'start':
        return <TaoStepStart taoData={formData} updateTao={setFormData} bankAccounts={bankAccounts} canEdit={canEdit} />;
      case '1':
        return <TaoStep1 taoData={formData} updateTao={setFormData} canEdit={canEdit} />;
      case '2':
        return <TaoStep2 taoData={formData} updateTao={setFormData} canEdit={canEdit} />;
      case '3':
        return <TaoStep3 taoData={formData} updateTao={setFormData} canEdit={canEdit} />;
      case '4':
        return <TaoStep4 taoData={formData} updateTao={setFormData} canEdit={canEdit} />;
      case '5':
        return <TaoStep5 taoData={formData} updateTao={setFormData} canEdit={canEdit} />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('TaoList'))}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {id ? `Editando: ${formData.project_name || 'Sem nome'}` : 'Novo Termo de Abertura'}
              {!canEdit && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200">Somente Leitura</span>}
              {formData.approval_status && (
                <span className={`text-xs px-2 py-1 rounded-full border uppercase font-bold
                      ${formData.approval_status === 'approved' ? 'bg-green-100 text-green-600 border-green-200' :
                    formData.approval_status === 'rejected' ? 'bg-red-100 text-red-600 border-red-200' :
                      formData.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {formData.approval_status === 'pending' ? 'Aprovação Pendente' : formData.approval_status}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Share Actions */}
        {id && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                toast.success("Link copiado para a área de transferência!");
              }}
              title="Copiar Link para SharePoint"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => {
                const url = window.location.href;
                const text = `Acesse a obra ${formData.project_name} no FX TAO: ${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              title="Compartilhar no WhatsApp"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        )}
        {/* Submit for Approval Button (Only if Draft or Rejected) */}
        {id && (formData.approval_status === 'draft' || formData.approval_status === 'rejected') && (
          <Button
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={async () => {
              try {
                await api.put(`/taos/${id}`, { approval_status: 'pending', current_approval_level: 0 });
                toast.success("Enviado para aprovação!");
                queryClient.invalidateQueries(['tao', id]);

                // Notify Approvers
                const res = await api.get('/resources/tao-approvers');
                const allApprovers = res.data || [];
                const approvers = allApprovers.filter(a => a.tao_id === id && a.level === 1);

                for (const approver of approvers) {
                  createNotification(
                    approver.user_email,
                    "Nova Aprovação Pendente",
                    `A obra ${formData.project_name} requer sua aprovação.`,
                    `/TaoForm?id=${id}`
                  );
                }
              } catch (error) {
                toast.error("Erro ao enviar para aprovação.");
                console.error(error);
              }
            }}
          >
            Enviar para Aprovação
          </Button>
        )}
      </div>

      <TaoStepper currentStep={currentStep} onStepChange={handleStepClick} />

      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20 flex justify-end items-center gap-4 px-8">
        <span className="text-sm text-slate-500 mr-auto">
          {mutation.isPending ? 'Salvando...' : 'Alterações salvas localmente'}
        </span>

        <Button
          variant="outline"
          onClick={() => handleSave(currentStep)}
          disabled={mutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Rascunho
        </Button>

        <Button
          className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
          onClick={handleNext}
          disabled={mutation.isPending}
        >
          {currentStep === '5' ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
            </>
          ) : (
            <>
              Próximo <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
