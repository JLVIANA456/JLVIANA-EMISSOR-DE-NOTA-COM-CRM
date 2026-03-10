import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceRequest, PAYMENT_METHOD_LABELS, BANK_DETAILS } from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

interface Props {
  request: InvoiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function generateEmailBody(r: InvoiceRequest): string {
  const competency = `${MONTHS[r.competency_month - 1]}/${r.competency_year}`;
  const dueDate = new Date(r.due_date).toLocaleDateString('pt-BR');
  const value = `R$ ${Number(r.gross_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const paymentMethod = PAYMENT_METHOD_LABELS[r.payment_method];

  let body = `Prezado(a),

Informamos que a nota fiscal referente à competência de ${competency} foi emitida e segue anexa a esta mensagem para os devidos fins.

Detalhes do documento:
• Descrição: ${r.description}
• Valor: ${value}
• Vencimento: ${dueDate}
• Forma de pagamento: ${paymentMethod}`;

  if (r.show_bank_details) {
    body += `

Dados para pagamento:
• Banco: ${BANK_DETAILS.banco}
• Agência: ${BANK_DETAILS.agencia}
• Conta: ${BANK_DETAILS.conta}
• CNPJ: ${BANK_DETAILS.cnpj}
• PIX: ${BANK_DETAILS.pix}`;
  }

  body += `

Solicitamos a gentileza de confirmar o recebimento desta nota fiscal respondendo a este e-mail.

Caso haja qualquer divergência ou necessidade de esclarecimento, estamos à disposição.

Atenciosamente,
Equipe Financeira
Decoding People
financeiro@decodingp.com`;

  return body;
}

function generateSubject(r: InvoiceRequest): string {
  const competency = `${String(r.competency_month).padStart(2, '0')}/${r.competency_year}`;
  return `Nota Fiscal - ${r.client_name} - Competência ${competency}`;
}

export function InvoiceEmailDialog({ request, open, onOpenChange }: Props) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (request && open) {
      setTo(request.client_email);
      setSubject(generateSubject(request));
      setBody(generateEmailBody(request));
    }
  }, [request, open]);

  const handleSend = async () => {
    if (!request || !to) return;
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to,
          subject,
          body,
          invoiceId: request.id,
        },
      });

      if (error) throw error;

      toast.success("E-mail enviado com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao enviar e-mail:", err);
      toast.error("Erro ao enviar e-mail: " + (err.message || "Tente novamente"));
    } finally {
      setSending(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Nota Fiscal por E-mail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="email-to">Destinatário</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@cliente.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Assunto</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Corpo do E-mail</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Revise o conteúdo antes de enviar. Você pode editar livremente o texto acima.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !to} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Enviando..." : "Enviar E-mail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



