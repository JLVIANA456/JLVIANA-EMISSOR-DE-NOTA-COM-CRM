import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Plus, Download, Send, Settings, CheckCircle2, AlertCircle, Loader2, RefreshCcw, Building2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceRequest } from "@/types/invoice";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PHP_BRIDGE_URL = "http://localhost:8001/server.php";

const EmissaoNotas = () => {
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<InvoiceRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isServerUp, setIsServerUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState({
    cnpj: localStorage.getItem("nf_sp_cnpj") || "",
    certificate: localStorage.getItem("nf_sp_cert_path") || "",
    password: localStorage.getItem("nf_sp_cert_pass") || "",
    im: localStorage.getItem("nf_sp_im") || "",
    simplesNacional: localStorage.getItem("nf_sp_simples") === "true",
    naturezaPadrao: localStorage.getItem("nf_sp_natureza") || "1",
  });

  const onFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Browsers provide a fake path like C:\fakepath\file.pfx
      // We take the name and alert the user it's a hint
      const filePath = file.name;
      setConfig({ ...config, certificate: filePath });
      toast.info(`Arquivo selecionado: ${filePath}. Lembre-se que o PHP precisa do caminho completo.`);
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoice_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as unknown as InvoiceRequest[]);
    }
    setLoading(false);
  }, []);

  const checkServer = async () => {
    try {
      const res = await fetch(PHP_BRIDGE_URL, { method: "OPTIONS" });
      setIsServerUp(res.ok || res.status === 200 || res.status === 204);
    } catch {
      setIsServerUp(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    checkServer();
  }, [fetchRequests]);

  const handleSaveConfig = () => {
    localStorage.setItem("nf_sp_cnpj", config.cnpj);
    localStorage.setItem("nf_sp_cert_path", config.certificate);
    localStorage.setItem("nf_sp_cert_pass", config.password);
    localStorage.setItem("nf_sp_im", config.im);
    localStorage.setItem("nf_sp_simples", String(config.simplesNacional));
    localStorage.setItem("nf_sp_natureza", config.naturezaPadrao);
    toast.success("Configurações salvas!");
    checkServer();
  };

  const emitirNota = async (request: InvoiceRequest) => {
    if (!isServerUp) {
      toast.error("Servidor PHP Offline. Verifique a porta 8001.");
      return;
    }

    setActionLoading(request.id);
    try {
      const response = await fetch(PHP_BRIDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "emitir",
          config: config,
          data: {
            valorServicos: Number(request.gross_value),
            codigoServico: request.service_code_municipal || "02881",
            aliquotaServicos: (request.iss_aliq || 2) / 100,
            issRetido: request.iss_retained,
            valorDeducoes: Number(request.deductions_value || 0),
            cnpjTomador: request.client_document.replace(/\D/g, ""),
            razaoSocialTomador: request.client_name,
            inscricaoMunicipalTomador: request.client_inscricao_municipal?.replace(/\D/g, ""),
            logradouro: request.client_address,
            numeroEndereco: request.client_address_number || "SN",
            complemento: request.client_address_complement || "",
            bairro: request.client_neighborhood || "",
            cidade: request.client_city === "São Paulo" ? "3550308" : (request.client_city || "3550308"),
            uf: request.client_state || "SP",
            cep: request.client_zip_code?.replace(/\D/g, "") || "00000000",
            emailTomador: request.client_email,
            discriminacao: request.description,
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Nota emitida com sucesso!");
        await supabase
          .from("invoice_requests" as any)
          .update({ status: "emitida", issued_at: new Date().toISOString() } as any)
          .eq("id", request.id);
        fetchRequests();
      } else {
        toast.error("Erro na prefeitura: " + (result.error || "Erro desconhecido"));
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor PHP.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportExcel = () => {
    const issued = requests.filter(r => r.status === 'emitida');
    if (issued.length === 0) {
      toast.error("Nenhuma nota emitida para exportar");
      return;
    }

    const data = issued.map(r => ({
      "Cliente": r.client_name,
      "Documento": r.client_document,
      "Valor (R$)": Number(r.gross_value),
      "Data Emissão": r.issued_at ? new Date(r.issued_at).toLocaleDateString('pt-BR') : '',
      "Descrição": r.description,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notas Emitidas");
    XLSX.writeFile(wb, `notas-sp-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const pendingNotes = requests.filter(r => r.status === "emissao_andamento" || r.status === "enviada_analista" || r.status === "rascunho");
  const issuedNotes = requests.filter(r => r.status === "emitida");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Centralizado e Limpo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Nota do Milhão</h1>
            <p className="text-sm text-muted-foreground font-light">
              Emissor Municipal São Paulo • {isServerUp ?
                <span className="text-green-600 inline-flex items-center gap-1 font-medium"><CheckCircle2 className="h-3 w-3" /> Servidor Ativo</span> :
                <span className="text-amber-600 inline-flex items-center gap-1 font-medium"><AlertCircle className="h-3 w-3" /> Servidor Offline</span>
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2 font-light">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 font-light text-primary border-primary/20 hover:bg-primary/5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="lg" onClick={() => { setEditingRequest(null); setFormOpen(true); }} className="gap-2 gradient-brand text-white shadow-xl shadow-primary/20">
            <Plus className="h-5 w-5" />
            Nova Nota
          </Button>
        </div>
      </div>

      {/* Grid de Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Lado Esquerdo: Configurações (Se visível) ou Stats */}
        {showSettings && (
          <div className="lg:col-span-12">
            <Card className="border-border/50 shadow-sm animate-in fade-in slide-in-from-top-4">
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-light">Configurações do Emissor</CardTitle>
                  <CardDescription>Credenciais salvas apenas localmente neste navegador.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>Fechar</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">CNPJ Prestador</Label>
                    <Input value={config.cnpj} onChange={e => setConfig({ ...config, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CCM (Inscrição Municipal)</Label>
                    <Input value={config.im} onChange={e => setConfig({ ...config, im: e.target.value })} placeholder="1234567" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Senha do Certificado</Label>
                    <Input type="password" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })} placeholder="******" />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs">Caminho do Certificado (.pfx ou .pem)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={config.certificate}
                        onChange={e => setConfig({ ...config, certificate: e.target.value })}
                        placeholder="Ex: C:/Certificados/empresa.pfx"
                        className="flex-1"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileBrowse}
                        accept=".pfx,.pem"
                        className="hidden"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 shrink-0 font-light"
                      >
                        <Search className="h-4 w-4" />
                        Procurar
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <Switch checked={config.simplesNacional} onCheckedChange={v => setConfig({ ...config, simplesNacional: v })} />
                    <Label className="font-light text-sm">Empresa no Simples Nacional?</Label>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">Natureza da Operação Padrão</Label>
                    <Select value={config.naturezaPadrao} onValueChange={v => setConfig({ ...config, naturezaPadrao: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Tributação no Município (Normal)</SelectItem>
                        <SelectItem value="2">Tributação Fora do Município</SelectItem>
                        <SelectItem value="3">Isenção</SelectItem>
                        <SelectItem value="4">Imunidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveConfig} className="gap-2">
                    <Save className="h-4 w-4" /> Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fila de Emissão (Pendentes) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-light flex items-center gap-2">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-primary`} />
              Fila de Emissão
            </h2>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{pendingNotes.length} pendentes</span>
          </div>

          <div className="grid gap-3">
            {pendingNotes.map(request => (
              <Card key={request.id} className="border-border/40 hover:border-primary/20 transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-1 bg-amber-400" />
                    <div className="p-4 flex-1 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-foreground">{request.client_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          R$ {Number(request.gross_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} •
                          <span className="truncate max-w-[200px]">{request.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingRequest(request); setFormOpen(true); }} className="h-8 text-[11px] font-light">Editar</Button>
                        <Button
                          size="sm"
                          onClick={() => emitirNota(request)}
                          disabled={actionLoading === request.id || !isServerUp}
                          className="h-8 gap-2 bg-primary text-white text-[11px] font-medium min-w-[100px]"
                        >
                          {actionLoading === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          Enviar SP
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingNotes.length === 0 && (
              <div className="text-center py-16 border border-dashed rounded-2xl bg-card/30">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="h-8 w-8 opacity-20" />
                  <p className="font-light text-sm">Sua fila de emissão está vazia.</p>
                  <Button variant="link" onClick={() => setFormOpen(true)} className="text-primary font-light text-xs">Criar nova solicitação</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Histórico Recente (Emitidas) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-light px-1 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Ultimas Emitidas
          </h2>
          <div className="grid gap-3">
            {issuedNotes.slice(0, 10).map(request => (
              <div key={request.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card/30 hover:bg-card transition-colors">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{request.client_name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Emitida em {request.issued_at ? new Date(request.issued_at).toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <div className="text-[10px] font-light mt-1">
                    Valor: <span className="text-foreground">R$ {Number(request.gross_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            ))}
            {issuedNotes.length === 0 && (
              <div className="text-sm text-muted-foreground font-light text-center py-10 opacity-60">Nenhuma nota emitida recentemente.</div>
            )}
          </div>
        </div>
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={fetchRequests}
        editingRequest={editingRequest}
      />
    </div>
  );
};

export default EmissaoNotas;




