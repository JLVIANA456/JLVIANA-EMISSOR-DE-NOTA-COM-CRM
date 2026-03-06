import { BarChart3, DollarSign, TrendingDown, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { CashFlowProjection } from "@/components/dashboard/CashFlowProjection";
import { RecommendationsList } from "@/components/dashboard/RecommendationsList";

const DashboardOperacional = () => {
  const {
    isLoading,
    receitaAtual,
    despesaAtual,
    saldoTotal,
    overdueItems,
    receitaChange,
    alerts,
    recommendations,
    cashFlowData,
    formatCurrency,
  } = useFinancialData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalOverdue = overdueItems.reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-light tracking-tight">Dashboard Operacional</h1>
          <p className="text-sm text-muted-foreground">Contas a pagar, receber, vencimentos e ações imediatas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="A Receber (Mês)" value={formatCurrency(receitaAtual)} change={receitaChange} icon={TrendingUp} variant="success" />
        <KPICard title="A Pagar (Mês)" value={formatCurrency(despesaAtual)} icon={TrendingDown} variant="warning" />
        <KPICard title="Saldo Disponível" value={formatCurrency(saldoTotal)} icon={DollarSign} variant={saldoTotal > 0 ? "success" : "danger"} />
        <KPICard title="Em Atraso" value={overdueItems.length > 0 ? `${overdueItems.length} itens (${formatCurrency(totalOverdue)})` : "Nenhum"} icon={Clock} variant={overdueItems.length > 0 ? "danger" : "success"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowProjection data={cashFlowData} />
        </div>
        <AlertsList alerts={alerts} />
      </div>

      <RecommendationsList recommendations={recommendations} />
    </div>
  );
};

export default DashboardOperacional;



