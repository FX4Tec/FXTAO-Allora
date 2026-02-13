
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { toast } from "sonner";

const SSOCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { checkUserAuth } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            localStorage.setItem('token', token);
            checkUserAuth()
                .then(() => {
                    toast.success("Login realizado com sucesso via Microsoft!");

                    // Check for saved redirect URL (saved by Auth Guard in App.jsx)
                    const redirectUrl = localStorage.getItem('login_redirect_url');
                    localStorage.removeItem('login_redirect_url'); // Clean up

                    navigate(redirectUrl || '/', { replace: true });
                })
                .catch((err) => {
                    console.error("SSO Auth Check Failed", err);
                    toast.error("Erro ao validar login SSO.");
                    navigate('/Login');
                });
        } else if (error) {
            toast.error("Erro no login Microsoft: " + error);
            navigate('/Login');
        } else {
            navigate('/Login');
        }
    }, [searchParams, navigate, checkUserAuth]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Processando login...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
        </div>
    );
};

export default SSOCallback;
