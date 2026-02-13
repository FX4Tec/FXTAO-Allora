
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban } from 'lucide-react';

export default function AccessBlocked() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 5000); // 5 seconds delay

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-slate-200">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <Ban className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Bloqueado</h1>
                <p className="text-slate-600 mb-6">
                    Sua conta foi desativada pelo administrador. Entre em contato com o suporte para mais informações.
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-red-500 h-1.5 rounded-full animate-[progress_5s_linear_forwards]" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-slate-400">
                    Você será redirecionado para o login em instantes...
                </p>
                <style>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                `}</style>
            </div>
        </div>
    );
}
