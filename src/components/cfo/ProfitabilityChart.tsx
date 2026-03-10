import { Area, ComposedChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Line } from "recharts";

interface ProfitabilityChartProps {
  data: { month: string; lucro: number; margem: number }[];
}

export function ProfitabilityChart({ data }: ProfitabilityChartProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">Lucro bruto e margem líquida ao longo do tempo</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              formatter={(value: number, name: string) => name === "margem" ? `${value}%` : `R$ ${value.toLocaleString("pt-BR")}`}
            />
            <Area yAxisId="left" type="monotone" dataKey="lucro" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorLucro)" name="Lucro" />
            <Line yAxisId="right" type="monotone" dataKey="margem" stroke="hsl(0, 0%, 80%)" strokeWidth={2} dot={{ r: 4 }} name="Margem %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Lucro (R$)</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Margem (%)</span></div>
      </div>
    </div>
  );
}



