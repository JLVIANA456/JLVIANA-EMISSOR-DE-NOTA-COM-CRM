import { Users, DollarSign, UserCheck, UserX, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  totalPeople: number;
  activePeople: number;
  inactivePeople: number;
  totalMonthly: number;
  totalAnnual: number;
}

export function PeopleSummaryCards({ totalPeople, activePeople, inactivePeople, totalMonthly, totalAnnual }: Props) {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cards = [
    { label: "Custo Mensal", value: fmt(totalMonthly), icon: DollarSign, accent: "text-primary" },
    { label: "Custo Anual", value: fmt(totalAnnual), icon: Calendar, accent: "text-primary" },
    { label: "Total Colaboradores", value: totalPeople.toString(), icon: Users, accent: "text-primary" },
    { label: "Ativos", value: activePeople.toString(), icon: UserCheck, accent: "text-primary" },
    { label: "Inativos", value: inactivePeople.toString(), icon: UserX, accent: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.accent}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-lg font-light tracking-tight">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



