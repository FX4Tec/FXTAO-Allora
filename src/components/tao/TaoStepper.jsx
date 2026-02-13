import React from 'react';
import { Check, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function TaoStepper({ currentStep, onStepChange, maxSteps = 5 }) {
  const steps = [
    { id: 'start', label: 'Início' },
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
  ];

  const getStepStatus = (stepId) => {
    const stepOrder = ['start', '1', '2', '3', '4', '5'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
      <div className="flex items-center justify-between max-w-3xl mx-auto relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-0 transform -translate-y-1/2" />

        {steps.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={cn(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300 border-2 overflow-hidden",
                status === 'completed' && "bg-green-500 border-green-500 text-white hover:bg-green-600",
                status === 'current' && "bg-indigo-600 border-indigo-600 text-white shadow-md scale-110 ring-4 ring-indigo-100",
                status === 'upcoming' && "bg-white border-slate-300 text-slate-500 hover:border-indigo-300 hover:text-indigo-500"
              )}
            >
              {status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : step.id === 'start' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <span>{step.label}</span>
              )}

              <span className={cn(
                "absolute -bottom-8 text-xs font-medium whitespace-nowrap",
                status === 'current' ? "text-indigo-600" : "text-slate-400"
              )}>
                {step.id === 'start' ? 'Dados Iniciais' : `Etapa ${step.label}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}