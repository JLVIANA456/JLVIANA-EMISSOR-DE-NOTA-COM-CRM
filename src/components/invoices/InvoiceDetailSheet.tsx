import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InvoiceWorkflow } from "./InvoiceWorkflow";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceEmailDialog } from "./InvoiceEmailDialog";
import {
  InvoiceRequest, InvoiceRequestStatus, STATUS_LABELS, REVENUE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS, FINANCIAL_CATEGORY_LABELS, COST_CENTER_LABELS,
  BANK_DETAILS, WORKFLOW_ORDER
} from "@/types/invoice";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, RotateCcw, Pencil, Copy, Mail } from "lucide-react";
import { useAuth } from "@/components/contexts/AuthContext";

interface Props {
  request: InvoiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  onEdit?: (request: InvoiceRequest) => void;
  onDuplicate?: (request: InvoiceRequest) => void;
}

export function InvoiceDetailSheet({ request, open, onOpenChange, onRefresh, onEdit, onDuplicate }: Props) {
  const { user } = useAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  if (!request) return null;

  const currentIdx = WORKFLOW_ORDER.indexOf(request.status);
  const nextStatus = currentIdx >= 0 && currentIdx < WORKFLOW_ORDER.length - 1
    ? WORKFLOW_ORDER[currentIdx + 1]
    : null;

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;

    const updates: Record<string, any> = { status: nextStatus };
    const now = new Date().toISOString();
    if (nextStatus === 'enviada_analista') updates.sent_to_analyst_at = now;
    if (nextStatus === 'emitida') updates.issued_at = now;
    if (nextStatus === 'enviada_cliente') updates.sent_to_client_at = now;
    if (nextStatus === 'pagamento_confirmado') updates.payment_confirmed_at = now;

    const { error } = await supabase
      .from('invoice_requests' as any)
      .update(updates as any)
      .eq('id', request.id);

    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
    } else {
      toast.success(`Status atualizado para: ${STATUS_LABELS[nextStatus]}`);
      onRefresh();
    }
  };

  const handleRevertStatus = async () => {
    if (currentIdx <= 0) return;
    const prevStatus = WORKFLOW_ORDER[currentIdx - 1];
    if (!confirm(`Deseja reverter o status para "${STATUS_LABELS[prevStatus]}"?`)) return;

    const { error } = await supabase
      .from('invoice_requests' as any)
      .update({ status: prevStatus } as any)
      .eq('id', request.id);

    if (error) {
      toast.error("Erro ao reverter: " + error.message);
    } else {
      toast.success(`Status revertido para: ${STATUS_LABELS[prevStatus]}`);
      onRefresh();
    }
  };

  const handleCancel = async () => {
    const { error } = await supabase
      .from('invoice_requests' as any)
      .update({ status: 'cancelada', cancelled_at: new Date().toISOString() } as any)
      .eq('id', request.id);

    if (error) {
      toast.error("Erro ao cancelar: " + error.message);
    } else {
      toast.success("Solicitação cancelada");
      onRefresh();
    }
  };

  const handleDuplicate = async () => {
    if (!user) return;
    // Advance competency month
    let newMonth = request.competency_month + 1;
    let newYear = request.competency_year;
    if (newMonth > 12) { newMonth = 1; newYear++; }

    // Advance due_date by 1 month
    const oldDue = new Date(request.due_date);
    const newDue = new Date(oldDue);
    newDue.setMonth(newDue.getMonth() + 1);

    // Advance desired_issue_date by 1 month
    const oldIssue = new Date(request.desired_issue_date);
    const newIssue = new Date(oldIssue);
    newIssue.setMonth(newIssue.getMonth() + 1);

    const { id, created_at, updated_at, status, sent_to_analyst_at, issued_at, sent_to_client_at, payment_confirmed_at, cancelled_at, invoice_pdf_url, invoice_xml_url, ...rest } = request;

    const payload = {
      ...rest,
      user_id: user.id,
      competency_month: newMonth,
      competency_year: newYear,
      due_date: newDue.toISOString().split('T')[0],
      desired_issue_date: newIssue.toISOString().split('T')[0],
      status: 'rascunho' as const,
    };

    const { error } = await supabase
      .from('invoice_requests' as any)
      .insert(payload as any);

    if (error) {
      toast.error("Erro ao duplicar: " + error.message);
    } else {
      toast.success(`Nota duplicada para ${String(newMonth).padStart(2, '0')}/${newYear}`);
      onOpenChange(false);
      onRefresh();
    }
  };

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">Solicitação de Emissão</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Workflow */}
          <InvoiceWorkflow currentStatus={request.status} />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {request.status !== 'cancelada' && (
              <Button size="sm" variant="outline" onClick={() => onEdit?.(request)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            {request.is_recurring && (
              <Button size="sm" variant="outline" onClick={handleDuplicate} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Duplicar próximo mês
              </Button>
            )}
            {(request.status === 'emitida' || request.status === 'enviada_cliente') && (
              <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)} className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Enviar por E-mail
              </Button>
            )}
            {currentIdx > 0 && request.status !== 'cancelada' && (
              <Button size="sm" variant="secondary" onClick={handleRevertStatus} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para: {STATUS_LABELS[WORKFLOW_ORDER[currentIdx - 1]]}
              </Button>
            )}
            {nextStatus && request.status !== 'cancelada' && (
              <Button size="sm" onClick={handleAdvanceStatus} className="gap-1.5">
                <ArrowRight className="h-3.5 w-3.5" />
                Avançar para: {STATUS_LABELS[nextStatus]}
              </Button>
            )}
            {request.status !== 'cancelada' && request.status !== 'pagamento_confirmado' && (
              <Button size="sm" variant="destructive" onClick={handleCancel} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            )}
          </div>

          <Separator />

          {/* Client Info */}
          <Section title="Dados do Cliente">
            <Field label="Cliente" value={request.client_name} />
            <Field label="CNPJ/CPF" value={request.client_document} />
            <Field label="E-mail" value={request.client_email} />
            <Field label="Contato" value={request.client_contact || '—'} />
            <Field label="Endereço" value={request.client_address} />
          </Section>

          <Separator />

          {/* Invoice Info */}
          <Section title="Informações da Nota">
            <Field label="Tipo" value={REVENUE_TYPE_LABELS[request.revenue_type]} />
            <Field label="Descrição" value={request.description} />
            <Field label="Competência" value={`${String(request.competency_month).padStart(2, '0')}/${request.competency_year}`} />
            <Field label="Emissão desejada" value={fmtDate(request.desired_issue_date)} />
            <Field label="Vencimento" value={fmtDate(request.due_date)} />
            <Field label="Valor" value={fmt(request.gross_value)} highlight />
          </Section>

          <Separator />

          {/* Payment */}
          <Section title="Pagamento">
            <Field label="Forma" value={PAYMENT_METHOD_LABELS[request.payment_method]} />
            {request.show_bank_details && (
              <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-0.5">
                <p className="font-light text-primary text-[11px] mb-1">Dados Bancários:</p>
                <p>Banco: {BANK_DETAILS.banco}</p>
                <p>Agência: {BANK_DETAILS.agencia}</p>
                <p>Conta: {BANK_DETAILS.conta}</p>
                <p>CNPJ: {BANK_DETAILS.cnpj}</p>
                <p>PIX: {BANK_DETAILS.pix}</p>
              </div>
            )}
          </Section>

          <Separator />

          {/* Classification */}
          <Section title="Classificação">
            <Field label="Categoria" value={FINANCIAL_CATEGORY_LABELS[request.financial_category]} />
            <Field label="Centro de Custo" value={COST_CENTER_LABELS[request.cost_center]} />
            {request.tags && request.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {request.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
              </div>
            )}
          </Section>

          {request.is_recurring && (
            <>
              <Separator />
              <Section title="Recorrência">
                <Field label="Dia fixo" value={request.recurring_day ? `Dia ${request.recurring_day}` : '—'} />
                <Field label="Término" value={fmtDate(request.recurring_end_date)} />
              </Section>
            </>
          )}

          {request.analyst_notes && (
            <>
              <Separator />
              <Section title="Observações">
                <p className="text-sm text-muted-foreground">{request.analyst_notes}</p>
              </Section>
            </>
          )}

          <Separator />

          {/* Tracking */}
          <Section title="Histórico">
            <Field label="Criado em" value={fmtDate(request.created_at)} />
            <Field label="Enviada analista" value={fmtDate(request.sent_to_analyst_at)} />
            <Field label="Emitida em" value={fmtDate(request.issued_at)} />
            <Field label="Enviada cliente" value={fmtDate(request.sent_to_client_at)} />
            <Field label="Pagamento confirmado" value={fmtDate(request.payment_confirmed_at)} />
          </Section>
        </div>

        <InvoiceEmailDialog
          request={request}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-light text-primary uppercase tracking-wide">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={highlight ? "font-light text-primary" : "font-light text-right max-w-[60%]"}>
        {value}
      </span>
    </div>
  );
}



