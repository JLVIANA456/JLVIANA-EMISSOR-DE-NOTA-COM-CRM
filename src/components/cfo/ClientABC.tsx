import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface ClientABCProps {
  data: { client: string; revenue: number; pct: number; cumPct: number; group: string }[];
}

const colors = { A: "hsl(var(--primary))", B: "hsl(195, 80%, 75%)", C: "hsl(214, 30%, 85%)" };

export function ClientABC({ data }: ClientABCProps) {
  if (data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Sem dados de receita por cliente</div>;
  }

  const groupA = data.filter(d => d.group === "A");
  const groupAPct = groupA.reduce((s, d) => s + d.pct, 0).toFixed(0);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">Top clientes representam {groupAPct}% da receita (Grupo A)</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="client" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Receita">
              {data.map((entry, i) => (
                <Cell key={i} fill={colors[entry.group as keyof typeof colors] || colors.C} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Grupo A</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary-light" /><span className="text-xs text-muted-foreground">Grupo B</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded bg-border" /><span className="text-xs text-muted-foreground">Grupo C</span></div>
      </div>
    </div>
  );
}



