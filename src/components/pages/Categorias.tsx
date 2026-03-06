import { useState, useEffect } from "react";
import {
    Tag, Plus, Trash2, Loader2, BookOpen, Wand2, Receipt, Wallet
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
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/components/integrations/supabase/client";
import { defaultCategoriesRaw } from "@/components/finance/DefaultCategories";

const Categorias = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"receber" | "pagar">("pagar");
    const [creating, setCreating] = useState(false);
    const [seeding, setSeeding] = useState(false);

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
                    tenant_id: selectedClient.tenant_id || null,
                    empresa_id: selectedClient.id,
                    ativo: true
                }]);

            if (error) throw error;
            toast.success("Categoria criada!");
            setNewName("");
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
                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Tipo</label>
                            <div className="flex gap-2">
                                <Button
                                    variant={newType === 'receber' ? 'default' : 'outline'}
                                    className="flex-1 font-light text-xs"
                                    onClick={() => setNewType('receber')}
                                >
                                    <Receipt className="h-3 w-3 mr-2" />
                                    Receber
                                </Button>
                                <Button
                                    variant={newType === 'pagar' ? 'default' : 'outline'}
                                    className="flex-1 font-light text-xs"
                                    onClick={() => setNewType('pagar')}
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
                        <div className="max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card z-10">
                                    <TableRow className="border-border hover:bg-transparent px-2">
                                        <TableHead className="font-light uppercase text-[10px] tracking-widest pl-6 py-4">Nome</TableHead>
                                        <TableHead className="font-light uppercase text-[10px] tracking-widest py-4 text-center">Tipo</TableHead>
                                        <TableHead className="font-light uppercase text-[10px] tracking-widest text-right pr-6 py-4">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-16 text-muted-foreground font-light text-sm">
                                                Nenhuma categoria cadastrada.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((cat) => (
                                            <TableRow key={cat.id} className="border-border hover:bg-muted/30 transition-colors group">
                                                <TableCell className="py-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${cat.tipo === 'receber' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                            }`}>
                                                            {cat.tipo === 'receber' ? <Receipt className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                                                        </div>
                                                        <span className={`text-sm font-light ${cat.parent_id ? 'ml-4 text-muted-foreground' : 'font-normal'}`}>
                                                            {cat.nome}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <Badge variant="outline" className={`font-light text-[10px] uppercase tracking-widest ${cat.tipo === 'receber' ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'
                                                        }`}>
                                                        {cat.tipo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(cat.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
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
