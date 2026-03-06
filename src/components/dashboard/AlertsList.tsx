import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

type AlertLevel = "critical" | "warning" | "info";

interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
}

interface AlertsListProps {
  alerts: Alert[];
}

const levelConfig = {
  critical: { icon: AlertCircle, bg: "bg-destructive/8 border-destructive/20", iconColor: "text-destructive", badge: "bg-destructive text-destructive-foreground", label: "Crítico" },
  warning: { icon: AlertTriangle, bg: "bg-warning/8 border-warning/20", iconColor: "text-warning", badge: "bg-warning text-primary", label: "Atenção" },
  info: { icon: Info, bg: "bg-info/8 border-info/20", iconColor: "text-info", badge: "bg-info/20 text-info", label: "Info" },
};

export function AlertsList({ alerts }: AlertsListProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-light mb-4">Alertas Ativos</h3>
      <div className="space-y-2.5">
        {alerts.map((alert) => {
          const config = levelConfig[alert.level];
          const Icon = config.icon;
          return (
            <div key={alert.id} className={cn("flex items-start gap-3 rounded-lg border p-3", config.bg)}>
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-light leading-tight">{alert.title}</p>
                  <span className={cn("text-[9px] font-light px-1.5 py-0.5 rounded-full uppercase", config.badge)}>{config.label}</span>
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



