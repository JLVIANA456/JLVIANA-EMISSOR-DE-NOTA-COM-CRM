import { useState, useEffect, useRef } from "react";
import {
    Plus, Filter, Calendar, Wallet, Search, Download, Upload, MoreHorizontal,
    Edit, Trash2, CheckCircle2, XCircle, Clock, Brain, Receipt, Check, Repeat, FileText,
    TrendingUp, TrendingDown, Landmark, Scale, Info, ChevronRight, FilterX, Loader2
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/components/integrations/supabase/client";
import { analyzeReceiptWithAI, AIAnalysisResult } from "@/components/services/openai";
import { cn } from "@/lib/utils";

const Lancamentos = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Summary
    const [summary, setSummary] = useState({ entradas: 0, saidas: 0, saldo: 0 });

    // Dialog & Form Local States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        id: "",
        data: new Date().toISOString().split('T')[0],
        descricao: "",
        valor: 0,
        tipo: 'saida',
        categoria_id: "",
        bank_account_id: "",
        status: 'pendente' as 'pendente' | 'efetivado',
    });

    const fetchCategories = async () => {
        if (!selectedClient) return;
        const { data } = await (supabase as any)
            .from('finance_categories')
            .select('*')
            .eq('empresa_id', selectedClient.id)
            .eq('ativo', true);
        if (data) setCategories(data);
    };

    const fetchBankAccounts = async () => {
        if (!selectedClient) return;
        const { data } = await (supabase as any)
            .from('finance_bank_accounts')
            .select('*')
            .eq('empresa_id', selectedClient.id);
        if (data) setBankAccounts(data);
    };

    const fetchTransactions = async () => {
        if (!selectedClient) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('finance_transactions')
                .select(`
                    *,
                    finance_categories (nome, id),
                    finance_bank_accounts (banco, conta, id)
                `)
                .eq('empresa_id', selectedClient.id)
                .order('data', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
            calculateSummary(data || []);
        } catch (error: any) {
            console.error('Error fetching transactions:', error.message);
            toast.error("Erro ao carregar lançamentos");
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data: any[]) => {
        const entradas = data
            .filter(t => t.tipo === 'entrada')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);
        const saidas = data
            .filter(t => t.tipo === 'saida')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);
        setSummary({ entradas, saidas, saldo: entradas - saidas });
    };

    useEffect(() => {
        if (selectedClient) {
            fetchTransactions();
            fetchCategories();
            fetchBankAccounts();
        }
    }, [selectedClient]);

    const handleSave = async () => {
        if (!selectedClient) return;
        setIsSaving(true);
        try {
            const payload = {
                ...form,
                tenant_id: selectedClient.tenant_id,
                empresa_id: selectedClient.id,
                valor: Number(form.valor)
            };

            const { error } = form.id
                ? await (supabase as any).from('finance_transactions').update(payload).eq('id', form.id)
                : await (supabase as any).from('finance_transactions').insert([payload]);

            if (error) throw error;
            toast.success(form.id ? "Lançamento atualizado!" : "Lançamento registrado!");
            setIsDialogOpen(false);
            resetForm();
            fetchTransactions();
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            id: "",
            data: new Date().toISOString().split('T')[0],
            descricao: "",
            valor: 0,
            tipo: 'saida',
            categoria_id: "",
            bank_account_id: "",
            status: 'pendente',
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este lançamento?")) return;
        const { error } = await (supabase as any)
            .from('finance_transactions')
            .delete()
            .eq('id', id);

        if (error) toast.error("Erro ao excluir");
        else {
            toast.success("Excluído com sucesso");
            fetchTransactions();
        }
    };

    const handleAILoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        toast.promise(analyzeReceiptWithAI(file), {
            loading: 'IA analisando nota fiscal...',
            success: (data: AIAnalysisResult) => {
                const suggestedCat = categories.find(c =>
                    c.nome.toLowerCase().includes(data.categoria_sugerida.toLowerCase())
                );

                setForm(prev => ({
                    ...prev,
                    descricao: data.descricao,
                    valor: data.valor,
                    data: data.data,
                    tipo: data.tipo,
                    categoria_id: suggestedCat?.id || prev.categoria_id
                }));
                setIsAnalyzing(false);
                return "Dados extraídos com sucesso!";
            },
            error: (err) => {
                setIsAnalyzing(false);
                return "Erro na análise de IA: " + err.message;
            }
        });
    };

    const toggleStatus = async (transaction: any) => {
        const newStatus = transaction.status === 'pendente' ? 'efetivado' : 'pendente';
        const { error } = await (supabase as any)
            .from('finance_transactions')
            .update({ status: newStatus })
            .eq('id', transaction.id);

        if (error) toast.error("Erro ao alterar status");
        else fetchTransactions();
    };

    const filteredTransactions = transactions.filter(tr => {
        const matchesFilter = filter === "all" || (filter === "gains" && tr.tipo === "entrada") || (filter === "expenses" && tr.tipo === "saida");
        const matchesSearch = tr.descricao.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                    <Wallet className="h-10 w-10 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground/80">Gestão de Fluxo</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Selecione uma empresa para gerenciar o movimento financeiro em tempo real.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            {/* 1. Refined Header */}
            <div className="flex items-end justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <Scale className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Fluxo de Caixa</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Landmark className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                                {selectedClient.nome_fantasia || selectedClient.razao_social}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="ai-upload"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAILoad}
                        accept="image/*"
                    />
                    <Button
                        variant="ghost"
                        className="font-light text-primary hover:bg-primary/5 border border-primary/20 bg-white/50 backdrop-blur-sm group px-6"
                        onClick={() => {
                            setIsDialogOpen(true);
                            setTimeout(() => fileInputRef.current?.click(), 100);
                        }}
                    >
                        <Brain className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Extrair com IA
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/95 text-white font-light px-8 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                                <Plus className="h-4 w-4 mr-2" /> Novo Registro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-none shadow-2xl sm:rounded-[2rem] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-emerald-400" />
                            <DialogHeader className="pt-8 px-8">
                                <DialogTitle className="font-light text-2xl tracking-tight text-foreground/90">
                                    {form.id ? 'Ajustar Lançamento' : 'Lançamento Inteligente'}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-8">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">O que foi transacionado?</Label>
                                    <div className="relative group">
                                        <Input
                                            placeholder="Ex: Assinatura Softwares PJ..."
                                            className="bg-muted/30 border-muted-foreground/10 font-light h-12 text-sm focus:ring-1 focus:ring-primary/30 transition-all"
                                            value={form.descricao}
                                            onChange={e => setForm({ ...form, descricao: e.target.value })}
                                        />
                                        {isAnalyzing && (
                                            <div className="absolute right-3 top-3.5 flex items-center gap-2">
                                                <span className="text-[10px] text-primary animate-pulse">Lendo Nota...</span>
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Natureza</Label>
                                        <div className="flex gap-2 p-1.5 bg-muted/20 rounded-xl border border-muted-foreground/5">
                                            <button
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${form.tipo === 'entrada' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                                                onClick={() => setForm({ ...form, tipo: 'entrada' })}
                                            >
                                                <TrendingUp className="h-3.5 w-3.5" /> Receita
                                            </button>
                                            <button
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${form.tipo === 'saida' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                                                onClick={() => setForm({ ...form, tipo: 'saida' })}
                                            >
                                                <TrendingDown className="h-3.5 w-3.5" /> Despesa
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Data de Vencimento</Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="date"
                                                className="bg-muted/30 border-muted-foreground/10 font-light h-10 pl-10"
                                                value={form.data}
                                                onChange={e => setForm({ ...form, data: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Valor da Operação</Label>
                                        <div className="relative group">
                                            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-light">R$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0,00"
                                                className="bg-muted/30 border-muted-foreground/10 font-medium h-10 pl-9 text-lg"
                                                value={form.valor || ""}
                                                onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Plano de Contas</Label>
                                        <Select
                                            value={form.categoria_id}
                                            onValueChange={val => setForm({ ...form, categoria_id: val })}
                                        >
                                            <SelectTrigger className="bg-muted/30 border-muted-foreground/10 font-light h-10">
                                                <SelectValue placeholder="Classificar como..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl">
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id} className="text-xs font-light">{cat.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Origem / Destino Bancário</Label>
                                    <Select
                                        value={form.bank_account_id}
                                        onValueChange={val => setForm({ ...form, bank_account_id: val })}
                                    >
                                        <SelectTrigger className="bg-muted/30 border-muted-foreground/10 font-light h-12 rounded-xl">
                                            <SelectValue placeholder="Selecione a conta de movimentação..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-border rounded-xl">
                                            {bankAccounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id} className="text-sm font-light">
                                                    {acc.banco} - {acc.conta}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <DialogFooter className="bg-muted/10 p-8 border-t border-muted/20">
                                <Button variant="ghost" className="font-light text-muted-foreground hover:text-foreground" onClick={() => setIsDialogOpen(false)}>Descartar</Button>
                                <Button className="bg-primary hover:bg-primary/95 font-light px-12 h-12 rounded-xl shadow-xl shadow-primary/10 transition-all active:scale-95" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    {form.id ? 'Atualizar Dados' : 'Concluir Lançamento'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 2. Professional Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Receitas", val: summary.entradas, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                    { label: "Despesas", val: summary.saidas, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/20" },
                    { label: "Saldo Operacional", val: summary.saldo, icon: Scale, color: summary.saldo >= 0 ? "text-primary" : "text-rose-600", bg: "bg-primary/5", border: "border-primary/20" },
                    { label: "Eficiência", val: `${summary.entradas > 0 ? ((summary.saldo / summary.entradas) * 100).toFixed(1) : 0}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" }
                ].map((card, i) => (
                    <Card key={i} className={cn("bg-card border shadow-sm p-6 overflow-hidden relative group transition-all duration-300 hover:shadow-md", card.border)}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">{card.label}</p>
                                <p className={cn("text-2xl font-light tracking-tight", card.color)}>
                                    {typeof card.val === 'number' ? card.val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : card.val}
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

            {/* 3. Modern Table Area */}
            <Card className="bg-card/50 backdrop-blur-md border-border/60 shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-8 px-8 border-b border-border/40">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                placeholder="Filtrar por descrição..."
                                className="pl-11 bg-muted/20 border-border/50 font-light text-xs h-11 rounded-2xl focus:bg-white/80 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="all" onValueChange={setFilter} className="w-fit">
                            <TabsList className="bg-muted/40 border border-border/50 h-11 p-1 rounded-2xl backdrop-blur-sm">
                                <TabsTrigger value="all" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                <TabsTrigger value="gains" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl text-emerald-600/70 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-emerald-500/20">Entradas</TabsTrigger>
                                <TabsTrigger value="expenses" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl text-rose-600/70 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-rose-500/20">Saídas</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border-border/50 text-muted-foreground px-5 hover:bg-white transition-all">
                            <Download className="h-3.5 w-3.5 mr-2 opacity-50" /> Exportar Dados
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="min-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/40 hover:bg-transparent bg-muted/5">
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] pl-8 py-5 text-muted-foreground/70">Data Lançamento</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Detalhe da Transação</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Centro de Origem</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right py-5 text-muted-foreground/70">Impacto Financeiro</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-center py-5 text-muted-foreground/70">Conciliação</TableHead>
                                    <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right pr-8 py-5 text-muted-foreground/70">Opções</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                                <span className="font-light text-xs text-muted-foreground uppercase tracking-widest">Sincronizando Banco...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <FilterX className="h-12 w-12 text-muted-foreground" />
                                                <p className="font-light text-sm uppercase tracking-widest">Nenhum registro encontrado</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tr) => (
                                        <TableRow key={tr.id} className="border-border/40 hover:bg-muted/10 transition-all group">
                                            <TableCell className="py-6 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-foreground/80">
                                                        {new Date(tr.data).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-tighter mt-1">Competência Fiscal</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all border shadow-sm",
                                                        tr.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' :
                                                            tr.tipo === 'saida' ? 'bg-rose-500/10 text-rose-600 border-rose-500/10' :
                                                                'bg-blue-500/10 text-blue-600 border-blue-500/10'
                                                    )}>
                                                        {tr.tipo === 'entrada' ? <TrendingUp className="h-5 w-5" /> :
                                                            tr.tipo === 'saida' ? <TrendingDown className="h-5 w-5" /> :
                                                                <Repeat className="h-5 w-5" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{tr.descricao}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/10 text-muted-foreground/60 uppercase tracking-tighter px-1.5 rounded-sm">
                                                                {tr.finance_categories?.nome || "Outros"}
                                                            </Badge>
                                                            {tr.documento_url && <FileText className="h-3 w-3 text-primary/40" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground/70">
                                                    <div className="h-7 w-7 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-center">
                                                        <Landmark className="h-3.5 w-3.5 opacity-50" />
                                                    </div>
                                                    <span className="max-w-[120px] truncate">{tr.finance_bank_accounts?.banco || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(
                                                "py-6 text-right font-medium text-sm tracking-tight",
                                                tr.tipo === 'entrada' ? 'text-emerald-600' : 'text-foreground/80'
                                            )}>
                                                {tr.tipo === 'saida' ? "-" : tr.tipo === 'entrada' ? "+" : ""}
                                                {Number(tr.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="py-6 text-center">
                                                <button
                                                    onClick={() => toggleStatus(tr)}
                                                    className={cn(
                                                        "mx-auto h-9 w-9 rounded-2xl flex items-center justify-center transition-all border",
                                                        tr.status === 'efetivado'
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-emerald-500'
                                                            : 'bg-white text-muted-foreground/30 border-muted/30 hover:border-primary/30 hover:text-primary'
                                                    )}
                                                    title={tr.status === 'efetivado' ? "Pago/Recebido" : "Pendente"}
                                                >
                                                    <Check className={cn("h-4.5 w-4.5", tr.status === 'efetivado' ? "stroke-[3px]" : "stroke-[2px]")} />
                                                </button>
                                            </TableCell>
                                            <TableCell className="py-6 text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:bg-muted rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-border min-w-[180px] rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-1">
                                                        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-2">Gestão de Registro</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted"
                                                            onClick={() => {
                                                                setForm({
                                                                    id: tr.id,
                                                                    data: tr.data,
                                                                    descricao: tr.descricao,
                                                                    valor: tr.valor,
                                                                    tipo: tr.tipo,
                                                                    categoria_id: tr.categoria_id || "",
                                                                    bank_account_id: tr.bank_account_id || "",
                                                                    status: tr.status,
                                                                });
                                                                setIsDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-500" /> Detalhes / Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted"
                                                            onClick={() => toggleStatus(tr)}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Alternar Status
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                                            onClick={() => handleDelete(tr.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Remover Registro
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* 4. IA Insights Banner - Minimalist White */}
            <div className="bg-white rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 blur-[100px] -z-10" />
                <div className="h-24 w-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-slate-200 relative group-hover:rotate-6 transition-transform duration-700">
                    <Brain className="h-12 w-12" />
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                        <Badge className="bg-slate-100 text-slate-900 border-none text-[10px] font-bold uppercase tracking-widest px-4">Tecnologia OpenAI Ativa</Badge>
                        <h3 className="text-2xl font-light text-slate-900 tracking-tight">Otimize 90% do seu tempo com IA</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
                        Nossa inteligência artificial não apenas lê seus documentos, ela compreende a natureza financeira de cada operação.
                        Ao subir um comprovante, o sistema sugere automaticamente a classificação contábil, evitando erros manuais e garantindo
                        um DRE sempre impecável.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Extração OCR
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Categorização Smart
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Preenchimento Auto
                        </div>
                    </div>
                </div>
                <Button
                    className="font-bold bg-slate-900 text-white hover:bg-black px-10 h-14 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    onClick={() => {
                        setIsDialogOpen(true);
                        setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                >
                    Começar Análise IA
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div >
    );
};

export default Lancamentos;
