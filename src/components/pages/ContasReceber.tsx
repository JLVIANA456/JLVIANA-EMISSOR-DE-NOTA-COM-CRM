import {
    ArrowUpCircle,
    Plus,
    Search,
    TrendingUp,
    Calendar,
    CheckCircle2,
    DollarSign,
    Loader2,
    Download,
    FileSearch,
    Brain,
    ChevronRight,
    Landmark,
    Scale,
    TrendingDown,
    ArrowDownCircle,
    Check,
    Edit,
    Trash2,
    MoreHorizontal,
    Filter,
    XCircle,
    Clock,
    ScanBarcode,
    PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { RevenueForm } from "../accounts-receivable/RevenueForm";
import { useAccountsReceivable } from "@/components/hooks/useAccountsReceivable";
import { analyzeARProofWithAI, generateCollectionMessage } from "@/components/services/openai";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ContasReceber = () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { records, loading, selectedClient, fetchRecords, createRecord, updateRecordStatus } = useAccountsReceivable();
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [matchResult, setMatchResult] = useState<any>(null);
    const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
    const [collectionMessage, setCollectionMessage] = useState("");
    const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pago":
            case "recebido":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-light px-2 py-0.5">Recebido</Badge>;
            case "pendente":
                return <Badge className="bg-amber-500/10 text-amber-500 border-none font-light px-2 py-0.5">Pendente</Badge>;
            case "atrasado":
                return <Badge className="bg-rose-500/10 text-rose-500 border-none font-light px-2 py-0.5">Atrasado</Badge>;
            default:
                return <Badge variant="outline" className="font-light px-2 py-0.5">{status || 'Pendente'}</Badge>;
        }
    };

    const handleAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalysing(true);
        const toastId = toast.loading("IA analisando comprovante e buscando correspondências...");

        try {
            const analysis = await analyzeARProofWithAI(file);

            // Lógica de Match: Procurar faturas pendentes que batam com o valor ou pagador
            const potentialMatch = records.find(r =>
                r.status !== 'pago' &&
                (Math.abs(Number(r.valor_liquido) - analysis.valor) < 1.0 ||
                    (r.clientes_sacados?.nome || "").toLowerCase().includes(analysis.pagador.toLowerCase()))
            );

            if (potentialMatch) {
                setMatchResult({
                    ...analysis,
                    fatura_correspondente: potentialMatch
                });
                setIsMatchDialogOpen(true);
                toast.success("Possível correspondência encontrada!", { id: toastId });
            } else {
                toast.info("Comprovante analisado, mas nenhuma fatura correspondente foi encontrada.", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error.message || "Erro na análise de IA", { id: toastId });
        } finally {
            setIsAnalysing(false);
            e.target.value = '';
        }
    };

    const handleConfirmMatch = async () => {
        if (!matchResult?.fatura_correspondente) return;

        try {
            await updateRecordStatus(matchResult.fatura_correspondente.id, 'pago');
            setIsMatchDialogOpen(false);
            setMatchResult(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGenerateCollection = async (record: any) => {
        setIsGeneratingMessage(true);
        const toastId = toast.loading("IA criando régua de cobrança personalizada...");

        try {
            const clientName = record.clientes_sacados?.nome || record.razao_social || "Cliente";
            const amount = Number(record.valor_liquido);
            const dueDate = record.vencimento ? new Date(record.vencimento).toLocaleDateString('pt-BR') : "N/A";

            const message = await generateCollectionMessage(clientName, amount, dueDate);
            setCollectionMessage(message);
            setIsCollectionDialogOpen(true);
            toast.success("Mensagem gerada com sucesso!", { id: toastId });
        } catch (error) {
            toast.error("Erro ao gerar mensagem", { id: toastId });
        } finally {
            setIsGeneratingMessage(false);
        }
    };

    const handleNewRevenue = async (data: any, installments: any[]) => {
        try {
            await createRecord(data, installments);
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const exportToExcel = () => {
        if (records.length === 0) {
            toast.error("Não há dados para exportar");
            return;
        }

        const exportData = records.map(record => ({
            Descrição: record.descricao,
            'Cliente / Faturado': record.clientes_sacados?.nome || record.razao_social || 'N/A',
            Vencimento: record.vencimento ? new Date(record.vencimento).toLocaleDateString('pt-BR') : '-',
            Valor: record.valor_liquido,
            Status: record.status || 'Pendente'
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Contas a Receber");
        writeFile(wb, `Contas_a_Receber_${selectedClient?.nome_fantasia || 'BPO'}.xlsx`);
        toast.success("Relatório gerado com sucesso!");
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                    <TrendingUp className="h-10 w-10 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground/80">Contas a Receber</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Selecione uma empresa para gerenciar recebimentos e faturas.
                    </p>
                </div>
            </div>
        );
    }

    const totalAReceber = records
        .filter(r => r.status?.toLowerCase() !== 'pago' && r.status?.toLowerCase() !== 'recebido')
        .reduce((acc, r) => acc + Number(r.valor_liquido || 0), 0);

    const totalRecebido = records
        .filter(r => r.status?.toLowerCase() === 'pago' || r.status?.toLowerCase() === 'recebido')
        .reduce((acc, r) => acc + Number(r.valor_liquido || 0), 0);

    const totalAtrasado = records
        .filter(r => r.status?.toLowerCase() !== 'pago' && r.status?.toLowerCase() !== 'recebido' && r.vencimento && new Date(r.vencimento) < new Date())
        .reduce((acc, r) => acc + Number(r.valor_liquido || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            {/* 1. Refined Header */}
            <div className="flex items-end justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Contas a Receber</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Landmark className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                                {selectedClient.nome_fantasia || selectedClient.razao_social}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="font-light text-primary hover:bg-primary/5 border border-primary/20 bg-white/50 backdrop-blur-sm px-6"
                        onClick={exportToExcel}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar XLSX
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="ai-upload-ar"
                            onChange={handleAIAnalysis}
                            disabled={isAnalysing}
                        />
                        <Button
                            variant="ghost"
                            className="font-light text-emerald-600 hover:bg-emerald-500/5 border border-emerald-500/20 bg-white/50 backdrop-blur-sm group px-6"
                            asChild
                        >
                            <label htmlFor="ai-upload-ar" className="cursor-pointer flex items-center">
                                {isAnalysing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Brain className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                )}
                                Conciliar via IA
                            </label>
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/95 text-white font-light px-8 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                                <Plus className="h-4 w-4 mr-2" /> Nova Receita
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-card border-none shadow-2xl sm:rounded-[2rem] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-emerald-400" />
                            <DialogHeader className="pt-8 px-8">
                                <DialogTitle className="font-light text-2xl tracking-tight text-foreground/90">
                                    Lançamento de Receita
                                </DialogTitle>
                            </DialogHeader>
                            <div className="px-8 pb-8">
                                <RevenueForm onSubmit={handleNewRevenue} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            {/* 2. Professional Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total em Aberto", val: totalAReceber, icon: DollarSign, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20", desc: "Faturamento a realizar" },
                    { label: "Recebido no Mês", val: totalRecebido, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20", desc: "Fluxo de caixa efetivado" },
                    { label: "Total Atrasado", val: totalAtrasado, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/20", desc: totalAtrasado > 0 ? "Revisar inadimplência" : "Tudo em dia" },
                    { label: "Previsão Real (30d)", val: totalAReceber * 0.95, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20", desc: "Ajustado por histórico" }
                ].map((card, i) => (
                    <Card key={i} className={cn("bg-card border shadow-sm p-6 overflow-hidden relative group transition-all duration-300 hover:shadow-md", card.border)}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">{card.label}</p>
                                <p className={cn("text-2xl font-light tracking-tight", card.color)}>
                                    {card.val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-light">{card.desc}</p>
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
                                placeholder="Filtrar por descrição ou cliente..."
                                className="pl-11 bg-muted/20 border-border/50 font-light text-xs h-11 rounded-2xl focus:bg-white/80 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Tabs defaultValue="all" onValueChange={setFilter} className="w-fit">
                            <TabsList className="bg-muted/40 border border-border/50 h-11 p-1 rounded-2xl backdrop-blur-sm">
                                <TabsTrigger value="all" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Todos</TabsTrigger>
                                <TabsTrigger value="pendente" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl text-amber-600/70 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-amber-500/20">Em Aberto</TabsTrigger>
                                <TabsTrigger value="pago" className="text-[9px] uppercase font-bold tracking-widest px-6 rounded-xl text-emerald-600/70 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-emerald-500/20">Pagos</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border-border/50 text-muted-foreground px-5 hover:bg-white transition-all"
                            onClick={() => fetchRecords()}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <TrendingDown className="h-3.5 w-3.5 mr-2 opacity-50" />}
                            Atualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/40 hover:bg-transparent bg-muted/5">
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] pl-8 py-5 text-muted-foreground/70">Vencimento</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Cliente / Descrição</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Categoria</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right py-5 text-muted-foreground/70">Valor</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-center py-5 text-muted-foreground/70">Status</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right pr-8 py-5 text-muted-foreground/70">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground mt-2 font-light">Carregando faturamento...</p>
                                    </TableCell>
                                </TableRow>
                            ) : records.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-light text-sm">
                                        Nenhum registro de faturamento encontrado para este cliente.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                records
                                    .filter(item => {
                                        const matchesFilter = filter === "all" ||
                                            (filter === "pendente" && item.status !== "pago") ||
                                            (filter === "pago" && item.status === "pago");
                                        const matchesSearch =
                                            (item.clientes_sacados?.nome || "").toLowerCase().includes(search.toLowerCase()) ||
                                            (item.descricao || "").toLowerCase().includes(search.toLowerCase());
                                        return matchesFilter && matchesSearch;
                                    })
                                    .map((record) => (
                                        <TableRow key={record.id} className="border-border/40 hover:bg-muted/10 transition-all group">
                                            <TableCell className="py-6 pl-8 font-light text-xs">
                                                {record.vencimento ? new Date(record.vencimento).toLocaleDateString('pt-BR') : '-'}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all border shadow-sm",
                                                        record.status === 'pago' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' :
                                                            'bg-blue-500/10 text-blue-600 border-blue-500/10'
                                                    )}>
                                                        <TrendingUp className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{record.clientes_sacados?.nome || 'N/A'}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground font-light">{record.descricao}</span>
                                                            {new Date(record.vencimento) < new Date() && record.status !== 'pago' && (
                                                                <Badge variant="outline" className="text-[8px] h-3.5 bg-rose-500/5 text-rose-500 border-rose-500/20 px-1 font-bold uppercase">Risco Alto</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/10 text-muted-foreground/60 uppercase tracking-tighter px-1.5 rounded-sm">
                                                    Recebimento
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6 text-right font-medium text-sm tracking-tight text-foreground/80">
                                                {Number(record.valor_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="py-6 text-center">{getStatusBadge(record.status)}</TableCell>
                                            <TableCell className="py-6 text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:bg-muted rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-border min-w-[200px] rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-1">
                                                        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-2">Gestão de Receita</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted" onClick={() => { }}>
                                                            <Edit className="h-4 w-4 text-blue-500" /> Detalhes / Editar
                                                        </DropdownMenuItem>
                                                        {record.status !== 'pago' && (
                                                            <>
                                                                <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted" onClick={() => updateRecordStatus(record.id, 'pago')}>
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Confirmar Recebimento
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted" onClick={() => handleGenerateCollection(record)}>
                                                                    <Brain className="h-4 w-4 text-amber-500" /> Gerar Cobrança IA
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                            <FileSearch className="h-4 w-4 text-primary" /> Ver Comprovante
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                                                            <Trash2 className="h-4 w-4" /> Estornar / Remover
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

            {/* 4. IA Insights Banner - Minimalist White */}
            <div className="bg-white rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-200 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 blur-[100px] -z-10" />
                <div className="h-24 w-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xl shadow-slate-200 relative group-hover:rotate-6 transition-transform duration-700">
                    <Brain className="h-12 w-12" />
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="space-y-1">
                        <Badge className="bg-slate-100 text-slate-900 border-none text-[10px] font-bold uppercase tracking-widest px-4">Conciliação Inteligente</Badge>
                        <h3 className="text-2xl font-light text-slate-900 tracking-tight">Potencialize seu Fluxo de Recebíveis</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
                        Nossa IA analisa comprovantes de pagamento, identifica pagadores e sugere baixas automáticas em segundos.
                        Além disso, gera réguas de cobrança personalizadas de acordo com o perfil de cada cliente.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Match Automático
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Régua de Cobrança
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Score de Crédito
                        </div>
                    </div>
                </div>
                <Button
                    className="font-bold bg-slate-900 text-white hover:bg-black px-10 h-14 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    asChild
                >
                    <label htmlFor="ai-upload-ar" className="cursor-pointer flex items-center">
                        Conciliar Comprovante
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </label>
                </Button>
            </div>

            {/* Match Suggestion Dialog */}
            <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                <DialogContent className="max-w-md bg-card border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
                    <DialogHeader className="pt-8 px-8">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                            <PartyPopper className="h-8 w-8" />
                        </div>
                        <DialogTitle className="font-light text-2xl tracking-tight">Correspondência Encontrada!</DialogTitle>
                        <DialogDescription className="text-sm font-light text-muted-foreground pt-2">
                            A IA identificou um comprovante que bate com uma fatura pendente. Deseja realizar a baixa automática?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mb-2">Dados do Comprovante</p>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span>{matchResult?.pagador}</span>
                                    <span className="text-emerald-500">{Number(matchResult?.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <ChevronRight className="h-6 w-6 text-muted-foreground/30 rotate-90" />
                            </div>

                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary/60 mb-2">Fatura Correspondente</p>
                                <div className="flex justify-between items-center text-sm font-medium text-foreground">
                                    <span>{matchResult?.fatura_correspondente?.clientes_sacados?.nome}</span>
                                    <span>{Number(matchResult?.fatura_correspondente?.valor_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-2">{matchResult?.fatura_correspondente?.descricao}</p>
                            </div>
                        </div>

                        {matchResult?.alerta && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <ScanBarcode className="h-4 w-4 text-amber-500 mt-0.5" />
                                <p className="text-[10px] text-amber-700 leading-tight">{matchResult.alerta}</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-muted/30 p-6 flex justify-end gap-3 rounded-b-[2rem]">
                        <Button variant="ghost" className="font-light" onClick={() => setIsMatchDialogOpen(false)}>Ignorar</Button>
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-light px-8" onClick={handleConfirmMatch}>
                            Confirmar Baixa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Collection Dialog */}
            <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
                <DialogContent className="max-w-md bg-card border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <DialogHeader className="pt-8 px-8">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                            <Brain className="h-8 w-8" />
                        </div>
                        <DialogTitle className="font-light text-2xl tracking-tight text-foreground/90">Cobrança Estratégica</DialogTitle>
                        <DialogDescription className="text-sm font-light text-muted-foreground pt-2">
                            Gerei uma mensagem personalizada para facilitar o recebimento desta fatura.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8">
                        <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 relative group">
                            <p className="text-sm text-foreground/80 font-light leading-relaxed italic">
                                "{collectionMessage}"
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute bottom-2 right-2 text-[10px] uppercase font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    navigator.clipboard.writeText(collectionMessage);
                                    toast.success("Copiado para o clipboard!");
                                }}
                            >
                                Copiar Texto
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/30 p-6 flex justify-end gap-3 rounded-b-[2rem]">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-light px-8" onClick={() => setIsCollectionDialogOpen(false)}>
                            Concluído
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ContasReceber;
