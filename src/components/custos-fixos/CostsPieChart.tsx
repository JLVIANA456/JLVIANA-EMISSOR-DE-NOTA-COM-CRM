import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

interface Props {
  categoryTotals: Record<string, number>;
}

const COLORS = [
  "hsl(var(--primary))", "hsl(220, 60%, 35%)", "hsl(0, 0%, 80%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(142, 71%, 45%)",
  "hsl(270, 50%, 55%)", "hsl(0, 84%, 85%)", "hsl(30, 80%, 55%)",
  "hsl(330, 60%, 50%)",
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CostsPieChart({ categoryTotals }: Props) {
  const data = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const config = data.reduce((acc, item, i) => {
    acc[item.name] = { label: item.name, color: COLORS[i % COLORS.length] };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Proporção por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => formatBRL(Number(value))}
                />
              }
            />
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={50} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



