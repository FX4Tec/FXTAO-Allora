import { Check, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

const stepOrder = ['start', '1', '2', '3', '4', '5'];

const getStepIndex = (stepId) => stepOrder.indexOf(stepId);

export default function TaoStepper({ currentStep, completedThrough = currentStep, onStepChange }) {
  const steps = [
    { id: 'start', label: 'Cadastro e Sienge' },
    { id: '1', label: 'Contrato e Valores' },
    { id: '2', label: 'Financeiro e Equipe' },
    { id: '3', label: 'Aprovações e Aditivos' },
    { id: '4', label: 'Documentos e Compliance' },
    { id: '5', label: 'Contatos e Publicação' },
  ];

  const getStepStatus = (stepId) => {
    const currentIndex = getStepIndex(currentStep);
    const completedIndex = getStepIndex(completedThrough);
    const stepIndex = getStepIndex(stepId);

    if (stepIndex === currentIndex) return 'current';
    if (stepIndex <= completedIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-5 mb-6 overflow-x-auto">
      <div className="flex items-start justify-between min-w-[760px] max-w-6xl mx-auto relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-100" />

        {steps.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <button key={step.id} onClick={() => onStepChange(step.id)} className="relative z-10 flex w-28 flex-col items-center gap-2 text-center">
              <span className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-medium transition-all duration-300",
                status === 'completed' && "bg-green-500 border-green-500 text-white hover:bg-green-600",
                status === 'current' && "bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-100",
                status === 'upcoming' && "border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-500"
              )}>
                {status === 'completed' ? <Check className="w-5 h-5" /> : step.id === 'start' ? <FileText className="w-5 h-5" /> : step.id}
              </span>
              <span className={cn("text-[11px] font-medium leading-tight", status === 'current' ? "text-indigo-700" : "text-slate-500")}>{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
