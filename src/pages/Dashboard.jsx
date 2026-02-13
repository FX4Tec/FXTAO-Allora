import React, { useState, useMemo } from 'react';
import api from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend,
} from 'recharts';
import {
    Building2,
    Wallet,
    Users,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Banknote,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isBefore, isAfter, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ──────── Helpers ────────
const toNum = (v) => {
    if (v == null || v === '') return 0;
    const n = typeof v === 'string' ? parseFloat(v) : Number(v);
    return isNaN(n) ? 0 : n;
};

const formatMoney = (val) =>
    `R$ ${toNum(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatNumber = (val) =>
    toNum(val).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Friendly status label
const STATUS_LABEL = {
    'start': 'Início',
    '1': 'Etapa 1',
    '2': 'Etapa 2',
    '3': 'Etapa 3',
    '4': 'Etapa 4',
    '5': 'Entregue',
};

// Status → progress %
const STATUS_PROGRESS = { 'start': 0, '1': 20, '2': 40, '3': 60, '4': 80, '5': 100 };

// Regime labels (DB → PT-BR display)
const REGIME_LABELS = {
    'preco_maximo_garantido': 'Preço Máximo Garantido',
    'empreitada_global': 'Empreitada Global',
    'administracao': 'Administração',
    'preco_unitario': 'Preço Unitário',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    // ── Data Fetching ──
    const { data: taos = [], isLoading: isLoadingTaos } = useQuery({
        queryKey: ['taos'],
        queryFn: async () => {
            const res = await api.get('/taos');
            const data = res.data;
            if (data && Array.isArray(data.data)) return data.data;
            return Array.isArray(data) ? data : [];
        },
        placeholderData: [],
    });

    const { data: installments = [], isLoading: isLoadingInst } = useQuery({
        queryKey: ['allInstallments'],
        queryFn: async () => {
            const res = await api.get('/resources/tao-installments');
            const data = res.data;
            if (data && Array.isArray(data.data)) return data.data;
            return Array.isArray(data) ? data : [];
        },
        placeholderData: [],
    });

    const { data: additives = [], isLoading: isLoadingAdds } = useQuery({
        queryKey: ['allAdditives'],
        queryFn: async () => {
            const res = await api.get('/resources/tao-additives');
            const data = res.data;
            if (data && Array.isArray(data.data)) return data.data;
            return Array.isArray(data) ? data : [];
        },
        placeholderData: [],
    });

    // ── Filtering ──
    const safeTaos = Array.isArray(taos) ? taos : [];
    const safeInstallments = Array.isArray(installments) ? installments : [];
    const safeAdditives = Array.isArray(additives) ? additives : [];

    const filteredTaos = useMemo(() => {
        if (selectedProjectId === 'all') return safeTaos;
        return safeTaos.filter(t => t.id === selectedProjectId);
    }, [safeTaos, selectedProjectId]);

    const filteredInstallments = useMemo(() => {
        if (selectedProjectId === 'all') return safeInstallments;
        return safeInstallments.filter(i => i.tao_id === selectedProjectId);
    }, [safeInstallments, selectedProjectId]);

    const filteredAdditives = useMemo(() => {
        if (selectedProjectId === 'all') return safeAdditives;
        return safeAdditives.filter(a => a.tao_id === selectedProjectId);
    }, [safeAdditives, selectedProjectId]);

    // ── KPI Calculations ──
    const stats = useMemo(() => {
        const activeProjects = filteredTaos.filter(t => t.status !== '5');
        const deliveredProjects = filteredTaos.filter(t => t.status === '5');

        const totalM2 = filteredTaos.reduce((acc, t) => acc + toNum(t.area_m2), 0);
        const totalValue = filteredTaos.reduce((acc, t) => acc + toNum(t.value_total_contract), 0);
        const avgValueM2 = totalM2 > 0 ? totalValue / totalM2 : 0;

        // Fat. Direto: Contratado
        const totalDirectContracted = filteredTaos.reduce((acc, t) => acc + toNum(t.value_billing_direct), 0);

        // Fat. Direto: Realizado (parcelas pagas do tipo direto)
        const totalDirectRealized = filteredInstallments
            .filter(i => i.is_paid && i.type === 'direct')
            .reduce((acc, i) => acc + toNum(i.value), 0);

        // Custo Médio da Equipe Técnica
        const totalTeamCost = filteredTaos.reduce((acc, t) => acc + toNum(t.value_team_technical), 0);
        const avgTeamCost = filteredTaos.length > 0 ? totalTeamCost / filteredTaos.length : 0;

        // Impostos Totais
        const totalTaxes = filteredTaos.reduce((acc, t) => acc + toNum(t.value_taxes), 0);

        // Performance Geral (média de progresso de todas as obras)
        const totalPerformance = filteredTaos.reduce((acc, t) => acc + (STATUS_PROGRESS[t.status] || 0), 0);
        const avgPerformance = filteredTaos.length > 0 ? totalPerformance / filteredTaos.length : 0;

        return {
            activeCount: activeProjects.length,
            deliveredCount: deliveredProjects.length,
            totalM2,
            totalValue,
            avgValueM2,
            totalDirectContracted,
            totalDirectRealized,
            avgTeamCost,
            totalTaxes,
            avgPerformance,
            activeProjects,
            deliveredProjects
        };
    }, [filteredTaos, filteredInstallments]);

    // ── Charts Data ──

    // Valor por Regime de Contratação
    const regimeData = useMemo(() => {
        const map = {};
        filteredTaos.forEach(t => {
            const raw = t.hiring_regime || 'Não Definido';
            const label = REGIME_LABELS[raw] || raw;
            map[label] = (map[label] || 0) + toNum(t.value_total_contract);
        });
        return Object.keys(map).map(k => ({ name: k, value: map[k] }));
    }, [filteredTaos]);

    // Total de Aditivos
    const totalAdditivesValue = (filteredAdditives || []).reduce((acc, a) => acc + toNum(a.value), 0);

    // Calendário de Recebíveis (Próx. 6 Meses)
    const receivablesCalendar = useMemo(() => {
        const today = new Date();
        const sixMonthsLater = addMonths(today, 6);

        return filteredInstallments
            .filter(i => !i.is_paid && i.due_date)
            .filter(i => {
                const date = parseISO(i.due_date);
                return isAfter(date, today) && isBefore(date, sixMonthsLater);
            })
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 5);
    }, [filteredInstallments]);

    if (isLoadingTaos || isLoadingInst || isLoadingAdds) {
        return <div className="p-10 text-center text-slate-500">Carregando Dashboard...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
                    <p className="text-slate-500">Visão geral dos indicadores de performance e financeiros.</p>
                </div>
                <div className="w-full md:w-64">
                    <div className="flex items-center gap-2 mb-1">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-500">Obra</span>
                    </div>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Todas as Obras" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Obras</SelectItem>
                            {safeTaos.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.project_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ─── Top KPI Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Performance Geral */}
                <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium mb-1">Performance Geral</p>
                                <h3 className="text-3xl font-bold">{stats.avgPerformance.toFixed(1)}%</h3>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-blue-200">
                            Média de avanço das etapas (TAO)
                        </div>
                    </CardContent>
                </Card>

                {/* Área Total / Valor Médio */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Área Total / Valor Médio</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold">{formatNumber(stats.totalM2)} m²</h3>
                                </div>
                                <p className="text-sm text-indigo-600 font-semibold mt-1">
                                    {formatMoney(stats.avgValueM2)} / m²
                                </p>
                            </div>
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-slate-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Fat. Direto: Contratado vs Realizado */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Fat. Direto: Contratado vs Real.</p>
                                <h3 className="text-lg font-bold text-slate-900">{formatMoney(stats.totalDirectContracted)}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all"
                                            style={{ width: `${Math.min((stats.totalDirectRealized / (stats.totalDirectContracted || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-green-600 font-bold whitespace-nowrap">
                                        {Math.round((stats.totalDirectRealized / (stats.totalDirectContracted || 1)) * 100)}%
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Realizado: {formatMoney(stats.totalDirectRealized)}</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Wallet className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Impostos Totais + Custo Méd. Equipe */}
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-red-100 rounded">
                                        <Banknote className="w-4 h-4 text-red-600" />
                                    </div>
                                    <span className="text-sm text-slate-500">Impostos Totais</span>
                                </div>
                                <span className="font-bold text-slate-700">{formatMoney(stats.totalTaxes)}</span>
                            </div>
                            <div className="w-full h-px bg-slate-100" />
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm text-slate-500">Custo Méd. Equipe</span>
                                </div>
                                <span className="font-bold text-slate-700">{formatMoney(stats.avgTeamCost)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Charts Row ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Valor por Regime de Contratação */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-700 uppercase">Valor por Regime de Contratação</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        {regimeData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                                Nenhum dado disponível.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={regimeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {regimeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip formatter={(value) => formatMoney(value)} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Calendário de Recebíveis */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-700 uppercase">Calendário de Recebíveis (Próx. 6 Meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {receivablesCalendar.length === 0 ? (
                                <div className="text-center text-slate-400 py-8 text-sm">Nenhum recebimento previsto.</div>
                            ) : (
                                receivablesCalendar.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded border border-slate-200 text-center min-w-[50px]">
                                                <span className="block text-xs font-bold text-indigo-600 uppercase">
                                                    {format(parseISO(item.due_date), 'MMM', { locale: ptBR })}
                                                </span>
                                                <span className="block text-lg font-bold text-slate-700 leading-none">
                                                    {format(parseISO(item.due_date), 'dd')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">{item.description}</p>
                                                <p className="text-xs text-slate-500 capitalize">
                                                    {item.type === 'direct' ? 'Direto' : item.type === 'consultancy' ? 'Consultoria' : item.type}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-green-600">{formatMoney(item.value)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Aditivos Contratuais */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-700 uppercase">Aditivos Contratuais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center h-[200px] space-y-2">
                            <p className="text-slate-500 font-medium">Total em Aditivos</p>
                            <h2 className="text-3xl font-bold text-orange-600">{formatMoney(totalAdditivesValue)}</h2>
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                <span className="text-xs text-orange-700 font-bold">
                                    {stats.totalValue > 0 ? ((totalAdditivesValue / stats.totalValue) * 100).toFixed(2) : '0,00'}% do valor original
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 text-center mt-4 max-w-[200px]">
                                Representa o valor acrescido ao contrato original através de termos aditivos.
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* ─── Detalhamento de Obras ─── */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Detalhamento de Obras
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Obras Ativas */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-blue-700">Obras Ativas ({stats.activeCount})</CardTitle>
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Em Andamento</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats.activeProjects.length === 0 ? (
                                <p className="p-6 text-center text-slate-400">Nenhuma obra ativa.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {stats.activeProjects.map(p => (
                                        <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-800">{p.project_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">ERP: {p.erp_number || 'N/A'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-700">{formatMoney(p.value_total_contract)}</div>
                                                <div className="text-xs text-blue-600">{STATUS_LABEL[p.status] || p.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Obras Entregues */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-green-700">Obras Entregues ({stats.deliveredCount})</CardTitle>
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Finalizadas</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats.deliveredProjects.length === 0 ? (
                                <p className="p-6 text-center text-slate-400">Nenhuma obra entregue.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {stats.deliveredProjects.map(p => (
                                        <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-800">{p.project_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">ERP: {p.erp_number || 'N/A'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-700">{formatMoney(p.value_total_contract)}</div>
                                                <div className="text-xs text-green-600 flex items-center gap-1 justify-end">
                                                    <CheckCircle2 className="w-3 h-3" /> Entregue
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

        </div>
    );
}