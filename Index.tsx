import {
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Clock,
  Loader2,
  Users,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CashFlowProjection } from "@/components/dashboard/CashFlowProjection";
import { RecommendationsList } from "@/components/dashboard/RecommendationsList";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useRevenueProjections } from "@/hooks/useRevenueProjections";
import { useFixedCosts } from "@/hooks/useFixedCosts";
import { usePeople } from "@/hooks/usePeople";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const {
    isLoading,
    lastSync,
    saldoTotal,
    healthScore: healthScoreBase,
    alerts: alertsGranatum,
    recommendations: recsGranatum,
    revenueChartData,
    cashFlowData,
    formatCurrency,
  } = useFinancialData();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { projections: revenueProjections } = useRevenueProjections(currentYear);
  const { totalMonthly: totalFixedCosts } = useFixedCosts();
  const { getRealMonthlyCost } = usePeople();

  // Fetch confirmed invoices for current month
  const { data: invoicesTotal = 0 } = useQuery({
    queryKey: ["invoices-total", userId, currentMonth, currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_requests")
        .select("gross_value")
        .eq("competency_month", currentMonth)
        .eq("competency_year", currentYear)
        .in("status", ["emitida", "enviada_cliente", "pagamento_confirmado"]);
      if (error) throw error;
      return (data || []).reduce((sum, inv) => sum + Number(inv.gross_value), 0);
    },
    enabled: !!userId,
  });

  // Real people cost for current month (salary_history + commissions)
  const realPeopleCost = getRealMonthlyCost(currentMonth, currentYear);

  const enriched = useMemo(() => {
    // Revenue projections for current month
    const receitaProjetada = revenueProjections
      .filter(p => p.month === currentMonth)
      .reduce((sum, p) => sum + Number(p.value), 0);

    const mrrMensal = revenueProjections
      .filter(p => p.month === currentMonth && p.is_mrr)
      .reduce((sum, p) => sum + Number(p.value), 0);

    // Revenue: invoices if available, otherwise projections
    const receita = Math.max(invoicesTotal, receitaProjetada);
    const revenueSource = invoicesTotal > 0 ? "notas" : "projeção";

    // Expenses: fixed costs + real people cost only
    const despesa = totalFixedCosts + realPeopleCost;

    const lucro = receita - despesa;
    const margem = receita > 0 ? Number(((lucro / receita) * 100).toFixed(1)) : 0;
    const burnRate = Math.round(despesa / 30);

    // Health score
    let score = 50;
    if (margem > 20) score += 20;
    else if (margem > 10) score += 10;
    else if (margem < 0) score -= 20;
    if (saldoTotal > despesa) score += 15;
    else if (saldoTotal > despesa * 0.5) score += 5;
    else score -= 10;
    if (mrrMensal > receitaProjetada * 0.5) score += 10;
    score = Math.max(0, Math.min(100, score));

    // Alerts
    const alerts: typeof alertsGranatum = [];
    if (saldoTotal < despesa * 0.5 && despesa > 0) {
      alerts.push({
        id: "low-cash-proj",
        level: "critical" as const,
        title: `Caixa de ${formatCurrency(saldoTotal)} cobre menos de 15 dias`,
        description: `Burn rate de ${formatCurrency(burnRate)}/dia (custos fixos + pessoas).`,
      });
    }
    if (receita > despesa && receita > 0) {
      alerts.push({
        id: "proj-positive",
        level: "info" as const,
        title: `Receita de ${formatCurrency(receita)} cobre despesas`,
        description: `Margem de ${margem}%. Fonte: ${revenueSource === "notas" ? "Notas Emitidas" : "Projeção Anual"}.`,
      });
    }
    if (realPeopleCost === 0) {
      alerts.push({
        id: "no-people-cost",
        level: "info" as const,
        title: "Sem custos com pessoas neste mês",
        description: "Nenhum salário ou comissão registrado para o mês corrente.",
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: "all-good",
        level: "info" as const,
        title: "Indicadores dentro dos parâmetros",
        description: "Continue monitorando.",
      });
    }

    return {
      receita, despesa, margem, burnRate, score, alerts,
      mrrMensal, receitaProjetada, invoicesTotal, revenueSource,
      totalFixedCosts, realPeopleCost,
    };
  }, [invoicesTotal, revenueProjections, currentMonth, totalFixedCosts, realPeopleCost, saldoTotal, alertsGranatum, formatCurrency]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: typeof recsGranatum = [];
    const runway = enriched.despesa > 0 ? saldoTotal / enriched.despesa : 12;

    if (runway < 2 && enriched.despesa > 0) {
      recs.push({
        id: "runway",
        category: "Caixa",
        action: `Aumentar reserva: caixa cobre apenas ${runway.toFixed(1)} meses. Ideal: 3+ meses.`,
        impact: formatCurrency(enriched.despesa * 3 - saldoTotal),
        impactLevel: "alto",
      });
    }

    if (enriched.mrrMensal < enriched.receitaProjetada * 0.6 && enriched.receitaProjetada > 0) {
      recs.push({
        id: "mrr",
        category: "Receita",
        action: "Converter projetos avulsos em contratos recorrentes para estabilizar fluxo",
        impact: formatCurrency(enriched.receitaProjetada - enriched.mrrMensal),
        impactLevel: "alto",
      });
    }

    if (enriched.despesa > enriched.receita * 0.8 && enriched.receita > 0) {
      recs.push({
        id: "cost-ratio",
        category: "Custos",
        action: `Custos consomem ${((enriched.despesa / enriched.receita) * 100).toFixed(0)}% da receita. Revisar estrutura.`,
        impact: formatCurrency(enriched.despesa),
        impactLevel: "medio",
      });
    }

    if (enriched.invoicesTotal === 0 && enriched.receitaProjetada > 0) {
      recs.push({
        id: "no-invoices",
        category: "Faturamento",
        action: "Nenhuma nota emitida este mês. Emitir notas para confirmar receita projetada.",
        impact: formatCurrency(enriched.receitaProjetada),
        impactLevel: "alto",
      });
    }

    if (recs.length === 0) {
      recs.push({
        id: "maintain",
        category: "Geral",
        action: "Indicadores saudáveis — manter práticas atuais",
        impact: "Estável",
        impactLevel: "medio",
      });
    }

    return recs;
  }, [enriched, saldoTotal, formatCurrency]);

  // Revenue chart: update current month with real data
  const revenueChartEnriched = useMemo(() => {
    return revenueChartData.map((d, i) => {
      if (i === revenueChartData.length - 1) {
        return {
          ...d,
          receita: Math.round(enriched.receita),
          despesas: Math.round(enriched.despesa),
        };
      }
      return d;
    });
  }, [revenueChartData, enriched]);

  // Cash flow: build from real sources
  const cashFlowEnriched = useMemo(() => {
    const months = [currentMonth, currentMonth + 1 > 12 ? 1 : currentMonth + 1];
    const weeks: typeof cashFlowData = [];

    for (let w = 0; w < 6; w++) {
      const monthIdx = Math.floor(w / 3);
      const month = months[monthIdx] || months[months.length - 1];
      const yearForMonth = month < currentMonth ? currentYear + 1 : currentYear;

      const monthRevenue = revenueProjections
        .filter(p => p.month === month)
        .reduce((sum, p) => sum + Number(p.value), 0);

      // For current month, use real invoices if higher
      const effectiveRevenue = month === currentMonth
        ? Math.max(invoicesTotal, monthRevenue)
        : monthRevenue;

      // For current month use real people cost, for future months use 0 (no data yet)
      const peopleCost = month === currentMonth ? realPeopleCost : 0;

      const weeklyRevenue = effectiveRevenue / 4;
      const weeklyExpense = (totalFixedCosts + peopleCost) / 4;

      weeks.push({
        period: `Sem ${w + 1}`,
        entradas: Math.round(weeklyRevenue),
        saidas: Math.round(-weeklyExpense),
        saldo: Math.round(weeklyRevenue - weeklyExpense),
      });
    }

    return weeks;
  }, [revenueProjections, currentMonth, currentYear, totalFixedCosts, realPeopleCost, invoicesTotal, cashFlowData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sourceLabel = enriched.revenueSource === "notas"
    ? "Receita: Notas Emitidas"
    : "Receita: Projeção Anual";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão C-Level · {sourceLabel} · Custos: Fixos + Pessoas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Receita do Mês"
          value={formatCurrency(enriched.receita)}
          description="Total faturado no mês atual"
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Margem Líquida"
          value={`${enriched.margem}%`}
          description="Lucro após custos fixos e pessoas"
          icon={Percent}
          variant={enriched.margem >= 15 ? "success" : enriched.margem >= 5 ? "warning" : "danger"}
        />
        <KPICard title="Saldo em Caixa" value={formatCurrency(saldoTotal)} description="Saldo disponível em contas bancárias" icon={Wallet} variant={saldoTotal > 0 ? "success" : "danger"} />
        <KPICard title="Burn Rate" value={`${formatCurrency(enriched.burnRate)}/dia`} description="Gasto médio diário da operação" icon={Clock} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RevenueChart data={revenueChartEnriched} />
          <CashFlowProjection data={cashFlowEnriched} />
        </div>
        <div className="space-y-6">
          <HealthScore score={enriched.score} />
          <AlertsList alerts={enriched.alerts} />
        </div>
      </div>

      <RecommendationsList recommendations={recommendations} />
    </div>
  );
};

export default Index;
