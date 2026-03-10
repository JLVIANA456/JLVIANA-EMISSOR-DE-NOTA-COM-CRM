import { useState, useEffect } from "react";
import {
    Users, Plus, Search, Building2, Mail, Phone, MapPin,
    Loader2, Hash, FileCheck, Globe, Info, CheckCircle2,
    Trash2, FileUp, Download, Edit, BookmarkCheck, ExternalLink,
    AlertCircle, X
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";
import { cn } from "@/lib/utils";

const Clientes = () => {
    const { user } = useAuth();
    const { refreshClients, setSelectedClient, selectedClient } = useClient();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [registeredClients, setRegisteredClients] = useState<any[]>([]);

    // Form & Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [cnpjQuery, setCnpjQuery] = useState("");

    const [formData, setFormData] = useState({
        razao_social: "",
        nome_fantasia: "",
        cnpj: "",
        inscricao_estadual: "",
        inscricao_municipal: "",
        email: "",
        telefone: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        municipio: "",
        uf: "",
        cep: "",
        regime_tributario: "Simples Nacional",
        natureza_juridica: "",
        cnae_principal: "",
        status_bpo: "Ativo"
    });

    const fetchClients = async () => {
        setFetching(true);
        try {
            const { data, error } = await (supabase as any)
                .from('empresas_bpo')
                .select('*')
                .eq('ativo', true)
                .order('nome_fantasia', { ascending: true });

            if (error) throw error;
            setRegisteredClients(data || []);
        } catch (error: any) {
            console.error('Error fetching clients:', error.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const consultCNPJ = async (targetCnpj?: string) => {
        const cleanCnpj = (targetCnpj || cnpjQuery).replace(/\D/g, "");
        if (cleanCnpj.length < 14) {
            toast.error("Por favor, insira um CNPJ válido.");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            let data;

            if (!response.ok) {
                toast.info("Consultando via ReceitaWS...");
                const fallback = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
                if (!fallback.ok) throw new Error("Erro na consulta do CNPJ.");
                data = await fallback.json();

                setFormData(prev => ({
                    ...prev,
                    razao_social: data.nome || "",
                    nome_fantasia: data.fantasia || data.nome || "",
                    cnpj: data.cnpj?.replace(/\D/g, "") || cleanCnpj,
                    logradouro: data.logradouro || "",
                    numero: data.numero || "",
                    complemento: data.complemento || "",
                    bairro: data.bairro || "",
                    municipio: data.municipio || "",
                    uf: data.uf || "",
                    cep: data.cep?.replace(/\D/g, "") || "",
                    email: data.email || "",
                    telefone: data.telefone || "",
                    natureza_juridica: data.natureza_juridica || "",
                    cnae_principal: data.atividade_principal?.[0]?.code || ""
                }));
            } else {
                data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    razao_social: data.razao_social || "",
                    nome_fantasia: data.nome_fantasia || data.razao_social || "",
                    cnpj: data.cnpj?.replace(/\D/g, "") || cleanCnpj,
                    logradouro: data.logradouro || "",
                    numero: data.numero || "",
                    complemento: data.complemento || "",
                    bairro: data.bairro || "",
                    municipio: data.municipio || "",
                    uf: data.uf || "",
                    cep: data.cep?.replace(/\D/g, "") || "",
                    email: data.email || "",
                    telefone: data.ddd_telefone_1 || "",
                    natureza_juridica: data.natureza_juridica || "",
                    cnae_principal: data.cnae_fiscal || ""
                }));
            }
            toast.success("Dados da empresa recuperados!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao consultar CNPJ.");
        } finally {
            setLoading(false);
        }
    };

    const consultCEP = async () => {
        if (formData.cep.replace(/\D/g, "").length < 8) return;

        setLoading(true);
        try {
            const cleanCep = formData.cep.replace(/\D/g, "");
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error("CEP não encontrado.");
                return;
            }

            setFormData(prev => ({
                ...prev,
                logradouro: data.logradouro,
                bairro: data.bairro,
                municipio: data.localidade,
                uf: data.uf
            }));
            toast.success("Endereço localizado!");
        } catch (error) {
            toast.error("Erro ao buscar CEP.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async () => {
        if (!formData.razao_social || !formData.cnpj) {
            toast.error("Razão Social e CNPJ são obrigatórios.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                razao_social: formData.razao_social,
                nome_fantasia: formData.nome_fantasia,
                cnpj: formData.cnpj.replace(/\D/g, ""),
                email: formData.email || null,
                telefone: formData.telefone || null,
                logradouro: formData.logradouro || null,
                numero: formData.numero || null,
                complemento: formData.complemento || null,
                bairro: formData.bairro || null,
                municipio: formData.municipio || null,
                uf: formData.uf || null,
                cep: formData.cep || null,
                inscricao_estadual: formData.inscricao_estadual || null,
                inscricao_municipal: formData.inscricao_municipal || null,
                natureza_juridica: formData.natureza_juridica || null,
                cnae_principal: formData.cnae_principal || null,
                regime_tributario: formData.regime_tributario || null,
                status_bpo: formData.status_bpo || "Ativo",
                ativo: true,
                updated_at: new Date().toISOString()
            };

            if (editingId) {
                const { error } = await (supabase as any)
                    .from('empresas_bpo')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
                toast.success("Cliente atualizado!");
            } else {
                const { data, error } = await (supabase as any)
                    .from('empresas_bpo')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                toast.success("Cliente cadastrado com sucesso!");
                if (data) setSelectedClient(data);
            }

            setIsDialogOpen(false);
            setEditingId(null);
            resetForm();
            fetchClients();
            refreshClients();
        } catch (error: any) {
            console.error('Error saving client:', error.message);
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            razao_social: "",
            nome_fantasia: "",
            cnpj: "",
            inscricao_estadual: "",
            inscricao_municipal: "",
            email: "",
            telefone: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            municipio: "",
            uf: "",
            cep: "",
            regime_tributario: "Simples Nacional",
            natureza_juridica: "",
            cnae_principal: "",
            status_bpo: "Ativo"
        });
        setCnpjQuery("");
    };

    const startEdit = (client: any) => {
        setEditingId(client.id);
        setFormData({
            razao_social: client.razao_social || "",
            nome_fantasia: client.nome_fantasia || "",
            cnpj: client.cnpj || "",
            inscricao_estadual: client.inscricao_estadual || "",
            inscricao_municipal: client.inscricao_municipal || "",
            email: client.email || "",
            telefone: client.telefone || "",
            logradouro: client.logradouro || "",
            numero: client.numero || "",
            complemento: client.complemento || "",
            bairro: client.bairro || "",
            municipio: client.municipio || "",
            uf: client.uf || "",
            cep: client.cep || "",
            regime_tributario: client.regime_tributario || "Simples Nacional",
            natureza_juridica: client.natureza_juridica || "",
            cnae_principal: client.cnae_principal || "",
            status_bpo: client.status_bpo || "Ativo"
        });
        setIsDialogOpen(true);
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm("Remover este cliente desativará o acesso aos dados vinculados. Confirmar?")) return;

        try {
            const { error } = await (supabase as any)
                .from('empresas_bpo')
                .update({ ativo: false })
                .eq('id', id);

            if (error) throw error;
            toast.success("Cliente desativado.");
            fetchClients();
            refreshClients();
        } catch (error: any) {
            toast.error("Erro ao remover cliente.");
        }
    };

    const handleDownloadTemplate = () => {
        const template = [{
            "Razão Social": "Empresa Exemplo LTDA",
            "Nome Fantasia": "Exemplo",
            "CNPJ": "00000000000100",
            "Município": "São Paulo",
            "UF": "SP",
            "Email": "exemplo@email.com"
        }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo");
        XLSX.writeFile(wb, "modelo_clientes_robust.xlsx");
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
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json(ws);

                const clientsToInsert = rawData.map((row: any) => ({
                    tenant_id: user?.id,
                    razao_social: row["Razão Social"],
                    nome_fantasia: row["Nome Fantasia"] || row["Razão Social"],
                    cnpj: String(row["CNPJ"]).replace(/\D/g, ""),
                    municipio: row["Município"],
                    uf: row["UF"],
                    email: row["Email"],
                    ativo: true
                }));

                const { error } = await (supabase as any)
                    .from('empresas_bpo')
                    .insert(clientsToInsert);
                if (error) throw error;

                toast.success(`${clientsToInsert.length} clientes importados!`);
                fetchClients();
                refreshClients();
            } catch (error) {
                toast.error("Erro na importação Excel.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredClients = registeredClients.filter(c =>
        (c.nome_fantasia || c.razao_social || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cnpj || "").includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-foreground">Gestão de Empresas (BPO)</h1>
                        <p className="text-sm text-muted-foreground font-light">Controle de portfólio e isolamento multi-tenant</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-light" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" /> Modelo
                    </Button>
                    <label className="cursor-pointer">
                        <Input type="file" accept=".xlsx" className="hidden" onChange={handleImportExcel} />
                        <Button variant="outline" size="sm" className="font-light pointer-events-none">
                            <FileUp className="h-4 w-4 mr-2" /> Importar
                        </Button>
                    </label>
                    <Button size="sm" className="font-light bg-primary text-white px-6" onClick={() => { resetForm(); setEditingId(null); setIsDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Empresa
                    </Button>
                </div>
            </div>

            <Card className="border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filtrar por nome ou CNPJ..."
                                className="pl-9 h-10 bg-muted/20 font-light"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-xs font-light text-muted-foreground">
                            <span>Total: <strong>{registeredClients.length}</strong></span>
                            {fetching && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border">
                                    <TableHead className="font-light py-4 pl-6 uppercase text-[10px] tracking-widest">Empresa / Documento</TableHead>
                                    <TableHead className="font-light py-4 uppercase text-[10px] tracking-widest">Localização</TableHead>
                                    <TableHead className="font-light py-4 uppercase text-[10px] tracking-widest">Status / Regime</TableHead>
                                    <TableHead className="font-light py-4 uppercase text-[10px] tracking-widest text-right pr-6">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.length === 0 && !fetching ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground font-light italic">
                                            {searchTerm ? "Nenhum resultado para a busca." : "Nenhuma empresa cadastrada."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((c) => (
                                        <TableRow key={c.id} className={cn(
                                            "border-border group hover:bg-primary/5 transition-all duration-200",
                                            selectedClient?.id === c.id && "bg-primary/10"
                                        )}>
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                                        selectedClient?.id === c.id ? "bg-primary text-white shadow-lg" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                                    )}>
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm leading-none mb-1">{c.nome_fantasia || c.razao_social}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">{c.cnpj}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-foreground font-light">{c.municipio || "---"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{c.uf}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <Badge variant="outline" className="w-fit text-[9px] font-light bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-2 py-0 uppercase">
                                                        {c.status_bpo || "Ativo"}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground italic px-1">{c.regime_tributario || "Não Inf."}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "font-light text-[11px] h-8 px-3 rounded-lg flex items-center gap-2",
                                                            selectedClient?.id === c.id ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary"
                                                        )}
                                                        onClick={() => setSelectedClient(c)}
                                                    >
                                                        {selectedClient?.id === c.id ? <BookmarkCheck className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                                                        {selectedClient?.id === c.id ? "Selecionado" : "Selecionar"}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEdit(c)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClient(c.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Registration/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col p-0 bg-background border-border">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-light tracking-tight">{editingId ? 'Editar Empresa' : 'Nova Empresa BPO'}</DialogTitle>
                        <DialogDescription className="font-light">Revise os dados fiscais e cadastrais da empresa.</DialogDescription>
                    </DialogHeader>

                    {!editingId && (
                        <div className="px-6 py-4 bg-muted/10 border-y border-border/50">
                            <Label className="text-[10px] uppercase tracking-widest text-primary mb-2 block">Carga Rápida (Consultar CNPJ)</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="CNPJ para busca..."
                                    value={cnpjQuery}
                                    onChange={(e) => setCnpjQuery(e.target.value)}
                                    className="bg-card font-light"
                                />
                                <Button onClick={() => consultCNPJ()} disabled={loading} className="shrink-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-light">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                                    Consultar
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        <Tabs defaultValue="geral" className="w-full">
                            <TabsList className="bg-muted/30 w-full md:w-fit p-1 mb-6">
                                <TabsTrigger value="geral" className="text-xs font-light px-4">Dados Operacionais</TabsTrigger>
                                <TabsTrigger value="endereco" className="text-xs font-light px-4">Endereço & Contato</TabsTrigger>
                                <TabsTrigger value="fiscal" className="text-xs font-light px-4">Configuração Fiscal</TabsTrigger>
                            </TabsList>

                            <TabsContent value="geral" className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Razão Social *</Label>
                                        <Input value={formData.razao_social} onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Nome Fantasia</Label>
                                        <Input value={formData.nome_fantasia} onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Número do CNPJ *</Label>
                                        <Input value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value.replace(/\D/g, "") })} className="bg-muted/10 font-mono text-sm tracking-widest" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Status no BPO</Label>
                                        <Select value={formData.status_bpo} onValueChange={(v) => setFormData({ ...formData, status_bpo: v })}>
                                            <SelectTrigger className="bg-muted/10 font-light">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Ativo">Ativo</SelectItem>
                                                <SelectItem value="Inativo">Inativo</SelectItem>
                                                <SelectItem value="Suspenso">Suspenso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1 font-medium text-primary">Natureza Jurídica</Label>
                                        <Input value={formData.natureza_juridica} onChange={(e) => setFormData({ ...formData, natureza_juridica: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="endereco" className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">CEP</Label>
                                        <div className="flex gap-1">
                                            <Input value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, "") })} className="bg-muted/10 font-light" />
                                            <Button variant="ghost" size="icon" onClick={consultCEP} className="text-primary hover:bg-primary/10">
                                                <MapPin className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Logradouro</Label>
                                        <Input value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Número</Label>
                                        <Input value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Bairro</Label>
                                        <Input value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Complemento</Label>
                                        <Input value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">E-mail de Contato</Label>
                                        <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Telefone / WhatsApp</Label>
                                        <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="fiscal" className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Regime Tributário</Label>
                                        <Select value={formData.regime_tributario} onValueChange={(v) => setFormData({ ...formData, regime_tributario: v })}>
                                            <SelectTrigger className="bg-muted/10 font-light">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                                                <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                                                <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                                                <SelectItem value="MEI">MEI (Microempreendedor)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">CNAE Principal</Label>
                                        <Input value={formData.cnae_principal} onChange={(e) => setFormData({ ...formData, cnae_principal: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Inscrição Estadual</Label>
                                        <Input value={formData.inscricao_estadual} onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-light uppercase tracking-wider pl-1">Inscrição Municipal</Label>
                                        <Input value={formData.inscricao_municipal} onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })} className="bg-muted/10 font-light" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-medium text-orange-700 uppercase tracking-wider">Atenção Fiscal</h4>
                                        <p className="text-[10px] text-orange-600 font-light leading-relaxed">
                                            Certifique-se de que o Regime Tributário está correto, pois ele influencia nos cálculos de Projeção de Caixa e Impostos do sistema.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter className="p-6 pt-0 border-t border-border mt-auto">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-light">Cancelar</Button>
                        <Button onClick={handleSaveClient} disabled={loading} className="px-8 font-light bg-primary text-white hover:bg-primary/90">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BookmarkCheck className="h-4 w-4 mr-2" />}
                            {editingId ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Clientes;
