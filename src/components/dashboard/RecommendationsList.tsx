import { Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  id: string;
  category: string;
  action: string;
  impact: string;
  impactLevel?: "alto" | "medio";
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-light">Recomendações</h3>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec, i) => (
          <div key={rec.id} className="group flex items-start gap-3 rounded-lg border border-transparent p-3 hover:border-border hover:bg-muted/30 cursor-pointer transition-all">
            <div className="mt-0.5 h-6 w-6 rounded-md gradient-brand flex items-center justify-center text-[10px] font-light text-primary shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-light uppercase tracking-wider text-primary">{rec.category}</span>
                {rec.impactLevel && (
                  <span className={cn(
                    "text-[9px] font-light text-muted-foreground px-1.5 py-0.5 rounded-full",
                    rec.impactLevel === "alto" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  )}>
                    Impacto {rec.impactLevel}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/90">{rec.action}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-light text-success">{rec.impact}</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



