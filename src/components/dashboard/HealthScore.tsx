import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  label?: string;
}

export function HealthScore({ score, label = "Saúde Financeira" }: HealthScoreProps) {
  const color =
    score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-destructive";
  const bgColor =
    score >= 70 ? "bg-success/10" : score >= 40 ? "bg-warning/10" : "bg-destructive/10";
  const ringColor =
    score >= 70 ? "stroke-success" : score >= 40 ? "stroke-warning" : "stroke-destructive";

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center gap-3")}>
      <p className="text-xs font-light uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="relative flex items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            className={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={cn("text-3xl font-light", color)}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div className={cn("px-3 py-1 rounded-full text-xs font-light", bgColor, color)}>
        {score >= 70 ? "Saudável" : score >= 40 ? "Atenção" : "Crítico"}
      </div>
    </div>
  );
}



