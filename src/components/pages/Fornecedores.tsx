import { useState, useEffect } from "react";
import {
    Truck, Plus, Search, Building2, Mail, Phone, MapPin,
    Loader2, Tag, Upload, Edit, Trash2, Filter,
    Download, CheckCircle2, X, FileUp
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";

const Fornecedores = () => {
    const { selectedClient } = useClient();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [cnpj, setCnpj] = useState("");
    const [supplierData, setSupplierData] = useState<any>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const fetchSuppliers = async () => {
        if (!selectedClient) return;
        setFetching(true);
        try {
            const { data, error } = await (supabase as any)
                .from('fornecedores')
                .select('*')
                .eq('empresa_id', selectedClient.id)
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (error) throw error;
            setSuppliers(data || []);
        } catch (error: any) {
            console.error('Error fetching suppliers:', error.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [selectedClient]);

    const consultCNPJ = async () => {
        if (!cnpj || cnpj.replace(/\D/g, "").length < 14) {
            toast.error("Por favor, insira um CNPJ válido.");
            return;
        }

        setLoading(true);
        try {
            const cleanCnpj = cnpj.replace(/\D/g, "");
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

            if (!response.ok) {
                // Fallback to ReceitaWS if BrasilAPI fails
                const fallbackRes = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
                const fallbackData = await fallbackRes.json();
                if (fallbackData.status === 'ERROR') throw new Error(fallbackData.message);
                setSupplierData({
                    nome: fallbackData.nome || fallbackData.fantasia || "Fornecedor s/ Nome",
                    razao_social: fallbackData.nome || fallbackData.fantasia || "Fornecedor s/ Nome",
                    cnpj: cleanCnpj,
                    municipio: fallbackData.municipio || "",
                    uf: fallbackData.uf || "",
                    email: fallbackData.email || null,
                    telefone: fallbackData.telefone || null
                });
            } else {
                const data = await response.json();
                setSupplierData({
                    nome: data.razao_social || data.nome_fantasia || "Fornecedor s/ Nome",
                    razao_social: data.razao_social || data.nome_fantasia || "Fornecedor s/ Nome",
                    cnpj: cleanCnpj,
                    municipio: data.municipio || "",
                    uf: data.uf || "",
                    email: data.email || null,
                    telefone: data.ddd_telefone_1 || data.telefone || null
                });
            }
            toast.success("Fornecedor localizado!");
        } catch (error) {
            console.error("Erro na consulta CNPJ:", error);
            toast.error("Erro ao consultar CNPJ.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                "Nome": "Fornecedor Exemplo",
                "CNPJ": "00.000.000/0000-00",
                "Email": "fornecedor@exemplo.com",
                "Telefone": "(11) 99999-9999"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "modelo_importacao_fornecedores.xlsx");
        toast.info("Modelo de planilha baixado!");
    };

    const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            setLoading(true);
            try {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                if (rawData.length === 0) {
                    toast.error("A planilha está vazia.");
                    return;
                }

                const suppliersToInsert = rawData.map((row: any) => ({
                    nome: row["Nome"] || "Importado s/ Nome",
                    doc_tipo: 'cnpj',
                    doc_numero: String(row["CNPJ"]).replace(/\D/g, ""),
                    email: row["Email"] || null,
                    telefone: row["Telefone"] || null,
                    tenant_id: selectedClient?.tenant_id || null,
                    empresa_id: selectedClient?.id,
                    ativo: true
                }));

                const { error } = await (supabase as any)
                    .from('fornecedores')
                    .insert(suppliersToInsert);

                if (error) throw error;

                toast.success(`${suppliersToInsert.length} fornecedores importados!`);
                fetchSuppliers();
            } catch (error: any) {
                console.error("Erro na importação:", error);
                toast.error("Erro ao importar planilha: " + (error.message || "Erro desconhecido"));
            } finally {
                setLoading(false);
                if (event.target) event.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSaveFornecedor = async () => {
        if (!supplierData || !selectedClient) return;

        setLoading(true);
        try {
            const cleanCnpj = String(supplierData.cnpj).replace(/\D/g, "");

            if (!cleanCnpj) {
                throw new Error("CNPJ não fornecido ou inválido.");
            }

            const { error } = await (supabase as any)
                .from('fornecedores')
                .insert([{
                    nome: supplierData.nome || "Fornecedor s/ Nome",
                    doc_tipo: 'cnpj',
                    doc_numero: cleanCnpj,
                    email: supplierData.email || null,
                    telefone: supplierData.telefone || null,
                    tenant_id: selectedClient.tenant_id || null,
                    empresa_id: selectedClient.id,
                    ativo: true
                }]);

            if (error) throw error;

            toast.success("Fornecedor cadastrado!");
            setSupplierData(null);
            setCnpj("");
            fetchSuppliers();
        } catch (error: any) {
            console.error("Erro completo ao salvar fornecedor:", error);
            toast.error("Erro ao salvar fornecedor: " + (error.message || "Verifique as permissões"));
        } finally {
            setLoading(false);
        }
    };


    const handleDeleteSupplier = async (id: string) => {
        if (!confirm("Deseja realmente remover este fornecedor?")) return;

        try {
            const { error } = await (supabase as any)
                .from('fornecedores')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Fornecedor removido.");
            fetchSuppliers();
        } catch (error) {
            toast.error("Erro ao remover fornecedor.");
        }
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-light tracking-tight">Selecione um Cliente</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Para gerenciar fonecedores, você precisa selecionar um cliente BPO no cabeçalho.
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
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-foreground">Gestão de Fornecedores</h1>
                        <p className="text-sm text-muted-foreground font-light uppercase tracking-widest text-[10px]">
                            {selectedClient.nome_fantasia || selectedClient.razao_social}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="font-light border-border" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" /> Modelo
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="supplier-upload"
                            onChange={handleImportExcel}
                        />
                        <Button variant="outline" className="font-light border-border" asChild>
                            <label htmlFor="supplier-upload" className="cursor-pointer">
                                <FileUp className="h-4 w-4 mr-2" /> Importar
                            </label>
                        </Button>
                    </div>
                    <Button variant="outline" className="font-light border-border text-foreground hover:bg-muted" onClick={() => fetchSuppliers()}>
                        <Loader2 className={`h-4 w-4 mr-2 ${fetching ? 'animate-spin' : ''}`} /> Sincronizar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 bg-card border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-light uppercase tracking-widest flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" /> Novo Cadastro
                        </CardTitle>
                        <CardDescription className="text-[10px] font-light uppercase tracking-tight">Consulta automatizada via API</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="00.000.000/0000-00"
                                className="bg-muted/30 border-border font-light"
                                value={cnpj}
                                onChange={(e) => setCnpj(e.target.value)}
                            />
                            <Button onClick={consultCNPJ} disabled={loading} size="icon" className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                        {supplierData && (
                            <div className="pt-4 border-t border-border space-y-4 animate-in fade-in zoom-in-95 duration-300 relative">
                                <Button variant="ghost" size="icon" className="absolute top-2 right-0 h-6 w-6" onClick={() => setSupplierData(null)}>
                                    <X className="h-3 w-3" />
                                </Button>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Razão Social</p>
                                    <p className="text-sm font-light px-1 text-foreground leading-tight">{supplierData.razao_social}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-light px-1">Localização</p>
                                    <p className="text-xs font-light px-1 text-muted-foreground">{supplierData.municipio} - {supplierData.uf}</p>
                                </div>
                                <Button className="w-full font-light bg-primary text-primary-foreground" onClick={handleSaveFornecedor} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Confirmar Cadastro
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between py-5">
                        <CardTitle className="text-sm font-light uppercase tracking-widest">Fornecedores Vinculados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent px-2">
                                    <TableHead className="font-light uppercase text-[10px] tracking-widest pl-6">Fornecedor / Doc</TableHead>
                                    <TableHead className="font-light uppercase text-[10px] tracking-widest">Email / Contato</TableHead>
                                    <TableHead className="font-light uppercase text-[10px] tracking-widest text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetching && suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-16 text-muted-foreground font-light text-sm">
                                            Nenhum fornecedor cadastrado para este cliente.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.map((sup) => (
                                        <TableRow key={sup.id} className="border-border hover:bg-muted/30 transition-colors group">
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-light">{sup.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">{sup.doc_numero}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
                                                        <Mail className="h-3 w-3" /> {sup.email || '-'}
                                                    </div>
                                                    {sup.telefone && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
                                                            <Phone className="h-3 w-3" /> {sup.telefone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-6">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSupplier(sup.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Fornecedores;
