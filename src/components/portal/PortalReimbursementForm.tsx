import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Upload, FileText, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { REIMBURSEMENT_CATEGORIES, DEPARTMENTS } from "@/hooks/useReimbursements";

interface PortalReimbursementFormProps {
  person: { name: string; email: string | null; role: string; cnpj: string | null };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PortalReimbursementForm({ person, onSuccess, onCancel }: PortalReimbursementFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [form, setForm] = useState({
    requester_name: person.name || "",
    requester_email: person.email || "",
    department: "",
    role_title: person.role || "",
    expense_date: "",
    category: "",
    description: "",
    amount: "",
    bank_name: "",
    agency: "",
    account_number: "",
    cpf_holder: "",
    pix_key: "",
    approver_name: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    const filePath = `receipts/${Date.now()}_${receiptFile.name}`;
    const { error } = await supabase.storage.from("reimbursement-attachments").upload(filePath, receiptFile);
    if (error) {
      toast.error("Erro ao enviar comprovante.");
      return null;
    }
    const { data } = supabase.storage.from("reimbursement-attachments").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      toast.error("Anexe o comprovante da despesa.");
      return;
    }
    setLoading(true);

    const receiptUrl = await uploadReceipt();
    if (!receiptUrl) {
      setLoading(false);
      return;
    }
    
    const protocolNumber = `RMB-${Date.now().toString().slice(-8)}`;

    const { error } = await supabase.from("reimbursement_requests" as any).insert({
      protocol_number: protocolNumber,
      requester_name: form.requester_name,
      requester_email: form.requester_email,
      department: form.department,
      role_title: form.role_title,
      expense_date: form.expense_date,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      payment_method: paymentMethod,
      bank_name: paymentMethod === "transferencia" ? form.bank_name : null,
      agency: paymentMethod === "transferencia" ? form.agency : null,
      account_number: paymentMethod === "transferencia" ? form.account_number : null,
      cpf_holder: form.cpf_holder || null,
      pix_key: paymentMethod === "pix" ? form.pix_key : null,
      receipt_url: receiptUrl,
      status: "aguardando_aprovacao",
      approver_name: form.approver_name || null,
    });

    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
      return;
    }



    setProtocol(protocolNumber);
    setSubmitted(true);
    toast.success("Reembolso enviado com sucesso!");
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
            <h2 className="text-xl font-light">Solicitação Enviada!</h2>
            <p className="text-muted-foreground">Seu reembolso foi registrado com sucesso.</p>
            <div className="rounded-lg bg-muted p-4 max-w-xs mx-auto">
              <p className="text-sm text-muted-foreground">Número do Protocolo</p>
              <p className="text-2xl font-light font-mono">{protocol}</p>
            </div>
            <p className="text-sm text-muted-foreground">Acompanhe o status da sua solicitação diretamente pelo portal.</p>
            <Button variant="outline" onClick={() => { setSubmitted(false); onSuccess?.(); }}>
              Voltar aos Reembolsos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const flatCategories = REIMBURSEMENT_CATEGORIES.flatMap((g) =>
    g.items.map((item) => (g.group === "Outras Despesas" ? item : `${g.group} > ${item}`))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Nova Solicitação de Reembolso</CardTitle>
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>Cancelar</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 text-sm text-muted-foreground space-y-2">
          <p><strong>Olá, colaborador(a)!</strong></p>
          <p>Este formulário é o canal oficial para solicitar o reembolso de despesas corporativas. Para garantir que sua solicitação seja processada de forma rápida e eficiente, por favor:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li><strong>Preencha todos os campos obrigatórios</strong> com atenção.</li>
            <li><strong>Anexe um comprovante fiscal válido</strong> (nota fiscal ou recibo).</li>
            <li><strong>Descreva detalhadamente</strong> o motivo de cada despesa.</li>
            <li><strong>Consulte a Política de Reembolso</strong> em caso de dúvidas.</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo <span className="text-destructive">*</span></Label>
              <Input
                required
                value={form.requester_name}
                onChange={(e) => handleChange("requester_name", e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail Corporativo <span className="text-destructive">*</span></Label>
              <Input required type="email" value={form.requester_email} onChange={(e) => handleChange("requester_email", e.target.value)} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Departamento/Setor <span className="text-destructive">*</span></Label>
              <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar opção..." /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo/Função <span className="text-destructive">*</span></Label>
              <Input required value={form.role_title} onChange={(e) => handleChange("role_title", e.target.value)} placeholder="Inserir texto" />
            </div>
          </div>

          {/* Expense Details */}
          <div>
            <h2 className="text-sm font-light uppercase tracking-wide text-muted-foreground mb-3">Detalhes da Despesa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data da Despesa <span className="text-destructive">*</span></Label>
                <Input required type="date" value={form.expense_date} onChange={(e) => handleChange("expense_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Categoria da Despesa <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar opção..." /></SelectTrigger>
                  <SelectContent>
                    {flatCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Descrição da Despesa <span className="text-destructive">*</span></Label>
              <p className="text-xs text-muted-foreground">Descreva detalhadamente o gasto, incluindo o motivo e a relação com a atividade profissional</p>
              <Textarea required rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Inserir texto" />
            </div>
            <div className="space-y-2 mt-4 max-w-xs">
              <Label>Valor <span className="text-destructive">*</span></Label>
              <Input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => handleChange("amount", e.target.value)} placeholder="Inserir moeda" />
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h2 className="text-sm font-light uppercase tracking-wide text-muted-foreground mb-3">Informações para Pagamento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Reembolso <span className="text-destructive">*</span></Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "pix" && (
                <div className="space-y-2">
                  <Label>Chave PIX <span className="text-destructive">*</span></Label>
                  <Input required value={form.pix_key} onChange={(e) => handleChange("pix_key", e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Banco <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Nome do banco (ex: Banco do Brasil, Itaú)</p>
                <Input required value={form.bank_name} onChange={(e) => handleChange("bank_name", e.target.value)} placeholder="Inserir texto" />
              </div>
              <div className="space-y-2">
                <Label>Agência <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Número da agência com dígito (ex: 1234-5)</p>
                <Input required value={form.agency} onChange={(e) => handleChange("agency", e.target.value)} placeholder="Inserir texto" />
              </div>
              <div className="space-y-2">
                <Label>Conta Corrente <span className="text-destructive">*</span></Label>
                <Input required value={form.account_number} onChange={(e) => handleChange("account_number", e.target.value)} placeholder="Inserir texto" />
              </div>
              <div className="space-y-2">
                <Label>CPF do Titular <span className="text-destructive">*</span></Label>
                <Input required value={form.cpf_holder} onChange={(e) => handleChange("cpf_holder", e.target.value)} placeholder="Inserir texto" />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h2 className="text-sm font-light uppercase tracking-wide text-muted-foreground mb-3">Anexos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comprovante da Despesa <span className="text-destructive">*</span></Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  {receiptFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-light">{receiptFile.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setReceiptFile(null)} className="text-xs">Remover</Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para anexar comprovante</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.size > 10 * 1024 * 1024) {
                            toast.error("Arquivo muito grande. Máximo 10MB.");
                            return;
                          }
                          setReceiptFile(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aprovador Imediato (Gestor Direto) <span className="text-destructive">*</span></Label>
                <Input required value={form.approver_name} onChange={(e) => handleChange("approver_name", e.target.value)} placeholder="Nome do gestor" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}



