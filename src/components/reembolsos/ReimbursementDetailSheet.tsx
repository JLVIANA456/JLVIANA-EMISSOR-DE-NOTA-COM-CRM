import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useReimbursements, STATUS_LABELS, STATUS_COLORS, ReimbursementStatusHistory } from "@/hooks/useReimbursements";
import { FileText, ExternalLink } from "lucide-react";

interface Props {
  requestId: string;
  open: boolean;
  onClose: () => void;
}

export function ReimbursementDetailSheet({ requestId, open, onClose }: Props) {
  const { requests, updateStatus, fetchHistory } = useReimbursements();
  const request = requests.find((r) => r.id === requestId);
  const [history, setHistory] = useState<ReimbursementStatusHistory[]>([]);
  const [justification, setJustification] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (requestId && open) {
      fetchHistory(requestId).then(setHistory).catch(() => {});
    }
  }, [requestId, open]);

  if (!request) return null;

  const handleAction = async (newStatus: string) => {
    if (newStatus === "recusado" && !justification.trim()) return;
    if (newStatus === "programado" && !scheduledDate) return;
    setActionLoading(true);
    await updateStatus.mutateAsync({ id: requestId, newStatus, justification, scheduledDate });
    setActionLoading(false);
    setJustification("");
    setScheduledDate("");
    fetchHistory(requestId).then(setHistory).catch(() => {});
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Reembolso {request.protocol_number}
            <Badge variant="secondary" className={STATUS_COLORS[request.status] || ""}>
              {STATUS_LABELS[request.status] || request.status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Colaborador:</span><br /><strong>{request.requester_name}</strong></div>
            <div><span className="text-muted-foreground">E-mail:</span><br />{request.requester_email}</div>
            <div><span className="text-muted-foreground">Departamento:</span><br />{request.department}</div>
            <div><span className="text-muted-foreground">Cargo:</span><br />{request.role_title}</div>
            <div><span className="text-muted-foreground">Categoria:</span><br />{request.category}</div>
            <div><span className="text-muted-foreground">Data da Despesa:</span><br />{new Date(request.expense_date).toLocaleDateString("pt-BR")}</div>
            <div className="col-span-2"><span className="text-muted-foreground">Descrição:</span><br />{request.description}</div>
            <div><span className="text-muted-foreground">Valor:</span><br /><strong className="text-lg">R$ {Number(request.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
            <div><span className="text-muted-foreground">Forma de Pagamento:</span><br />{request.payment_method === "pix" ? "PIX" : "Transferência Bancária"}</div>
          </div>

          {request.payment_method === "transferencia" && (
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-3 rounded-lg">
              <div><span className="text-muted-foreground">Banco:</span><br />{request.bank_name}</div>
              <div><span className="text-muted-foreground">Agência:</span><br />{request.agency}</div>
              <div><span className="text-muted-foreground">Conta:</span><br />{request.account_number}</div>
              <div><span className="text-muted-foreground">CPF Titular:</span><br />{request.cpf_holder}</div>
            </div>
          )}

          {request.payment_method === "pix" && request.pix_key && (
            <div className="text-sm bg-muted/50 p-3 rounded-lg">
              <span className="text-muted-foreground">Chave PIX:</span><br />{request.pix_key}
            </div>
          )}

          {request.receipt_url && (
            <a href={request.receipt_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <FileText className="h-4 w-4" /> Ver Comprovante <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {request.scheduled_payment_date && (
            <div className="text-sm"><span className="text-muted-foreground">Pagamento previsto:</span> {new Date(request.scheduled_payment_date).toLocaleDateString("pt-BR")}</div>
          )}
          {request.paid_at && (
            <div className="text-sm"><span className="text-muted-foreground">Pago em:</span> {new Date(request.paid_at).toLocaleDateString("pt-BR")} por {request.paid_by}</div>
          )}

          <Separator />

          {/* Actions */}
          {request.status === "aguardando_aprovacao" && (
            <div className="space-y-3">
              <Label>Observações</Label>
              <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justificativa (obrigatório para recusar)" />
              <div className="flex gap-2">
                <Button onClick={() => handleAction("aprovado")} disabled={actionLoading} className="flex-1">Aprovar</Button>
                <Button variant="destructive" onClick={() => handleAction("recusado")} disabled={actionLoading || !justification.trim()} className="flex-1">Recusar</Button>
              </div>
            </div>
          )}

          {request.status === "aprovado" && (
            <div className="space-y-3">
              <Label>Data prevista de pagamento *</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Observações (opcional)" />
              <Button onClick={() => handleAction("programado")} disabled={actionLoading || !scheduledDate} className="w-full">Programar Pagamento</Button>
            </div>
          )}

          {request.status === "programado" && (
            <div className="space-y-3">
              <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Observações (opcional)" />
              <Button onClick={() => handleAction("pago")} disabled={actionLoading} className="w-full">Confirmar Pagamento</Button>
            </div>
          )}

          <Separator />

          {/* Audit Log */}
          <div>
            <h3 className="font-light text-sm mb-2">Histórico de Alterações</h3>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum histórico.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="text-xs border-l-2 border-primary/30 pl-3 py-1">
                    <div className="font-light">
                      {h.old_status ? `${STATUS_LABELS[h.old_status] || h.old_status} → ` : ""}
                      {STATUS_LABELS[h.new_status] || h.new_status}
                    </div>
                    <div className="text-muted-foreground">
                      {h.changed_by} • {new Date(h.created_at).toLocaleString("pt-BR")}
                    </div>
                    {h.justification && <div className="text-muted-foreground italic mt-0.5">{h.justification}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}



