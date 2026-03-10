import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/contexts/AuthContext";
import { usePjPortal } from "@/components/hooks/usePjPortal";
import { supabase } from "@/components/integrations/supabase/client";
// Logo removed
import { toast } from "sonner";
import {
  Building2, LogOut, LayoutDashboard, FileText, CalendarDays,
  Receipt, CreditCard, FolderOpen, Upload, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Download, Eye, User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PayslipDialog, buildPayslipPdf } from "@/components/portal/PayslipDialog";
import { PortalReimbursementForm } from "@/components/portal/PortalReimbursementForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const MONTHS_FULL = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const STATUS_COLORS: Record<string, string> = {
  rascunho: "secondary",
  pronta: "outline",
  aprovada: "default",
  paga: "default",
  pendente: "secondary",
  valida: "default",
  aguardando_aprovacao: "secondary",
  aprovado: "default",
  programado: "outline",
  solicitada: "secondary",
};

const PortalPjDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const { person, payrollItems, reimbursements, absences, contracts, isLoading } = usePjPortal();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [payslipItem, setPayslipItem] = useState<any>(null);
  const [showReimbForm, setShowReimbForm] = useState(false);

  // Vacation request state
  const [vacForm, setVacForm] = useState({ start_date: "", end_date: "", reason: "", absence_type: "ferias" });
  const [vacLoading, setVacLoading] = useState(false);



  const handleLogout = async () => {
    await signOut();
    navigate("/portal-pj");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando portal...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-muted-foreground">Perfil PJ não encontrado.</p>
          <Button onClick={handleLogout}>Sair</Button>
        </div>
      </div>
    );
  }

  // Dashboard metrics — only show items where holerite was emitted
  const paidItems = payrollItems.filter((i: any) => i.payroll_sheets?.status === "paga" && i.holerite_emitido);
  const payslipItems = payrollItems.filter((i: any) => (i.payroll_sheets?.status === "aprovada" || i.payroll_sheets?.status === "paga") && i.holerite_emitido);
  const pendingNfs = payrollItems.filter((i: any) => i.nf_status === "pendente" && i.holerite_emitido && i.payroll_sheets?.status !== "paga");
  const openReimbursements = reimbursements.filter((r: any) => r.status === "aguardando_aprovacao");
  const openAbsences = absences.filter((a: any) => a.status === "solicitada");
  const nextPayment = payrollItems.find((i: any) => i.payroll_sheets?.status === "aprovada");

  const handleVacationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVacLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(vacForm.start_date);
    const endDate = new Date(vacForm.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (startDate < today) {
      toast.error("A data de início não pode ser retroativa.");
      setVacLoading(false);
      return;
    }

    if (daysDiff < 1) {
      toast.error("A data final deve ser posterior à data inicial.");
      setVacLoading(false);
      return;
    }

    // Check for overlapping absences
    const overlap = absences.find((a: any) => {
      if (a.status === "rejeitada") return false;
      const aStart = new Date(a.start_date);
      const aEnd = new Date(a.end_date);
      return startDate <= aEnd && endDate >= aStart;
    });

    if (overlap) {
      toast.error("Já existe uma solicitação para o período selecionado.");
      setVacLoading(false);
      return;
    }

    // Get the admin's user_id from the people record (required for RLS)
    const { data: personRecord } = await supabase
      .from("people")
      .select("user_id")
      .eq("id", person.id)
      .single();

    if (!(personRecord as any)?.user_id) {
      toast.error("Erro: não foi possível identificar o administrador responsável.");
      setVacLoading(false);
      return;
    }

    const { error } = await supabase.from("pj_absences").insert({
      person_id: person.id,
      user_id: (personRecord as any).user_id,
      absence_type: vacForm.absence_type,
      start_date: vacForm.start_date,
      end_date: vacForm.end_date,
      days_count: daysDiff,
      reason: vacForm.reason || null,
      status: "solicitada",
    } as any);

    setVacLoading(false);
    if (error) {
      toast.error("Erro ao enviar solicitação: " + error.message);
    } else {
      toast.success("Solicitação enviada com sucesso!");
      setVacForm({ start_date: "", end_date: "", reason: "", absence_type: "ferias" });
      queryClient.invalidateQueries({ queryKey: ["pj-portal-absences"] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium tracking-tight">Portal do Cliente BPO</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{person.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-light">Bem-vindo(a), {person.name.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-muted-foreground">
            {person.nome_fantasia || person.razao_social || person.name} • {person.role} • {person.email}
          </p>
          {person.cnpj && (
            <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {person.cnpj}</p>
          )}
        </div>

        {/* Alert Banners */}
        {(pendingNfs.length > 0 || payslipItems.length > 0 || absences.some((a: any) => a.status === "aprovada" || a.status === "rejeitada")) && (
          <div className="mb-6 space-y-2">
            {pendingNfs.length > 0 && (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("nfs")}>
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">Você tem <strong>{pendingNfs.length}</strong> nota{pendingNfs.length > 1 ? "s" : ""} fiscal{pendingNfs.length > 1 ? "is" : ""} pendente{pendingNfs.length > 1 ? "s" : ""} de envio.</p>
              </div>
            )}
            {payslipItems.length > 0 && payslipItems.some((i: any) => i.payroll_sheets?.status === "aprovada") && (
              <div className="rounded-lg border border-secondary bg-secondary dark:bg-primary/20 dark:border-primary p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("documentos")}>
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-primary dark:text-secondary">Novo recibo disponível para visualização.</p>
              </div>
            )}
            {absences.some((a: any) => a.status === "aprovada") && (
              <div className="rounded-lg border border-secondary bg-secondary dark:bg-primary/20 dark:border-primary p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("ferias")}>
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm text-primary dark:text-secondary">Sua solicitação documental foi <strong>atendida</strong>!</p>
              </div>
            )}
            {absences.some((a: any) => a.status === "rejeitada") && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("ferias")}>
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">Uma solicitação documental foi <strong>rejeitada</strong>. Verifique os detalhes.</p>
              </div>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" /> Painel de Controle</TabsTrigger>
            <TabsTrigger value="nfs" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Faturamento e NFs</TabsTrigger>
            <TabsTrigger value="ferias" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Solicitações Operacionais</TabsTrigger>
            <TabsTrigger value="reembolsos" className="gap-1.5"><Receipt className="h-3.5 w-3.5" /> Reembolsos e Despesas</TabsTrigger>
            <TabsTrigger value="pagamentos" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Meus Extratos</TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5"><FolderOpen className="h-3.5 w-3.5" /> Arquivo Digital</TabsTrigger>
            <TabsTrigger value="meus-dados" className="gap-1.5"><User className="h-3.5 w-3.5" /> Dados cadastrais</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("pagamentos")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-light text-muted-foreground">Próximo Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {nextPayment ? (
                    <>
                      <div className="text-2xl font-light">{fmt(Number(nextPayment.total_value))}</div>
                      <p className="text-xs text-muted-foreground">
                        {MONTHS_FULL[nextPayment.payroll_sheets?.month]}/{nextPayment.payroll_sheets?.year}
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum previsto</div>
                  )}
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("nfs")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-light text-muted-foreground">NFs Pendentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-light">{pendingNfs.length}</div>
                  <p className="text-xs text-muted-foreground">aguardando envio</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("reembolsos")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-light text-muted-foreground">Reembolsos Abertos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-light">{openReimbursements.length}</div>
                  <p className="text-xs text-muted-foreground">aguardando aprovação</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("documentos")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-light text-muted-foreground">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-light">{contracts.length}</div>
                  <p className="text-xs text-muted-foreground">contratos disponíveis</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {paidItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Valor Base</TableHead>
                        <TableHead>Reembolsos</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pago em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidItems.slice(0, 5).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{MONTHS_FULL[item.payroll_sheets?.month]}/{item.payroll_sheets?.year}</TableCell>
                          <TableCell>{fmt(Number(item.base_value))}</TableCell>
                          <TableCell>{Number(item.reimbursements) > 0 ? fmt(Number(item.reimbursements)) : "—"}</TableCell>
                          <TableCell className="font-light">{fmt(Number(item.total_value))}</TableCell>
                          <TableCell>{fmtDate(item.payroll_sheets?.paid_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* NFs */}
          <TabsContent value="nfs" className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-base text-primary">Faturamento e NFs</CardTitle>
                  <CardDescription>Envie e gerencie as notas fiscais da sua empresa</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status NF</TableHead>
                      <TableHead>Status Folha</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.filter((i: any) => i.holerite_emitido).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nenhuma folha encontrada.</TableCell></TableRow>
                    ) : payrollItems.filter((i: any) => i.holerite_emitido).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{MONTHS_FULL[item.payroll_sheets?.month]}/{item.payroll_sheets?.year}</TableCell>
                        <TableCell>{fmt(Number(item.total_value))}</TableCell>
                        <TableCell>
                          <Badge variant={item.nf_status === "valida" ? "default" : item.nf_status === "enviada" ? "outline" : item.nf_status === "pendente" ? "secondary" : "destructive"}>
                            {item.nf_status === "pendente" ? "Pendente" : item.nf_status === "enviada" ? "Enviada" : item.nf_status === "valida" ? "Válida" : item.nf_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.payroll_sheets?.status === "paga" ? "default" : "outline"}>
                            {item.payroll_sheets?.status === "paga" ? "Paga" : item.payroll_sheets?.status === "aprovada" ? "Aprovada" : item.payroll_sheets?.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.nf_status === "pendente" && !item.nf_url && item.nf_share_token ? (
                            <Button size="sm" variant="outline" onClick={() => window.open(`/enviar-nf-pj?token=${item.nf_share_token}`, "_blank")}>
                              <Upload className="h-3.5 w-3.5 mr-1" /> Enviar NF
                            </Button>
                          ) : item.nf_url ? (
                            <Button size="sm" variant="ghost" onClick={() => window.open(item.nf_url, "_blank")}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver NF
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FÉRIAS */}
          <TabsContent value="ferias" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Solicitar Férias / Ausência</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVacationSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={vacForm.absence_type} onValueChange={(v) => setVacForm(f => ({ ...f, absence_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ferias">Férias</SelectItem>
                          <SelectItem value="licenca">Licença</SelectItem>
                          <SelectItem value="day_off">Day Off</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Input type="date" required value={vacForm.start_date} onChange={(e) => setVacForm(f => ({ ...f, start_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Input type="date" required value={vacForm.end_date} onChange={(e) => setVacForm(f => ({ ...f, end_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (opcional)</Label>
                      <Textarea value={vacForm.reason} onChange={(e) => setVacForm(f => ({ ...f, reason: e.target.value }))} placeholder="Descreva o motivo..." />
                    </div>
                    <Button type="submit" disabled={vacLoading} className="w-full">
                      {vacLoading ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Solicitações</CardTitle>
                </CardHeader>
                <CardContent>
                  {absences.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação registrada.</p>
                  ) : (
                    <div className="space-y-3">
                      {absences.map((a: any) => (
                        <div key={a.id} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-light capitalize">{a.absence_type === "ferias" ? "Férias" : a.absence_type === "day_off" ? "Day Off" : a.absence_type}</span>
                            <Badge variant={a.status === "aprovada" ? "default" : a.status === "rejeitada" ? "destructive" : "secondary"}>
                              {a.status === "solicitada" ? "Enviada" : a.status === "aprovada" ? "Aprovada" : a.status === "rejeitada" ? "Rejeitada" : a.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(a.start_date)} → {fmtDate(a.end_date)} ({a.days_count} dias)
                          </p>
                          {a.reason && <p className="text-xs text-muted-foreground">{a.reason}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REEMBOLSOS */}
          <TabsContent value="reembolsos" className="space-y-6">
            {showReimbForm ? (
              <PortalReimbursementForm
                person={{ name: person.name, email: person.email, role: person.role, cnpj: person.cnpj }}
                onSuccess={() => { setShowReimbForm(false); queryClient.invalidateQueries({ queryKey: ["pj-portal-reimbursements"] }); }}
                onCancel={() => setShowReimbForm(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Meus Reembolsos</CardTitle>
                      <CardDescription>Acompanhe o status das suas solicitações</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowReimbForm(true)}>
                      <Receipt className="h-4 w-4 mr-1" /> Nova Solicitação
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reimbursements.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <Receipt className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhuma solicitação de reembolso encontrada.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protocolo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reimbursements.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">{r.protocol_number}</TableCell>
                            <TableCell>{fmtDate(r.expense_date)}</TableCell>
                            <TableCell className="text-sm">{r.category}</TableCell>
                            <TableCell>{fmt(Number(r.amount))}</TableCell>
                            <TableCell>
                              <Badge variant={
                                r.status === "pago" ? "default" :
                                  r.status === "aprovado" ? "default" :
                                    r.status === "rejeitado" ? "destructive" : "secondary"
                              }>
                                {r.status === "aguardando_aprovacao" ? "Aguardando" :
                                  r.status === "aprovado" ? "Aprovado" :
                                    r.status === "programado" ? "Programado" :
                                      r.status === "pago" ? "Pago" :
                                        r.status === "rejeitado" ? "Rejeitado" : r.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PAGAMENTOS */}
          <TabsContent value="pagamentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
                <CardDescription>Todos os pagamentos processados pela folha PJ</CardDescription>
              </CardHeader>
              <CardContent>
                {payslipItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro de pagamento.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead>Valor Base</TableHead>
                        <TableHead>Ajustes</TableHead>
                        <TableHead>Bônus</TableHead>
                        <TableHead>Reembolsos</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslipItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-light">
                            {MONTHS_FULL[item.payroll_sheets?.month]}/{item.payroll_sheets?.year}
                          </TableCell>
                          <TableCell>{fmt(Number(item.base_value))}</TableCell>
                          <TableCell>{Number(item.adjustments) !== 0 ? fmt(Number(item.adjustments)) : "—"}</TableCell>
                          <TableCell>{Number(item.bonus) > 0 ? fmt(Number(item.bonus)) : "—"}</TableCell>
                          <TableCell>{Number(item.reimbursements) > 0 ? fmt(Number(item.reimbursements)) : "—"}</TableCell>
                          <TableCell className="font-light">{fmt(Number(item.total_value))}</TableCell>
                          <TableCell>
                            <Badge variant={item.payroll_sheets?.status === "paga" ? "default" : "outline"}>
                              {item.payroll_sheets?.status === "paga" ? "Pago" : item.payroll_sheets?.status === "aprovada" ? "Aprovado" : item.payroll_sheets?.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{fmtDate(item.payroll_sheets?.paid_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTOS */}
          <TabsContent value="documentos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contracts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contratos</CardTitle>
                  <CardDescription>Seus contratos e aditivos</CardDescription>
                </CardHeader>
                <CardContent>
                  {contracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum contrato encontrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {contracts.map((c: any) => (
                        <div key={c.id} className="rounded-lg border p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-light capitalize">{c.contract_type === "original" ? "Contrato Original" : c.contract_type === "aditivo" ? "Aditivo" : c.contract_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(c.start_date)} → {c.end_date ? fmtDate(c.end_date) : "Vigente"}
                              {" • "}{fmt(Number(c.monthly_value))}/mês
                            </p>
                            <Badge variant={c.status === "ativo" ? "default" : "secondary"} className="mt-1">
                              {c.status}
                            </Badge>
                          </div>
                          {c.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={c.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holerites */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Holerites</CardTitle>
                  <CardDescription>Recibos de pagamento</CardDescription>
                </CardHeader>
                <CardContent>
                  {payslipItems.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <CreditCard className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Nenhum holerite disponível ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payslipItems.map((item: any) => (
                        <div key={item.id} className="rounded-lg border p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-light">{MONTHS_FULL[item.payroll_sheets?.month]}/{item.payroll_sheets?.year}</p>
                              <p className="text-xs text-muted-foreground">{fmt(Number(item.total_value))}</p>
                            </div>
                            <Badge variant={item.payroll_sheets?.status === "paga" ? "default" : "secondary"} className={item.payroll_sheets?.status === "paga" ? "bg-primary hover:bg-primary" : "bg-secondary text-primary hover:bg-secondary"}>
                              {item.payroll_sheets?.paid_at ? `Pago em ${fmtDate(item.payroll_sheets.paid_at)}` : "Aprovado"}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setPayslipItem(item)}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> Ver Holerite
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* MEUS DADOS */}
          <TabsContent value="meus-dados" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meus Dados Cadastrais</CardTitle>
                <CardDescription>Informações registradas pela empresa (somente leitura)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: "Nome", value: person.name },
                    { label: "E-mail", value: person.email },
                    { label: "CNPJ", value: person.cnpj },
                    { label: "Razão Social", value: person.razao_social },
                    { label: "Nome Fantasia", value: person.nome_fantasia },
                    { label: "Telefone", value: person.phone },
                    { label: "Endereço", value: person.address },
                    { label: "Cargo / Função", value: person.role },
                    { label: "Tipo de Contrato", value: person.contract_type === "pj" ? "PJ" : person.contract_type === "prestacao_servicos_pj" ? "Prestação de Serviços PJ" : person.contract_type },
                    { label: "Regime Tributário", value: person.tax_regime },
                    { label: "Data de Admissão", value: person.admission_date ? fmtDate(person.admission_date) : null },
                    { label: "Valor Base", value: fmt(person.base_salary) },
                  ].map((field) => (
                    <div key={field.label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="text-sm font-light">{field.value || "—"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {person && (
        <PayslipDialog
          open={!!payslipItem}
          onOpenChange={(open) => !open && setPayslipItem(null)}
          item={payslipItem}
          person={person}
        />
      )}
    </div>
  );
};

export default PortalPjDashboard;



