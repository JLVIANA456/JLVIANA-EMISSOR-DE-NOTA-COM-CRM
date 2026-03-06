import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle, Shield, DollarSign, Settings } from "lucide-react";
import type { PeopleAlert } from "@/hooks/usePeople";

const ICON_MAP = {
  warning: AlertTriangle,
  info: Info,
  error: AlertCircle,
};

const COLOR_MAP = {
  warning: "text-amber-500",
  info: "text-primary",
  error: "text-destructive",
};

const CATEGORY_CONFIG = {
  compliance: {
    label: "Compliance & Trabalhista",
    icon: Shield,
    color: "text-destructive",
    borderColor: "border-l-destructive",
    description: "Riscos legais e de conformidade trabalhista",
  },
  financeiro: {
    label: "Financeiro",
    icon: DollarSign,
    color: "text-primary",
    borderColor: "border-l-primary",
    description: "Concentração de custos e variações financeiras",
  },
  operacional: {
    label: "Operacional",
    icon: Settings,
    color: "text-amber-500",
    borderColor: "border-l-amber-500",
    description: "Pendências operacionais e cadastrais",
  },
} as const;

const CATEGORY_ORDER: Array<"compliance" | "financeiro" | "operacional"> = ["compliance", "financeiro", "operacional"];

interface Props {
  alerts: PeopleAlert[];
}

export function PeopleAlerts({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Nenhum alerta no momento.</p>
        </CardContent>
      </Card>
    );
  }

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    config: CATEGORY_CONFIG[cat],
    items: alerts.filter(a => a.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map(({ category, config, items }) => {
        const CategoryIcon = config.icon;
        return (
          <Card key={category} className={`border-l-4 ${config.borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CategoryIcon className={`h-5 w-5 ${config.color}`} />
                <div>
                  <CardTitle className="text-base">{config.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <span className="ml-auto text-xs font-light bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {items.map((alert, i) => {
                const Icon = ICON_MAP[alert.type];
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                    <Icon className={`h-4 w-4 ${COLOR_MAP[alert.type]} shrink-0 mt-0.5`} />
                    <div>
                      <p className="font-light text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}



