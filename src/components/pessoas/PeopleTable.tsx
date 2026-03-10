import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, ArrowUpDown, Search, ChevronRight, ChevronDown } from "lucide-react";
import { PersonFormDialog } from "./PersonFormDialog";
import type { Person, SalaryHistory, PersonInsert, Commission, SalaryAdjustment } from "@/hooks/usePeople";
import type { PayrollSheet, PayrollItem } from "@/hooks/usePayroll";
import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  people: Person[];
  salaryHistory: SalaryHistory[];
  commissions: Commission[];
  totalMonthlySalary: number;
  onUpdate: (data: Partial<Person> & { id: string }) => void;
  onDelete: (id: string) => void;
  onUpdateCommission?: (data: { id: string; month: number; year: number; value: number; description: string | null }) => void;
  onDeleteCommission?: (id: string) => void;
  onAddCommission?: (data: { person_id: string; month: number; year: number; value: number; description: string | null }) => void;
  onUpdateSalary?: (data: { id: string; value: number; notes: string | null }) => void;
  onDeleteSalary?: (id: string) => void;
  salaryAdjustments?: SalaryAdjustment[];
  onSalaryAdjustment?: (adj: { person_id: string; old_value: number; new_value: number; change_percentage: number; effective_date: string; reason: string | null }) => void;
  payrollSheets?: PayrollSheet[];
  payrollItems?: PayrollItem[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  pausado: { label: "Pausado", variant: "secondary" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

type SortKey = "name" | "role" | "base_salary" | "status" | "admission_date" | "pct";

export function PeopleTable({ people, salaryHistory, commissions, totalMonthlySalary, onUpdate, onDelete, onUpdateCommission, onDeleteCommission, onAddCommission, onUpdateSalary, onDeleteSalary, salaryAdjustments = [], onSalaryAdjustment, payrollSheets = [], payrollItems = [] }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showMonths, setShowMonths] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ column }: { column: SortKey }) => (
    <ArrowUpDown className={`h-3 w-3 ml-1 inline ${sortKey === column ? "opacity-100" : "opacity-30"}`} />
  );

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Show all 12 months of the current year (Jan-Dec)
  const currentYear = new Date().getFullYear();
  const monthColumns = useMemo(() => {
    const cols: { month: number; year: number; label: string }[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(currentYear, m, 1);
      cols.push({
        month: m + 1,
        year: currentYear,
        label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      });
    }
    return cols;
  }, [currentYear]);

  const filtered = useMemo(() => {
    let result = [...people];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "base_salary" || sortKey === "pct") cmp = Number(a.base_salary) - Number(b.base_salary);
      else if (sortKey === "admission_date") cmp = (a.admission_date || "").localeCompare(b.admission_date || "");
      else cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [people, search, statusFilter, sortKey, sortDir]);

  const getBaseSalaryAtDate = (personId: string, month: number, year: number) => {
    const personAdj = salaryAdjustments
      .filter((a) => a.person_id === personId)
      .sort((a, b) => a.effective_date.localeCompare(b.effective_date));

    if (personAdj.length === 0) return Number(people.find(p => p.id === personId)?.base_salary ?? 0);

    const endOfMonth = new Date(year, month, 0); // last day of month
    const endStr = endOfMonth.toISOString().slice(0, 10);

    const applicable = personAdj.filter((a) => a.effective_date <= endStr);
    if (applicable.length > 0) return Number(applicable[applicable.length - 1].new_value);

    // No adjustment before this month — use old_value of the earliest adjustment
    return Number(personAdj[0].old_value);
  };

  const getSalary = (personId: string, month: number, year: number) => {
    return salaryHistory.find((s) => s.person_id === personId && s.month === month && s.year === year);
  };

  const getCommission = (personId: string, month: number, year: number) => {
    return commissions
      .filter((c) => c.person_id === personId && c.month === month && c.year === year)
      .reduce((sum, c) => sum + Number(c.value), 0);
  };

  // Get payroll data for a person in a given month/year
  const getPayrollData = (personId: string, month: number, year: number) => {
    const sheet = payrollSheets.find(s => s.month === month && s.year === year);
    if (!sheet) return null;
    const item = payrollItems.find(i => i.payroll_id === sheet.id && i.person_id === personId);
    if (!item) return null;
    return { item, sheet };
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  Nome <SortIcon column="name" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("role")}>
                  Cargo <SortIcon column="role" />
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("base_salary")}>
                  Salário Base <SortIcon column="base_salary" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => setShowMonths(!showMonths)}>
                  <span className="flex items-center gap-1 text-xs">
                    {showMonths ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    Meses
                  </span>
                </TableHead>
                {showMonths && monthColumns.map((mc) => (
                  <TableHead key={`${mc.month}-${mc.year}`} className="text-right text-xs">
                    {mc.label}/{mc.year.toString().slice(-2)}
                  </TableHead>
                ))}
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort("pct")}>
                  % do Total <SortIcon column="pct" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("status")}>
                  Status <SortIcon column="status" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("admission_date")}>
                  Admissão <SortIcon column="admission_date" />
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6 + (showMonths ? monthColumns.length : 0)} className="text-center text-muted-foreground py-8">
                    Nenhum colaborador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((person) => {
                  const pct = totalMonthlySalary > 0 ? (Number(person.base_salary) / totalMonthlySalary) * 100 : 0;
                  const st = STATUS_MAP[person.status] || STATUS_MAP.ativo;
                  return (
                    <TableRow key={person.id} className="group">
                      <TableCell className="font-light">{person.name}</TableCell>
                      <TableCell className="text-muted-foreground">{person.role || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(Number(person.base_salary))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {showMonths ? "" : "—"}
                      </TableCell>
                      {showMonths && monthColumns.map((mc) => {
                        const payrollData = getPayrollData(person.id, mc.month, mc.year);
                        
                        if (!payrollData) {
                          return (
                            <TableCell key={`${mc.month}-${mc.year}`} className="text-right font-mono text-xs">
                              <span className="text-muted-foreground/40">—</span>
                            </TableCell>
                          );
                        }

                        const { item, sheet } = payrollData;
                        const isPaid = sheet.status === "paga";
                        const isApproved = sheet.status === "aprovada";
                        const hasNf = item.nf_status === "aprovada" || item.nf_status === "validada" || item.nf_url;

                        return (
                          <TableCell key={`${mc.month}-${mc.year}`} className="text-right font-mono text-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center gap-1 cursor-help ${isPaid ? "text-primary font-light" : isApproved ? "text-primary" : ""}`}>
                                  {fmt(Number(item.total_value))}
                                  {isPaid && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                  {!isPaid && isApproved && <Clock className="h-3 w-3 text-primary" />}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p>Base: {fmt(Number(item.base_value))}</p>
                                  {Number(item.adjustments) !== 0 && <p>Ajustes: {fmt(Number(item.adjustments))}</p>}
                                  {Number(item.bonus) > 0 && <p>Bônus: {fmt(Number(item.bonus))}</p>}
                                  {Number(item.reimbursements) > 0 && <p>Reembolsos: {fmt(Number(item.reimbursements))}</p>}
                                  <p className="font-light border-t pt-1">Total: {fmt(Number(item.total_value))}</p>
                                  <p className="border-t pt-1">
                                    Folha: <span className={isPaid ? "text-primary" : ""}>{isPaid ? "Paga ✓" : sheet.status}</span>
                                  </p>
                                  <p>NF: {hasNf ? "Enviada ✓" : item.nf_status}</p>
                                  {item.holerite_emitido && <p>Holerite: Emitido ✓</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-mono">{pct.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {person.admission_date ? new Date(person.admission_date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PersonFormDialog
                            editPerson={person}
                            onSubmit={(data) => onUpdate({ id: person.id, ...data })}
                            commissions={commissions}
                            onUpdateCommission={onUpdateCommission}
                            onDeleteCommission={onDeleteCommission}
                            onAddCommission={onAddCommission}
                            salaryHistory={salaryHistory}
                            onUpdateSalary={onUpdateSalary}
                            onDeleteSalary={onDeleteSalary}
                            salaryAdjustments={salaryAdjustments}
                            onSalaryAdjustment={onSalaryAdjustment}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(person.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground text-right">{filtered.length} colaborador(es) listado(s)</p>
      </div>
    </TooltipProvider>
  );
}



