import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Upload, FileText, AlertTriangle, Loader2 } from "lucide-react";
// Logo removed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/components/integrations/supabase/client";
import { toast } from "sonner";

interface PayrollItemInfo {
  id: string;
  nf_share_token: string;
  base_value: number;
  total_value: number;
  nf_status: string;
  nf_url: string | null;
  person_id: string;
  person_name?: string;
  person_cnpj?: string;
  month?: number;
  year?: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const EnviarNfPj = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<PayrollItemInfo | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [nfNumber, setNfNumber] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Link inválido. Token não encontrado.");
      setLoading(false);
      return;
    }
    loadItem(token);
  }, [token]);

  const loadItem = async (shareToken: string) => {
    try {
      // Fetch payroll item by share token
      const { data: itemData, error: itemError } = await supabase
        .from("payroll_items")
        .select("*")
        .eq("nf_share_token", shareToken)
        .single();

      if (itemError || !itemData) {
        setError("Link inválido ou expirado.");
        setLoading(false);
        return;
      }

      // Fetch person info
      const { data: personData } = await supabase
        .from("people")
        .select("name, cnpj")
        .eq("id", (itemData as any).person_id)
        .single();

      // Fetch payroll sheet for period info
      const { data: sheetData } = await supabase
        .from("payroll_sheets")
        .select("month, year")
        .eq("id", (itemData as any).payroll_id)
        .single();

      setItem({
        id: (itemData as any).id,
        nf_share_token: (itemData as any).nf_share_token,
        base_value: Number((itemData as any).base_value),
        total_value: Number((itemData as any).total_value),
        nf_status: (itemData as any).nf_status,
        nf_url: (itemData as any).nf_url || null,
        person_id: (itemData as any).person_id,
        person_name: personData?.name || "—",
        person_cnpj: personData?.cnpj || undefined,
        month: (sheetData as any)?.month,
        year: (sheetData as any)?.year,
      });
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !item) return;

    setSubmitting(true);
    try {
      // Upload the NF file
      const filePath = `nf-pj/${item.id}/${Date.now()}_${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("payroll-nf")
        .upload(filePath, pdfFile);

      if (uploadError) {
        toast.error("Erro ao enviar arquivo.");
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("payroll-nf")
        .getPublicUrl(filePath);

      // Update payroll item with NF URL
      const { error: updateError } = await supabase
        .from("payroll_items")
        .update({
          nf_url: urlData.publicUrl,
          nf_status: "enviada",
        } as any)
        .eq("nf_share_token", item.nf_share_token);

      if (updateError) {
        toast.error("Erro ao registrar nota fiscal.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-light">Link Inválido</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-light">Nota Fiscal Enviada!</h1>
          <p className="text-muted-foreground">
            Sua nota fiscal foi recebida com sucesso e será validada pela equipe financeira.
          </p>
        </div>
      </div>
    );
  }

  if (item?.nf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-2xl font-light">NF Já Enviada</h1>
          <p className="text-muted-foreground">
            A nota fiscal para este período já foi enviada e está em processo de validação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">


          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <h2 className="font-light text-sm text-foreground">Envio de Nota Fiscal — Folha PJ</h2>
            <p className="text-sm text-muted-foreground">
              Por favor, anexe a Nota Fiscal referente ao período abaixo para que possamos processar seu pagamento.
            </p>
            <p className="text-sm text-muted-foreground">
              Em caso de dúvidas, entre em contato com o financeiro:{" "}
              <a href="mailto:financeiro@decodingp.com" className="text-primary font-light hover:underline">
                financeiro@decodingp.com
              </a>
            </p>
          </div>

          {/* Item details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Prestador:</span>
                <p className="font-light">{item?.person_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CNPJ:</span>
                <p className="font-light">{item?.person_cnpj || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Período:</span>
                <p className="font-light">
                  {item?.month && item?.year ? `${MONTHS_FULL[item.month - 1]} / ${item.year}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Esperado:</span>
                <p className="font-light text-primary">{fmt(item?.total_value || 0)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Número da NF (opcional)</Label>
              <Input
                value={nfNumber}
                onChange={e => setNfNumber(e.target.value)}
                placeholder="Ex: 001234"
              />
            </div>

            <div className="space-y-2">
              <Label>Nota Fiscal (PDF) *</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-light">{pdfFile.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPdfFile(null)} className="text-xs text-muted-foreground">
                      Remover
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1.5">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para anexar PDF da nota fiscal</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 10 * 1024 * 1024) {
                          toast.error("Arquivo muito grande. O tamanho máximo é 10MB.");
                          return;
                        }
                        setPdfFile(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !pdfFile}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando...</>
              ) : (
                "Enviar Nota Fiscal"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnviarNfPj;



