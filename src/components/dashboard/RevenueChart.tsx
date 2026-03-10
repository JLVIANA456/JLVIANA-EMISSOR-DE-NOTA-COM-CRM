import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface RevenueChartProps {
  data: { month: string; receita: number; despesas: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some(d => d.receita > 0 || d.despesas > 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light">Receitas vs Despesas</h3>
        <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
      </div>
      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem dados de lançamentos sincronizados</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`}
              />
              <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorReceita)" name="Receita" />
              <Area type="monotone" dataKey="despesas" stroke="hsl(0, 0%, 80%)" strokeWidth={2} fill="url(#colorDespesas)" name="Despesas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Receita</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Despesas</span></div>
      </div>
    </div>
  );
}



