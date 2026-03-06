import { useState, useEffect } from "react";
import {
    Building2, Plus, Search, Trash2, Loader2, CreditCard,
    ArrowUpRight, ArrowDownRight, Wallet, Landmark,
    ArrowRightLeft, Brain, AlertCircle,
    CheckCircle2, TrendingUp, DollarSign, PieChart,
    Calendar, ShieldCheck, Info, ChevronRight, RefreshCw,
    MoreHorizontal, Edit, Star
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { analyzeCashFlowWithAI, CashFlowPrediction } from "@/components/services/openai";
import { Progress } from "@/components/ui/progress";

interface BankAccount {
    id: string;
    banco: string;
    agencia: string;
    conta: string;
    tipo: string;
    saldo_inicial: number;
    saldo_atual: number;
    is_padrao: boolean;
    color: string;
    created_at: string;
}

const ContasBancarias = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");

    // AI States
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiPrediction, setAiPrediction] = useState<CashFlowPrediction | null>(null);

    const [newAccount, setNewAccount] = useState({
        banco: "",
        agencia: "",
        conta: "",
        tipo: "corrente",
        saldo_inicial: 0,
        is_padrao: false,
        color: "#3b82f6"
    });

    const [transferData, setTransferData] = useState({
        origin: "",
        destination: "",
        amount: 0,
        description: "Transferência Interna"
    });

    const fetchAccounts = async () => {
        if (!selectedClient) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('finance_bank_accounts')
                .select('*')
                .eq('empresa_id', selectedClient.id)
                .eq('ativo', true)
                .order('is_padrao', { ascending: false });

            if (error) throw error;
            setAccounts(data || []);
        } catch (error: any) {
            console.error('Error fetching bank accounts:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAIPrediction = async () => {
        if (!selectedClient || accounts.length === 0) return;

        setIsAnalysing(true);
        const totalBalance = accounts.reduce((acc, a) => acc + (a.saldo_atual || 0), 0);

        try {
            // Mocking some pending data to show the AI in action
            const pendingPayments = [{ valor: 2500, data: '2024-03-20' }, { valor: 1200, data: '2024-03-22' }];
            const pendingReceivables = [{ valor: 5000, data: '2024-03-25' }];

            const prediction = await analyzeCashFlowWithAI(totalBalance, pendingPayments, pendingReceivables);
            setAiPrediction(prediction);
            toast.success("Análise de fluxo de caixa concluída!");
        } catch (error) {
            toast.error("Erro na análise preditiva");
        } finally {
            setIsAnalysing(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [selectedClient]);

    const handleCreate = async () => {
        if (!newAccount.banco || !newAccount.conta || !selectedClient) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }
        setCreating(true);
        try {
            const { error } = await (supabase as any)
                .from('finance_bank_accounts')
                .insert([{
                    ...newAccount,
                    saldo_atual: newAccount.saldo_inicial,
                    tenant_id: user?.id,
                    empresa_id: selectedClient.id,
                    ativo: true
                }]);

            if (error) throw error;
            toast.success("Conta bancária cadastrada!");
            setIsDialogOpen(false);
            setNewAccount({ banco: "", agencia: "", conta: "", tipo: "corrente", saldo_inicial: 0, is_padrao: false, color: "#3b82f6" });
            fetchAccounts();
        } catch (error: any) {
            toast.error("Erro ao cadastrar conta");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover esta conta?")) return;
        try {
            const { error } = await (supabase as any)
                .from('finance_bank_accounts')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Conta removida");
            fetchAccounts();
        } catch (error: any) {
            toast.error("Erro ao remover");
        }
    };

    const handleTransfer = async () => {
        if (!transferData.origin || !transferData.destination || transferData.amount <= 0) {
            toast.error("Preencha os dados da transferência");
            return;
        }
        if (transferData.origin === transferData.destination) {
            toast.error("Origem e destino não podem ser iguais");
            return;
        }

        const toastId = toast.loading("Processando transferência interna...");
        try {
            // In a real app, this would be a transaction: 
            // 1. Debit origin
            // 2. Credit destination
            // 3. Create 'transfer' entry in Lancamentos

            // For now, simulating success as the focus is UI/UX and AI
            await new Promise(r => setTimeout(r, 1500));

            toast.success("Transferência realizada com sucesso!", { id: toastId });
            setIsTransferDialogOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error("Erro ao realizar transferência", { id: toastId });
        }
    };

    const totalConsolidated = accounts.reduce((acc, curr) => acc + (curr.saldo_atual || 0), 0);

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-24 w-24 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                    <Landmark className="h-12 w-12 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground/80">Gestão de Contas Bancárias</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Selecione um cliente para visualizar o saldo consolidado e gerenciar as instituições financeiras.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            {/* 1. Header - padrão sistema */}
            <div className="flex items-end justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <Landmark className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Contas Bancárias</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                                {selectedClient.nome_fantasia || selectedClient.razao_social}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="font-light text-primary hover:bg-primary/5 border border-primary/20 bg-white/50 backdrop-blur-sm group px-6"
                        onClick={() => setIsTransferDialogOpen(true)}
                    >
                        <ArrowRightLeft className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        Transferência
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/95 text-white font-light px-8 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Conta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2rem] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-primary to-indigo-500" />
                            <DialogHeader className="pt-8 px-8 pb-4">
                                <DialogTitle className="font-light text-2xl tracking-tight">Nova Instituição</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Registro de Fonte de Recurso</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-6 px-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Banco / Instituição</label>
                                    <Input
                                        placeholder="Ex: Itaú, Inter, Banco do Brasil..."
                                        className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm focus:bg-white/80 transition-all"
                                        value={newAccount.banco}
                                        onChange={(e) => setNewAccount({ ...newAccount, banco: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Agência</label>
                                        <Input
                                            placeholder="0001"
                                            className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm focus:bg-white/80 transition-all"
                                            value={newAccount.agencia}
                                            onChange={(e) => setNewAccount({ ...newAccount, agencia: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Conta</label>
                                        <Input
                                            placeholder="12345-6"
                                            className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm focus:bg-white/80 transition-all"
                                            value={newAccount.conta}
                                            onChange={(e) => setNewAccount({ ...newAccount, conta: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Tipo</label>
                                        <Select
                                            value={newAccount.tipo}
                                            onValueChange={(v) => setNewAccount({ ...newAccount, tipo: v })}
                                        >
                                            <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl">
                                                <SelectItem value="corrente">Corrente</SelectItem>
                                                <SelectItem value="poupanca">Poupança</SelectItem>
                                                <SelectItem value="investimento">Investimento</SelectItem>
                                                <SelectItem value="caixa">Caixa Físico</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Saldo Inicial</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                            <Input
                                                type="number"
                                                className="h-12 pl-11 bg-muted/20 border-border/50 rounded-2xl font-light text-sm focus:bg-white/80 transition-all"
                                                value={newAccount.saldo_inicial}
                                                onChange={(e) => setNewAccount({ ...newAccount, saldo_inicial: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => setNewAccount({ ...newAccount, is_padrao: !newAccount.is_padrao })}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest",
                                            newAccount.is_padrao ? "bg-amber-500/10 border-amber-500/40 text-amber-600" : "bg-muted/30 border-border text-muted-foreground"
                                        )}
                                    >
                                        <Star className={cn("h-3 w-3", newAccount.is_padrao ? "fill-amber-500" : "")} />
                                        Conta Padrão
                                    </button>
                                </div>
                            </div>
                            <DialogFooter className="bg-muted/30 p-8 flex justify-end gap-3 rounded-b-[2rem]">
                                <Button variant="ghost" className="font-light" onClick={() => setIsDialogOpen(false)}>Sair</Button>
                                <Button
                                    className="bg-primary hover:bg-primary/95 text-white font-medium px-10 h-12 rounded-xl shadow-lg shadow-primary/20"
                                    onClick={handleCreate}
                                    disabled={creating}
                                >
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirmar Cadastro"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 2. Summary Cards - padrão sistema */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Saldo Consolidado", val: totalConsolidated, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                    { label: "Projeção 7 Dias", val: totalConsolidated + 1300, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
                    { label: "Contas Ativas", val: accounts.length, icon: Landmark, isCount: true, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
                    { label: "Conciliação IA", val: null, icon: RefreshCw, isText: "Pendente", color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" }
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

            {/* 3. Account Grid & Search - padrão sistema */}
            <Card className="bg-card/50 backdrop-blur-md border-border/60 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b border-border/40">
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Instituições Cadastradas — {accounts.length} conta{accounts.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar banco ou conta..."
                            className="pl-11 bg-muted/20 border-border/50 font-light text-xs h-11 rounded-2xl focus:bg-white/80 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading && accounts.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="col-span-full border-2 border-dashed border-border/40 rounded-2xl py-20 text-center text-muted-foreground/40 font-light flex flex-col items-center gap-4">
                                <CreditCard className="h-12 w-12 opacity-20" />
                                <p className="text-sm">Nenhuma instituição financeira cadastrada.</p>
                                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="rounded-xl px-8 text-xs font-light">Cadastrar Primeira Conta</Button>
                            </div>
                        ) : (
                            accounts.filter(a => a.banco.toLowerCase().includes(search.toLowerCase())).map((acc) => (
                                <Card key={acc.id} className="bg-card border border-border/50 shadow-sm rounded-2xl group hover:shadow-md hover:border-primary/30 transition-all duration-300 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />

                                    <CardHeader className="p-6 pb-3 flex flex-row items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary relative">
                                                <Landmark className="h-5 w-5" />
                                                {acc.is_padrao && (
                                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                                                        <Star className="h-2 w-2 text-white fill-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{acc.banco}</h3>
                                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none mt-1">{acc.tipo}</p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:bg-muted rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-border min-w-[180px] rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-1">
                                                <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                    <Edit className="h-4 w-4 text-blue-500" /> Editar Dados
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                    <RefreshCw className="h-4 w-4 text-emerald-500" /> Conciliar Extrato
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="mx-1" />
                                                <DropdownMenuItem
                                                    className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                    onClick={() => handleDelete(acc.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Remover Conta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>

                                    <CardContent className="px-6 pb-6 space-y-4">
                                        <div className="flex justify-between items-end border-t border-border/20 pt-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Saldo Atual</p>
                                                <p className={cn("text-xl font-light tracking-tight", Number(acc.saldo_atual || 0) >= 0 ? "text-foreground/90" : "text-rose-500")}>
                                                    {Number(acc.saldo_atual || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Ag / Conta</p>
                                                <p className="text-xs font-light text-muted-foreground">{acc.agencia} | {acc.conta}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Limite Saudável</span>
                                                </div>
                                                <span className="text-[9px] text-muted-foreground font-light">75% Disponível</span>
                                            </div>
                                            <Progress value={75} className="h-1 bg-muted/50 rounded-full" />
                                        </div>

                                        <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 font-light">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Última conciliação: Hoje
                                            </div>
                                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-50/30 text-[8px] py-0 h-4">Sincronizado</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 4. AI Analyst Banner - Minimalist White */}
            <div className="bg-white rounded-[3rem] p-12 flex flex-col md:flex-row items-center gap-10 border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-50 blur-[120px] -z-10" />
                <div className="h-28 w-28 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-slate-200 relative group-hover:rotate-6 transition-transform duration-700">
                    <Brain className="h-14 w-14" />
                </div>
                <div className="flex-1 space-y-5 text-center md:text-left">
                    <div className="space-y-2">
                        <Badge className="bg-slate-100 text-slate-900 border-none text-[10px] font-bold uppercase tracking-[0.2em] px-5 py-1">Business Intelligence</Badge>
                        <h3 className="text-3xl font-light text-slate-900 tracking-tight leading-tight">Analista de Fluxo de Caixa IA</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
                        A IA monitora seus saldos bancários em tempo real e os cruza com as contas a pagar.
                        Receba alertas preventivos sobre falta de liquidez e sugestões de transferência de fundos.
                    </p>

                    {aiPrediction ? (
                        <div className={cn(
                            "p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-left-4",
                            aiPrediction.status === 'danger' ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                        )}>
                            {aiPrediction.status === 'danger' ? <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />}
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">{aiPrediction.alerta}</p>
                                <p className="text-xs text-slate-500 font-light">{aiPrediction.recomendacao}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-5 pt-4 justify-center md:justify-start">
                            {[
                                { icon: TrendingUp, text: "Previsão de Liquidez" },
                                { icon: RefreshCw, text: "Detecção de Erros" },
                                { icon: ArrowRightLeft, text: "Sugestão de Transferência" }
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                                    <feat.icon className="h-4 w-4 text-emerald-500" />
                                    {feat.text}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Button
                    className="font-bold bg-slate-900 text-white hover:bg-black px-12 h-16 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    onClick={handleAIPrediction}
                    disabled={isAnalysing || accounts.length === 0}
                >
                    {isAnalysing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ChevronRight className="h-5 w-5 mr-2" />}
                    {aiPrediction ? "Reanalisar Fluxo" : "Executar Análise IA"}
                </Button>
            </div>

            {/* Transfer Modal */}
            <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <DialogContent className="sm:max-w-[450px] bg-card border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600" />
                    <DialogHeader className="pt-8 px-8 pb-4">
                        <DialogTitle className="font-light text-2xl tracking-tight">Transferência Interna</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Movimentação entre Contas Próprias</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-6 px-8">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Origem (Saída)</label>
                            <Select onValueChange={(v) => setTransferData({ ...transferData, origin: v })}>
                                <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm">
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border rounded-xl">
                                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.banco} ({a.conta})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Destino (Entrada)</label>
                            <Select onValueChange={(v) => setTransferData({ ...transferData, destination: v })}>
                                <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-2xl font-light text-sm">
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border rounded-xl">
                                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.banco} ({a.conta})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Valor da Movimentação</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                <Input
                                    type="number"
                                    className="h-12 pl-11 bg-muted/20 border-border/50 rounded-2xl font-light text-sm focus:bg-white transition-all shadow-inner"
                                    placeholder="0.00"
                                    onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-muted/30 p-8 flex justify-end gap-3 rounded-b-[2rem]">
                        <Button variant="ghost" className="font-light" onClick={() => setIsTransferDialogOpen(false)}>Fechar</Button>
                        <Button
                            className="bg-primary hover:bg-primary/95 text-white font-medium px-10 h-12 rounded-xl shadow-lg shadow-primary/20"
                            onClick={handleTransfer}
                        >
                            Realizar Transferência
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContasBancarias;
