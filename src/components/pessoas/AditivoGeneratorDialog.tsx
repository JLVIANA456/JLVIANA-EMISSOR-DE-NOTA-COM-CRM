import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import {
  FileSignature, Loader2, Sparkles, Copy, Check, Send, Mail,
} from "lucide-react";
import type { Person, SalaryAdjustment } from "@/hooks/usePeople";

interface AditivoGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  adjustment: SalaryAdjustment;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AditivoGeneratorDialog({ open, onOpenChange, person, adjustment }: AditivoGeneratorDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newRole, setNewRole] = useState(person.role || "");
  const [newResponsibilities, setNewResponsibilities] = useState("");
  const [contractRef, setContractRef] = useState("");

  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<string | null>(null);
  const [sendingClicksign, setSendingClicksign] = useState(false);
  const [copied, setCopied] = useState(false);

  const pct = adjustment.change_percentage;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const form = {
        contract_type: "aditivo_contratual",
        company_cnpj: "",
        company_razao_social: "",
        company_nome_fantasia: "Decoding Potentials",
        company_address: "",
        company_representative: "",
        company_representative_cpf: "",
        company_representative_role: "",
        contractor_cnpj: person.cnpj || "",
        contractor_razao_social: person.razao_social || person.name,
        contractor_address: person.address || "",
        contractor_representative: person.name,
        contractor_representative_cpf: "",
        contractor_bank_details: "",
        contractor_pix: "",
        contractor_tax_regime: person.tax_regime || "",
        contract_value: adjustment.new_value.toString(),
        payment_method: "PIX",
        contract_duration: "",
        start_date: adjustment.effective_date,
        end_date: "",
        scope_summary: `TERMO ADITIVO — Alteração de remuneração e${newResponsibilities ? " escopo" : ""}.

REFERÊNCIA AO CONTRATO ORIGINAL: ${contractRef || "[A PREENCHER]"}

ALTERAÇÃO DE REMUNERAÇÃO:
- Valor anterior: ${fmt(adjustment.old_value)}
- Novo valor: ${fmt(adjustment.new_value)}
- Variação: ${pct > 0 ? "+" : ""}${pct.toFixed(1)}%
- Data de vigência: ${new Date(adjustment.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}
- Motivo: ${adjustment.reason || "Reajuste contratual"}

${newRole !== person.role ? `ALTERAÇÃO DE CARGO/POSIÇÃO:\n- Posição anterior: ${person.role}\n- Nova posição: ${newRole}\n` : ""}
${newResponsibilities ? `NOVAS RESPONSABILIDADES:\n${newResponsibilities}\n` : ""}

IMPORTANTE: Este é um TERMO ADITIVO ao contrato de prestação de serviços. NÃO é um contrato novo. 
Mantenha linguagem PJ segura: sem subordinação, sem controle de jornada, sem pessoalidade excessiva.
Use termos como "autonomia estratégica", "responsável pela condução de", "prestará os seguintes serviços adicionais".
Inclua cláusula: "Permanecem inalteradas as demais cláusulas e condições do contrato original."`,
        termination_penalty: "10",
        has_confidentiality: true,
        has_intellectual_property: false,
        has_exclusivity: false,
      };

      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: { form },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedContent(data.content);
    } catch (err: any) {
      toast.error("Erro ao gerar aditivo", { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !generatedContent) return;
    setSaving(true);
    try {
      const title = `Aditivo — ${person.name} — ${new Date(adjustment.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}`;
      const { data, error } = await supabase.from("contracts").insert({
        user_id: user.id,
        title,
        contract_type: "aditivo_contratual" as any,
        category: "pj" as any,
        status: "rascunho" as any,
        generated_content: generatedContent,
        contractor_cnpj: person.cnpj || null,
        contractor_razao_social: person.razao_social || person.name,
        contract_value: adjustment.new_value,
        start_date: adjustment.effective_date,
        salary_adjustment_id: adjustment.id,
        scope_summary: adjustment.reason || "Reajuste contratual",
      } as any).select("id").single();

      if (error) throw error;
      setSavedContractId(data.id);
      queryClient.invalidateQueries({ queryKey: ["contracts-for-signature"] });
      queryClient.invalidateQueries({ queryKey: ["pj-contracts"] });
      toast.success("Aditivo salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar aditivo", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendToClicksign = async () => {
    if (!savedContractId || !user?.id) return;
    setSendingClicksign(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clicksign-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "upload_document",
            contractId: savedContractId,
            userId: user.id,
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${resp.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["contracts-for-signature"] });
      toast.success("Aditivo enviado para Clicksign! Adicione os signatários na aba Contratos Inteligentes → Assinatura Digital.");
    } catch (err: any) {
      toast.error("Erro ao enviar para Clicksign", { description: err.message });
    } finally {
      setSendingClicksign(false);
    }
  };

  const emailTemplate = `Assunto: Formalização de Nova Atuação | ${person.name}

Olá, ${person.name},

É com muita satisfação que formalizamos sua nova atuação na Decoding Potentials.

A partir de ${new Date(adjustment.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}, ${newRole && newRole !== person.role ? `você passará a atuar como ${newRole}, ampliando seu escopo de contribuição dentro da empresa.` : `formalizamos o reajuste da sua remuneração mensal.`}

Essa evolução reconhece:
• Sua entrega consistente
• Seu alinhamento com nossa cultura
• Sua capacidade de assumir responsabilidades estratégicas

Em anexo, segue o Termo Aditivo ao Contrato de Prestação de Serviços formalizando:
• ${newRole && newRole !== person.role ? "Atualização de escopo" : "Manutenção do escopo atual"}
• Nova remuneração: ${fmt(adjustment.new_value)} (anteriormente ${fmt(adjustment.old_value)})
• Data de início: ${new Date(adjustment.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}

Seguimos confiantes no seu crescimento conosco.

Conte comigo.

Karen Cartagena
Founder | Decoding Potentials`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopied(true);
    toast.success("E-mail copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Gerar Aditivo Contratual
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Colaborador:</span>
                <span className="font-light">{person.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ:</span>
                <span className="font-mono text-xs">{person.cnpj || "Não informado"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reajuste:</span>
                <span>
                  {fmt(adjustment.old_value)} → {fmt(adjustment.new_value)}{" "}
                  <Badge variant={pct >= 0 ? "default" : "destructive"} className="text-[10px] px-1 h-4 ml-1">
                    {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                  </Badge>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data efetiva:</span>
                <span>{new Date(adjustment.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
              </div>
              {adjustment.reason && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motivo:</span>
                  <span>{adjustment.reason}</span>
                </div>
              )}
            </div>

            {/* Extra fields */}
            {!generatedContent && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Referência ao Contrato Original</Label>
                  <Input
                    value={contractRef}
                    onChange={(e) => setContractRef(e.target.value)}
                    placeholder="Ex: Contrato nº 001/2025 de 01/03/2025"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Novo Cargo/Posição (se houver mudança)</Label>
                  <Input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder={person.role || "Manter cargo atual"}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Novas Responsabilidades (opcional)</Label>
                  <Textarea
                    value={newResponsibilities}
                    onChange={(e) => setNewResponsibilities(e.target.value)}
                    placeholder="Descreva as novas responsabilidades macro, se houver alteração de escopo..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Generated content preview */}
            {generatedContent && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-light">Preview do Aditivo</Label>
                  <div className="rounded-lg border bg-card p-4 prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{generatedContent}</ReactMarkdown>
                  </div>
                </div>

                {/* Email template */}
                {savedContractId && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-light flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Modelo de E-mail de Formalização
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Copie e envie manualmente para o colaborador
                      </p>
                      <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono text-xs">
                        {emailTemplate}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={handleCopyEmail}
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copiado!" : "Copiar E-mail"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-wrap gap-2">
          {!generatedContent ? (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Gerando..." : "Gerar Aditivo com IA"}
            </Button>
          ) : !savedContractId ? (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              {saving ? "Salvando..." : "Salvar Aditivo"}
            </Button>
          ) : (
            <Button onClick={handleSendToClicksign} disabled={sendingClicksign} className="gap-2">
              {sendingClicksign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sendingClicksign ? "Enviando..." : "Enviar para Clicksign"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



