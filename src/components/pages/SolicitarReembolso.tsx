import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Upload, FileText, UserSearch } from "lucide-react";
// Logo removed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/components/integrations/supabase/client";
import { toast } from "sonner";
import { REIMBURSEMENT_CATEGORIES, DEPARTMENTS } from "@/components/hooks/useReimbursements";
import { useReimbursementAutocomplete } from "@/components/hooks/useReimbursementAutocomplete";

const SolicitarReembolso = () => {
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const autocomplete = useReimbursementAutocomplete();
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    requester_name: "",
    requester_email: "",
    department: "",
    role_title: "",
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
    approval_status: "",
    approval_notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectSuggestion = (suggestion: typeof autocomplete.suggestions[0]) => {
    setForm((prev) => ({
      ...prev,
      requester_name: suggestion.requester_name,
      requester_email: suggestion.requester_email || prev.requester_email,
      department: suggestion.department || prev.department,
      role_title: suggestion.role_title || prev.role_title,
      bank_name: suggestion.bank_name || prev.bank_name,
      agency: suggestion.agency || prev.agency,
      account_number: suggestion.account_number || prev.account_number,
      cpf_holder: suggestion.cpf_holder || prev.cpf_holder,
      pix_key: suggestion.pix_key || prev.pix_key,
    }));
    if (suggestion.payment_method) {
      setPaymentMethod(suggestion.payment_method);
    }
    autocomplete.close();
    toast.success("Dados preenchidos automaticamente! Revise antes de enviar.");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        autocomplete.close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
          <h1 className="text-2xl font-light">Solicitação Enviada!</h1>
          <p className="text-muted-foreground">Seu reembolso foi registrado com sucesso.</p>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Número do Protocolo</p>
            <p className="text-2xl font-light font-mono">{protocol}</p>
          </div>
          <p className="text-sm text-muted-foreground">Acompanhe o status pelo portal ou com o departamento financeiro.</p>
        </div>
      </div>
    );
  }

  const flatCategories = REIMBURSEMENT_CATEGORIES.flatMap((g) =>
    g.items.map((item) => (g.group === "Outras Despesas" ? item : `${g.group} > ${item}`))
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">


          <div>
            <h1 className="text-xl font-light">Reembolso de Despesas</h1>
            <div className="mt-3 text-sm text-muted-foreground space-y-2">
              <p><strong>Olá, colaborador(a)!</strong></p>
              <p>Este formulário é o canal oficial para solicitar o reembolso de despesas corporativas. Para garantir que sua solicitação seja processada de forma rápida e eficiente, por favor, siga as instruções abaixo:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Preencha todos os campos obrigatórios</strong> com atenção, fornecendo informações claras e precisas.</li>
                <li><strong>Anexe um comprovante fiscal válido</strong> (nota fiscal ou recibo) para cada despesa. Solicitações sem anexo não serão processadas.</li>
                <li><strong>Descreva detalhadamente</strong> o motivo de cada despesa, explicando sua relação com a atividade profissional.</li>
                <li><strong>Consulte a Política de Reembolso da empresa</strong> em caso de dúvidas sobre despesas elegíveis e limites de valor.</li>
              </ol>
              <p>Após o envio, sua solicitação será encaminhada para o departamento financeiro. Acompanhe o status pelo portal ou com o departamento financeiro.</p>
              <p><strong>Obrigado(a) pela sua colaboração!</strong></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 relative" ref={autocompleteRef}>
                <Label>Nome Completo <span className="text-destructive">*</span></Label>
                <Input
                  required
                  value={form.requester_name}
                  onChange={(e) => {
                    handleChange("requester_name", e.target.value);
                    autocomplete.search(e.target.value);
                  }}
                  placeholder="Comece a digitar para buscar..."
                />
                {autocomplete.isOpen && autocomplete.suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b bg-muted/50">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserSearch className="h-3.5 w-3.5" />
                        Selecione seu nome para preencher automaticamente
                      </p>
                    </div>
                    {autocomplete.suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-light">{s.requester_name}</p>
                          {s.source === "people" && (
                            <span className="text-[10px] font-light px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              Colaborador PJ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {s.role_title ? `${s.role_title} • ` : ""}{s.requester_email}
                          {s.count > 1 && <span className="ml-1">({s.count} solicitações)</span>}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>E-mail Corporativo <span className="text-destructive">*</span></Label>
                <Input required type="email" value={form.requester_email} onChange={(e) => handleChange("requester_email", e.target.value)} placeholder="Inserir texto" />
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
                  <p className="text-xs text-muted-foreground">Nome do banco (ex: Banco do Brasil, Itaú, Bradesco)</p>
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
                        <span className="text-sm text-muted-foreground">Solte seus arquivos aqui para <span className="underline">fazer upload</span></span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
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

            <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 text-base" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SolicitarReembolso;



