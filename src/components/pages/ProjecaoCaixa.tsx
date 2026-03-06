import { useMemo } from "react";
import { TrendingUp, BarChart3, DollarSign, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { usePeople } from "@/hooks/usePeople";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useRevenueProjections } from "@/hooks/useRevenueProjections";
import { CashFlowSummary } from "@/components/projecao-caixa/CashFlowSummary";
import { CashFlowAlerts } from "@/components/projecao-caixa/CashFlowAlerts";
import { RiskAnalysis } from "@/components/projecao-caixa/RiskAnalysis";
import { AnnualProjectionGrid } from "@/components/projecao-caixa/AnnualProjectionGrid";

function fmt(v: number) {
  return `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const ProjecaoCaixa = () => {
  const { totalMonthly: totalFixedCosts, selectedClient } = useFixedCosts();
  const { totalMonthlySalary } = usePeople();
  const { saldoTotal, cashFlowData } = useFinancialData();

  if (!selectedClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-light tracking-tight">Selecione um Cliente BPO</h2>
          <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
            Para ver a projeção de caixa, selecione um cliente BPO no cabeçalho.
          </p>
        </div>
      </div>
    );
  }

  // Use revenue projections for current year
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed
  const { projections: revenueProjections, clientNames } = useRevenueProjections(currentYear);

  // Calculate current month revenue from revenue_projections
  const revenueData = useMemo(() => {
    let totalRevenue = 0;
    let mrrRevenue = 0;
    let avulsoRevenue = 0;
    const clientRevenues: Record<string, { total: number; isMrr: boolean }> = {};

    revenueProjections.forEach((p) => {
      if (p.month === currentMonth) {
        totalRevenue += Number(p.value);
        if (p.is_mrr) mrrRevenue += Number(p.value);
        else avulsoRevenue += Number(p.value);
      }
      // Accumulate total per client (all months)
      if (!clientRevenues[p.client_name]) {
        clientRevenues[p.client_name] = { total: 0, isMrr: p.is_mrr };
      }
      clientRevenues[p.client_name].total += Number(p.value);
    });

    // Top client concentration
    const sortedClients = Object.entries(clientRevenues)
      .sort(([, a], [, b]) => b.total - a.total);
    const totalAllClients = sortedClients.reduce((s, [, c]) => s + c.total, 0);
    const topClientPct = totalAllClients > 0 && sortedClients.length > 0
      ? (sortedClients[0][1].total / totalAllClients) * 100
      : 0;
    const topClientName = sortedClients.length > 0 ? sortedClients[0][0] : "";

    return {
      totalRevenue,
      mrrRevenue,
      avulsoRevenue,
      topClientPct,
      topClientName,
      clientCount: clientNames.length,
      sortedClients,
    };
  }, [revenueProjections, clientNames, currentMonth]);

  // Compute monthly projections
  const projections = useMemo(() => {
    const custosFixos = totalFixedCosts;
    const custosComPessoas = totalMonthlySalary;

    // Pending items from Granatum
    const notasAPagar = cashFlowData.reduce((sum, w) => sum + Math.abs(w.saidas), 0);
    const outrasReceitasGranatum = cashFlowData.reduce((sum, w) => sum + w.entradas, 0);

    const totalReceitas = revenueData.totalRevenue + outrasReceitasGranatum;
    const totalDespesas = custosFixos + custosComPessoas + notasAPagar;
    const saldoProjetado = saldoTotal + totalReceitas - totalDespesas;

    return {
      receitaProjetada: revenueData.totalRevenue,
      outrasReceitasGranatum,
      custosFixos,
      custosComPessoas,
      notasAPagar,
      totalReceitas,
      totalDespesas,
      saldoProjetado,
    };
  }, [revenueData, totalFixedCosts, totalMonthlySalary, saldoTotal, cashFlowData]);

  const kpis = [
    { label: "Saldo Atual", value: fmt(saldoTotal), icon: BarChart3 },
    {
      label: "Receita Mensal Projetada",
      value: fmt(revenueData.totalRevenue),
      icon: DollarSign,
      subtitle: revenueData.mrrRevenue > 0 ? `MRR: ${fmt(revenueData.mrrRevenue)}` : undefined,
    },
    {
      label: "Saldo Projetado (Mensal)",
      value: `${projections.saldoProjetado < 0 ? "-" : ""}${fmt(projections.saldoProjetado)}`,
      icon: TrendingUp,
      negative: projections.saldoProjetado < 0,
    },
    {
      label: "Clientes Ativos",
      value: String(revenueData.clientCount),
      icon: RefreshCw,
      subtitle: revenueData.mrrRevenue > 0 ? `${revenueProjections.filter(p => p.month === currentMonth && p.is_mrr).length} MRR` : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">Projeção de Caixa</h1>
            <p className="text-sm text-muted-foreground">Visão completa do fluxo de caixa integrado a todos os módulos</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-lg font-light ${(kpi as any).negative ? "text-destructive" : ""}`}>{kpi.value}</p>
                  {(kpi as any).subtitle && (
                    <p className="text-[10px] text-muted-foreground">{(kpi as any).subtitle}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projecao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projecao">Projeção Completa</TabsTrigger>
          <TabsTrigger value="anual">Projeção Anual</TabsTrigger>
          <TabsTrigger value="riscos">Análise de Risco</TabsTrigger>
        </TabsList>

        <TabsContent value="projecao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CashFlowSummary
                saldoInicial={saldoTotal}
                receitaProjetada={projections.receitaProjetada}
                mrrReceita={revenueData.mrrRevenue}
                avulsoReceita={revenueData.avulsoRevenue}
                outrasReceitasGranatum={projections.outrasReceitasGranatum}
                custosFixos={projections.custosFixos}
                custosComPessoas={projections.custosComPessoas}
                notasAPagar={projections.notasAPagar}
              />
            </div>
            <div>
              <CashFlowAlerts
                saldoProjetado={projections.saldoProjetado}
                saldoInicial={saldoTotal}
                totalDespesas={projections.totalDespesas}
                totalReceitas={projections.totalReceitas}
                topClientPct={revenueData.topClientPct}
                topClientName={revenueData.topClientName}
                clientCount={revenueData.clientCount}
                mrrRevenue={revenueData.mrrRevenue}
                avulsoRevenue={revenueData.avulsoRevenue}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="anual">
          <AnnualProjectionGrid />
        </TabsContent>

        <TabsContent value="riscos">
          <RiskAnalysis
            saldoProjetado={projections.saldoProjetado}
            totalDespesas={projections.totalDespesas}
            totalReceitas={projections.totalReceitas}
            mrrRevenue={revenueData.mrrRevenue}
            avulsoRevenue={revenueData.avulsoRevenue}
            topClientPct={revenueData.topClientPct}
            topClientName={revenueData.topClientName}
            clientCount={revenueData.clientCount}
            totalFixedCosts={totalFixedCosts}
            totalSalaries={totalMonthlySalary}
            saldoAtual={saldoTotal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjecaoCaixa;



