import { useState, useRef } from "react";
import {
  Wallet, Plus, Check, X, Trash2, Upload, FileText, Download,
  AlertTriangle, Clock, ChevronLeft, Eye, BarChart3, Link2, Copy,
  Send, UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { usePeople } from "@/hooks/usePeople";
import { usePayroll, type PayrollSheet, type PayrollItem } from "@/hooks/usePayroll";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  rascunho: { label: "Rascunho", variant: "secondary", color: "text-muted-foreground" },
  pronta: { label: "Pronta p/ Aprovação", variant: "outline", color: "text-yellow-600" },
  aprovada: { label: "Aprovada", variant: "default", color: "text-primary" },
  paga: { label: "Paga", variant: "default", color: "text-primary" },
};

const NF_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  valida: { label: "Válida", variant: "default" },
  alerta: { label: "Alerta", variant: "outline" },
  invalida: { label: "Inválida", variant: "destructive" },
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FolhaPagamento = () => {
  const { people, activePeople } = usePeople();
  const {
    sheets, items, statusHistory, nfValidations, isLoading,
    createSheet, changeStatus, updateItem, deleteSheet, validateNf,
    addItemToSheet, emitPayslip,
  } = usePayroll();

  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"geral" | "individual">("geral");
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; action: string; sheetId: string }>({ open: false, action: "", sheetId: "" });
  const [justification, setJustification] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PayrollItem>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [addPjOpen, setAddPjOpen] = useState(false);
  const [addPjPerson, setAddPjPerson] = useState("");
  const [individualValue, setIndividualValue] = useState("");
  const [addPjValue, setAddPjValue] = useState("");

  const activeSheet = selectedSheet ? sheets.find(s => s.id === selectedSheet) : null;
  const sheetItems = selectedSheet ? items.filter(i => i.payroll_id === selectedSheet) : [];

  // Dashboard metrics
  const pendingSheets = sheets.filter(s => s.status === "rascunho" || s.status === "pronta");
  const approvedSheets = sheets.filter(s => s.status === "aprovada");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthSheet = sheets.find(s => s.month === currentMonth && s.year === currentYear);
  const lastMonthSheet = sheets.find(s => {
    const lm = currentMonth === 1 ? 12 : currentMonth - 1;
    const ly = currentMonth === 1 ? currentYear - 1 : currentYear;
    return s.month === lm && s.year === ly;
  });
  const pendingNfs = items.filter(i => i.nf_status === "pendente").length;
  const totalCurrent = currentMonthSheet ? Number(currentMonthSheet.total_value) : 0;
  const totalLast = lastMonthSheet ? Number(lastMonthSheet.total_value) : 0;
  const variation = totalLast > 0 ? ((totalCurrent - totalLast) / totalLast) * 100 : 0;

  const handleCreate = () => {
    if (createMode === "individual") {
      if (!selectedPerson) {
        toast.error("Selecione um PJ.");
        return;
      }
      const person = activePeople.find(p => p.id === selectedPerson);
      if (!person) return;
      const baseValue = individualValue ? parseFloat(individualValue) : Number(person.base_salary);
      createSheet.mutate({
        month: parseInt(month),
        year: parseInt(year),
        items: [{ person_id: person.id, base_value: baseValue, email: person.email || null }],
      });
    } else {
      const itemsData = activePeople.map(p => ({
        person_id: p.id,
        base_value: Number(p.base_salary),
        email: p.email || null,
      }));
      createSheet.mutate({ month: parseInt(month), year: parseInt(year), items: itemsData });
    }
    setCreateOpen(false);
    setSelectedPerson("");
    setIndividualValue("");
  };

  const handleAddPjToSheet = () => {
    if (!addPjPerson || !activeSheet) return;
    const person = activePeople.find(p => p.id === addPjPerson);
    if (!person) return;
    const baseValue = addPjValue ? parseFloat(addPjValue) : Number(person.base_salary);
    addItemToSheet.mutate({
      sheetId: activeSheet.id,
      person_id: person.id,
      base_value: baseValue,
      email: person.email || null,
    });
    setAddPjOpen(false);
    setAddPjPerson("");
    setAddPjValue("");
  };

  const handleEmitPayslip = (itemId: string) => {
    emitPayslip.mutate({ itemIds: [itemId] });
  };

  const handleEmitAll = () => {
    const notEmitted = sheetItems.filter(i => !i.holerite_emitido).map(i => i.id);
    if (notEmitted.length === 0) {
      toast.info("Todos os holerites já foram emitidos.");
      return;
    }
    emitPayslip.mutate({ itemIds: notEmitted });
  };

  const handleStatusChange = (sheetId: string, action: string) => {
    if (action === "rejeitar") {
      setApprovalDialog({ open: true, action, sheetId });
    } else {
      changeStatus.mutate({ id: sheetId, newStatus: action === "aprovar" ? "aprovada" : action === "pagar" ? "paga" : action === "pronta" ? "pronta" : action });
    }
  };

  const handleApprovalSubmit = () => {
    if (approvalDialog.action === "rejeitar") {
      changeStatus.mutate({ id: approvalDialog.sheetId, newStatus: "rascunho", justification });
    }
    setApprovalDialog({ open: false, action: "", sheetId: "" });
    setJustification("");
  };

  const startEditing = (item: PayrollItem) => {
    setEditingItem(item.id);
    setEditValues({
      base_value: item.base_value,
      adjustments: item.adjustments,
      adjustment_reason: item.adjustment_reason,
      reimbursements: item.reimbursements,
      bonus: item.bonus,
      bonus_reason: item.bonus_reason,
      debit_note: item.debit_note,
      debit_note_reason: item.debit_note_reason,
    });
  };

  const saveEditing = () => {
    if (!editingItem) return;
    const item = items.find(i => i.id === editingItem);
    if (!item) return;
    const updates: any = {
      id: editingItem,
      base_value: Number(editValues.base_value) || 0,
      adjustments: Number(editValues.adjustments) || 0,
      adjustment_reason: editValues.adjustment_reason || null,
      reimbursements: Number(editValues.reimbursements) || 0,
      bonus: Number(editValues.bonus) || 0,
      bonus_reason: editValues.bonus_reason || null,
      debit_note: editValues.debit_note || false,
      debit_note_reason: editValues.debit_note_reason || null,
    };
    // Reset holerite if it was already emitted so it can be re-emitted with new values
    if (item.holerite_emitido) {
      updates.holerite_emitido = false;
    }
    updateItem.mutate(updates);
    setEditingItem(null);
    setEditValues({});
  };

  const handleNfUpload = (itemId: string) => {
    setUploadingItemId(itemId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingItemId) return;
    const item = items.find(i => i.id === uploadingItemId);
    if (!item) return;
    const person = people.find(p => p.id === item.person_id);
    validateNf.mutate({
      file,
      payrollItemId: uploadingItemId,
      expectedValue: Number(item.total_value),
      expectedCnpj: person?.cnpj || undefined,
    });
    setUploadingItemId(null);
    e.target.value = "";
  };

  const generateHolerite = (item: PayrollItem) => {
    const person = people.find(p => p.id === item.person_id);
    if (!person || !activeSheet) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("HOLERITE PJ", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${MONTHS_FULL[activeSheet.month - 1]} / ${activeSheet.year}`, pageWidth / 2, 28, { align: "center" });

    doc.setDrawColor(200);
    doc.line(14, 32, pageWidth - 14, 32);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Dados do Prestador", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nome: ${person.name}`, 14, 48);
    if (person.cnpj) doc.text(`CNPJ: ${person.cnpj}`, 14, 54);
    if (person.role) doc.text(`Função: ${person.role}`, 14, 60);

    const tableData = [
      ["Valor Base", fmt(Number(item.base_value))],
      ["Ajustes", fmt(Number(item.adjustments))],
      ["Reembolsos", fmt(Number(item.reimbursements))],
      ["Bonificação", fmt(Number(item.bonus))],
    ];

    if (item.adjustment_reason) tableData.push(["  Motivo Ajuste", item.adjustment_reason]);
    if (item.bonus_reason) tableData.push(["  Motivo Bônus", item.bonus_reason]);

    autoTable(doc, {
      startY: 68,
      head: [["Descrição", "Valor"]],
      body: tableData,
      foot: [["TOTAL LÍQUIDO", fmt(Number(item.total_value))]],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255 },
      footStyles: { fillColor: [240, 240, 240], textColor: [30, 58, 95], fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: "right" } },
    });

    if (item.debit_note) {
      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFontSize(9);
      doc.setTextColor(180, 0, 0);
      doc.text("* Este pagamento inclui nota de débito.", 14, finalY + 10);
      if (item.debit_note_reason) doc.text(`  Motivo: ${item.debit_note_reason}`, 14, finalY + 16);
      doc.setTextColor(0);
    }

    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, 14, 280);
    doc.text("DecoAdmin® — Documento de uso interno", pageWidth / 2, 286, { align: "center" });

    doc.save(`holerite_${person.name.replace(/\s/g, "_")}_${MONTHS[activeSheet.month - 1]}_${activeSheet.year}.pdf`);
  };

  const generateAllHolerites = () => {
    sheetItems.forEach(item => generateHolerite(item));
  };

  const getNfLink = (item: PayrollItem) => {
    const token = (item as any).nf_share_token;
    if (!token) return "";
    return `${window.location.origin}/enviar-nf-pj?token=${token}`;
  };

  const copyNfLink = (item: PayrollItem) => {
    const link = getNfLink(item);
    if (!link) {
      toast.error("Token não encontrado para este item.");
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const copyAllNfLinks = () => {
    const links = sheetItems.map(item => {
      const person = people.find(p => p.id === item.person_id);
      return `${person?.name || "PJ"}: ${getNfLink(item)}`;
    }).join("\n");
    navigator.clipboard.writeText(links);
    toast.success(`${sheetItems.length} links copiados!`);
  };

  // People not yet in the current sheet (for Add PJ dialog)
  const availablePeopleForSheet = activeSheet
    ? activePeople.filter(p => !sheetItems.find(si => si.person_id === p.id))
    : [];

  // ========== RENDER ==========

  if (selectedSheet && activeSheet) {
    return renderSheetDetail();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Folha de Pagamento PJ</h1>
            <p className="text-sm text-muted-foreground">Gerencie folhas, NFs, ajustes e aprovações</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Criar Folha</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Folha de Pagamento</DialogTitle></DialogHeader>
            <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as "geral" | "individual")}>
              <TabsList className="w-full">
                <TabsTrigger value="geral" className="flex-1">Folha Completa</TabsTrigger>
                <TabsTrigger value="individual" className="flex-1">Individual</TabsTrigger>
              </TabsList>
              <TabsContent value="geral">
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{activePeople.length} PJ(s) ativo(s) serão incluídos automaticamente.</p>
                  <Button className="w-full" onClick={handleCreate} disabled={createSheet.isPending || activePeople.length === 0}>
                    {createSheet.isPending ? "Criando..." : "Criar Folha Completa"}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="individual">
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input type="number" value={year} onChange={e => setYear(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PJ</Label>
                    <Select value={selectedPerson} onValueChange={(v) => {
                      setSelectedPerson(v);
                      const p = activePeople.find(pp => pp.id === v);
                      if (p) setIndividualValue(Number(p.base_salary).toString());
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione um PJ..." /></SelectTrigger>
                      <SelectContent>
                        {activePeople.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {fmt(Number(p.base_salary))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPerson && (
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={individualValue}
                        onChange={e => setIndividualValue(e.target.value)}
                        placeholder="Valor base para este mês"
                      />
                      <p className="text-xs text-muted-foreground">Altere para lançar valor proporcional (ex: dias trabalhados).</p>
                    </div>
                  )}
                  {selectedPerson && (() => {
                    const existingSheet = sheets.find(s => s.month === parseInt(month) && s.year === parseInt(year));
                    return existingSheet ? (
                      <p className="text-xs text-muted-foreground">
                        Já existe folha para {MONTHS[parseInt(month) - 1]}/{year}. O PJ será adicionado a ela.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Será criada uma nova folha para {MONTHS[parseInt(month) - 1]}/{year}.
                      </p>
                    );
                  })()}
                  <Button className="w-full" onClick={handleCreate} disabled={createSheet.isPending || !selectedPerson}>
                    {createSheet.isPending ? "Criando..." : "Lançar Individual"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-light text-muted-foreground">Folhas em Aberto</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{pendingSheets.length}</div>
            <p className="text-xs text-muted-foreground">Rascunho ou aguardando aprovação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-light text-muted-foreground">Aguardando Pagamento</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{approvedSheets.length}</div>
            <p className="text-xs text-muted-foreground">Aprovadas, pendentes de execução</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-light text-muted-foreground">Total Mês Atual</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{fmt(totalCurrent)}</div>
            {totalLast > 0 && (
              <p className={`text-xs ${variation > 0 ? "text-destructive" : "text-primary"}`}>
                {variation > 0 ? "+" : ""}{variation.toFixed(1)}% vs mês anterior
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-light text-muted-foreground">NFs Pendentes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-light">{pendingNfs}</div>
              {pendingNfs > 0 && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando validação</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Folhas list + Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Folhas</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {isLoading ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="rounded-lg border bg-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>NFs</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheets.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma folha criada. Clique em "Criar Folha" para começar.</TableCell></TableRow>
                  ) : sheets.map(s => {
                    const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.rascunho;
                    const shItems = items.filter(i => i.payroll_id === s.id);
                    const nfPending = shItems.filter(i => i.nf_status === "pendente").length;
                    const nfTotal = shItems.length;
                    return (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSheet(s.id)}>
                        <TableCell className="font-light">{MONTHS[s.month - 1]}/{s.year}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell className="text-right font-mono">{fmt(Number(s.total_value))}</TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {nfPending > 0 ? (
                              <span className="text-yellow-600">{nfPending}/{nfTotal} pendentes</span>
                            ) : (
                              <span className="text-primary">{nfTotal}/{nfTotal} ok</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.approved_at ? new Date(s.approved_at).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.paid_at ? new Date(s.paid_at).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          {(s.status === "rascunho" || s.status === "pronta") && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteSheet.mutate(s.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <div className="rounded-lg border bg-card overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Folha</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusHistory.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum histórico.</TableCell></TableRow>
                ) : statusHistory.map(h => {
                  const sheet = sheets.find(s => s.id === h.payroll_id);
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">{new Date(h.created_at).toLocaleDateString("pt-BR")} {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell className="font-light">{sheet ? `${MONTHS[sheet.month - 1]}/${sheet.year}` : "—"}</TableCell>
                      <TableCell>{h.old_status ? <Badge variant="secondary" className="text-[10px]">{STATUS_CONFIG[h.old_status]?.label || h.old_status}</Badge> : "—"}</TableCell>
                      <TableCell><Badge variant={STATUS_CONFIG[h.new_status]?.variant || "secondary"} className="text-[10px]">{STATUS_CONFIG[h.new_status]?.label || h.new_status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{h.justification || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rejection dialog */}
      <Dialog open={approvalDialog.open} onOpenChange={(o) => !o && setApprovalDialog({ open: false, action: "", sheetId: "" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Folha</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Descreva o motivo da rejeição e os ajustes necessários..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog({ open: false, action: "", sheetId: "" })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleApprovalSubmit} disabled={!justification.trim()}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelected} />
    </div>
  );

  // ========== SHEET DETAIL VIEW ==========
  function renderSheetDetail() {
    if (!activeSheet) return null;
    const isEditable = activeSheet.status === "rascunho";
    const sheetHistory = statusHistory.filter(h => h.payroll_id === activeSheet.id);
    const emittedCount = sheetItems.filter(i => i.holerite_emitido).length;
    const canEmit = activeSheet.status === "aprovada" || activeSheet.status === "paga";

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSheet(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-light">Folha {MONTHS_FULL[activeSheet.month - 1]} / {activeSheet.year}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATUS_CONFIG[activeSheet.status]?.variant || "secondary"}>
                  {STATUS_CONFIG[activeSheet.status]?.label || activeSheet.status}
                </Badge>
                {activeSheet.approved_by && (
                  <span className="text-xs text-muted-foreground">Aprovado por: {activeSheet.approved_by}</span>
                )}
                {canEmit && (
                  <Badge variant="outline" className="text-[10px]">
                    {emittedCount}/{sheetItems.length} holerites emitidos
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isEditable && availablePeopleForSheet.length > 0 && (
              <Dialog open={addPjOpen} onOpenChange={setAddPjOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><UserPlus className="h-4 w-4 mr-1" /> Adicionar PJ</Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Adicionar PJ à Folha</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>PJ</Label>
                      <Select value={addPjPerson} onValueChange={(v) => {
                        setAddPjPerson(v);
                        const p = availablePeopleForSheet.find(pp => pp.id === v);
                        if (p) setAddPjValue(Number(p.base_salary).toString());
                      }}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {availablePeopleForSheet.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} — {fmt(Number(p.base_salary))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {addPjPerson && (
                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={addPjValue}
                          onChange={e => setAddPjValue(e.target.value)}
                          placeholder="Valor base para este mês"
                        />
                        <p className="text-xs text-muted-foreground">Altere para lançar valor proporcional.</p>
                      </div>
                    )}
                    <Button className="w-full" onClick={handleAddPjToSheet} disabled={!addPjPerson || addItemToSheet.isPending}>
                      {addItemToSheet.isPending ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isEditable && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(activeSheet.id, "pronta")}>
                <Clock className="h-4 w-4 mr-1" /> Enviar p/ Aprovação
              </Button>
            )}
            {activeSheet.status === "pronta" && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(activeSheet.id, "aprovar")}>
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(activeSheet.id, "rejeitar")}>
                  <X className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              </>
            )}
            {activeSheet.status === "aprovada" && (
              <>
                <Button size="sm" onClick={() => handleStatusChange(activeSheet.id, "pagar")}>
                  <Wallet className="h-4 w-4 mr-1" /> Marcar como Paga
                </Button>
                <Button size="sm" variant="outline" onClick={handleEmitAll}>
                  <Send className="h-4 w-4 mr-1" /> Emitir Todos Holerites
                </Button>
              </>
            )}
            {activeSheet.status === "paga" && emittedCount < sheetItems.length && (
              <Button size="sm" variant="outline" onClick={handleEmitAll}>
                <Send className="h-4 w-4 mr-1" /> Emitir Restantes
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={generateAllHolerites}>
              <Download className="h-4 w-4 mr-1" /> Holerites (PDF)
            </Button>
          </div>
        </div>

        {/* Rejection reason */}
        {activeSheet.rejection_reason && activeSheet.status === "rascunho" && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-light text-destructive">Folha rejeitada</p>
                  <p className="text-sm text-muted-foreground mt-1">{activeSheet.rejection_reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs font-light text-muted-foreground">Valor Base</CardTitle></CardHeader>
            <CardContent><div className="text-lg font-light font-mono">{fmt(sheetItems.reduce((s, i) => s + Number(i.base_value), 0))}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs font-light text-muted-foreground">Ajustes</CardTitle></CardHeader>
            <CardContent><div className="text-lg font-light font-mono">{fmt(sheetItems.reduce((s, i) => s + Number(i.adjustments), 0))}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs font-light text-muted-foreground">Reembolsos + Bônus</CardTitle></CardHeader>
            <CardContent><div className="text-lg font-light font-mono">{fmt(sheetItems.reduce((s, i) => s + Number(i.reimbursements) + Number(i.bonus), 0))}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs font-light text-muted-foreground">Total Folha</CardTitle></CardHeader>
            <CardContent><div className="text-lg font-light font-mono text-primary">{fmt(Number(activeSheet.total_value))}</div></CardContent>
          </Card>
        </div>

        {/* Items table */}
        <div className="rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PJ</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Ajustes</TableHead>
                <TableHead className="text-right">Reembolsos</TableHead>
                <TableHead className="text-right">Bônus</TableHead>
                <TableHead className="text-right font-light">Total</TableHead>
                <TableHead>NF</TableHead>
                <TableHead>Nota Débito</TableHead>
                {canEmit && <TableHead>Holerite</TableHead>}
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheetItems.map(item => {
                const person = people.find(p => p.id === item.person_id);
                const isItemEditing = editingItem === item.id;
                const nfConfig = NF_STATUS_CONFIG[item.nf_status] || NF_STATUS_CONFIG.pendente;
                const itemValidations = nfValidations.filter(v => v.payroll_item_id === item.id);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <span className="font-light">{person?.name || "—"}</span>
                        {person?.cnpj && <span className="block text-[10px] text-muted-foreground">{person.cnpj}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isItemEditing ? (
                        <Input type="number" step="0.01" className="h-7 w-28 text-xs text-right ml-auto"
                          value={editValues.base_value ?? 0}
                          onChange={e => setEditValues(v => ({ ...v, base_value: parseFloat(e.target.value) || 0 }))} />
                      ) : <span className="font-mono">{fmt(Number(item.base_value))}</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {isItemEditing ? (
                        <div className="space-y-1">
                          <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right ml-auto"
                            value={editValues.adjustments ?? 0}
                            onChange={e => setEditValues(v => ({ ...v, adjustments: parseFloat(e.target.value) || 0 }))} />
                          <Input className="h-6 w-24 text-[10px] ml-auto" placeholder="Motivo"
                            value={editValues.adjustment_reason ?? ""}
                            onChange={e => setEditValues(v => ({ ...v, adjustment_reason: e.target.value }))} />
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono">{fmt(Number(item.adjustments))}</span>
                          {item.adjustment_reason && <span className="block text-[10px] text-muted-foreground">{item.adjustment_reason}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isItemEditing ? (
                        <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right ml-auto"
                          value={editValues.reimbursements ?? 0}
                          onChange={e => setEditValues(v => ({ ...v, reimbursements: parseFloat(e.target.value) || 0 }))} />
                      ) : <span className="font-mono">{fmt(Number(item.reimbursements))}</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {isItemEditing ? (
                        <div className="space-y-1">
                          <Input type="number" step="0.01" className="h-7 w-24 text-xs text-right ml-auto"
                            value={editValues.bonus ?? 0}
                            onChange={e => setEditValues(v => ({ ...v, bonus: parseFloat(e.target.value) || 0 }))} />
                          <Input className="h-6 w-24 text-[10px] ml-auto" placeholder="Motivo"
                            value={editValues.bonus_reason ?? ""}
                            onChange={e => setEditValues(v => ({ ...v, bonus_reason: e.target.value }))} />
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono">{fmt(Number(item.bonus))}</span>
                          {item.bonus_reason && <span className="block text-[10px] text-muted-foreground">{item.bonus_reason}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-light">{fmt(Number(item.total_value))}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={nfConfig.variant} className="text-[10px]">{nfConfig.label}</Badge>
                        {item.nf_status === "pendente" && !item.debit_note && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1" onClick={() => handleNfUpload(item.id)} disabled={validateNf.isPending}>
                              <Upload className="h-3 w-3 mr-1" /> Upload NF
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1" onClick={() => copyNfLink(item)}>
                              <Link2 className="h-3 w-3 mr-1" /> Link PJ
                            </Button>
                          </>
                        )}
                        {item.nf_url && (
                          <a href={item.nf_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                            <Eye className="h-3 w-3" /> Ver NF
                          </a>
                        )}
                        {itemValidations.length > 0 && itemValidations[0].validation_notes && (
                          <span className="text-[10px] text-yellow-600 max-w-[120px] truncate" title={itemValidations[0].validation_notes}>
                            ⚠ {itemValidations[0].validation_notes}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isItemEditing ? (
                        <div className="space-y-1">
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                            <input type="checkbox" checked={editValues.debit_note || false}
                              onChange={e => setEditValues(v => ({ ...v, debit_note: e.target.checked }))} />
                            Nota Débito
                          </label>
                          {editValues.debit_note && (
                            <Input className="h-6 w-24 text-[10px]" placeholder="Motivo"
                              value={editValues.debit_note_reason ?? ""}
                              onChange={e => setEditValues(v => ({ ...v, debit_note_reason: e.target.value }))} />
                          )}
                        </div>
                      ) : (
                        item.debit_note ? (
                          <div>
                            <Badge variant="outline" className="text-[10px]">Sim</Badge>
                            {item.debit_note_reason && <span className="block text-[10px] text-muted-foreground">{item.debit_note_reason}</span>}
                          </div>
                        ) : <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canEmit && (
                      <TableCell>
                        {item.holerite_emitido ? (
                          <Badge variant="default" className="text-[10px]">
                            <Check className="h-3 w-3 mr-0.5" /> Emitido
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleEmitPayslip(item.id)} disabled={emitPayslip.isPending}>
                            <Send className="h-3 w-3 mr-1" /> Emitir
                          </Button>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1">
                        {!isItemEditing && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => startEditing(item)}>Editar</Button>
                        )}
                        {isItemEditing && (
                          <>
                            <Button size="sm" className="h-7 text-xs" onClick={saveEditing}>Salvar</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingItem(null); setEditValues({}); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => generateHolerite(item)}>
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Status history for this sheet */}
        {sheetHistory.length > 0 && (
          <div>
            <h3 className="text-sm font-light mb-2 text-muted-foreground">Histórico de Aprovação</h3>
            <div className="space-y-2">
              {sheetHistory.map(h => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground w-32 shrink-0">
                    {new Date(h.created_at).toLocaleDateString("pt-BR")} {new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {h.old_status && <Badge variant="secondary" className="text-[10px]">{STATUS_CONFIG[h.old_status]?.label || h.old_status}</Badge>}
                  <span className="text-muted-foreground">→</span>
                  <Badge variant={STATUS_CONFIG[h.new_status]?.variant || "secondary"} className="text-[10px]">{STATUS_CONFIG[h.new_status]?.label || h.new_status}</Badge>
                  {h.justification && <span className="text-xs text-muted-foreground">— {h.justification}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection dialog */}
        <Dialog open={approvalDialog.open} onOpenChange={(o) => !o && setApprovalDialog({ open: false, action: "", sheetId: "" })}>
          <DialogContent>
            <DialogHeader><DialogTitle>Rejeitar Folha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder="Descreva o motivo da rejeição e os ajustes necessários..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog({ open: false, action: "", sheetId: "" })}>Cancelar</Button>
              <Button variant="destructive" onClick={handleApprovalSubmit} disabled={!justification.trim()}>Rejeitar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelected} />
      </div>
    );
  }
};

export default FolhaPagamento;



