import { useState, useEffect } from "react";
import {
    ArrowUpCircle,
    Filter,
    Plus,
    Search,
    MoreHorizontal,
    Copy,
    CheckCircle2,
    XCircle,
    Calendar,
    Clock,
    DollarSign,
    Loader2,
    Download,
    FileSearch,
    Brain,
    ChevronRight,
    Landmark,
    Scale,
    TrendingUp,
    TrendingDown,
    ArrowDownCircle,
    Check,
    Edit,
    Trash2
} from "lucide-react";
import { analyzeAPBillWithAI } from "@/components/services/openai";
import { utils, writeFile } from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BillForm } from "../accounts-payable/BillForm";
import { APBill, BillStatus } from "@/types/accountsPayable";
import { useAccountsPayable } from "@/hooks/useAccountsPayable";
import { useAuth } from "@/components/contexts/AuthContext";

const ContasPagar = () => {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { bills, loading, fetchBills, createBill, updateBillStatus, selectedClient } = useAccountsPayable();
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiPreFill, setAiPreFill] = useState<any>(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    const handleAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setIsAnalysing(true);
        const toastId = toast.loading("IA analisando impostos e vencimentos...");

        try {
            const result = await analyzeAPBillWithAI(file);

            // Map AI result to BillForm structure
            const prefill = {
                descricao: `Pgto ${result.fornecedor}`,
                valor_bruto: result.valor_total,
                vencimento_primeira_parcela: result.data_vencimento,
                competencia_mes: new Date(result.data_vencimento).getUTCMonth() + 1,
                competencia_year: new Date(result.data_vencimento).getUTCFullYear(),
                codigo_barras: result.codigo_barras,
                alerta: result.alerta,
            };

            setAiPreFill(prefill);
            setIsDialogOpen(true);
            toast.success("Análise concluída! O formulário foi preenchido.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Erro na análise", { id: toastId });
        } finally {
            setIsAnalysing(false);
            e.target.value = ''; // Reset input
        }
    };

    const getStatusBadge = (status: BillStatus | string) => {
        switch (status) {
            case "pago":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-light px-2 py-0.5">Pago</Badge>;
            case "aguardando_aprovacao":
                return <Badge variant="outline" className="text-amber-500 border-amber-500/20 font-light px-2 py-0.5">Aguardando Aprovação</Badge>;
            case "aprovado":
                return <Badge variant="outline" className="text-blue-500 border-blue-500/20 font-light px-2 py-0.5">Aprovado</Badge>;
            case "atrasado":
                return <Badge variant="destructive" className="bg-primary/10 text-primary border-primary/20 font-light px-2 py-0.5">Atrasado</Badge>;
            default:
                return <Badge variant="secondary" className="font-light uppercase text-[10px] px-2 py-0.5">{status}</Badge>;
        }
    };

    const handleNewBill = async (data: any, installments: any[]) => {
        try {
            await createBill(data, installments);
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const exportToExcel = () => {
        if (bills.length === 0) {
            toast.error("Não há dados para exportar");
            return;
        }

        const exportData = bills.map(bill => ({
            Vencimento: bill.vencimento ? new Date(bill.vencimento).toLocaleDateString('pt-BR') : '-',
            Fornecedor: bill.fornecedores?.nome || 'N/A',
            Descrição: bill.descricao,
            Status: bill.status,
            'Valor Bruto': bill.valor_bruto,
            Retensões: bill.total_retencoes,
            'Valor Líquido': bill.valor_liquido,
            Parcelado: bill.parcelado ? 'Sim' : 'Não',
            Parcelas: bill.qtd_parcelas
        }));

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Contas a Pagar");
        writeFile(wb, `Contas_a_Pagar_${selectedClient?.nome_fantasia || 'BPO'}.xlsx`);
        toast.success("Relatório gerado com sucesso!");
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center text-muted-foreground shadow-inner">
                    <DollarSign className="h-10 w-10 opacity-20" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-foreground/80">Contas a Pagar</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Selecione uma empresa para gerenciar as obrigações financeiras e pagamentos.
                    </p>
                </div>
            </div>
        );
    }

    const totalPendente = bills
        .filter(b => b.status !== 'pago' && b.status !== 'cancelada')
        .reduce((acc, b) => acc + Number(b.valor_liquido), 0);

    const totalPago = bills
        .filter(b => b.status === 'pago')
        .reduce((acc, b) => acc + Number(b.valor_liquido), 0);

    const totalAtrasado = bills
        .filter(b => b.status !== 'pago' && b.status !== 'cancelada' && b.vencimento && new Date(b.vencimento) < new Date())
        .reduce((acc, b) => acc + Number(b.valor_liquido), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            {/* 1. Refined Header */}
            <div className="flex items-end justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <ArrowUpCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Contas a Pagar</h1>
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
                            id="ai-upload-ap"
                            onChange={handleAIAnalysis}
                            disabled={isAnalysing}
                        />
                        <Button
                            variant="ghost"
                            className="font-light text-emerald-600 hover:bg-emerald-500/5 border border-emerald-500/20 bg-white/50 backdrop-blur-sm group px-6"
                            asChild
                        >
                            <label htmlFor="ai-upload-ap" className="cursor-pointer flex items-center">
                                {isAnalysing ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Brain className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                )}
                                Lançar via IA
                            </label>
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setAiPreFill(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/95 text-white font-light px-8 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]">
                                <Plus className="h-4 w-4 mr-2" /> Novo Registro
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-card border-none shadow-2xl sm:rounded-[2rem] overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-emerald-400" />
                            <DialogHeader className="pt-8 px-8">
                                <DialogTitle className="font-light text-2xl tracking-tight text-foreground/90">
                                    Lançamento de Conta a Pagar
                                </DialogTitle>
                            </DialogHeader>
                            <div className="px-8 pb-8">
                                <BillForm onSubmit={handleNewBill} initialData={aiPreFill} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* AI Analysis Dropzone - High End Aesthetic */}
            {
                !isDialogOpen && (
                    <div
                        className={`
                        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 group
                        ${isAnalysing ? 'border-primary bg-primary/5 py-12' : 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 py-10'}
                    `}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleAIAnalysis}
                            disabled={isAnalysing}
                        />
                        <div className="flex flex-col items-center justify-center text-center px-4">
                            <div className={`
                            h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110
                            ${isAnalysing ? 'bg-primary/20 animate-pulse' : 'bg-slate-100'}
                        `}>
                                {isAnalysing ? (
                                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                                ) : (
                                    <Brain className="h-7 w-7 text-slate-600" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-light tracking-tight">
                                    {isAnalysing ? "IA analisando seu documento..." : "Arraste sua nota fiscal ou boleto aqui"}
                                </h3>
                                <p className="text-xs text-muted-foreground font-light max-w-sm mx-auto">
                                    A nossa inteligência artificial irá extrair automaticamente o fornecedor, valor, vencimento e impostos para você.
                                </p>
                            </div>
                            {!isAnalysing && (
                                <div className="mt-4 flex gap-2">
                                    <Badge variant="outline" className="bg-white/50 border-emerald-500/20 text-[10px] uppercase tracking-wider font-light">
                                        PNG, JPG, WEBP
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/50 border-primary/20 text-[10px] uppercase tracking-wider font-light">
                                        Extração Instantânea
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* 2. Professional Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total em Aberto", val: totalPendente, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20", desc: "Aguardando aprovação ou pagamento" },
                    { label: "Pago no Mês", val: totalPago, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/20", desc: "Efetuado com sucesso" },
                    { label: "Total Atrasado", val: totalAtrasado, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/5", border: "border-rose-500/20", desc: totalAtrasado > 0 ? "Revisar urgências" : "Nenhuma pendência crítica" },
                    { label: "Projetado (30d)", val: totalPendente * 1.2, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20", desc: "Estimativa de fluxo de saída" }
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
                                placeholder="Filtrar por fornecedor ou descrição..."
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
                            onClick={() => fetchBills()}
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
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Fornecedor / Descrição</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] py-5 text-muted-foreground/70">Categoria</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right py-5 text-muted-foreground/70">Valor Bruto</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right py-5 text-muted-foreground/70">Retenções</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right py-5 text-muted-foreground/70">Valor Líquido</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-center py-5 text-muted-foreground/70">Status</TableHead>
                                <TableHead className="font-bold uppercase text-[9px] tracking-[0.2em] text-right pr-8 py-5 text-muted-foreground/70">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground mt-2 font-light">Carregando lançamentos...</p>
                                    </TableCell>
                                </TableRow>
                            ) : bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground font-light text-sm">
                                        Nenhum lançamento encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills
                                    .filter(item => {
                                        const matchesFilter = filter === "all" ||
                                            (filter === "pendente" && item.status !== "pago") ||
                                            (filter === "pago" && item.status === "pago");
                                        const matchesSearch =
                                            (item.fornecedores?.nome || "").toLowerCase().includes(search.toLowerCase()) ||
                                            (item.descricao || "").toLowerCase().includes(search.toLowerCase());
                                        return matchesFilter && matchesSearch;
                                    })
                                    .map((item) => (
                                        <TableRow key={item.id} className="border-border/40 hover:bg-muted/10 transition-all group">
                                            <TableCell className="py-6 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-foreground/80">
                                                        {item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : '-'}
                                                    </span>
                                                    {item.parcelado && (
                                                        <span className="text-[9px] text-muted-foreground tracking-tighter italic">({item.qtd_parcelas}x Parcelas)</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all border shadow-sm",
                                                        item.status === 'pago' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' :
                                                            'bg-amber-500/10 text-amber-600 border-amber-500/10'
                                                    )}>
                                                        <ArrowDownCircle className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{item.fornecedores?.nome || 'N/A'}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground font-light">{item.descricao}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Badge variant="outline" className="text-[9px] h-4 font-bold border-muted-foreground/10 text-muted-foreground/60 uppercase tracking-tighter px-1.5 rounded-sm">
                                                    Financeiro
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-6 text-right font-light text-xs">
                                                {Number(item.valor_bruto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="py-6 text-right font-light text-xs text-amber-600">
                                                {item.total_retencoes > 0 ?
                                                    Number(item.total_retencoes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
                                                    '-'}
                                            </TableCell>
                                            <TableCell className="py-6 text-right font-medium text-sm tracking-tight text-foreground/80">
                                                {Number(item.valor_liquido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="py-6 text-center">
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="py-6 text-right pr-8">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:bg-muted rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-border min-w-[180px] rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-1">
                                                        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-2">Gestão de Conta</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted" onClick={() => { }}>
                                                            <Edit className="h-4 w-4 text-blue-500" /> Detalhes / Editar
                                                        </DropdownMenuItem>
                                                        {item.status === 'aguardando_aprovacao' && (
                                                            <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted" onClick={() => updateBillStatus(item.id, 'aprovado')}>
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Aprovar Pagamento
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors hover:bg-muted">
                                                            <FileSearch className="h-4 w-4 text-primary" /> Anexar / Ver NF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="mx-1" />
                                                        <DropdownMenuItem className="cursor-pointer gap-3 font-medium text-xs p-3 rounded-xl transition-colors text-rose-500 hover:bg-rose-50 hover:text-rose-600">
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
                        <Badge className="bg-slate-100 text-slate-900 border-none text-[10px] font-bold uppercase tracking-widest px-4">Análise Fiscal Preditiva</Badge>
                        <h3 className="text-2xl font-light text-slate-900 tracking-tight">Gestão Inteligente de Obrigações</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl">
                        Nossa IA detecta automaticamente vencimentos, extrai códigos de barras e identifica fornecedores
                        apenas lendo a imagem do boleto ou nota fiscal. Reduza em até 95% o erro manual no preenchimento
                        de suas contas a pagar.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Leitura OCR Avançada
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Detecção de Juros
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Check className="h-4 w-4 text-emerald-500" /> Agendamento Smart
                        </div>
                    </div>
                </div>
                <Button
                    className="font-bold bg-slate-900 text-white hover:bg-black px-10 h-14 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shrink-0"
                    asChild
                >
                    <label htmlFor="ai-upload-ap" className="cursor-pointer flex items-center">
                        Iniciar Análise IA
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </label>
                </Button>
            </div>
        </div >
    );
};

export default ContasPagar;
