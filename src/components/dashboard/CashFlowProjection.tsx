import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";

interface CashFlowProjectionProps {
  data: { period: string; entradas: number; saidas: number; saldo: number }[];
}

export function CashFlowProjection({ data }: CashFlowProjectionProps) {
  const hasData = data.some(d => d.entradas > 0 || d.saidas !== 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light">Projeção de Caixa</h3>
        <span className="text-xs text-muted-foreground">Próximas 6 semanas</span>
      </div>
      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Sem lançamentos pendentes para projetar</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(value: number) => `R$ ${Math.abs(value).toLocaleString("pt-BR")}`}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="saidas" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} name="Saídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Entradas</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-destructive/70" /><span className="text-xs text-muted-foreground">Saídas</span></div>
      </div>
    </div>
  );
}



