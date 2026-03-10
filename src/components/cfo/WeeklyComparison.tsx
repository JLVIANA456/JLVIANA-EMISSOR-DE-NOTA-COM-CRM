import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyComparisonProps {
  data: { label: string; current: string; previous: string; change: number }[];
}

export function WeeklyComparison({ data }: WeeklyComparisonProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-light uppercase tracking-wide text-muted-foreground">Comparativo</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((item) => {
          const isPositive = item.change > 0;
          const isNeutral = item.change === 0;
          return (
            <div key={item.label} className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-base font-light">{item.current}</p>
              <div className="flex items-center gap-1">
                {isNeutral ? <Minus className="h-3 w-3 text-muted-foreground" /> : isPositive ? <ArrowUp className="h-3 w-3 text-success" /> : <ArrowDown className="h-3 w-3 text-destructive" />}
                <span className={cn("text-xs font-light", isPositive ? "text-success" : isNeutral ? "text-muted-foreground" : "text-destructive")}>
                  {isPositive ? "+" : ""}{item.change}%
                </span>
                {item.previous !== "-" && <span className="text-[10px] text-muted-foreground">({item.previous})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



