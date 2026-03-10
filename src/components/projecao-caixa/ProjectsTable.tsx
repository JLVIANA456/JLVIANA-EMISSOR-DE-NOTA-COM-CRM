import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { CashFlowProject } from "@/hooks/useProjects";
import { addMonths, parseISO, isWithinInterval, isBefore, isAfter } from "date-fns";

interface ProjectsTableProps {
  projects: CashFlowProject[];
  onEdit: (project: CashFlowProject) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  ativo: "bg-primary/15 text-primary border-secondary",
  pausado: "bg-amber-500/15 text-amber-700 border-amber-200",
  negociacao: "bg-primary/15 text-primary border-secondary",
  finalizado: "bg-muted text-muted-foreground border-border",
};

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  negociacao: "Negociação",
  finalizado: "Finalizado",
};

const typeLabels: Record<string, string> = {
  recorrente: "Recorrente",
  pontual: "Pontual",
  consultoria: "Consultoria",
  treinamento: "Treinamento",
};

function getProjectionForMonth(project: CashFlowProject, monthOffset: number): number {
  if (project.status === "finalizado" || project.status === "pausado") return 0;
  const now = new Date();
  const targetMonth = addMonths(now, monthOffset);
  const start = parseISO(project.start_date);
  if (isAfter(start, targetMonth)) return 0;
  if (project.end_date) {
    const end = parseISO(project.end_date);
    if (isBefore(end, targetMonth)) return 0;
  }
  return Number(project.monthly_value);
}

function fmt(v: number) {
  return v > 0 ? `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "-";
}

export function ProjectsTable({ projects, onEdit, onDelete }: ProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
        Nenhum projeto cadastrado. Clique em "Novo Projeto" para começar.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projeto / Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor Mensal</TableHead>
            <TableHead className="text-right">30 dias</TableHead>
            <TableHead className="text-right">60 dias</TableHead>
            <TableHead className="text-right">90 dias</TableHead>
            <TableHead className="text-right">Total 90d</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => {
            const m1 = getProjectionForMonth(p, 0);
            const m2 = getProjectionForMonth(p, 1);
            const m3 = getProjectionForMonth(p, 2);
            const total = m1 + m2 + m3;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-light text-sm">{p.name}</div>
                  {p.client_name && <div className="text-xs text-muted-foreground">{p.client_name}</div>}
                </TableCell>
                <TableCell className="text-sm">{typeLabels[p.project_type] || p.project_type}</TableCell>
                <TableCell className="text-right text-sm font-light">{fmt(Number(p.monthly_value))}</TableCell>
                <TableCell className="text-right text-sm">{fmt(m1)}</TableCell>
                <TableCell className="text-right text-sm">{fmt(m2)}</TableCell>
                <TableCell className="text-right text-sm">{fmt(m3)}</TableCell>
                <TableCell className="text-right text-sm font-light">{fmt(total)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[p.status] || ""}>
                    {statusLabels[p.status] || p.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}



