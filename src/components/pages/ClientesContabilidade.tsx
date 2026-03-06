import { useState, useEffect } from "react";
import { Users, Upload, Download, Search, FileSpreadsheet, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, X, Edit, FileUp } from "lucide-react";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/components/contexts/ClientContext";
import { useAuth } from "@/components/contexts/AuthContext";

const ClientesContabilidade = () => {
    const { selectedClient } = useClient();
    const { session } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nome: "",
        razao_social: "",
        doc_tipo: "cnpj",
        doc_numero: "",
        email: "",
        telefone: ""
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchClients = async () => {
        if (!selectedClient) return;
        setFetching(true);
        try {
            const { data, error } = await (supabase as any)
                .from('clientes_sacados')
                .select('*')
                .eq('empresa_id', selectedClient.id)
                .eq('ativo', true)
                .order('nome', { ascending: true });

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            console.error('Error fetching customers:', error.message);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [selectedClient]);

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !session?.user?.id) return;

        setLoading(true);
        try {
            if (editingId) {
                const { error } = await (supabase as any)
                    .from('clientes_sacados')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId);

                if (error) throw error;
                toast.success("Faturado atualizado com sucesso!");
            } else {
                const { error } = await (supabase as any)
                    .from('clientes_sacados')
                    .insert([{
                        ...formData,
                        empresa_id: selectedClient.id,
                        tenant_id: session.user.id,
                        ativo: true
                    }]);

                if (error) throw error;
                toast.success("Faturado cadastrado com sucesso!");
            }

            setIsDialogOpen(false);
            setEditingId(null);
            setFormData({
                nome: "",
                razao_social: "",
                doc_tipo: "cnpj",
                doc_numero: "",
                email: "",
                telefone: ""
            });
            fetchClients();
        } catch (error: any) {
            toast.error("Erro ao salvar faturado: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                "Nome": "Cliente Faturado Exemplo",
                "Razão Social": "Exemplo LTDA",
                "Tipo": "cnpj",
                "Documento": "00.000.000/0000-00",
                "Email": "cliente@exemplo.com",
                "Telefone": "(11) 99999-9999"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, "modelo_faturados.xlsx");
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

                const clientsToInsert = rawData.map((row: any) => ({
                    nome: row["Nome"],
                    razao_social: row["Razão Social"] || row["Nome"],
                    doc_tipo: String(row["Tipo"]).toLowerCase().includes("cpf") ? "cpf" : "cnpj",
                    doc_numero: String(row["Documento"]).replace(/\D/g, ""),
                    email: row["Email"] || null,
                    telefone: row["Telefone"] || null,
                    empresa_id: selectedClient?.id,
                    tenant_id: session?.user?.id,
                    ativo: true
                }));

                const { error } = await (supabase as any)
                    .from('clientes_sacados')
                    .insert(clientsToInsert);

                if (error) throw error;

                toast.success(`${clientsToInsert.length} faturados importados com sucesso!`);
                fetchClients();
            } catch (error: any) {
                console.error("Erro na importação:", error);
                toast.error("Erro ao importar planilha.");
            } finally {
                setLoading(false);
                if (event.target) event.target.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    const startEdit = (client: any) => {
        setFormData({
            nome: client.nome || "",
            razao_social: client.razao_social || "",
            doc_tipo: client.doc_tipo || "cnpj",
            doc_numero: client.doc_numero || "",
            email: client.email || "",
            telefone: client.telefone || ""
        });
        setEditingId(client.id);
        setIsDialogOpen(true);
    };

    const deleteClient = async (id: string) => {
        if (!confirm("Deseja realmente remover este cliente?")) return;

        try {
            const { error } = await (supabase as any)
                .from('clientes_sacados')
                .update({ ativo: false }) // Use soft delete
                .eq('id', id);

            if (error) throw error;
            toast.success("Cliente removido.");
            fetchClients();
        } catch (error: any) {
            toast.error("Erro ao remover cliente.");
        }
    };

    if (!selectedClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-light tracking-tight">Selecione um Cliente BPO</h2>
                    <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                        Para gerenciar os faturados (clientes do seu cliente), selecione um cliente BPO no cabeçalho.
                    </p>
                </div>
            </div>
        );
    }

    const filteredClients = clients.filter(c =>
        (c.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.doc_numero || "").includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-light tracking-tight text-foreground">Clientes Faturados</h1>
                        <p className="text-sm text-muted-foreground font-light uppercase tracking-widest text-[10px]">
                            {selectedClient.nome_fantasia || selectedClient.razao_social}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="font-light" onClick={handleDownloadTemplate}>
                        <Download className="h-4 w-4 mr-2" /> Modelo
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="faturado-upload"
                            onChange={handleImportExcel}
                        />
                        <Button variant="outline" size="sm" className="font-light" asChild>
                            <label htmlFor="faturado-upload" className="cursor-pointer">
                                <FileUp className="h-4 w-4 mr-2" /> Importar
                            </label>
                        </Button>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                            setEditingId(null);
                            setFormData({ nome: "", razao_social: "", doc_tipo: "cnpj", doc_numero: "", email: "", telefone: "" });
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white font-light px-6"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ nome: "", razao_social: "", doc_tipo: "cnpj", doc_numero: "", email: "", telefone: "" });
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Faturado
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-card border-border">
                            <DialogHeader>
                                <DialogTitle className="font-light text-xl">{editingId ? 'Editar Faturado' : 'Novo Faturado'}</DialogTitle>
                                <DialogDescription className="font-light text-sm">
                                    {editingId ? 'Atualize os dados do faturado.' : `Cadastre um novo cliente para ${selectedClient.nome_fantasia || selectedClient.razao_social}.`}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveClient} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="nome" className="text-xs font-light uppercase tracking-wider">Nome / Nome Fantasia</Label>
                                        <Input
                                            id="nome"
                                            required
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            className="bg-muted/30 border-border font-light"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="razao_social" className="text-xs font-light uppercase tracking-wider">Razão Social</Label>
                                        <Input
                                            id="razao_social"
                                            value={formData.razao_social}
                                            onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                                            className="bg-muted/30 border-border font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="doc_tipo" className="text-xs font-light uppercase tracking-wider">Tipo Documento</Label>
                                        <Select
                                            value={formData.doc_tipo}
                                            onValueChange={(v) => setFormData({ ...formData, doc_tipo: v })}
                                        >
                                            <SelectTrigger className="bg-muted/30 border-border font-light">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border">
                                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                                <SelectItem value="cpf">CPF</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="doc_numero" className="text-xs font-light uppercase tracking-wider">Número</Label>
                                        <Input
                                            id="doc_numero"
                                            required
                                            value={formData.doc_numero}
                                            onChange={(e) => setFormData({ ...formData, doc_numero: e.target.value })}
                                            className="bg-muted/30 border-border font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-light uppercase tracking-wider">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-muted/30 border-border font-light"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telefone" className="text-xs font-light uppercase tracking-wider">Telefone</Label>
                                        <Input
                                            id="telefone"
                                            value={formData.telefone}
                                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                            className="bg-muted/30 border-border font-light"
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-light">Cancelar</Button>
                                    <Button type="submit" disabled={loading} className="bg-primary text-white font-light px-8">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        {editingId ? 'Salvar Alterações' : 'Salvar Faturado'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>


            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription className="text-[10px] uppercase tracking-wider font-light">Total de Faturados</CardDescription>
                        <CardTitle className="text-2xl font-light">{clients.length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Table Section */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por Nome ou Documento..."
                                className="pl-9 bg-muted/50 border-border font-light h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead className="font-light text-[11px] uppercase tracking-widest pl-6 py-4">Nome / Empresa</TableHead>
                                    <TableHead className="font-light text-[11px] uppercase tracking-widest py-4">Documento</TableHead>
                                    <TableHead className="font-light text-[11px] uppercase tracking-widest py-4">Email</TableHead>
                                    <TableHead className="text-right font-light text-[11px] uppercase tracking-widest pr-6 py-4">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetching && clients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground font-light hover:bg-transparent">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="h-8 w-8 opacity-10" />
                                                <p>Nenhum faturado encontrado para este cliente.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((client) => (
                                        <TableRow key={client.id} className="border-border/50 hover:bg-muted/10 transition-colors group">
                                            <TableCell className="font-light py-4 pl-6 text-sm text-foreground">
                                                <div className="flex flex-col">
                                                    <span>{client.nome}</span>
                                                    {client.razao_social && <span className="text-[10px] text-muted-foreground">{client.razao_social}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-light text-xs text-muted-foreground uppercase">{client.doc_tipo}: {client.doc_numero}</TableCell>
                                            <TableCell className="font-light text-xs text-muted-foreground">{client.email || '---'}</TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => startEdit(client)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteClient(client.id)}
                                                        className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5"
                                                    >
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
        </div>
    );
};
export default ClientesContabilidade;
