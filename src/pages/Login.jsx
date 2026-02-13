
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch System Configs for Logos
    const { data: systemConfigs } = useQuery({
        queryKey: ['systemConfigs'],
        queryFn: async () => {
            try {
                const res = await api.get('/resources/system-configs');
                return res.data || [];
            } catch (error) {
                console.error("Failed to fetch configs", error);
                return [];
            }
        },
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    const clientLogoUrl = systemConfigs?.find(c => c.key === 'client_logo_url')?.value;
    const fx4LogoUrl = "https://fx4.com.br/wp-content/uploads/2025/07/logo-bola.png";

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            toast({
                title: "Login realizado com sucesso",
                description: "Bem-vindo de volta!",
            });
            // Check for redirect location (from localStorage or React Router state)
            const savedRedirect = localStorage.getItem('login_redirect_url');
            localStorage.removeItem('login_redirect_url'); // Clean up

            const redirectPath = savedRedirect
                || (location.state?.from ? `${location.state.from.pathname}${location.state.from.search}` : '/');

            navigate(redirectPath, { replace: true });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro no Login",
                description: error.message || "Verifique suas credenciais.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 relative">
            <Card className="w-[480px] shadow-lg">
                <div className="px-6 pt-6 flex justify-between items-center">
                    {/* Top Left FX4 Logo */}
                    <div className="flex items-center gap-2">
                        <img src={fx4LogoUrl} alt="FX4 Logo" className="h-10 w-auto" />
                    </div>

                    {/* Top Right Client Logo */}
                    {clientLogoUrl && (
                        <div>
                            <img src={clientLogoUrl} alt="Client Logo" className="h-12 w-auto object-contain" />
                        </div>
                    )}
                </div>

                <CardHeader>
                    <div className="text-center mb-2">
                        <h1 className="text-xl font-bold text-slate-800">FX4 Apps - TAO</h1>
                    </div>
                    <CardTitle className="text-center text-2xl">Login</CardTitle>
                    <CardDescription className="text-center">Entre para acessar o sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 mt-6">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    // Save the redirect path (if any) to session storage before leaving for Microsoft
                                    const from = location.state?.from;
                                    if (from) {
                                        const redirectUrl = `${from.pathname}${from.search}`;
                                        sessionStorage.setItem('sso_redirect_url', redirectUrl);
                                    }
                                    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/microsoft`;
                                }}
                                disabled={isLoading}
                            >
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                                Entrar com Microsoft
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
