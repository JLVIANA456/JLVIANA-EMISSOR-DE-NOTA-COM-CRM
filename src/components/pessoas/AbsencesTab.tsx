import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { differenceInBusinessDays } from "date-fns";
import type { PJAbsence, AbsenceInsert } from "@/hooks/useAbsences";
import type { Person } from "@/hooks/usePeople";

interface Props {
  absences: PJAbsence[];
  people: Person[];
  onAdd: (a: AbsenceInsert) => void;
  onUpdate: (a: Partial<PJAbsence> & { id: string }) => void;
  onDelete: (id: string) => void;
}

const TYPE_MAP: Record<string, string> = { ferias: "Férias", licenca: "Licença", folga: "Folga" };
const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  solicitada: { label: "Pendente", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
};

export function AbsencesTab({ absences, people, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [absenceType, setAbsenceType] = useState("ferias");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const reset = () => { setPersonId(""); setAbsenceType("ferias"); setStartDate(""); setEndDate(""); setReason(""); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = startDate && endDate ? differenceInBusinessDays(new Date(endDate), new Date(startDate)) + 1 : 0;
    onAdd({
      person_id: personId,
      absence_type: absenceType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      status: "solicitada",
      approved_by: null,
      days_count: Math.max(days, 0),
    });
    setOpen(false);
    reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{absences.length} ausência(s)</p>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar Ausência</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Ausência</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Colaborador *</Label>
                <Select value={personId} onValueChange={setPersonId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {people.filter(p => p.status === "ativo").map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={absenceType} onValueChange={setAbsenceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="licenca">Licença</SelectItem>
                    <SelectItem value="folga">Folga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início *</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Fim *</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={!personId || !startDate || !endDate}>Registrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {absences.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma ausência registrada.</TableCell></TableRow>
            ) : absences.map(a => {
              const person = people.find(p => p.id === a.person_id);
              const st = STATUS_MAP[a.status] || STATUS_MAP.solicitada;
              return (
                <TableRow key={a.id} className="group">
                  <TableCell className="font-light">{person?.name || "—"}</TableCell>
                  <TableCell>{TYPE_MAP[a.absence_type] || a.absence_type}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(a.start_date + "T12:00:00").toLocaleDateString("pt-BR")} — {new Date(a.end_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{a.days_count}</TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{a.reason || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {a.status === "solicitada" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => onUpdate({ id: a.id, status: "aprovada" })}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onUpdate({ id: a.id, status: "rejeitada" })}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(a.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



