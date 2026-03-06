import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus } from "lucide-react";
import type { Person } from "@/hooks/usePeople";

interface SalaryFormDialogProps {
  people: Person[];
  onSubmit: (salary: { person_id: string; month: number; year: number; value: number; notes: string | null }) => void;
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function SalaryFormDialog({ people, onSubmit }: SalaryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [personId, setPersonId] = useState("");
  const [month, setMonth] = useState((now.getMonth() + 1).toString());
  const [year, setYear] = useState(now.getFullYear().toString());
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      person_id: personId,
      month: parseInt(month),
      year: parseInt(year),
      value: parseFloat(value) || 0,
      notes: notes || null,
    });
    setOpen(false);
    setPersonId(""); setValue(""); setNotes("");
  };

  const activePeople = people.filter((p) => p.status === "ativo");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarPlus className="h-4 w-4 mr-1" />
          Registrar Salário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Salário Mensal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Colaborador *</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {activePeople.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={!personId}>Registrar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}



