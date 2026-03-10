import {
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Clock,
  Loader2,
  Users,
  PieChart,
  ArrowUpRight,
  ChevronRight,
  Target,
  FileText,
  Building2,
  CheckCircle2,
  Zap
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CashFlowProjection } from "@/components/dashboard/CashFlowProjection";
import { RecommendationsList } from "@/components/dashboard/RecommendationsList";
import { useFinancialData } from "@/components/hooks/useFinancialData";
import { useRevenueProjections } from "@/components/hooks/useRevenueProjections";
import { useFixedCosts } from "@/components/hooks/useFixedCosts";
import { usePeople } from "@/components/hooks/usePeople";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";

const Index = () => {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const userId = session?.user?.id;
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 4); // 4 slides
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    queryKey: ["invoices-total", userId, selectedClient?.id, currentMonth, currentYear],
    queryFn: async () => {
      if (!selectedClient) return 0;
      const { data, error } = await (supabase as any)
        .from("invoice_requests")
        .select("gross_value")
        .eq("empresa_id", selectedClient.id)
        .eq("competency_month", currentMonth)
        .eq("competency_year", currentYear)
        .in("status", ["emitida", "enviada_cliente", "pagamento_confirmado"]);
      if (error) throw error;
      return (data || []).reduce((sum, inv) => sum + Number(inv.gross_value), 0);
    },
    enabled: !!userId && !!selectedClient,
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
      totalFixedCosts, realPeopleCost, lucro,
    };
  }, [invoicesTotal, revenueProjections, currentMonth, totalFixedCosts, realPeopleCost, saldoTotal, alertsGranatum, formatCurrency]);

  const carouselMetrics = useMemo(() => {
    const runway = enriched.despesa > 0 ? (saldoTotal / enriched.despesa) : 12;

    return [
      {
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1920",
        accent: "#22c55e",
        icon: TrendingUp,
        tag: "Performance Financeira",
        title: "Rentabilidade & Margem",
        description: "Análise consolidada de lucro real versus despesas operacionais no mês corrente.",
        stats: [
          { label: "Lucro Estimado", value: formatCurrency(enriched.lucro) },
          { label: "Margem Líquida", value: `${enriched.margem}%` },
          { label: "Status", value: enriched.margem >= 15 ? "Saudável" : "Em Atenção" }
        ]
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&q=80&w=1920",
        accent: "#3b82f6",
        icon: Wallet,
        tag: "Fluxo de Caixa",
        title: "Disponibilidade & Runway",
        description: "Saldo em contas conciliadas versus velocidade de queima de caixa (Burn Rate).",
        stats: [
          { label: "Saldo Total", value: formatCurrency(saldoTotal) },
          { label: "Reserva Estimada", value: `${runway.toFixed(1)} meses` },
          { label: "Burn Rate", value: `${formatCurrency(enriched.burnRate)}/dia` }
        ]
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=1920",
        accent: "#a855f7",
        icon: Users,
        tag: "Eficiência Operacional",
        title: "Estrutura de Custos",
        description: "Monitoramento de investimentos em capital humano e despesas administrativas fixas.",
        stats: [
          { label: "Folha & Comissões", value: formatCurrency(enriched.realPeopleCost) },
          { label: "Custos Fixos", value: formatCurrency(enriched.totalFixedCosts) },
          { label: "Ratio", value: enriched.receita > 0 ? `${((enriched.despesa / enriched.receita) * 100).toFixed(0)}% da Rec.` : "-" }
        ]
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?auto=format&fit=crop&q=80&w=1920",
        accent: "#f59e0b",
        icon: FileText,
        tag: "Faturamento & CRM",
        title: "Previsão de Receita",
        description: "Notas fiscais emitidas versus as projeções de faturamento e contratos recorrentes.",
        stats: [
          { label: "Recorrência (MRR)", value: formatCurrency(enriched.mrrMensal) },
          { label: "Notas Emitidas", value: formatCurrency(enriched.invoicesTotal) },
          { label: "Projetado", value: formatCurrency(enriched.receitaProjetada) }
        ]
      },
    ];
  }, [enriched, saldoTotal, formatCurrency]);


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

  const sourceLabel = enriched.revenueSource === "notas"
    ? "Receita: Notas Emitidas"
    : "Receita: Projeção Anual";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão C-Level · {sourceLabel} · Custos: Fixos + Pessoas
          </p>
        </div>
        <div className="flex gap-2">
          {carouselMetrics.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`h-2 rounded-full transition-all duration-500 ${i === activeSlide ? "w-8 bg-black" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Hero Metrics Carousel - New Model */}
      <section className="overflow-hidden rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 bg-white">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {carouselMetrics.map((slide, index) => {
            const Icon = slide.icon;
            return (
              <div key={index} className="min-w-full">
                <div
                  className="text-white relative overflow-hidden min-h-[340px] md:min-h-[380px] flex flex-col justify-between"
                  style={{
                    backgroundImage: `url(${slide.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                >
                  {/* Glassy overlay for premium look */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
                  <div className="absolute inset-0 backdrop-blur-[2px] z-0 opacity-20" />

                  <div className="relative z-10 p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="h-10 w-10 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20" style={{ backgroundColor: `${slide.accent}30` }}>
                        <Icon className="h-5 w-5" style={{ color: slide.accent }} />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-light uppercase tracking-widest px-3 py-1 border-white/20 backdrop-blur-md bg-white/5" style={{ color: slide.accent }}>
                        {slide.tag}
                      </Badge>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-light mb-3 tracking-tight drop-shadow-lg text-white animate-in fade-in slide-in-from-left-6 duration-700">{slide.title}</h3>
                    <p className="text-white/70 font-light max-w-2xl text-base leading-relaxed animate-in fade-in slide-in-from-left-8 duration-900">{slide.description}</p>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-8 px-8 md:px-12 pb-8 md:pb-12 border-t border-white/10 pt-8 mt-4 backdrop-blur-sm bg-black/20">
                    {slide.stats.map((stat, si) => (
                      <div key={si} className="space-y-1 group">
                        <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold group-hover:text-white transition-colors">{stat.label}</p>
                        <p className="text-xl md:text-3xl font-light text-white tracking-tighter">{stat.value}</p>
                      </div>
                    ))}
                    <div className="hidden md:flex items-center justify-end">
                      <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10" onClick={() => setActiveSlide((index + 1) % 4)}>
                        Próxima Métrica <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
        <KPICard
          title="Receita do Mês"
          value={formatCurrency(enriched.receita)}
          description="Total faturado ou projetado"
          icon={DollarSign}
          variant="success"
        />
        <KPICard
          title="Margem Líquida"
          value={`${enriched.margem}%`}
          description="Lucro vs faturamento total"
          icon={Percent}
          variant={enriched.margem >= 15 ? "success" : enriched.margem >= 5 ? "warning" : "danger"}
        />
        <KPICard title="Saldo em Caixa" value={formatCurrency(saldoTotal)} description="Disponível em conta" icon={Wallet} variant={saldoTotal > 0 ? "success" : "danger"} />
        <KPICard title="Burn Rate" value={`${formatCurrency(enriched.burnRate)}/dia`} description="Gasto operacional médio" icon={Clock} variant="default" />
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
    </div >
  );
};

export default Index;



