import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, Wallet, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Person } from "@/hooks/usePeople";
import type { PJContract } from "@/hooks/useContracts";
import type { PJAbsence } from "@/hooks/useAbsences";
import type { PayrollSheet } from "@/hooks/usePayroll";

interface Props {
  people: Person[];
  contracts: PJContract[];
  absences: PJAbsence[];
  sheets: PayrollSheet[];
  totalMonthlySalary: number;
}

export function DPDashboardTab({ people, contracts, absences, sheets, totalMonthlySalary }: Props) {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const now = new Date();

  const active = people.filter(p => p.status === "ativo").length;
  const paused = people.filter(p => p.status === "pausado").length;
  const inactive = people.filter(p => p.status === "finalizado").length;

  const expiringContracts = contracts.filter(c => {
    if (!c.end_date || c.status !== "ativo") return false;
    const days = differenceInDays(new Date(c.end_date), now);
    return days >= 0 && days <= 30;
  });

  const upcomingAbsences = absences.filter(a => {
    if (a.status === "rejeitada") return false;
    const start = new Date(a.start_date);
    const days = differenceInDays(start, now);
    return days >= 0 && days <= 14;
  });

  const pendingSheets = sheets.filter(s => s.status === "rascunho" || s.status === "pronta");
  const pendingApprovalAbsences = absences.filter(a => a.status === "solicitada").length;

  const cards = [
    { title: "PJs Ativos", value: active, sub: `${paused} pausados · ${inactive} inativos`, icon: Users, color: "text-primary" },
    { title: "Contratos a Vencer", value: expiringContracts.length, sub: "Próximos 30 dias", icon: FileText, color: expiringContracts.length > 0 ? "text-destructive" : "text-muted-foreground" },
    { title: "Ausências Previstas", value: upcomingAbsences.length, sub: "Próximas 2 semanas", icon: Calendar, color: "text-amber-500" },
    { title: "Aprovações Pendentes", value: pendingApprovalAbsences + pendingSheets.length, sub: `${pendingApprovalAbsences} ausências · ${pendingSheets.length} folhas`, icon: AlertTriangle, color: (pendingApprovalAbsences + pendingSheets.length) > 0 ? "text-amber-500" : "text-muted-foreground" },
    { title: "Custo Mensal Total", value: fmt(totalMonthlySalary), sub: `${active} colaboradores ativos`, icon: Wallet, color: "text-primary", isText: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-light text-muted-foreground">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-light ${card.isText ? "text-lg" : ""}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



