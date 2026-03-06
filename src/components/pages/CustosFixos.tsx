import { Wallet, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { CostsSummaryCards } from "@/components/custos-fixos/CostsSummaryCards";
import { CostsCategoryTable } from "@/components/custos-fixos/CostsCategoryTable";
import { CostsPieChart } from "@/components/custos-fixos/CostsPieChart";
import { CostsBarChart } from "@/components/custos-fixos/CostsBarChart";
import { CostsAlerts } from "@/components/custos-fixos/CostsAlerts";
import { CostsAddDialog } from "@/components/custos-fixos/CostsAddDialog";

const CustosFixos = () => {
  const {
    costs,
    activeCosts,
    isLoading,
    totalMonthly,
    categoryTotals,
    addCost,
    updateCost,
    deleteCost,
    selectedClient
  } = useFixedCosts();

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-light tracking-tight">Selecione um Cliente BPO</h2>
          <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
            Para gerenciar os custos fixos, selecione um cliente BPO no cabeçalho.
          </p>
        </div>
      </div>
    );
  }

  const categoryEntries = Object.entries(categoryTotals);
  const topCategory = categoryEntries.length > 0
    ? categoryEntries.sort((a, b) => b[1] - a[1])[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Custos Fixos Mensais</h1>
            <p className="text-sm text-muted-foreground">Analise e otimize seus custos fixos por categoria</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CostsAddDialog onAdd={(cost) => addCost.mutate(cost)} />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <p>Carregando dados...</p>
        </div>
      ) : costs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-light">Nenhum custo fixo cadastrado</p>
          <p className="text-sm mt-1">Adicione manualmente clicando em "Novo Custo".</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <CostsSummaryCards
            totalMonthly={totalMonthly}
            totalAnnual={totalMonthly * 12}
            categoryCount={Object.keys(categoryTotals).length}
            itemCount={activeCosts.length}
            topCategory={topCategory ? { name: topCategory[0], value: topCategory[1] } : null}
          />

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="tabela">Tabela Detalhada</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CostsPieChart categoryTotals={categoryTotals} />
                <CostsBarChart categoryTotals={categoryTotals} />
              </div>
            </TabsContent>

            <TabsContent value="tabela">
              <CostsCategoryTable costs={costs} totalMonthly={totalMonthly} onUpdate={(data) => updateCost.mutate(data)} onDelete={(id) => deleteCost.mutate(id)} />
            </TabsContent>

            <TabsContent value="alertas">
              <CostsAlerts costs={costs} categoryTotals={categoryTotals} totalMonthly={totalMonthly} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CustosFixos;



