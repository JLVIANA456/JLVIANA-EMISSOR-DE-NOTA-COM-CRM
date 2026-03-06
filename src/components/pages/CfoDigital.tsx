import { Brain, Mail, Download, TrendingDown, DollarSign, Percent, Loader2 } from "lucide-react";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { KPICard } from "@/components/dashboard/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyComparison } from "@/components/cfo/WeeklyComparison";
import { ProfitabilityChart } from "@/components/cfo/ProfitabilityChart";
import { ExpenseAnalysis } from "@/components/cfo/ExpenseAnalysis";
import { ClientABC } from "@/components/cfo/ClientABC";
import { CfoAlerts } from "@/components/cfo/CfoAlerts";
import { CfoRecommendations } from "@/components/cfo/CfoRecommendations";
import { BurnRateChart } from "@/components/cfo/BurnRateChart";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useRevenueProjections } from "@/hooks/useRevenueProjections";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { usePeople } from "@/hooks/usePeople";
import { useMemo } from "react";

const CfoDigital = () => {
  const {
    isLoading,
    receitaAtual: receitaGranatum,
    despesaAtual: despesaGranatum,
    margemAtual: margemGranatum,
    saldoTotal,
    receitaChange: receitaChangeGranatum,
    margemChange: margemChangeGranatum,
    healthScore: healthScoreBase,
    weeklyComparison: weeklyComparisonBase,
    profitabilityData,
    expenseByCategory,
    clientABCData,
    burnRateData,
    burnRateDiario: burnGranatum,
    receitaDiaria,
    alerts: alertsGranatum,
    recommendations: recsGranatum,
    formatCurrency,
  } = useFinancialData();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { projections: revenueProjections } = useRevenueProjections(currentYear);
  const { totalMonthly: totalFixedCosts } = useFixedCosts();
  const { totalMonthlySalary } = usePeople();

  // Enrich with projections when Granatum has no current month data
  const enriched = useMemo(() => {
    const receitaProjetada = revenueProjections
      .filter(p => p.month === currentMonth)
      .reduce((sum, p) => sum + Number(p.value), 0);

    const mrrMensal = revenueProjections
      .filter(p => p.month === currentMonth && p.is_mrr)
      .reduce((sum, p) => sum + Number(p.value), 0);

    const hasGranatumRevenue = receitaGranatum > 0;
    const receita = hasGranatumRevenue ? receitaGranatum : receitaProjetada;

    const hasGranatumExpenses = despesaGranatum > 0;
    const despesa = hasGranatumExpenses ? despesaGranatum : (totalFixedCosts + totalMonthlySalary);

    const lucro = receita - despesa;
    const margem = receita > 0 ? Number(((lucro / receita) * 100).toFixed(1)) : 0;
    const burnRate = Math.round(despesa / 30);

    let score = healthScoreBase;
    if (!hasGranatumRevenue && receitaProjetada > 0) {
      score = 50;
      if (margem > 20) score += 20;
      else if (margem > 10) score += 10;
      else if (margem < 0) score -= 20;
      if (saldoTotal > despesa) score += 15;
      else if (saldoTotal > despesa * 0.5) score += 5;
      else score -= 10;
      if (mrrMensal > receitaProjetada * 0.5) score += 10;
      score = Math.max(0, Math.min(100, score));
    }

    // Enriched alerts
    const alerts = [...alertsGranatum];
    if (!hasGranatumRevenue && receitaProjetada > 0) {
      const filtered = alerts.filter(a => a.id !== "all-good");
      if (saldoTotal < despesa * 0.5) {
        if (!filtered.find(a => a.id === "low-cash")) {
          filtered.push({
            id: "low-cash-proj",
            level: "critical" as const,
            title: `Caixa de ${formatCurrency(saldoTotal)} cobre menos de 15 dias`,
            description: `Burn rate projetado de ${formatCurrency(burnRate)}/dia com base em custos fixos + pessoas.`,
          });
        }
      }
      if (receitaProjetada > despesa) {
        filtered.push({
          id: "proj-positive",
          level: "info" as const,
          title: `Receita projetada de ${formatCurrency(receitaProjetada)} cobre despesas`,
          description: `Margem projetada de ${margem}%. Dados baseados na Projeção Anual.`,
        });
      }
      if (filtered.length === 0) {
        filtered.push({
          id: "all-good",
          level: "info" as const,
          title: "Projeção dentro dos parâmetros",
          description: "Receitas projetadas cobrem as despesas. Continue monitorando.",
        });
      }
      return { receita, despesa, margem, burnRate, score, alerts: filtered, mrrMensal, receitaProjetada, source: "projeção" as const };
    }

    return { receita, despesa, margem, burnRate, score, alerts, mrrMensal, receitaProjetada, source: (hasGranatumRevenue ? "granatum" : "projeção") as "granatum" | "projeção" };
  }, [receitaGranatum, despesaGranatum, revenueProjections, currentMonth, totalFixedCosts, totalMonthlySalary, saldoTotal, healthScoreBase, alertsGranatum, formatCurrency]);

  // Enriched recommendations
  const recommendations = useMemo(() => {
    if (enriched.source === "projeção" && enriched.receitaProjetada > 0) {
      const recs: typeof recsGranatum = [];

      const runway = enriched.despesa > 0 ? saldoTotal / enriched.despesa : 12;
      if (runway < 2) {
        recs.push({
          id: "runway",
          category: "Caixa",
          action: `Aumentar reserva: caixa cobre apenas ${runway.toFixed(1)} meses. Ideal: 3+ meses.`,
          impact: formatCurrency(enriched.despesa * 3 - saldoTotal),
          impactLevel: "alto",
        });
      }

      if (enriched.mrrMensal < enriched.receitaProjetada * 0.6) {
        recs.push({
          id: "mrr",
          category: "Receita",
          action: "Converter projetos avulsos em contratos recorrentes para estabilizar fluxo",
          impact: formatCurrency(enriched.receitaProjetada - enriched.mrrMensal),
          impactLevel: "alto",
        });
      }

      if (totalFixedCosts + totalMonthlySalary > enriched.receitaProjetada * 0.8) {
        recs.push({
          id: "cost-ratio",
          category: "Custos",
          action: `Custos fixos + pessoas consomem ${((enriched.despesa / enriched.receitaProjetada) * 100).toFixed(0)}% da receita. Revisar estrutura.`,
          impact: formatCurrency(enriched.despesa),
          impactLevel: "medio",
        });
      }

      if (recs.length === 0) {
        recs.push({
          id: "maintain",
          category: "Geral",
          action: "Indicadores projetados saudáveis — manter práticas atuais",
          impact: "Estável",
          impactLevel: "medio",
        });
      }

      return recs;
    }
    return recsGranatum;
  }, [enriched, recsGranatum, saldoTotal, totalFixedCosts, totalMonthlySalary, formatCurrency]);

  // Enriched weekly comparison
  const weeklyComparison = useMemo(() => {
    if (enriched.source === "projeção" && enriched.receitaProjetada > 0) {
      const receitaSemanal = enriched.receita / 4;
      const despesaSemanal = enriched.despesa / 4;
      const lucroSemanal = receitaSemanal - despesaSemanal;
      return [
        { label: "Receita", current: formatCurrency(receitaSemanal), previous: "-", change: 0 },
        { label: "Despesas", current: formatCurrency(despesaSemanal), previous: "-", change: 0 },
        { label: "Lucro", current: formatCurrency(lucroSemanal), previous: "-", change: 0 },
        { label: "MRR Mensal", current: formatCurrency(enriched.mrrMensal), previous: "-", change: 0 },
      ];
    }
    return weeklyComparisonBase;
  }, [enriched, weeklyComparisonBase, formatCurrency]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weekNum = Math.ceil((new Date().getDate()) / 7);
  const dataSource = enriched.source === "projeção" ? "Baseado na Projeção Anual" : "Dados do Granatum";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight">CFO Digital</h1>
            <p className="text-sm text-muted-foreground">Diagnóstico semanal · Semana {String(weekNum).padStart(2, "0")}/{new Date().getFullYear()} · {dataSource}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-light hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-light hover:bg-primary/90 transition-colors">
            <Mail className="h-4 w-4" />
            Enviar Relatório
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <HealthScore score={enriched.score} />
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Receita do Mês"
              value={formatCurrency(enriched.receita)}
              change={enriched.source === "granatum" ? receitaChangeGranatum : undefined}
              icon={DollarSign}
              variant="success"
              changeLabel={enriched.source === "projeção" ? "projeção anual" : "vs mês anterior"}
            />
            <KPICard
              title="Margem Líquida"
              value={`${enriched.margem}%`}
              change={enriched.source === "granatum" ? margemChangeGranatum : undefined}
              icon={Percent}
              variant={enriched.margem >= 15 ? "success" : "warning"}
              changeLabel={enriched.source === "projeção" ? "projeção anual" : "vs mês anterior"}
            />
            <KPICard
              title="Caixa Disponível"
              value={formatCurrency(saldoTotal)}
              icon={TrendingDown}
              variant={saldoTotal > 0 ? "success" : "danger"}
              changeLabel="saldo atual"
            />
          </div>
          <WeeklyComparison data={weeklyComparison} />
        </div>
      </div>

      <CfoAlerts alerts={enriched.alerts} />
      <CfoRecommendations recommendations={recommendations} />

      <div className="rounded-xl border bg-card shadow-sm">
        <Tabs defaultValue="profitability" className="w-full">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-sm font-light">Análise de Desempenho</h3>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="profitability" className="text-xs">Lucratividade</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs">Despesas</TabsTrigger>
              <TabsTrigger value="clients" className="text-xs">Curva ABC</TabsTrigger>
              <TabsTrigger value="burnrate" className="text-xs">Burn Rate</TabsTrigger>
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
            <TabsContent value="burnrate" className="mt-0">
              <BurnRateChart data={burnRateData} burnRateDiario={enriched.burnRate} receitaDiaria={enriched.source === "granatum" ? receitaDiaria : Math.round(enriched.receita / 30)} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-gradient-to-br from-primary to-navy-light p-6 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-light">Relatório Executivo Semanal</h3>
            <p className="text-sm text-primary-foreground/70 mt-1">{dataSource}</p>
            <div className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              <p>✓ Score de Saúde: {enriched.score}/100</p>
              <p>✓ {enriched.alerts.length} Alerta(s) ativo(s)</p>
              <p>✓ {recommendations.length} Recomendação(ões)</p>
              <p>✓ Receita: {formatCurrency(enriched.receita)}</p>
              <p>✓ Margem: {enriched.margem}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CfoDigital;



