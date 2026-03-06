import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Send, Plus, Trash2, Loader2, RefreshCw, CheckCircle2, Clock,
  XCircle, FileSignature, Users, Bell, Download, Eye, FileSearch
} from "lucide-react";
import jsPDF from "jspdf";

type Signer = {
  name: string;
  email: string;
  cpf: string;
  role: string;
  sign_order: number;
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  em_revisao: { label: "Em Revisão", variant: "outline" },
  aprovado: { label: "Aprovado", variant: "default" },
  enviado_assinatura: { label: "Enviado p/ Assinatura", variant: "default" },
  assinado_parcialmente: { label: "Assinado Parcialmente", variant: "outline" },
  assinado: { label: "Assinado", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const CLICKSIGN_STATUS_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  documento_enviado: { label: "Documento Enviado", icon: <Send className="h-4 w-4" /> },
  aguardando_assinaturas: { label: "Aguardando Assinaturas", icon: <Clock className="h-4 w-4" /> },
  assinado: { label: "Assinado", icon: <CheckCircle2 className="h-4 w-4 text-primary" /> },
  cancelado: { label: "Cancelado", icon: <XCircle className="h-4 w-4 text-red-500" /> },
};

export function ContractSignature() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [showSignersDialog, setShowSignersDialog] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([{ name: "", email: "", cpf: "", role: "signatário", sign_order: 1 }]);
  const [loading, setLoading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts-for-signature"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, title, status, clicksign_status, clicksign_document_key, generated_content, final_pdf_url, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contractSigners = [] } = useQuery({
    queryKey: ["contract-signers", selectedContract],
    enabled: !!selectedContract,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_signers")
        .select("*")
        .eq("contract_id", selectedContract!)
        .order("sign_order");
      if (error) throw error;
      return data;
    },
  });

  const callClicksign = async (action: string, extra: Record<string, any> = {}) => {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clicksign-integration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action, userId: user?.id, ...extra }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Erro ${resp.status}`);
    }
    return resp.json();
  };

  const handleUploadToClicksign = async (contractId: string) => {
    setLoading(contractId);
    try {
      await callClicksign("upload_document", { contractId });
      toast.success("Contrato enviado para Clicksign!");
      queryClient.invalidateQueries({ queryKey: ["contracts-for-signature"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleAddSigners = async () => {
    if (!selectedContract) return;
    const validSigners = signers.filter((s) => s.name && s.email);
    if (validSigners.length === 0) {
      toast.error("Adicione pelo menos um signatário válido");
      return;
    }

    setLoading("signers");
    try {
      // Save signers to DB first
      const { data: savedSigners, error } = await supabase
        .from("contract_signers")
        .insert(
          validSigners.map((s) => ({
            contract_id: selectedContract,
            user_id: user!.id,
            name: s.name,
            email: s.email,
            cpf: s.cpf || null,
            role: s.role,
            sign_order: s.sign_order,
          }))
        )
        .select();
      if (error) throw error;

      // Send to Clicksign
      await callClicksign("create_signer", {
        contractId: selectedContract,
        signers: savedSigners?.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          cpf: s.cpf,
          role: s.role,
          sign_order: s.sign_order,
        })),
      });

      toast.success("Signatários adicionados e notificados!");
      setShowSignersDialog(false);
      setSigners([{ name: "", email: "", cpf: "", role: "signatário", sign_order: 1 }]);
      queryClient.invalidateQueries({ queryKey: ["contract-signers"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-for-signature"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleCheckStatus = async (contractId: string) => {
    setLoading(contractId);
    try {
      const result = await callClicksign("check_status", { contractId });
      toast.success(`Status: ${CLICKSIGN_STATUS_MAP[result.status]?.label || result.status}`);
      queryClient.invalidateQueries({ queryKey: ["contracts-for-signature"] });
      queryClient.invalidateQueries({ queryKey: ["contract-signers"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleNotify = async (contractId: string) => {
    setLoading(contractId);
    try {
      await callClicksign("notify_signers", { contractId });
      toast.success("Notificação reenviada aos signatários!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const addSignerRow = () => {
    setSigners([...signers, { name: "", email: "", cpf: "", role: "signatário", sign_order: signers.length + 1 }]);
  };

  const removeSignerRow = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const updateSigner = (index: number, field: keyof Signer, value: string | number) => {
    setSigners(signers.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const generatePdfPreview = (content: string) => {
    const pdf = new jsPDF({ format: "a4", unit: "mm" });
    const marginLeft = 20;
    const marginTop = 25;
    const marginBottom = 20;
    const pageWidth = 210 - marginLeft * 2;
    const pageHeight = 297;
    const lineHeight = 6;
    let y = marginTop;

    const lines = content.split("\n");
    for (const rawLine of lines) {
      let line = rawLine.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").trim();
      const isTitle = rawLine.startsWith("#") || rawLine.startsWith("**") || /^CL[ÁA]USULA/i.test(line);

      if (isTitle) {
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(12);
      } else {
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(10);
      }

      if (!line) {
        y += lineHeight * 0.5;
        if (y > pageHeight - marginBottom) { pdf.addPage(); y = marginTop; }
        continue;
      }

      const splitLines: string[] = pdf.splitTextToSize(line, pageWidth);
      for (const sl of splitLines) {
        if (y > pageHeight - marginBottom) { pdf.addPage(); y = marginTop; }
        pdf.text(sl, marginLeft, y);
        y += lineHeight;
      }
      if (isTitle) y += lineHeight * 0.3;
    }

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const readyContracts = contracts.filter((c: any) => c.generated_content);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" /> Assinatura Digital
          </CardTitle>
          <CardDescription>
            Envie contratos para assinatura via Clicksign, defina signatários e acompanhe o status em tempo real
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : readyContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-light">Nenhum contrato pronto para assinatura</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Gere um contrato na aba "Gerador" primeiro
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {readyContracts.map((contract: any) => {
            const csStatus = CLICKSIGN_STATUS_MAP[contract.clicksign_status];
            const status = STATUS_MAP[contract.status] || STATUS_MAP.rascunho;
            const isProcessing = loading === contract.id;
            const hasClicksignKey = !!contract.clicksign_document_key;

            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-light text-sm truncate">{contract.title}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(contract.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        {csStatus && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {csStatus.icon} {csStatus.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!hasClicksignKey ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generatePdfPreview(contract.generated_content)}
                          >
                            <FileSearch className="h-4 w-4 mr-1" />
                            Preview PDF
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUploadToClicksign(contract.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Enviar p/ Clicksign
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract.id);
                              setShowSignersDialog(true);
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" /> Signatários
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckStatus(contract.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotify(contract.id)}
                            disabled={isProcessing}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          {contract.final_pdf_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={contract.final_pdf_url} target="_blank" rel="noopener">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContract(selectedContract === contract.id ? null : contract.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Signers list for selected contract */}
                  {selectedContract === contract.id && contractSigners.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-xs font-light text-muted-foreground">Signatários:</p>
                      {contractSigners.map((signer: any) => (
                        <div key={signer.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2">
                          <div>
                            <span className="font-light">{signer.name}</span>
                            <span className="text-muted-foreground ml-2">{signer.email}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{signer.role}</Badge>
                          </div>
                          <div>
                            {signer.signed_at ? (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Assinado em {new Date(signer.signed_at).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Signers Dialog */}
      <Dialog open={showSignersDialog} onOpenChange={setShowSignersDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Adicionar Signatários
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {signers.map((signer, index) => (
                <Card key={index}>
                  <CardContent className="py-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-light">Signatário {index + 1}</span>
                      {signers.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeSignerRow(index)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome *</Label>
                        <Input
                          value={signer.name}
                          onChange={(e) => updateSigner(index, "name", e.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">E-mail *</Label>
                        <Input
                          type="email"
                          value={signer.email}
                          onChange={(e) => updateSigner(index, "email", e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CPF</Label>
                        <Input
                          value={signer.cpf}
                          onChange={(e) => updateSigner(index, "cpf", e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Papel</Label>
                        <Select value={signer.role} onValueChange={(v) => updateSigner(index, "role", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="signatário">Signatário</SelectItem>
                            <SelectItem value="testemunha">Testemunha</SelectItem>
                            <SelectItem value="interveniente">Interveniente</SelectItem>
                            <SelectItem value="aprovador">Aprovador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addSignerRow} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Signatário
              </Button>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignersDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddSigners} disabled={loading === "signers"}>
              {loading === "signers" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Enviar e Notificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={(open) => {
        setShowPreview(open);
        if (!open && previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      }}>
        <DialogContent className="max-w-4xl h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" /> Preview do PDF
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full flex-1 rounded border"
              style={{ height: "calc(85vh - 120px)" }}
              title="Preview do contrato PDF"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



