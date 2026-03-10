import { useState, useEffect } from "react";
import {
    Tag, Plus, Trash2, Loader2, BookOpen, Wand2, Receipt, Wallet,
    ChevronDown, ChevronRight, Sparkles, TrendingUp, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/components/integrations/supabase/client";
import { defaultCategoriesRaw } from "@/components/finance/DefaultCategories";
import { generateNicheCategoriesWithAI } from "@/components/services/openai";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const Categorias = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"receber" | "pagar">("pagar");
    const [parentId, setParentId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [niche, setNiche] = useState("");
    const [suggesting, setSuggesting] = useState(false);

    const fetchCategories = async () => {
        if (!selectedClient) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('finance_categories')
                .select('*')
                .eq('empresa_id', selectedClient.id)
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error: any) {
            console.error('Error fetching categories:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [selectedClient]);

    const handleCreate = async () => {
        if (!newName || !selectedClient) return;
        setCreating(true);
        try {
            const { error } = await (supabase as any)
                .from('finance_categories')
                .insert([{
                    nome: newName,
                    tipo: newType,
                    parent_id: parentId,
                    tenant_id: selectedClient.tenant_id || null,
                    empresa_id: selectedClient.id,
                    ativo: true
                }]);

            if (error) throw error;
            toast.success("Categoria criada!");
            setNewName("");
            setParentId(null);
            fetchCategories();
        } catch (error: any) {
            toast.error("Erro ao criar categoria: " + error.message);
        } finally {
            setCreating(false);
        }
    };

    const handleSeedDefaultCategories = async () => {
        if (!selectedClient) return;
        setSeeding(true);

        try {
            for (const item of defaultCategoriesRaw) {
                // Create Parent
                const { data: parentData, error: parentError } = await (supabase as any)
                    .from('finance_categories')
                    .insert([{
                        nome: item.name,
                        tipo: item.type,
                        tenant_id: selectedClient.tenant_id || null,
                        empresa_id: selectedClient.id,
                        ativo: true
                    }])
                    .select();

                if (parentError) {
                    console.error("Error creating parent category:", parentError);
                    continue;
                }

                if (!parentData || parentData.length === 0) continue;
                const parentId = parentData[0].id;

                // Create Subs
                if (item.sub) {
                    for (const sub of item.sub) {
                        const { data: subData, error: subError } = await (supabase as any)
                            .from('finance_categories')
                            .insert([{
                                nome: sub.name,
                                tipo: item.type,
                                parent_id: parentId,
                                tenant_id: selectedClient.tenant_id || null,
                                empresa_id: selectedClient.id,
                                ativo: true
                            }])
                            .select();

                        if (subError) {
                            console.error("Error creating sub category:", subError);
                            continue;
                        }

                        if (!subData || subData.length === 0) continue;
                        const subId = subData[0].id;

                        // Create Sub-Subs
                        if (sub.sub && sub.sub.length > 0) {
                            const subItems = sub.sub.map((sName: string) => ({
                                nome: sName,
                                tipo: item.type,
                                parent_id: subId,
                                tenant_id: selectedClient.tenant_id || null,
                                empresa_id: selectedClient.id,
                                ativo: true
                            }));

                            const { error: finalError } = await (supabase as any)
                                .from('finance_categories')
                                .insert(subItems);

                            if (finalError) {
                                console.error("Error creating sub-sub categories:", finalError);
                            }
                        }
                    }
                }
            }
            toast.success('Plano de contas gerado com sucesso!');
            fetchCategories();
        } catch (error: any) {
            console.error("Seed error:", error);
            toast.error('Erro ao gerar categorias padrão: ' + error.message);
        } finally {
            setSeeding(false);
        }
    };

    const handleSuggestAI = async () => {
        if (!selectedClient || !niche) return;
        setSuggesting(true);
        const toastId = toast.loading(`IA criando categorias para ${niche}...`);

        try {
            const result = await generateNicheCategoriesWithAI(niche, selectedClient.id);

            if (!result || !result.categories) {
                throw new Error("Resposta da IA inválida");
            }

            for (const item of result.categories) {
                // Create Parent
                const { data: parentData, error: parentError } = await (supabase as any)
                    .from('finance_categories')
                    .insert([{
                        nome: item.name,
                        tipo: item.type,
                        tenant_id: selectedClient.tenant_id,
                        empresa_id: selectedClient.id,
                        ativo: true
                    }])
                    .select();

                if (parentError) continue;
                const parentId = parentData?.[0]?.id;
                if (!parentId) continue;

                // Create Subs
                if (item.sub) {
                    for (const sub of item.sub) {
                        const { data: subData, error: subError } = await (supabase as any)
                            .from('finance_categories')
                            .insert([{
                                nome: sub.name,
                                tipo: item.type,
                                parent_id: parentId,
                                tenant_id: selectedClient.tenant_id,
                                empresa_id: selectedClient.id,
                                ativo: true
                            }])
                            .select();

                        if (subError) continue;
                        const subId = subData?.[0]?.id;
                        if (!subId) continue;

                        // Create Sub-Subs
                        if (sub.sub && sub.sub.length > 0) {
                            const subItems = sub.sub.map((sName: string) => ({
                                nome: sName,
                                tipo: item.type,
                                parent_id: subId,
                                tenant_id: selectedClient.tenant_id,
                                empresa_id: selectedClient.id,
                                ativo: true
                            }));

                            await (supabase as any).from('finance_categories').insert(subItems);
                        }
                    }
                }
            }

            toast.success(`Plano de contas para ${niche} gerado pela IA!`, { id: toastId });
            setNiche("");
            fetchCategories();
        } catch (error: any) {
            toast.error("Erro ao sugerir categorias: " + error.message, { id: toastId });
        } finally {
            setSuggesting(false);
        }
    };

    const buildTree = (cats: any[]) => {
        const map: any = {};
        cats.forEach(cat => map[cat.id] = { ...cat, children: [] });
        const roots: any[] = [];
        cats.forEach(cat => {
            if (cat.parent_id) {
                if (map[cat.parent_id]) {
                    map[cat.parent_id].children.push(map[cat.id]);
                } else {
                    roots.push(map[cat.id]);
                }
            } else {
                roots.push(map[cat.id]);
            }
        });
        return roots;
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover esta categoria?")) return;
        try {
            const { error } = await (supabase as any)
                .from('finance_categories')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Removida com sucesso");
            fetchCategories();
        } catch (error: any) {
            toast.error("Erro ao remover");
        }
    };

    const CategoryNode = ({ node }: { node: any }) => {
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className={`transition-all duration-300 border-b border-border/5 last:border-0 ${node.parent_id ? 'bg-muted/5' : ''}`}>
                {hasChildren ? (
                    <AccordionItem value={node.id} className="border-none">
                        <div className="flex items-center group hover:bg-muted/30 transition-colors pr-6">
                            <AccordionTrigger className="hover:no-underline py-4 pl-6 flex-1 [&>svg]:hidden">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-9 w-9 rounded-2xl flex items-center justify-center transition-all border shadow-sm",
                                        !node.parent_id ? "bg-primary text-white shadow-primary/20 border-primary/10" : "bg-muted text-muted-foreground border-border/50"
                                    )}>
                                        {!node.parent_id ? <Receipt className="h-4 w-4" /> : <ChevronRight className="h-3 w-3" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className={cn(
                                            "text-sm tracking-tight",
                                            !node.parent_id ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                                        )}>
                                            {node.nome}
                                        </span>
                                        {!node.parent_id && (
                                            <div className="flex items-center gap-1.5 opacity-60 mt-0.5">
                                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold uppercase tracking-tighter">
                                                    {node.children.length} Sub-itens
                                                </Badge>
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] h-3.5 px-1 font-bold uppercase tracking-tighter",
                                                    node.tipo === 'receber' ? "border-emerald-500/20 text-emerald-600" : "border-rose-500/20 text-rose-600"
                                                )}>
                                                    {node.tipo === 'receber' ? 'Receita' : 'Despesa'}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground ml-auto group-data-[state=open]:rotate-180 transition-transform">
                                        <ChevronDown className="h-4 w-4" />
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg" onClick={() => handleDelete(node.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <AccordionContent className="pl-12 pt-0 pb-2 border-l-2 border-primary/5 ml-10 space-y-px">
                            {node.children.map((child: any) => (
                                <CategoryNode key={child.id} node={child} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ) : (
                    <div className="flex items-center group hover:bg-muted/30 transition-colors pr-6 py-4 pl-6">
                        <div className="flex items-center gap-4 flex-1">
                            <div className={cn(
                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all border",
                                node.tipo === 'receber' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                            )}>
                                {node.tipo === 'receber' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-light text-foreground/80 group-hover:text-foreground">
                                    {node.nome}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-muted-foreground/30 tracking-widest mt-0.5">Analítico</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn(
                                "font-bold text-[9px] uppercase tracking-widest border-border/50 opacity-40 group-hover:opacity-100 transition-opacity",
                                node.tipo === 'receber' ? 'text-emerald-500' : 'text-rose-500'
                            )}>
                                {node.tipo}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-lg" onClick={() => handleDelete(node.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Tag className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-light tracking-tight text-foreground">Selecione um Cliente</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Para gerenciar o plano de contas, selecione um cliente BPO no cabeçalho.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                        <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-foreground">Plano de Contas</h1>
                        <p className="text-sm text-muted-foreground font-light uppercase tracking-widest text-[10px]">
                            {selectedClient.nome_fantasia || selectedClient.razao_social}
                        </p>
                    </div>
                </div>
                {categories.length === 0 && !loading && (
                    <Button
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/5 font-light text-xs animate-bounce"
                        onClick={handleSeedDefaultCategories}
                        disabled={seeding}
                    >
                        {seeding ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Wand2 className="h-3 w-3 mr-2" />}
                        Gerar Plano de Contas Padrão
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 bg-card border-border shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-light uppercase tracking-widest text-foreground">Nova Categoria</CardTitle>
                        <CardDescription className="text-[10px] font-light uppercase tracking-tight">Defina um novo item para o plano de contas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Nome</label>
                            <Input
                                placeholder="Ex: Assinaturas, Aluguel, Vendas..."
                                className="bg-muted/30 border-border font-light"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Vincular a Categoria Pai (Opcional)</label>
                            <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? null : v)}>
                                <SelectTrigger className="bg-muted/30 border-border font-light">
                                    <SelectValue placeholder="Nenhum (Categoria Raiz)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum (Categoria Raiz)</SelectItem>
                                    {categories.filter(c => c.tipo === newType && !c.parent_id).map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Tipo</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={newType === 'receber' ? 'default' : 'outline'}
                                    className="flex-1 font-light text-xs"
                                    onClick={() => { setNewType('receber'); setParentId(null); }}
                                >
                                    <Receipt className="h-3 w-3 mr-2" />
                                    Receber
                                </Button>
                                <Button
                                    variant={newType === 'pagar' ? 'default' : 'outline'}
                                    className="flex-1 font-light text-xs"
                                    onClick={() => { setNewType('pagar'); setParentId(null); }}
                                >
                                    <Wallet className="h-3 w-3 mr-2" />
                                    Pagar
                                </Button>
                            </div>
                        </div>
                        <Button className="w-full font-light bg-primary" onClick={handleCreate} disabled={creating || !newName}>
                            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Criar Categoria
                        </Button>

                        <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                            <CardTitle className="text-sm font-light uppercase tracking-widest text-foreground flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" /> Sugestão por IA
                            </CardTitle>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Qual o seu nicho?</label>
                                <Input
                                    placeholder="Ex: Oficina Mecânica, Clínica Médica..."
                                    className="bg-muted/30 border-border font-light"
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" className="w-full font-light border-primary/20 text-primary hover:bg-primary/5" onClick={handleSuggestAI} disabled={suggesting || !niche}>
                                {suggesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                Gerar com IA
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-card border-border shadow-sm">
                    <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-light uppercase tracking-widest text-foreground">Estrutura Gerencial</CardTitle>
                        {categories.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-light text-muted-foreground hover:text-primary"
                                onClick={handleSeedDefaultCategories}
                                disabled={seeding}
                            >
                                Re-gerar Padrões
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[700px] overflow-y-auto">
                            {loading && categories.length === 0 ? (
                                <div className="text-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/20" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground font-light text-sm">
                                    Nenhuma categoria cadastrada.
                                </div>
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {buildTree(categories).map((rootCat) => (
                                        <CategoryNode key={rootCat.id} node={rootCat} />
                                    ))}
                                </Accordion>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-primary/5 border-primary/10 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <BookOpen className="h-24 w-24 text-primary" />
                </div>
                <CardContent className="p-6 relative z-10 max-w-2xl">
                    <h3 className="text-sm font-light text-primary mb-2 flex items-center gap-2 uppercase tracking-widest">
                        Plano de Contas Gerencial
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        Categorize seus lançamentos para obter relatórios precisos. Separe o que é custo fixo,
                        custo variável e diferentes fontes de receita para uma visão clara do seu negócio.
                        Utilize o botão "Gerar Plano de Contas Padrão" para começar com a estrutura recomendada.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Categorias;
