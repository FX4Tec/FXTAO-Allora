import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createPageUrl } from '@/utils';

const TaoDeepLink = () => {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, isLoadingAuth } = useAuth();
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // If auth is loading, wait
        if (isLoadingAuth) return;

        // If not authenticated, redirect to login, preserving this location
        if (!isAuthenticated) {
            // We use state to pass the current location to the login page
            // The Login page or AuthContext should handle redirecting back here after success
            navigate('/Login', { state: { from: location }, replace: true });
            return;
        }

        const checkAccess = async () => {
            try {
                setChecking(true);
                // Call backend to resolve identifier and check permissions
                const res = await api.get(`/taos/access-check/${identifier}`);

                if (res.data.authorized && res.data.taoId) {
                    // Redirect to TAO Form
                    navigate(`${createPageUrl('TaoForm')}?id=${res.data.taoId}`, { replace: true });
                } else {
                    // Should be caught by catch block if 403, but just in case
                    setError("Acesso não autorizado ou obra não encontrada.");
                }
            } catch (err) {
                console.error("Deep Link Error:", err);
                if (err.response?.status === 404) {
                    setError("Obra não encontrada. Verifique o ID ou Número ERP.");
                } else if (err.response?.status === 403) {
                    setError("Você não tem permissão para acessar esta obra. Contate o administrador.");
                } else if (err.response?.status === 401) {
                    // Token expired or invalid, force login
                    navigate('/Login', { state: { from: location }, replace: true });
                } else {
                    setError("Erro ao verificar acesso. Tente novamente mais tarde.");
                }
            } finally {
                setChecking(false);
            }
        };

        if (user) {
            checkAccess();
        }

    }, [identifier, isAuthenticated, isLoadingAuth, navigate, user, location]);

    if (isLoadingAuth || checking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                <h2 className="text-xl font-semibold text-slate-700">Verificando acesso à obra...</h2>
                <p className="text-slate-500">Por favor, aguarde.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
                <Card className="w-full max-w-md shadow-lg border-red-200">
                    <CardHeader className="bg-red-50 border-b border-red-100 pb-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                            <CardTitle>Acesso Negado</CardTitle>
                        </div>
                        <CardDescription className="text-red-700">
                            Não foi possível acessar a obra solicitada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 text-center space-y-6">
                        <p className="text-slate-600 font-medium">{error}</p>
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => navigate('/')} className="w-full bg-slate-800 hover:bg-slate-900">
                                Voltar ao Início
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/Login')} className="w-full">
                                Trocar de Usuário
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null; // Should redirect before rendering this
};

export default TaoDeepLink;
