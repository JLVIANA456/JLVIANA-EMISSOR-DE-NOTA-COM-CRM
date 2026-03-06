import { Wallet, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  totalMonthly: number;
  totalAnnual: number;
  categoryCount: number;
  itemCount: number;
  topCategory: { name: string; value: number } | null;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CostsSummaryCards({ totalMonthly, totalAnnual, categoryCount, itemCount, topCategory }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mensal</p>
              <p className="text-xl font-light">{formatBRL(totalMonthly)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Anual</p>
              <p className="text-xl font-light">{formatBRL(totalAnnual)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorias</p>
              <p className="text-xl font-light">{categoryCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Itens Ativos</p>
              <p className="text-xl font-light">{itemCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Maior Categoria</p>
              <p className="text-lg font-light truncate">{topCategory?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{topCategory ? formatBRL(topCategory.value) : ""}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



