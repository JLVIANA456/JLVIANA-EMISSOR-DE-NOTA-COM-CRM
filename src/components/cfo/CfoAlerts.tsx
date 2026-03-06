import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, TrendingDown, Phone, CreditCard, FileText } from "lucide-react";

interface CfoAlert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
}

interface CfoAlertsProps {
  alerts: CfoAlert[];
}

const config = {
  critical: { bg: "bg-destructive/8 border-destructive/20", icon: "text-destructive", badge: "bg-destructive text-destructive-foreground", label: "🔴 Crítico", Icon: AlertCircle },
  warning: { bg: "bg-warning/8 border-warning/20", icon: "text-warning", badge: "bg-warning text-primary", label: "🟡 Atenção", Icon: AlertTriangle },
  info: { bg: "bg-info/8 border-info/20", icon: "text-info", badge: "bg-info/20 text-info", label: "🟢 Info", Icon: Info },
};

export function CfoAlerts({ alerts }: CfoAlertsProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light">Alertas Classificados por Prioridade</h3>
        <span className="text-xs text-muted-foreground">{alerts.length} alerta(s) ativo(s)</span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const c = config[alert.level];
          const Icon = c.Icon;
          return (
            <div key={alert.id} className={cn("flex items-start gap-3 rounded-lg border p-3.5 group", c.bg)}>
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", c.icon)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-light">{alert.title}</p>
                  <span className={cn("text-[9px] font-light px-1.5 py-0.5 rounded-full", c.badge)}>{c.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



