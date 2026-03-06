import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, Users, TrendingDown, RefreshCw, DollarSign } from "lucide-react";

interface RiskAnalysisProps {
  saldoProjetado: number;
  totalDespesas: number;
  totalReceitas: number;
  mrrRevenue: number;
  avulsoRevenue: number;
  topClientPct: number;
  topClientName: string;
  clientCount: number;
  totalFixedCosts: number;
  totalSalaries: number;
  saldoAtual: number;
}

function getRiskLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Alto", color: "text-destructive" };
  if (score >= 40) return { label: "Médio", color: "text-amber-600" };
  return { label: "Baixo", color: "text-primary" };
}

function fmt(v: number) {
  return `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function RiskAnalysis({
  saldoProjetado,
  totalDespesas,
  totalReceitas,
  mrrRevenue,
  avulsoRevenue,
  topClientPct,
  topClientName,
  clientCount,
  totalFixedCosts,
  totalSalaries,
  saldoAtual,
}: RiskAnalysisProps) {
  // 1. Client concentration risk
  const concentrationRisk = Math.min(100, topClientPct * 1.5);

  // 2. Cash deficit risk
  const deficitRisk = saldoProjetado < 0
    ? Math.min(100, (Math.abs(saldoProjetado) / Math.max(totalDespesas, 1)) * 100)
    : 0;

  // 3. MRR dependency risk (high avulso = risky)
  const totalRev = mrrRevenue + avulsoRevenue;
  const mrrPct = totalRev > 0 ? (mrrRevenue / totalRev) * 100 : 0;
  const mrrRisk = totalRev > 0 ? Math.max(0, 100 - mrrPct * 1.2) : (clientCount > 0 ? 50 : 80);

  // 4. Expense coverage risk (can revenue cover expenses?)
  const coverageMonths = totalReceitas > 0 ? (totalReceitas / (totalDespesas / 3)) : 0;
  const coverageRisk = coverageMonths < 1 ? 90 : coverageMonths < 2 ? 50 : coverageMonths < 3 ? 20 : 0;

  // 5. Cash runway (how many months can current cash last)
  const monthlyBurn = totalFixedCosts + totalSalaries;
  const runwayMonths = monthlyBurn > 0 ? saldoAtual / monthlyBurn : 12;
  const runwayRisk = runwayMonths < 1 ? 95 : runwayMonths < 2 ? 70 : runwayMonths < 3 ? 40 : 10;

  const overallRisk = (
    concentrationRisk * 0.2 +
    deficitRisk * 0.25 +
    mrrRisk * 0.2 +
    coverageRisk * 0.15 +
    runwayRisk * 0.2
  );
  const overall = getRiskLevel(overallRisk);

  const risks = [
    {
      icon: <Users className="h-4 w-4" />,
      label: "Concentração de Clientes",
      score: concentrationRisk,
      detail: topClientName
        ? `${topClientName}: ${topClientPct.toFixed(0)}% da receita projetada`
        : `${clientCount} clientes na base`,
      explanation: topClientPct > 35
        ? `Se ${topClientName} sair, você perde ${topClientPct.toFixed(0)}% do faturamento. Ideal: nenhum cliente acima de 25%.`
        : topClientPct > 20
        ? `Boa distribuição, mas ${topClientName} ainda representa uma parcela relevante. Continue diversificando.`
        : `Receita bem distribuída entre ${clientCount} clientes — baixa dependência de qualquer um.`,
    },
    {
      icon: <TrendingDown className="h-4 w-4" />,
      label: "Déficit de Caixa",
      score: deficitRisk,
      detail: saldoProjetado < 0
        ? `Déficit de ${fmt(Math.abs(saldoProjetado))} em 90 dias`
        : `Saldo projetado positivo: ${fmt(saldoProjetado)}`,
      explanation: saldoProjetado < 0
        ? `Em 90 dias, suas despesas (${fmt(totalDespesas)}) superam receitas + saldo. Ação: aumentar faturamento ou cortar custos de ${fmt(Math.abs(saldoProjetado))}.`
        : `Receitas projetadas de ${fmt(totalReceitas)} cobrem as despesas de ${fmt(totalDespesas)} com folga de ${fmt(saldoProjetado)}.`,
    },
    {
      icon: <RefreshCw className="h-4 w-4" />,
      label: "Previsibilidade (MRR vs Avulso)",
      score: mrrRisk,
      detail: totalRev > 0
        ? `MRR: ${mrrPct.toFixed(0)}% da receita (${fmt(mrrRevenue)})`
        : "Sem receita projetada",
      explanation: mrrPct >= 70
        ? `Excelente! ${mrrPct.toFixed(0)}% da receita é recorrente — isso dá previsibilidade para planejar crescimento e investimentos.`
        : mrrPct >= 40
        ? `Parte relevante da receita depende de projetos avulsos (${(100 - mrrPct).toFixed(0)}%). Converta clientes pontuais em contratos mensais.`
        : totalRev > 0
        ? `Apenas ${mrrPct.toFixed(0)}% é recorrente. Receita volátil dificulta planejamento. Priorize fechar contratos de recorrência.`
        : `Sem projeções cadastradas. Adicione clientes na Projeção Anual para análise.`,
    },
    {
      icon: <ShieldAlert className="h-4 w-4" />,
      label: "Cobertura de Despesas",
      score: coverageRisk,
      detail: `Receita cobre ${coverageMonths.toFixed(1)} meses de despesa`,
      explanation: coverageMonths >= 3
        ? `Receita projetada cobre totalmente as despesas dos próximos 3 meses. Margem saudável para imprevistos.`
        : coverageMonths >= 2
        ? `Receita cobre ${coverageMonths.toFixed(1)} dos 3 meses. Gap de ${fmt(totalDespesas - totalReceitas)} precisa ser coberto por caixa ou novos contratos.`
        : `Receita insuficiente — cobre apenas ${coverageMonths.toFixed(1)} meses. Despesa mensal de ${fmt(totalDespesas / 3)} exige ação imediata.`,
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: "Runway de Caixa",
      score: runwayRisk,
      detail: `Saldo atual sustenta ${runwayMonths.toFixed(1)} meses (burn: ${fmt(monthlyBurn)}/mês)`,
      explanation: runwayMonths >= 3
        ? `Com ${fmt(saldoAtual)} em caixa e burn de ${fmt(monthlyBurn)}/mês, você tem ${runwayMonths.toFixed(1)} meses de fôlego mesmo sem receita.`
        : runwayMonths >= 1
        ? `Caixa de ${fmt(saldoAtual)} dura ${runwayMonths.toFixed(1)} meses sem receita. Custos fixos (${fmt(totalFixedCosts)}) + pessoas (${fmt(totalSalaries)}) = ${fmt(monthlyBurn)}/mês. Ideal: 3+ meses de reserva.`
        : `⚠️ Caixa de ${fmt(saldoAtual)} não cobre 1 mês de operação (${fmt(monthlyBurn)}/mês). Sem novas receitas, a operação para em ${Math.round(runwayMonths * 30)} dias.`,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Análise de Risco
          </CardTitle>
          <div className={`text-sm font-light ${overall.color}`}>
            Risco {overall.label} ({overallRisk.toFixed(0)}%)
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {risks.map((r, i) => {
          const level = getRiskLevel(r.score);
          return (
            <div key={i} className="space-y-1.5 pb-4 border-b border-border/40 last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-light">
                  {r.icon}
                  {r.label}
                </div>
                <span className={`text-xs font-light ${level.color}`}>{level.label}</span>
              </div>
              <Progress value={r.score} className="h-2" />
              <p className="text-xs font-light text-foreground/80">{r.detail}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.explanation}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}



