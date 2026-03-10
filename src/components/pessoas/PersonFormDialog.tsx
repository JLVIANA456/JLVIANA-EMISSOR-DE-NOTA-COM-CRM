import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Check, X, Mail, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCNPJ, validateCNPJ } from "@/lib/cnpj";
import type { Person, PersonInsert, Commission, SalaryHistory, SalaryAdjustment } from "@/hooks/usePeople";

interface PersonFormDialogProps {
  onSubmit: (person: PersonInsert) => void;
  editPerson?: Person;
  trigger?: React.ReactNode;
  commissions?: Commission[];
  onUpdateCommission?: (data: { id: string; month: number; year: number; value: number; description: string | null }) => void;
  onDeleteCommission?: (id: string) => void;
  onAddCommission?: (data: { person_id: string; month: number; year: number; value: number; description: string | null }) => void;
  salaryHistory?: SalaryHistory[];
  onUpdateSalary?: (data: { id: string; value: number; notes: string | null }) => void;
  onDeleteSalary?: (id: string) => void;
  salaryAdjustments?: SalaryAdjustment[];
  onSalaryAdjustment?: (adj: { person_id: string; old_value: number; new_value: number; change_percentage: number; effective_date: string; reason: string | null }) => void;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function PersonFormDialog({
  onSubmit, editPerson, trigger,
  commissions = [], onUpdateCommission, onDeleteCommission, onAddCommission,
  salaryHistory = [], onUpdateSalary, onDeleteSalary,
  salaryAdjustments = [], onSalaryAdjustment,
}: PersonFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editPerson?.name || "");
  const [role, setRole] = useState(editPerson?.role || "");
  const [email, setEmail] = useState((editPerson as any)?.email || "");
  const [baseSalary, setBaseSalary] = useState(editPerson?.base_salary?.toString() || "");
  const [status, setStatus] = useState(editPerson?.status || "ativo");
  const [contractType, setContractType] = useState(editPerson?.contract_type || "prestacao_servicos_pj");
  const [admissionDate, setAdmissionDate] = useState(editPerson?.admission_date || "");
  const [terminationDate, setTerminationDate] = useState((editPerson as any)?.termination_date || "");
  const [notes, setNotes] = useState(editPerson?.notes || "");
  // New PJ fields
  const [cnpj, setCnpj] = useState((editPerson as any)?.cnpj || "");
  const [razaoSocial, setRazaoSocial] = useState((editPerson as any)?.razao_social || "");
  const [nomeFantasia, setNomeFantasia] = useState((editPerson as any)?.nome_fantasia || "");
  const [taxRegime, setTaxRegime] = useState((editPerson as any)?.tax_regime || "");
  const [phone, setPhone] = useState((editPerson as any)?.phone || "");
  const [address, setAddress] = useState((editPerson as any)?.address || "");
  const [statusJustification, setStatusJustification] = useState((editPerson as any)?.status_justification || "");
  const [cnpjError, setCnpjError] = useState("");

  // Salary adjustment fields
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split("T")[0]);

  // Notification state
  const [notifyMonth, setNotifyMonth] = useState((new Date().getMonth() + 1).toString());
  const [notifyYear, setNotifyYear] = useState(new Date().getFullYear().toString());
  const [sending, setSending] = useState(false);

  // Commission editing state
  const [editingCommId, setEditingCommId] = useState<string | null>(null);
  const [editCommValue, setEditCommValue] = useState("");
  const [editCommDesc, setEditCommDesc] = useState("");
  const [editCommMonth, setEditCommMonth] = useState("");
  const [editCommYear, setEditCommYear] = useState("");

  // Salary editing state
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [editSalaryValue, setEditSalaryValue] = useState("");
  const [editSalaryNotes, setEditSalaryNotes] = useState("");

  // New commission inline form state
  const [showNewCommForm, setShowNewCommForm] = useState(false);
  const [newCommMonth, setNewCommMonth] = useState((new Date().getMonth() + 1).toString());
  const [newCommYear, setNewCommYear] = useState(new Date().getFullYear().toString());
  const [newCommValue, setNewCommValue] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");

  const personCommissions = editPerson
    ? commissions.filter((c) => c.person_id === editPerson.id).sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month))
    : [];

  const personSalaries = editPerson
    ? salaryHistory.filter((s) => s.person_id === editPerson.id).sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month))
    : [];

  // Compute notification preview
  const notifyPreview = useMemo(() => {
    const m = parseInt(notifyMonth);
    const y = parseInt(notifyYear);
    const sal = personSalaries.find((s) => s.month === m && s.year === y);
    const salaryVal = sal ? Number(sal.value) : parseFloat(baseSalary) || 0;
    const comm = personCommissions
      .filter((c) => c.month === m && c.year === y)
      .reduce((sum, c) => sum + Number(c.value), 0);
    return { salary: salaryVal, commission: comm, total: salaryVal + comm };
  }, [notifyMonth, notifyYear, personSalaries, personCommissions, baseSalary]);

  const reset = () => {
    if (!editPerson) {
      setName(""); setRole(""); setEmail(""); setBaseSalary(""); setStatus("ativo"); setAdmissionDate(""); setTerminationDate(""); setNotes("");
      setCnpj(""); setRazaoSocial(""); setNomeFantasia(""); setTaxRegime(""); setPhone(""); setAddress(""); setStatusJustification("");
    }
    setCnpjError("");
    setEditingCommId(null);
    setEditingSalaryId(null);
    setShowNewCommForm(false);
    setNewCommValue(""); setNewCommDesc("");
    setAdjustmentReason("");
    setAdjustmentDate(new Date().toISOString().split("T")[0]);
  };

  const salaryChanged = editPerson && (parseFloat(baseSalary) || 0) !== Number(editPerson.base_salary);
  const personAdjustments = editPerson
    ? salaryAdjustments.filter((a) => a.person_id === editPerson.id).sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
    : [];

  const pjTypes = ["prestacao_servicos_pj", "fornecimento_servicos", "autonomo", "representacao_comercial", "pj"];
  const isPJType = pjTypes.includes(contractType);
  const showStatusJustification = status === "pausado" || status === "finalizado";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (salaryChanged && !adjustmentReason.trim()) {
      toast.error("Informe o motivo do reajuste salarial");
      return;
    }

    const newSalary = parseFloat(baseSalary) || 0;

    // Create salary adjustment record if salary changed
    if (salaryChanged && onSalaryAdjustment && editPerson) {
      const oldVal = Number(editPerson.base_salary);
      const pct = oldVal > 0 ? ((newSalary - oldVal) / oldVal) * 100 : 0;
      onSalaryAdjustment({
        person_id: editPerson.id,
        old_value: oldVal,
        new_value: newSalary,
        change_percentage: Math.round(pct * 100) / 100,
        effective_date: adjustmentDate,
        reason: adjustmentReason || null,
      });
    }

    // Auto-set status to finalizado if termination_date is today or past
    let finalStatus = status;
    if (terminationDate) {
      const termDate = new Date(terminationDate + "T00:00:00");
      if (termDate <= new Date()) {
        finalStatus = "finalizado";
      }
    }

    // CNPJ validation disabled for now
    onSubmit({
      name, role,
      base_salary: newSalary,
      status: finalStatus,
      contract_type: contractType,
      admission_date: admissionDate || null,
      termination_date: terminationDate || null,
      notes: notes || null,
      is_active: finalStatus === "ativo",
      email: email || null,
      cnpj: cnpj ? cnpj.replace(/\D/g, "") : null,
      razao_social: razaoSocial || null,
      nome_fantasia: nomeFantasia || null,
      tax_regime: taxRegime || null,
      phone: phone || null,
      address: address || null,
      status_justification: showStatusJustification || terminationDate ? statusJustification || null : null,
    } as any);
    setOpen(false);
    reset();
  };

  const handleNotify = async () => {
    if (!email) {
      toast.error("Informe o email do colaborador antes de notificar");
      return;
    }
    if (notifyPreview.total <= 0) {
      toast.error("Valor total é zero. Registre salário ou comissão primeiro.");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-invoice", {
        body: {
          personName: name,
          personEmail: email,
          baseSalary: notifyPreview.salary,
          commission: notifyPreview.commission,
          total: notifyPreview.total,
          month: parseInt(notifyMonth),
          year: parseInt(notifyYear),
          invoiceLink: null,
        },
      });

      if (error) throw error;
      toast.success("Notificação enviada!", {
        description: `Email enviado para ${email} com valor de ${fmt(notifyPreview.total)}`,
      });
    } catch (err) {
      toast.error("Erro ao enviar notificação", { description: String(err) });
    } finally {
      setSending(false);
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Commission helpers
  const startEditComm = (c: Commission) => {
    setEditingCommId(c.id);
    setEditCommValue(c.value.toString());
    setEditCommDesc(c.description || "");
    setEditCommMonth(c.month.toString());
    setEditCommYear(c.year.toString());
  };
  const saveEditComm = () => {
    if (editingCommId && onUpdateCommission) {
      onUpdateCommission({
        id: editingCommId,
        month: parseInt(editCommMonth),
        year: parseInt(editCommYear),
        value: parseFloat(editCommValue) || 0,
        description: editCommDesc || null,
      });
    }
    setEditingCommId(null);
  };

  // Salary helpers
  const startEditSalary = (s: SalaryHistory) => {
    setEditingSalaryId(s.id);
    setEditSalaryValue(s.value.toString());
    setEditSalaryNotes(s.notes || "");
  };
  const saveEditSalary = () => {
    if (editingSalaryId && onUpdateSalary) {
      onUpdateSalary({ id: editingSalaryId, value: parseFloat(editSalaryValue) || 0, notes: editSalaryNotes || null });
    }
    setEditingSalaryId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Colaborador
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPerson ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome do colaborador" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@colaborador.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Designer, Desenvolvedor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Salário Base (R$)</Label>
              <Input type="number" step="0.01" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary adjustment fields - shown when editing and salary changed */}
          {salaryChanged && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <Label className="text-sm font-light text-primary">⚡ Reajuste Salarial Detectado</Label>
              <p className="text-xs text-muted-foreground">
                De {fmt(Number(editPerson!.base_salary))} → {fmt(parseFloat(baseSalary) || 0)}
                {Number(editPerson!.base_salary) > 0 && (
                  <span className="ml-1 font-light">
                    ({(((parseFloat(baseSalary) || 0) - Number(editPerson!.base_salary)) / Number(editPerson!.base_salary) * 100).toFixed(1)}%)
                  </span>
                )}
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Motivo do Reajuste *</Label>
                <Input value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="Ex: Reajuste anual 2026, Promoção a Senior" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data Efetiva</Label>
                <Input type="date" value={adjustmentDate} onChange={(e) => setAdjustmentDate(e.target.value)} />
              </div>
              {isPJType && (
                <p className="text-xs text-muted-foreground italic">
                  💡 Após salvar, você poderá gerar o Aditivo Contratual na aba "Reajustes".
                </p>
              )}
            </div>
          )}

          {/* Salary adjustment history */}
          {editPerson && personAdjustments.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-light">Histórico de Reajustes</Label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {personAdjustments.map((adj) => (
                  <div key={adj.id} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                    <span className="text-muted-foreground font-mono">{new Date(adj.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="text-muted-foreground">{fmt(adj.old_value)} →</span>
                    <span className="font-light">{fmt(adj.new_value)}</span>
                    <Badge variant={adj.change_percentage >= 0 ? "default" : "destructive"} className="text-[10px] px-1 h-4">
                      {adj.change_percentage > 0 ? "+" : ""}{adj.change_percentage.toFixed(1)}%
                    </Badge>
                    {adj.reason && <span className="text-muted-foreground truncate flex-1">{adj.reason}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Tipo de Contrato</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clt">Trabalho CLT</SelectItem>
                <SelectItem value="temporario">Trabalho Temporário</SelectItem>
                <SelectItem value="estagio">Estágio</SelectItem>
                <SelectItem value="jovem_aprendiz">Jovem Aprendiz</SelectItem>
                <SelectItem value="intermitente">Trabalho Intermitente</SelectItem>
                <SelectItem value="prazo_determinado">Trabalho por Prazo Determinado</SelectItem>
                <SelectItem value="autonomo">Autônomo</SelectItem>
                <SelectItem value="representacao_comercial">Representação Comercial (PF)</SelectItem>
                <SelectItem value="prestacao_servicos_pj">Prestação de Serviços (PJ)</SelectItem>
                <SelectItem value="fornecimento_servicos">Fornecimento de Serviços (Empresa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data de Admissão</Label>
              <Input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de Desligamento</Label>
              <Input type="date" value={terminationDate} onChange={(e) => {
                setTerminationDate(e.target.value);
                if (e.target.value) {
                  const termDate = new Date(e.target.value + "T00:00:00");
                  if (termDate <= new Date()) {
                    setStatus("finalizado");
                  }
                }
              }} />
              {terminationDate && new Date(terminationDate + "T00:00:00") > new Date() && (
                <p className="text-xs text-muted-foreground">⏳ Desligamento agendado. Status será atualizado automaticamente na data.</p>
              )}
            </div>
          </div>
          {/* PJ-specific fields */}
          {isPJType && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-light">Dados PJ</Label>
              <div className="space-y-2">
                <Label className="text-xs">CNPJ</Label>
                <Input
                  value={formatCNPJ(cnpj)}
                  onChange={(e) => { setCnpj(e.target.value.replace(/\D/g, "").slice(0, 14)); setCnpjError(""); }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {cnpjError && <p className="text-xs text-destructive">{cnpjError}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Razão Social</Label>
                <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão social da empresa" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nome Fantasia</Label>
                <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder="Nome fantasia" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Regime Tributário</Label>
                <Select value={taxRegime} onValueChange={setTaxRegime}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mei">MEI</SelectItem>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Contact fields */}
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Endereço completo" />
          </div>

          {/* Status justification */}
          {showStatusJustification && (
            <div className="space-y-2">
              <Label>Justificativa de Status</Label>
              <Textarea value={statusJustification} onChange={e => setStatusJustification(e.target.value)} placeholder="Motivo da mudança de status" rows={2} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre o colaborador" rows={2} />
          </div>

          {/* Salary History section */}
          {editPerson && personSalaries.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-light">Histórico de Salários</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {personSalaries.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    {editingSalaryId === s.id ? (
                      <>
                        <div className="flex-1 space-y-1">
                          <Input type="number" step="0.01" value={editSalaryValue} onChange={(e) => setEditSalaryValue(e.target.value)} className="h-7 text-xs" placeholder="Valor" />
                          <Input value={editSalaryNotes} onChange={(e) => setEditSalaryNotes(e.target.value)} className="h-7 text-xs" placeholder="Observação" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEditSalary}><Check className="h-3.5 w-3.5" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSalaryId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{MONTHS[s.month - 1]}/{s.year}</span>
                            <span className="font-mono font-light">{fmt(s.value)}</span>
                          </div>
                          {s.notes && <p className="text-xs text-muted-foreground truncate">{s.notes}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditSalary(s)}><Pencil className="h-3 w-3" /></Button>
                        {onDeleteSalary && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteSalary(s.id)}><Trash2 className="h-3 w-3" /></Button>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commissions section */}
          {editPerson && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-light">Comissões Registradas</Label>
                {onAddCommission && !showNewCommForm && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNewCommForm(true)}>
                    <Plus className="h-3 w-3" /> Nova Comissão
                  </Button>
                )}
              </div>

              {/* Inline new commission form */}
              {showNewCommForm && onAddCommission && (
                <div className="rounded-md border p-3 space-y-2 bg-secondary/30">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Mês</Label>
                      <Select value={newCommMonth} onValueChange={setNewCommMonth}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ano</Label>
                      <Input type="number" className="h-8 text-xs" value={newCommYear} onChange={(e) => setNewCommYear(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input type="number" step="0.01" className="h-8 text-xs" value={newCommValue} onChange={(e) => setNewCommValue(e.target.value)} placeholder="0,00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Input className="h-8 text-xs" value={newCommDesc} onChange={(e) => setNewCommDesc(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button" size="sm" className="h-7 text-xs flex-1"
                      disabled={!newCommValue || parseFloat(newCommValue) <= 0}
                      onClick={() => {
                        onAddCommission({
                          person_id: editPerson.id,
                          month: parseInt(newCommMonth),
                          year: parseInt(newCommYear),
                          value: parseFloat(newCommValue) || 0,
                          description: newCommDesc || null,
                        });
                        setNewCommValue(""); setNewCommDesc("");
                        setShowNewCommForm(false);
                      }}
                    >
                      <Check className="h-3 w-3 mr-1" /> Salvar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowNewCommForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {personCommissions.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {personCommissions.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      {editingCommId === c.id ? (
                        <>
                          <div className="flex-1 space-y-1">
                            <div className="grid grid-cols-2 gap-1">
                              <Input type="number" min={1} max={12} value={editCommMonth} onChange={(e) => setEditCommMonth(e.target.value)} className="h-7 text-xs" placeholder="Mês (1-12)" />
                              <Input type="number" value={editCommYear} onChange={(e) => setEditCommYear(e.target.value)} className="h-7 text-xs" placeholder="Ano" />
                            </div>
                            <Input type="number" step="0.01" value={editCommValue} onChange={(e) => setEditCommValue(e.target.value)} className="h-7 text-xs" placeholder="Valor" />
                            <Input value={editCommDesc} onChange={(e) => setEditCommDesc(e.target.value)} className="h-7 text-xs" placeholder="Descrição" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEditComm}><Check className="h-3.5 w-3.5" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCommId(null)}><X className="h-3.5 w-3.5" /></Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{MONTHS[c.month - 1]}/{c.year}</span>
                              <span className="font-mono font-light text-primary">{fmt(c.value)}</span>
                            </div>
                            {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditComm(c)}><Pencil className="h-3 w-3" /></Button>
                          {onDeleteCommission && <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDeleteCommission(c.id)}><Trash2 className="h-3 w-3" /></Button>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invoice Notification section */}
          {editPerson && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-light flex items-center gap-2">
                <Send className="h-4 w-4" />
                Notificar Emissão de Nota
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Mês</Label>
                  <Select value={notifyMonth} onValueChange={setNotifyMonth}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ano</Label>
                  <Input type="number" className="h-8 text-xs" value={notifyYear} onChange={(e) => setNotifyYear(e.target.value)} />
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Salário Base:</span><span className="font-light">{fmt(notifyPreview.salary)}</span></div>
                {notifyPreview.commission > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Comissão:</span><span className="font-light text-primary">{fmt(notifyPreview.commission)}</span></div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between font-light"><span>Total NF:</span><span>{fmt(notifyPreview.total)}</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleNotify}
                disabled={sending || !email}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {sending ? "Enviando..." : `Enviar Notificação para ${email || "(sem email)"}`}
              </Button>
            </div>
          )}

          <Button type="submit" className="w-full">{editPerson ? "Salvar" : "Adicionar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}



