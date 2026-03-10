import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

export function KPICard({ title, value, description, change, changeLabel, icon: Icon, variant = "default" }: KPICardProps) {
  const TrendIcon = change && change > 0 ? TrendingUp : change && change < 0 ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-light uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-light tracking-tight">{value}</p>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            variant === "success" && "bg-success/10 text-success",
            variant === "warning" && "bg-warning/10 text-warning",
            variant === "danger" && "bg-destructive/10 text-destructive",
            variant === "default" && "bg-primary-light text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <TrendIcon
            className={cn(
              "h-3.5 w-3.5",
              change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "font-light",
              change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {change > 0 ? "+" : ""}
            {change}%
          </span>
          <span className="text-muted-foreground">{changeLabel || "vs mês anterior"}</span>
        </div>
      )}
    </div>
  );
}



