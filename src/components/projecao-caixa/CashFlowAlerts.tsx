import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";

interface CashFlowAlert {
  id: string;
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
}

interface CashFlowAlertsProps {
  saldoProjetado: number;
  saldoInicial: number;
  totalDespesas: number;
  totalReceitas: number;
  topClientPct: number;
  topClientName: string;
  clientCount: number;
  mrrRevenue: number;
  avulsoRevenue: number;
}

const icons = {
  critical: <AlertTriangle className="h-4 w-4 text-destructive" />,
  warning: <ShieldAlert className="h-4 w-4 text-amber-600" />,
  info: <Lightbulb className="h-4 w-4 text-primary" />,
};

const styles = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-400/40 bg-amber-50",
  info: "border-primary/40 bg-secondary",
};

function fmt(v: number) {
  return `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CashFlowAlerts({
  saldoProjetado,
  saldoInicial,
  totalDespesas,
  totalReceitas,
  topClientPct,
  topClientName,
  clientCount,
  mrrRevenue,
  avulsoRevenue,
}: CashFlowAlertsProps) {
  const alerts: CashFlowAlert[] = [];

  // Deficit alert
  if (saldoProjetado < 0) {
    const deficit = Math.abs(saldoProjetado);
    alerts.push({
      id: "deficit",
      level: "critical",
      title: `Déficit projetado de ${fmt(deficit)}`,
      description: `Receita projetada de ${fmt(totalReceitas)} não cobre despesas de ${fmt(totalDespesas)}. Aumente faturamento ou reduza custos.`,
    });
  }

  // Low reserve
  if (saldoInicial < totalDespesas * 0.3) {
    alerts.push({
      id: "low-reserve",
      level: "critical",
      title: "Reserva de caixa insuficiente",
      description: `Saldo de ${fmt(saldoInicial)} cobre menos de 30% das despesas projetadas. Considere captação de recursos.`,
    });
  }

  // High concentration
  if (topClientPct > 35 && topClientName) {
    alerts.push({
      id: "concentration",
      level: "warning",
      title: `Concentração: ${topClientName} = ${topClientPct.toFixed(0)}% da receita`,
      description: "Alta dependência de um cliente. Diversifique a base para reduzir risco.",
    });
  }

  // MRR vs Avulso ratio
  const totalRev = mrrRevenue + avulsoRevenue;
  if (totalRev > 0 && avulsoRevenue > mrrRevenue) {
    const avulsoPct = ((avulsoRevenue / totalRev) * 100).toFixed(0);
    alerts.push({
      id: "mrr-low",
      level: "warning",
      title: `Receita avulsa (${avulsoPct}%) supera MRR`,
      description: "Priorize contratos recorrentes para estabilizar o fluxo de caixa.",
    });
  }

  // No revenue projections
  if (clientCount === 0) {
    alerts.push({
      id: "no-projections",
      level: "warning",
      title: "Sem projeções de faturamento",
      description: "Cadastre clientes na Projeção Anual para ter visibilidade de receita futura.",
    });
  }

  // Positive outlook
  if (saldoProjetado > 0 && saldoProjetado > totalDespesas * 0.5) {
    alerts.push({
      id: "opportunity",
      level: "info",
      title: "Oportunidade de investimento",
      description: `Saldo projetado de ${fmt(saldoProjetado)} permite investimentos em crescimento.`,
    });
  }

  // MRR strength
  if (mrrRevenue > 0 && mrrRevenue > avulsoRevenue) {
    const mrrPct = ((mrrRevenue / totalRev) * 100).toFixed(0);
    alerts.push({
      id: "mrr-strong",
      level: "info",
      title: `MRR forte: ${mrrPct}% da receita é recorrente`,
      description: `Base de ${fmt(mrrRevenue)} em MRR traz previsibilidade ao fluxo.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "ok",
      level: "info",
      title: "Projeção dentro dos parâmetros",
      description: "Sem alertas críticos. Continue monitorando semanalmente.",
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-light">Alertas de Caixa</h3>
      {alerts.map((a) => (
        <Alert key={a.id} className={styles[a.level]}>
          {icons[a.level]}
          <AlertTitle className="text-sm">{a.title}</AlertTitle>
          <AlertDescription className="text-xs">{a.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}



