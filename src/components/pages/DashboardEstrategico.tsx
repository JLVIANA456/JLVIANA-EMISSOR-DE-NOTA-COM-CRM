import { Target, DollarSign, Percent, TrendingUp, Loader2 } from "lucide-react";
import { useFinancialData } from "@/hooks/useFinancialData";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProfitabilityChart } from "@/components/cfo/ProfitabilityChart";
import { ClientABC } from "@/components/cfo/ClientABC";
import { ExpenseAnalysis } from "@/components/cfo/ExpenseAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DashboardEstrategico = () => {
  const {
    isLoading,
    receitaAtual,
    margemAtual,
    lucroAtual,
    receitaChange,
    margemChange,
    revenueChartData,
    profitabilityData,
    clientABCData,
    expenseByCategory,
    formatCurrency,
  } = useFinancialData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-light tracking-tight">Dashboard Estratégico</h1>
          <p className="text-sm text-muted-foreground">Rentabilidade, crescimento, eficiência e análise de tendências</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Receita Total" value={formatCurrency(receitaAtual)} change={receitaChange} icon={DollarSign} variant="success" />
        <KPICard title="Margem Líquida" value={`${margemAtual}%`} change={margemChange} icon={Percent} variant={margemAtual >= 15 ? "success" : "warning"} />
        <KPICard title="Lucro do Mês" value={formatCurrency(lucroAtual)} icon={TrendingUp} variant={lucroAtual > 0 ? "success" : "danger"} />
      </div>

      <RevenueChart data={revenueChartData} />

      <div className="rounded-xl border bg-card shadow-sm">
        <Tabs defaultValue="profitability" className="w-full">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-sm font-light">Análise Estratégica</h3>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="profitability" className="text-xs">Lucratividade</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs">Despesas</TabsTrigger>
              <TabsTrigger value="clients" className="text-xs">Curva ABC</TabsTrigger>
            </TabsList>
          </div>
          <div className="p-5">
            <TabsContent value="profitability" className="mt-0">
              <ProfitabilityChart data={profitabilityData} />
            </TabsContent>
            <TabsContent value="expenses" className="mt-0">
              <ExpenseAnalysis data={expenseByCategory} />
            </TabsContent>
            <TabsContent value="clients" className="mt-0">
              <ClientABC data={clientABCData} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardEstrategico;



