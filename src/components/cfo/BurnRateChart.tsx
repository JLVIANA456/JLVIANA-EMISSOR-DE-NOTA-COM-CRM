import { Area, ComposedChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface BurnRateChartProps {
  data: { month: string; gastos: number; receita: number; burnRate: number }[];
  burnRateDiario: number;
  receitaDiaria: number;
}

export function BurnRateChart({ data, burnRateDiario, receitaDiaria }: BurnRateChartProps) {
  const saldoDiario = receitaDiaria - burnRateDiario;
  const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">Quanto você gasta vs. quanto ganha por dia</p>
      <div className="flex items-center gap-4 mb-4">
        <div className="rounded-lg bg-muted px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground">Burn Rate Atual</p>
          <p className="text-lg font-light">{fmt(burnRateDiario)}<span className="text-xs font-normal text-muted-foreground">/dia</span></p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground">Receita Média/Dia</p>
          <p className="text-lg font-light text-success">{fmt(receitaDiaria)}<span className="text-xs font-normal text-muted-foreground">/dia</span></p>
        </div>
        <div className={`rounded-lg px-3 py-1.5 ${saldoDiario >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
          <p className="text-[10px] text-muted-foreground">Saldo Diário</p>
          <p className={`text-lg font-light ${saldoDiario >= 0 ? "text-success" : "text-destructive"}`}>{saldoDiario >= 0 ? "+" : "-"}{fmt(Math.abs(saldoDiario))}<span className="text-xs font-normal text-muted-foreground">/dia</span></p>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReceita2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
            <Area type="monotone" dataKey="gastos" stroke="hsl(0, 84%, 65%)" strokeWidth={2} fill="url(#colorGastos)" name="Gastos" />
            <Area type="monotone" dataKey="receita" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fill="url(#colorReceita2)" name="Receita" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-success" /><span className="text-xs text-muted-foreground">Receita</span></div>
        <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-destructive/70" /><span className="text-xs text-muted-foreground">Gastos</span></div>
      </div>
    </div>
  );
}



