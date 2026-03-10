import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface ExpenseAnalysisProps {
  data: { category: string; value: number; change: number; anomaly: boolean }[];
}

export function ExpenseAnalysis({ data }: ExpenseAnalysisProps) {
  if (data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Sem dados de despesas para o mês atual</div>;
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">Despesas por categoria no mês atual</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Despesa">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.anomaly ? "hsl(0, 84%, 60%)" : "hsl(var(--primary))"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



