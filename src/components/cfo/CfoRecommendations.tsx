import { Lightbulb, ArrowRight, Phone, Scissors, TrendingUp, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CfoRecommendation {
  id: string;
  category: string;
  action: string;
  impact: string;
  impactLevel: "alto" | "medio";
}

interface CfoRecommendationsProps {
  recommendations: CfoRecommendation[];
}

const iconMap: Record<string, any> = {
  "Cobrança": Phone,
  "Custos": Scissors,
  "Caixa": DollarSign,
  "Receita": TrendingUp,
  "Eficiência": Target,
};

export function CfoRecommendations({ recommendations }: CfoRecommendationsProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-light">Recomendações Acionáveis</h3>
        <span className="text-xs text-muted-foreground ml-auto">Baseadas em dados reais</span>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const Icon = iconMap[rec.category] || Target;
          return (
            <div key={rec.id} className="group flex items-start gap-3 rounded-lg border border-transparent p-3.5 hover:border-border hover:bg-muted/20 cursor-pointer transition-all">
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-light uppercase tracking-wider text-primary">{rec.category}</span>
                  <span className={cn(
                    "text-[9px] font-light px-1.5 py-0.5 rounded-full uppercase",
                    rec.impactLevel === "alto" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  )}>
                    Impacto {rec.impactLevel}
                  </span>
                </div>
                <p className="text-sm font-light">{rec.action}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-light text-success">{rec.impact}</p>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



