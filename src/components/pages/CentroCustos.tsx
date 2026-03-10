import { useState, useEffect } from "react";
import {
    Layers, Plus, Search, PieChart, TrendingUp, TrendingDown,
    Briefcase, Building, Target, MoreHorizontal, Edit, Trash2,
    DollarSign, BarChart3, ArrowRight, Loader2, X, Bell, BellOff,
    Brain, FileSearch, ChevronRight, Landmark, Scale, CheckCheck,
    CheckCircle2, AlertCircle, Info, Download, PartyPopper, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { analyzeCostCenterWithAI, CostCenterAnalysisResult } from "@/components/services/openai";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CentroCustos = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [centers, setCenters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newBudget, setNewBudget] = useState<number>(0);
    const [creating, setCreating] = useState(false);

    // AI States
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiResult, setAiResult] = useState<CostCenterAnalysisResult | null>(null);
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Alerts state - usando array simples para React detectar mudancas corretamente
    const [readAlerts, setReadAlerts] = useState<string[]>([]);

    // Mock alerts data (can be replaced with real data)
    const alerts = [
        { id: 'a1', type: 'warning', title: 'Orçamento Excedido', description: 'O centro "Marketing" ultrapassou 90% do orçamento mensal.', time: 'Há 2h' },
        { id: 'a2', type: 'info', title: 'Novo Lançamento Pendente', description: '3 lançamentos sem centro de custo definido aguardam classificação.', time: 'Há 5h' },
        { id: 'a3', type: 'danger', title: 'Orçamento Estourado', description: 'O centro "TI & Infraestrutura" excedeu o limite em R$ 1.200,00.', time: 'Ontem' },
        { id: 'a4', type: 'success', title: 'Classificação IA Concluída', description: '12 notas fiscais foram classificadas automaticamente pela IA.', time: 'Ontem' },
        { id: 'a5', type: 'info', title: 'Novo Centro Criado', description: 'O centro "Operações" foi adicionado com orçamento de R$ 5.000,00.', time: '2 dias atrás' },
    ];

    const unreadAlerts = alerts.filter(a => !readAlerts.includes(a.id));

    const markAsRead = (id: string) => {
        setReadAlerts(prev => [...prev, id]);
    };

    const markAllAsRead = () => {
        setReadAlerts(alerts.map(a => a.id));
    };

    const fetchCenters = async () => {
        if (!selectedClient) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('finance_cost_centers')
                .select('*')
                .eq('empresa_id', selectedClient.id)
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (error) throw error;
            setCenters(data || []);
        } catch (error: any) {
            console.error('Error fetching cost centers:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, [selectedClient]);

    const handleCreate = async () => {
        if (!newName || !selectedClient) return;
        setCreating(true);
        try {
            const { error } = await (supabase as any)
                .from('finance_cost_centers')
                .insert([{
                    nome: newName,
                    orcamento_mensal: newBudget, // Assuming this column exists or can be handled as any
                    tenant_id: user?.id,
                    empresa_id: selectedClient.id,
                    ativo: true
                }]);

            if (error) throw error;
            toast.success("Centro de custo criado!");
            setNewName("");
            setNewBudget(0);
            fetchCenters();
        } catch (error: any) {
            toast.error("Erro ao criar centro de custo");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este centro de custo?")) return;
        try {
            const { error } = await (supabase as any)
                .from('finance_cost_centers')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Removido com sucesso");
            fetchCenters();
        } catch (error: any) {
            toast.error("Erro ao remover");
        }
    };

    const handleAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setIsAnalysing(true);
        const toastId = toast.loading("IA analisando nota fiscal e sugerindo enquadramento...");

        try {
            const centerNames = centers.map(c => c.nome);
            const result = await analyzeCostCenterWithAI(file, centerNames);
            setAiResult(result);
            setIsAiDialogOpen(true);
            toast.success("Análise concluída!", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Erro na análise", { id: toastId });
        } finally {
            setIsAnalysing(false);
            e.target.value = '';
        }
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                    <Layers className="h-10 w-10 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground/80">Centro de Custos</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Selecione uma empresa para gerenciar a estrutura de agrupamento financeiro.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-16">

            {/* 1. Header - padrão sistema */}
            <div className="flex items-end justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <Layers className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Centro de Custos</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Landmark className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                                {selectedClient.nome_fantasia || selectedClient.razao_social}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="file" accept="image/*" className="hidden" id="ai-upload-cc" onChange={handleAIAnalysis} disabled={isAnalysing} />
                        <Button variant="ghost" className="font-light text-primary hover:bg-primary/5 border border-primary/20 bg-white/50 backdrop-blur-sm group px-6" asChild>
                            <label htmlFor="ai-upload-cc" className="cursor-pointer flex items-center">
                                {isAnalysing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                                Classificar via IA
                            </label>
                        </Button>
                    </div>
                    <Button variant="outline" className="font-light px-6 bg-card/50 hover:bg-muted" onClick={() => fetchCenters()}>
                        {loading && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                        Sincronizar
                    </Button>
                </div>
            </div>

            {/* 2. Summary Cards - padrão sistema */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total de Unidades", val: centers.length, isCount: true, icon: Layers, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
                    { label: "Orçamento Global", val: centers.reduce((acc, c) => acc + Number(c.orcamento_mensal || 0), 0), icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                    { label: "Utilização Média", val: null, isText: "24%", icon: TrendingUp, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
                    { label: "Eficiência IA", val: null, isText: "98%", icon: Brain, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" }
                ].map((card, i) => (
                    <Card key={i} className={cn("bg-card border shadow-sm p-6 overflow-hidden relative group transition-all duration-300 hover:shadow-md", card.border)}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">{card.label}</p>
                                <p className={cn("text-2xl font-light tracking-tight", card.color)}>
                                    {card.isText
                                        ? card.isText
                                        : card.isCount
                                            ? card.val
                                            : (card.val as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110", card.bg, card.color)}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <div className={cn("absolute bottom-0 left-0 h-0.5 w-0 bg-current transition-all duration-700 group-hover:w-full opacity-20", card.color)} />
                    </Card>
                ))}
            </div>

            {/* 3. Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Form Card - padrão sistema */}
                <Card className="lg:col-span-1 bg-card border border-border shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-light uppercase tracking-widest text-foreground">Nova Unidade</CardTitle>
                        <CardDescription className="text-[10px] font-light uppercase tracking-tight">Defina um novo centro de custo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Nome da Unidade</label>
                            <Input
                                placeholder="Ex: Marketing, TI, Infra..."
                                className="bg-muted/30 border-border font-light"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Orçamento Mensal</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-9 bg-muted/30 border-border font-light"
                                    value={newBudget}
                                    onChange={(e) => setNewBudget(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                        <Button className="w-full bg-primary font-light" onClick={handleCreate} disabled={creating || !newName}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Cadastrar Unidade
                        </Button>
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center gap-2 text-amber-600 mb-1">
                                <Info className="h-3 w-3" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Dica</span>
                            </div>
                            <p className="text-[10px] text-amber-700/70 font-light leading-relaxed">
                                Categorize seus gastos por unidade para visualizar a rentabilidade de cada área.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Card - padrão sistema */}
                <Card className="lg:col-span-3 bg-card/50 backdrop-blur-md border-border/60 shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b border-border/40">
                        <div>
                            <CardTitle className="text-sm font-light uppercase tracking-widest text-foreground">
                                Estrutura de Unidades
                            </CardTitle>
                            <CardDescription className="text-[10px] font-light uppercase tracking-tight mt-0.5">
                                {centers.length} centro{centers.length !== 1 ? 's' : ''} cadastrado{centers.length !== 1 ? 's' : ''}
                            </CardDescription>
                        </div>
                        <div className="relative w-56">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                placeholder="Buscar centro..."
                                className="pl-11 bg-muted/20 border-border/50 font-light text-xs h-10 rounded-2xl focus:bg-white/80 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] pl-8 py-4 text-muted-foreground/60">Unidade / Centro</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-4 text-muted-foreground/60">Orçamento Mensal</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-4 text-muted-foreground/60 text-center">Gasto Realizado</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right pr-8 py-4 text-muted-foreground/60">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && centers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-16">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/30" />
                                        </TableCell>
                                    </TableRow>
                                ) : centers.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20">
                                            <Layers className="h-10 w-10 mx-auto opacity-10 mb-3" />
                                            <p className="text-sm text-muted-foreground/60 font-light">Nenhuma unidade encontrada.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    centers.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())).map((center) => (
                                        <TableRow key={center.id} className="border-border/30 hover:bg-muted/30 transition-all group">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                        <Target className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{center.nome}</p>
                                                        <p className="text-[9px] text-muted-foreground font-light tracking-wide uppercase mt-1">Criado em {new Date(center.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="space-y-1.5">
                                                    <span className="text-xs font-medium text-foreground/80">
                                                        {Number(center.orcamento_mensal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                    </span>
                                                    <Progress value={Math.random() * 80} className="h-1 bg-muted/50 max-w-[100px]" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-200 font-bold text-[9px] uppercase tracking-tighter px-2">
                                                    Saudável (22%)
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-5 text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:bg-muted rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-border min-w-[180px] rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-1">
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                            <Edit className="h-4 w-4 text-blue-500" /> Editar Unidade
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                            <BarChart3 className="h-4 w-4 text-emerald-500" /> Relatório Detalhado
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                            onClick={() => handleDelete(center.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Remover
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* ALERTS SECTION */}
            <Card className="bg-card/50 backdrop-blur-md border-border/60 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="h-5 w-5 text-primary" />
                            {unreadAlerts.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                                    {unreadAlerts.length}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">Alertas do Sistema</p>
                            <p className="text-[10px] text-muted-foreground font-light uppercase tracking-widest">
                                {unreadAlerts.length} não lido{unreadAlerts.length !== 1 ? 's' : ''} · {alerts.length} total
                            </p>
                        </div>
                    </div>
                    {unreadAlerts.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-medium text-muted-foreground hover:text-primary gap-2"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-4 w-4" />
                            Marcar todos como lido
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    {alerts.length === 0 || unreadAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                <BellOff className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Sem alertas pendentes</p>
                            <p className="text-[11px] text-muted-foreground font-light mt-1">Todos os alertas foram lidos. O sistema está em dia.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {alerts.map((alert) => {
                                const isRead = readAlerts.includes(alert.id);
                                if (isRead) return null;
                                const config = {
                                    warning: { icon: AlertTriangle, iconColor: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
                                    danger: { icon: AlertCircle, iconColor: 'text-rose-500', bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
                                    info: { icon: Info, iconColor: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400' },
                                    success: { icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
                                }[alert.type] || { icon: Info, iconColor: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' };
                                const IconComp = config.icon;
                                return (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 group/alert animate-in fade-in slide-in-from-left-2",
                                            config.bg
                                        )}
                                    >
                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm", config.iconColor)}>
                                            <IconComp className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
                                                <p className="text-xs font-bold text-foreground tracking-tight">{alert.title}</p>
                                                <span className="text-[9px] text-muted-foreground font-light ml-auto shrink-0">{alert.time}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-light leading-relaxed mt-1">{alert.description}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 opacity-0 group-hover/alert:opacity-100 transition-all hover:bg-white rounded-xl"
                                            onClick={() => markAsRead(alert.id)}
                                            title="Marcar como lido"
                                        >
                                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. IA Insights Banner - Minimalist White */}
            <div className="bg-white rounded-[3rem] p-12 flex flex-col md:flex-row items-center gap-10 border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-50 blur-[120px] -z-10" />
                <div className="h-28 w-28 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-slate-200 relative group-hover:rotate-6 transition-transform duration-700">
                    <Brain className="h-14 w-14" />
                </div>
                <div className="flex-1 space-y-5 text-center md:text-left">
                    <div className="space-y-2">
                        <Badge className="bg-slate-100 text-slate-900 border-none text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-1">Classificação Inteligente</Badge>
                        <h3 className="text-3xl font-light text-slate-900 tracking-tight leading-tight">Gestão Estratégica por Unidade</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
                        Nossa IA analisa suas notas fiscais e sugere automaticamente o enquadramento no centro de custo correto.
                        Chega de rateios complexos: receba sugestões de divisão percentual baseadas no histórico e perfil do gasto.
                    </p>
                    <div className="flex flex-wrap gap-5 pt-4 justify-center md:justify-start">
                        {[
                            { icon: CheckCircle2, text: "Enquadramento Automático" },
                            { icon: Scale, text: "Sugeridor de Rateio" },
                            { icon: BarChart3, text: "ROI por Centro de Custo" }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl transition-all hover:bg-slate-100">
                                <feat.icon className="h-4 w-4 text-emerald-500" />
                                {feat.text}
                            </div>
                        ))}
                    </div>
                </div>
                <Button
                    className="font-bold bg-slate-900 text-white hover:bg-black px-12 h-16 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    asChild
                >
                    <label htmlFor="ai-upload-cc" className="cursor-pointer flex items-center">
                        Analisar Nota via IA
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </label>
                </Button>
            </div>

            {/* AI Analysis Modal */}
            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogContent className="max-w-md bg-card border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-primary" />
                    <DialogHeader className="pt-8 px-8">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-6 animate-pulse">
                            <Brain className="h-10 w-10" />
                        </div>
                        <DialogTitle className="font-light text-2xl tracking-tight text-foreground/90">Análise de Enquadramento</DialogTitle>
                        <DialogDescription className="text-sm font-light text-muted-foreground pt-2 leading-relaxed">
                            A IA identificou o melhor destino para este lançamento com base no histórico da empresa.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/20 space-y-2">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Centro Sugerido</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                                        <Landmark className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-xl font-bold tracking-tight text-foreground">{aiResult?.centro_sugerido}</h4>
                                </div>
                                <p className="text-[11px] text-muted-foreground/80 font-light italic mt-3 leading-relaxed">
                                    "{aiResult?.justificativa}"
                                </p>
                            </div>

                            {aiResult?.rateio_sugerido && aiResult.rateio_sugerido.length > 0 && (
                                <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-4">Sugestão de Rateio</p>
                                    <div className="space-y-4">
                                        {aiResult.rateio_sugerido.map((r, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-medium px-1">
                                                    <span>{r.centro}</span>
                                                    <span>{r.percentual}%</span>
                                                </div>
                                                <Progress value={r.percentual} className="h-1.5 bg-muted rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/30 p-8 flex justify-end gap-3 rounded-b-[2rem]">
                        <Button variant="ghost" className="font-light" onClick={() => setIsAiDialogOpen(false)}>Ignorar</Button>
                        <Button className="bg-primary hover:bg-primary/95 text-white font-medium px-10 h-12 rounded-xl shadow-lg shadow-primary/20" onClick={() => setIsAiDialogOpen(false)}>
                            Aplicar Classificação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CentroCustos;
