import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowUpRight, ArrowDownRight, TrendingUp, FileSignature, Plus, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SalaryAdjustment, Person } from "@/hooks/usePeople";
import { AditivoGeneratorDialog } from "./AditivoGeneratorDialog";
import type { UseMutationResult } from "@tanstack/react-query";

interface Contract {
  id: string;
  salary_adjustment_id?: string | null;
}

interface SalaryAdjustmentsTabProps {
  adjustments: SalaryAdjustment[];
  people: Person[];
  contracts?: Contract[];
  onAddAdjustment?: UseMutationResult<void, Error, Omit<SalaryAdjustment, "id" | "created_at" | "user_id">>["mutate"];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pjTypes = ["prestacao_servicos_pj", "fornecimento_servicos", "autonomo", "representacao_comercial", "pj"];

export function SalaryAdjustmentsTab({ adjustments, people, contracts = [], onAddAdjustment }: SalaryAdjustmentsTabProps) {
  const [filterPerson, setFilterPerson] = useState("all");
  const [aditivoAdjustment, setAditivoAdjustment] = useState<SalaryAdjustment | null>(null);
  const [aditivoPerson, setAditivoPerson] = useState<Person | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPersonId, setManualPersonId] = useState("");
  const [manualOldValue, setManualOldValue] = useState("");
  const [manualNewValue, setManualNewValue] = useState("");
  const [manualDate, setManualDate] = useState<Date | undefined>(new Date());
  const [manualReason, setManualReason] = useState("");

  const filtered = filterPerson === "all"
    ? adjustments
    : adjustments.filter((a) => a.person_id === filterPerson);

  const sorted = [...filtered].sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

  const getName = (personId: string) => people.find((p) => p.id === personId)?.name || "—";
  const getPerson = (personId: string) => people.find((p) => p.id === personId);
  const hasAditivo = (adjId: string) => contracts.some((c) => c.salary_adjustment_id === adjId);
  const isPJ = (personId: string) => {
    const p = getPerson(personId);
    return p ? pjTypes.includes(p.contract_type) : false;
  };

  const handleManualPersonChange = (id: string) => {
    setManualPersonId(id);
    const p = people.find((x) => x.id === id);
    if (p) setManualOldValue(String(p.base_salary));
  };

  const handleManualSave = () => {
    if (!manualPersonId || !manualOldValue || !manualNewValue || !manualDate || !manualReason) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const oldVal = parseFloat(manualOldValue);
    const newVal = parseFloat(manualNewValue);
    if (isNaN(oldVal) || isNaN(newVal) || oldVal <= 0) {
      toast.error("Valores inválidos.");
      return;
    }
    const pct = ((newVal - oldVal) / oldVal) * 100;
    onAddAdjustment?.({
      person_id: manualPersonId,
      old_value: oldVal,
      new_value: newVal,
      change_percentage: parseFloat(pct.toFixed(2)),
      effective_date: format(manualDate, "yyyy-MM-dd"),
      reason: manualReason,
    });
    setManualOpen(false);
    setManualPersonId("");
    setManualOldValue("");
    setManualNewValue("");
    setManualDate(new Date());
    setManualReason("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-light">Histórico de Reajustes Salariais</h3>
          <Badge variant="secondary">{sorted.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {onAddAdjustment && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4" /> Registrar Reajuste Manual
            </Button>
          )}
          <Select value={filterPerson} onValueChange={setFilterPerson}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os colaboradores</SelectItem>
              {people.filter(p => p.status === "ativo").map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Manual adjustment dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Reajuste Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={manualPersonId} onValueChange={handleManualPersonChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {people.filter(p => p.status === "ativo").map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor Anterior (R$) *</Label>
                <Input type="number" step="0.01" value={manualOldValue} onChange={(e) => setManualOldValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Novo Valor (R$) *</Label>
                <Input type="number" step="0.01" value={manualNewValue} onChange={(e) => setManualNewValue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Efetiva *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !manualDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {manualDate ? format(manualDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={manualDate} onSelect={setManualDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea value={manualReason} onChange={(e) => setManualReason(e.target.value)} placeholder="Ex: Reajuste anual 2026" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancelar</Button>
            <Button onClick={handleManualSave}>Salvar Reajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {sorted.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-light">Nenhum reajuste registrado</p>
          <p className="text-sm mt-1">Os reajustes serão registrados automaticamente ao alterar o salário base de um colaborador.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data Efetiva</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-right">Valor Anterior</TableHead>
                <TableHead className="text-right">Novo Valor</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Aditivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((adj) => {
                const isIncrease = adj.new_value >= adj.old_value;
                const adjHasAditivo = hasAditivo(adj.id);
                const adjIsPJ = isPJ(adj.person_id);
                return (
                  <TableRow key={adj.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(adj.effective_date + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-light">{getName(adj.person_id)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{fmt(adj.old_value)}</TableCell>
                    <TableCell className="text-right font-mono font-light">{fmt(adj.new_value)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isIncrease ? "default" : "destructive"} className="gap-1">
                        {isIncrease ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {adj.change_percentage > 0 ? "+" : ""}{adj.change_percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {adj.reason || "—"}
                    </TableCell>
                    <TableCell>
                      {adjIsPJ ? (
                        adjHasAditivo ? (
                          <Badge variant="default" className="gap-1 text-[10px]">
                            <FileSignature className="h-3 w-3" /> Gerado
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              const p = getPerson(adj.person_id);
                              if (p) {
                                setAditivoPerson(p);
                                setAditivoAdjustment(adj);
                              }
                            }}
                          >
                            <FileSignature className="h-3 w-3" /> Gerar Aditivo
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {aditivoPerson && aditivoAdjustment && (
        <AditivoGeneratorDialog
          open={!!aditivoAdjustment}
          onOpenChange={(open) => {
            if (!open) {
              setAditivoAdjustment(null);
              setAditivoPerson(null);
            }
          }}
          person={aditivoPerson}
          adjustment={aditivoAdjustment}
        />
      )}
    </div>
  );
}



