import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, AlertTriangle, PieChart } from "lucide-react";
import type { Person } from "@/hooks/usePeople";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface Props {
  people: Person[];
  totalMonthly: number;
}

export function PeopleImpactChart({ people, totalMonthly }: Props) {
  const activePeople = people.filter((p) => p.status === "ativo" && Number(p.base_salary) > 0);
  
  const data = [...activePeople]
    .sort((a, b) => Number(b.base_salary) - Number(a.base_salary))
    .slice(0, 10)
    .map((p) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name,
      fullName: p.name,
      value: Number(p.base_salary),
      pct: totalMonthly > 0 ? ((Number(p.base_salary) / totalMonthly) * 100) : 0,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum dado para exibir.
        </CardContent>
      </Card>
    );
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Analytics
  const avgSalary = totalMonthly / (activePeople.length || 1);
  const top3Cost = data.slice(0, 3).reduce((s, d) => s + d.value, 0);
  const top3Pct = totalMonthly > 0 ? (top3Cost / totalMonthly) * 100 : 0;
  const highestPct = data[0]?.pct || 0;
  const concentrationRisk = highestPct > 25;
  const median = (() => {
    const sorted = activePeople.map(p => Number(p.base_salary)).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  })();
  const aboveAvg = activePeople.filter(p => Number(p.base_salary) > avgSalary).length;

  return (
    <div className="space-y-4">
      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <PieChart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-light text-muted-foreground uppercase tracking-wide">Concentração Top 3</p>
                <p className="text-lg font-light">{top3Pct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Os 3 maiores custos somam {fmt(top3Cost)} da folha mensal de {fmt(totalMonthly)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-chart-2 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-light text-muted-foreground uppercase tracking-wide">Custo Médio vs Mediana</p>
                <p className="text-lg font-light">{fmt(avgSalary)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mediana: {fmt(median)}. {aboveAvg} de {activePeople.length} colaboradores acima da média.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${concentrationRisk ? 'border-l-destructive' : 'border-l-chart-3'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {concentrationRisk 
                ? <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                : <TrendingUp className="h-5 w-5 text-chart-3 mt-0.5 shrink-0" />
              }
              <div>
                <p className="text-xs font-light text-muted-foreground uppercase tracking-wide">Risco de Concentração</p>
                <p className="text-lg font-light">{concentrationRisk ? 'Alto' : 'Controlado'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data[0]?.fullName} representa {highestPct.toFixed(1)}% do total. 
                  {concentrationRisk 
                    ? ' Considere redistribuir responsabilidades.' 
                    : ' Distribuição saudável da folha.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maiores Custos (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={12} />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip
                  formatter={(value: number) => [fmt(value), "Salário"]}
                  labelFormatter={(label) => {
                    const item = data.find(d => d.name === label);
                    return item ? `${item.fullName} (${item.pct.toFixed(1)}% da folha)` : label;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



