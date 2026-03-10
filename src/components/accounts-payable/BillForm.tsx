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
import { AlertCircle, Save, Calculator, Plus, Loader2, Zap, ScanBarcode } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
    categoria_id: z.string().min(1, 'Categoria é obrigatória'),
    centro_custo_id: z.string().optional(),
    valor_bruto: z.number().min(0.01, 'Valor deve ser maior que zero'),
    competencia_mes: z.number().min(1).max(12),
    competencia_year: z.number().min(2020),
    possui_retencao: z.boolean().default(false),
    irrf_aliquota: z.number().default(0.015),
    pis_aliquota: z.number().default(0.0065),
    cofins_aliquota: z.number().default(0.03),
    csll_aliquota: z.number().default(0.01),
    iss_retido_valor: z.number().default(0),
    inss_retido_valor: z.number().default(0),
    parcelado: z.boolean().default(false),
    qtd_parcelas: z.number().min(1).max(12).default(1),
    vencimento_primeira_parcela: z.string().min(1, 'Data é obrigatória'),
    codigo_barras: z.string().optional(),
});

interface BillFormProps {
    onSubmit: (data: any, installments: any[]) => void;
    initialData?: any;
}

export function BillForm({ onSubmit, initialData }: BillFormProps) {
    const { selectedClient } = useClient();
    const { calculateRetentions, generateInstallments } = useBPOFinancialCalculations();
    const [installments, setInstallments] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const [retentionTotals, setRetentionTotals] = useState({
        irrf_valor: 0,
        pis_valor: 0,
        cofins_valor: 0,
        csll_valor: 0,
        total_retencoes: 0,
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            descricao: '',
            fornecedor_id: '',
            categoria_id: '',
            valor_bruto: 0,
            competencia_mes: new Date().getMonth() + 1,
            competencia_year: new Date().getFullYear(),
            possui_retencao: false,
            irrf_aliquota: 0.015,
            pis_aliquota: 0.0065,
            cofins_aliquota: 0.03,
            csll_aliquota: 0.01,
            iss_retido_valor: 0,
            inss_retido_valor: 0,
            parcelado: false,
            qtd_parcelas: 1,
            vencimento_primeira_parcela: new Date().toISOString().split('T')[0],
            codigo_barras: '',
        },
    });

    const watchValues = form.watch();

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...form.getValues(),
                ...initialData
            });
        }
    }, [initialData, form]);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedClient) return;

            setLoadingData(true);
            try {
                const [suppliersRes, categoriesRes] = await Promise.all([
                    (supabase as any)
                        .from('fornecedores')
                        .select('id, nome')
                        .eq('empresa_id', selectedClient.id)
                        .eq('ativo', true),
                    (supabase as any)
                        .from('finance_categories')
                        .select('id, nome')
                        .eq('empresa_id', selectedClient.id)
                        .eq('tipo', 'pagar')
                ]);

                if (suppliersRes.data) setSuppliers(suppliersRes.data);
                if (categoriesRes.data) setCategories(categoriesRes.data);
            } catch (error) {
                console.error('Error fetching form data:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [selectedClient]);

    useEffect(() => {
        if (watchValues.possui_retencao) {
            const totals = calculateRetentions(
                watchValues.valor_bruto,
                {
                    irrf: watchValues.irrf_aliquota,
                    pis: watchValues.pis_aliquota,
                    cofins: watchValues.cofins_aliquota,
                    csll: watchValues.csll_aliquota,
                },
                watchValues.iss_retido_valor,
                watchValues.inss_retido_valor
            );
            setRetentionTotals(totals);
        } else {
            setRetentionTotals({
                irrf_valor: 0,
                pis_valor: 0,
                cofins_valor: 0,
                csll_valor: 0,
                total_retencoes: 0,
            });
        }
    }, [
        watchValues.possui_retencao,
        watchValues.valor_bruto,
        watchValues.irrf_aliquota,
        watchValues.pis_aliquota,
        watchValues.cofins_aliquota,
        watchValues.csll_aliquota,
        watchValues.iss_retido_valor,
        watchValues.inss_retido_valor,
    ]);

    const handleGenerateInstallments = () => {
        const generated = generateInstallments(
            watchValues.valor_bruto,
            retentionTotals.total_retencoes,
            watchValues.qtd_parcelas,
            watchValues.vencimento_primeira_parcela
        );
        setInstallments(generated);
    };

    const checkValidation = () => {
        if (watchValues.parcelado && watchValues.qtd_parcelas > 1) {
            const firstParcelBruto = watchValues.valor_bruto / watchValues.qtd_parcelas;
            if (retentionTotals.total_retencoes > firstParcelBruto) {
                return "Retenções maiores que a 1ª parcela. Ajuste o nº de parcelas ou defina 1ª parcela diferenciada.";
            }
        }
        return null;
    };

    const validationError = checkValidation();

    const handleSubmit = (data: z.infer<typeof formSchema>) => {
        if (validationError) return;
        if (installments.length === 0) {
            handleGenerateInstallments();
        }
        onSubmit(data, installments);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {initialData?.alerta && (
                    <Alert variant="destructive" className="bg-primary/5 text-primary border-primary/20 animate-in slide-in-from-top duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-medium">Alerta da IA</AlertTitle>
                        <AlertDescription className="text-xs font-light">
                            {initialData.alerta}
                        </AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                Identificação
                                {initialData && (
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] py-0 h-4 px-1 leading-none font-light animate-pulse">
                                        <Zap className="h-2.5 w-2.5 mr-1" />
                                        IA
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Consultoria Mensal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fornecedor_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fornecedor</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {suppliers.length > 0 ? (
                                                        suppliers.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="none" disabled>Nenhum fornecedor encontrado</SelectItem>
                                                    )}
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
                                            <FormLabel>Categoria</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.length > 0 ? (
                                                        categories.map(c => (
                                                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <SelectItem value="1" disabled>Nenhuma categoria encontrada</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Valores e Datas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="valor_bruto"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Bruto</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vencimento_primeira_parcela"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vencimento</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="competencia_mes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mês Competência</FormLabel>
                                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="competencia_year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ano Competência</FormLabel>
                                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="codigo_barras"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <ScanBarcode className="h-3.5 w-3.5" />
                                            Linha Digitável / PIX
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Cole o código de barras ou chave PIX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Retenções</CardTitle>
                        <FormField
                            control={form.control}
                            name="possui_retencao"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel>Aplicar Retenções</FormLabel>
                                </FormItem>
                            )}
                        />
                    </CardHeader>
                    {watchValues.possui_retencao && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormItem>
                                    <FormLabel>IRRF (%)</FormLabel>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        defaultValue={form.getValues().irrf_aliquota * 100}
                                        onChange={(e) => form.setValue('irrf_aliquota', parseFloat(e.target.value) / 100)}
                                    />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>PIS (%)</FormLabel>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        defaultValue={form.getValues().pis_aliquota * 100}
                                        onChange={(e) => form.setValue('pis_aliquota', parseFloat(e.target.value) / 100)}
                                    />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>COFINS (%)</FormLabel>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        defaultValue={form.getValues().cofins_aliquota * 100}
                                        onChange={(e) => form.setValue('cofins_aliquota', parseFloat(e.target.value) / 100)}
                                    />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>CSLL (%)</FormLabel>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        defaultValue={form.getValues().csll_aliquota * 100}
                                        onChange={(e) => form.setValue('csll_aliquota', parseFloat(e.target.value) / 100)}
                                    />
                                </FormItem>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <FormField
                                    control={form.control}
                                    name="iss_retido_valor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ISS Retido (Valor)</FormLabel>
                                            <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="inss_retido_valor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>INSS Retido (Valor)</FormLabel>
                                            <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value))} />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="bg-muted p-4 rounded-lg flex justify-between items-center mt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Total Retenções</p>
                                    <p className="text-lg font-semibold text-primary">R$ {retentionTotals.total_retencoes.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase">Valor Líquido</p>
                                    <p className="text-lg font-semibold text-emerald-600">
                                        R$ {(watchValues.valor_bruto - retentionTotals.total_retencoes).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Parcelamento</CardTitle>
                        <div className="flex items-center gap-4">
                            <FormField
                                control={form.control}
                                name="parcelado"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormLabel>Habilitar</FormLabel>
                                    </FormItem>
                                )}
                            />
                            {watchValues.parcelado && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="w-20"
                                        placeholder="Qtd"
                                        {...form.register('qtd_parcelas', { valueAsNumber: true })}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateInstallments}>
                                        Gerar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    {watchValues.parcelado && installments.length > 0 && (
                        <CardContent>
                            {validationError && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erro de Validação</AlertTitle>
                                    <AlertDescription>{validationError}</AlertDescription>
                                </Alert>
                            )}
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nº</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead>Bruto</TableHead>
                                        <TableHead>Retenções</TableHead>
                                        <TableHead>Líquido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {installments.map((inst, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{inst.numero}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="date"
                                                    value={inst.vencimento}
                                                    className="h-8 w-36"
                                                    onChange={(e) => {
                                                        const newInst = [...installments];
                                                        newInst[idx].vencimento = e.target.value;
                                                        setInstallments(newInst);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>R$ {inst.valor_bruto.toFixed(2)}</TableCell>
                                            <TableCell className="text-amber-600">
                                                {inst.total_retencoes_aplicadas > 0 ? `R$ ${inst.total_retencoes_aplicadas.toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell className="font-medium">R$ {inst.valor_liquido.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    )}
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Lançamento
                    </Button>
                </div>
            </form>
        </Form>
    );
}
