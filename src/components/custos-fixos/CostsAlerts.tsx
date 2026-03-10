import { AlertTriangle, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FixedCost } from "@/hooks/useFixedCosts";

interface Props {
  costs: FixedCost[];
  categoryTotals: Record<string, number>;
  totalMonthly: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CostsAlerts({ costs, categoryTotals, totalMonthly }: Props) {
  const alerts: { icon: React.ReactNode; title: string; description: string; type: "warning" | "info" | "danger" }[] = [];

  // Top categories above 20%
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    const pct = totalMonthly > 0 ? (val / totalMonthly) * 100 : 0;
    if (pct > 20) {
      alerts.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        title: `${cat} representa ${pct.toFixed(1)}% dos custos`,
        description: `${formatBRL(val)} do total de ${formatBRL(totalMonthly)}`,
        type: "warning",
      });
    }
  });

  // Items above R$1000
  const expensiveItems = costs.filter((c) => Number(c.valor) >= 1000).sort((a, b) => Number(b.valor) - Number(a.valor));
  if (expensiveItems.length > 0) {
    alerts.push({
      icon: <TrendingUp className="h-4 w-4" />,
      title: `${expensiveItems.length} itens acima de R$ 1.000/mês`,
      description: expensiveItems.slice(0, 3).map((i) => `${i.descricao} (${formatBRL(Number(i.valor))})`).join(", "),
      type: "info",
    });
  }

  // Inactive items with zero value
  const zeroItems = costs.filter((c) => Number(c.valor) === 0);
  if (zeroItems.length > 0) {
    alerts.push({
      icon: <Info className="h-4 w-4" />,
      title: `${zeroItems.length} itens com valor R$ 0,00`,
      description: "Considere remover itens inativos ou atualizar os valores",
      type: "info",
    });
  }

  const typeColors = {
    warning: "border-l-warning text-amber-700 bg-amber-50",
    danger: "border-l-destructive text-red-700 bg-red-50",
    info: "border-l-info text-sky-700 bg-sky-50",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alertas e Recomendações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className={`rounded-lg border-l-4 p-3 ${typeColors[alert.type]}`}>
              <div className="flex items-center gap-2 font-light text-sm">
                {alert.icon}
                {alert.title}
              </div>
              <p className="text-xs mt-1 opacity-80">{alert.description}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}



