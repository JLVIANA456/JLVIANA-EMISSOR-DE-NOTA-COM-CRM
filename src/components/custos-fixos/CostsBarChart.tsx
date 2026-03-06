import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface Props {
  categoryTotals: Record<string, number>;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CostsBarChart({ categoryTotals }: Props) {
  const data = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const config = {
    value: { label: "Valor Mensal", color: "hsl(var(--primary))" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparação por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[300px]">
          <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}



