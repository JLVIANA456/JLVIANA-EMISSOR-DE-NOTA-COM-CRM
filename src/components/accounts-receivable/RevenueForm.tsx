import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/components/contexts/ClientContext';
import { useBPOFinancialCalculations } from '../hooks/useBPOFinancialCalculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Calculator, Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    cliente_sacado_id: z.string().min(1, 'Cliente é obrigatório'),
    categoria_id: z.string().min(1, 'Categoria é obrigatória'),
    centro_custo_id: z.string().optional(),
    valor_bruto: z.number().min(0.01, 'Valor deve ser maior que zero'),
    competencia_mes: z.number().min(1).max(12),
    competencia_year: z.number().min(2020),
    data_emissao: z.string().optional(),
    forma_recebimento: z.string().optional(),
    bank_account_id: z.string().optional(),
    parcelado: z.boolean().default(false),
    qtd_parcelas: z.number().min(1).max(12).default(1),
    vencimento_primeira_parcela: z.string().min(1, 'Data é obrigatória'),
});

interface RevenueFormProps {
    onSubmit: (data: any, installments: any[]) => void;
    initialData?: any;
}

export function RevenueForm({ onSubmit, initialData }: RevenueFormProps) {
    const { selectedClient } = useClient();
    const { generateInstallments } = useBPOFinancialCalculations();
    const [installments, setInstallments] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            descricao: '',
            cliente_sacado_id: '',
            categoria_id: '',
            valor_bruto: 0,
            competencia_mes: new Date().getMonth() + 1,
            competencia_year: new Date().getFullYear(),
            data_emissao: new Date().toISOString().split('T')[0],
            forma_recebimento: 'boleto',
            parcelado: false,
            qtd_parcelas: 1,
            vencimento_primeira_parcela: new Date().toISOString().split('T')[0],
        },
    });

    const watchValues = form.watch();

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClient) return;

            setLoadingData(true);
            try {
                const [clientsRes, categoriesRes, bankAccountsRes] = await Promise.all([
                    (supabase as any)
                        .from('clientes_sacados')
                        .select('id, nome')
                        .eq('empresa_id', selectedClient.id)
                        .eq('ativo', true),
                    (supabase as any)
                        .from('finance_categories')
                        .select('id, nome')
                        .eq('empresa_id', selectedClient.id)
                        .in('tipo', ['receber', 'ambos']),
                    (supabase as any)
                        .from('finance_bank_accounts')
                        .select('id, banco, conta')
                        .eq('empresa_id', selectedClient.id)
                ]);

                if (clientsRes.data) setClients(clientsRes.data);
                if (categoriesRes.data) setCategories(categoriesRes.data);
                if (bankAccountsRes.data) setBankAccounts(bankAccountsRes.data);
            } catch (error) {
                console.error('Error fetching form data:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [selectedClient]);

    const handleGenerateInstallments = () => {
        const generated = generateInstallments(
            watchValues.valor_bruto,
            0, // No retentions for now as per schema check
            watchValues.qtd_parcelas,
            watchValues.vencimento_primeira_parcela
        );
        setInstallments(generated);
    };

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        if (installments.length === 0) {
            handleGenerateInstallments();
        }
        onSubmit(data, installments);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-light uppercase tracking-widest">Identificação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Descrição</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Venda de Serviços" {...field} className="bg-muted/30 border-border font-light" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cliente_sacado_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-light uppercase tracking-wider">Cliente (Faturado)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/30 border-border font-light">
                                                        <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-card border-border">
                                                    {clients.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="categoria_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-light uppercase tracking-wider">Categoria</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/30 border-border font-light">
                                                        <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-card border-border">
                                                    {categories.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-light uppercase tracking-widest">Valores e Recebimento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="valor_bruto"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-light uppercase tracking-wider">Valor Bruto</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                    className="bg-muted/30 border-border font-light"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="forma_recebimento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-light uppercase tracking-wider">Forma</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-muted/30 border-border font-light">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-card border-border">
                                                    <SelectItem value="boleto">Boleto</SelectItem>
                                                    <SelectItem value="pix">PIX</SelectItem>
                                                    <SelectItem value="transferencia">Transferência</SelectItem>
                                                    <SelectItem value="cartao">Cartão</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="bank_account_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Conta Bancária Destino</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/30 border-border font-light">
                                                    <SelectValue placeholder="Selecione a conta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-card border-border">
                                                {bankAccounts.map(b => (
                                                    <SelectItem key={b.id} value={b.id}>{b.banco} - {b.conta}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-light uppercase tracking-widest">Parcelamento / Vencimentos</CardTitle>
                        <div className="flex items-center gap-4">
                            <FormField
                                control={form.control}
                                name="parcelado"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Habilitar</FormLabel>
                                    </FormItem>
                                )}
                            />
                            {watchValues.parcelado && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="w-20 bg-muted/30 border-border font-light"
                                        placeholder="Qtd"
                                        {...form.register('qtd_parcelas', { valueAsNumber: true })}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateInstallments} className="font-light">
                                        Gerar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="vencimento_primeira_parcela"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Vencimento (1ª)</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-muted/30 border-border font-light" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="competencia_mes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Mês Comp.</FormLabel>
                                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="bg-muted/30 border-border font-light" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="competencia_year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-light uppercase tracking-wider">Ano Comp.</FormLabel>
                                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="bg-muted/30 border-border font-light" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {watchValues.parcelado && installments.length > 0 && (
                            <div className="rounded-md border border-border/50 overflow-hidden mt-4">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-light text-[10px] uppercase tracking-widest pl-6">Nº</TableHead>
                                            <TableHead className="font-light text-[10px] uppercase tracking-widest">Vencimento</TableHead>
                                            <TableHead className="font-light text-[10px] uppercase tracking-widest text-right pr-6">Valor Bruto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {installments.map((inst, idx) => (
                                            <TableRow key={idx} className="border-border/50">
                                                <TableCell className="font-light pl-6">{inst.numero}</TableCell>
                                                <TableCell className="font-light">
                                                    <Input
                                                        type="date"
                                                        value={inst.vencimento}
                                                        className="h-8 w-36 bg-muted/20 border-border font-light text-xs"
                                                        onChange={(e) => {
                                                            const newInst = [...installments];
                                                            newInst[idx].vencimento = e.target.value;
                                                            setInstallments(newInst);
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-light text-right pr-6">
                                                    {Number(inst.valor_bruto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-light px-8">
                        <Save className="h-4 w-4 mr-2" />
                        Confirmar Lançamento
                    </Button>
                </div>
            </form>
        </Form>
    );
}
