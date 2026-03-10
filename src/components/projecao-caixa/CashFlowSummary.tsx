import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, AlertTriangle, TrendingUp, Wallet, Users, FileText, RefreshCw, Zap } from "lucide-react";

interface CashFlowSummaryProps {
  saldoInicial: number;
  receitaProjetada: number;
  mrrReceita: number;
  avulsoReceita: number;
  outrasReceitasGranatum: number;
  custosFixos: number;
  custosComPessoas: number;
  notasAPagar: number;
}

function fmt(v: number) {
  return `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function CashFlowSummary({
  saldoInicial,
  receitaProjetada,
  mrrReceita,
  avulsoReceita,
  outrasReceitasGranatum,
  custosFixos,
  custosComPessoas,
  notasAPagar,
}: CashFlowSummaryProps) {
  const totalReceitas = receitaProjetada + outrasReceitasGranatum;
  const totalDespesas = custosFixos + custosComPessoas + notasAPagar;
  const saldoProjetado = saldoInicial + totalReceitas - totalDespesas;
  const isDeficit = saldoProjetado < 0;

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Projeção de Caixa — Mês Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Saldo Inicial */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 text-sm font-light">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Saldo Inicial
          </div>
          <span className="font-light text-base">{fmt(saldoInicial)}</span>
        </div>

        {/* Receitas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-light text-primary">
            <ArrowUp className="h-4 w-4" />
            RECEITAS PROJETADAS
          </div>
          <div className="ml-6 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Receita Recorrente (MRR)
              </span>
              <span className="font-light text-primary">{fmt(mrrReceita)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" /> Receita Avulsa
              </span>
              <span className="font-light">{fmt(avulsoReceita)}</span>
            </div>
            {outrasReceitasGranatum > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" /> Recebíveis Pendentes
                </span>
                <span className="font-light">{fmt(outrasReceitasGranatum)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between ml-6 pt-1 border-t text-sm font-light text-primary">
            <span>TOTAL RECEITAS</span>
            <span>{fmt(totalReceitas)}</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-light text-destructive">
            <ArrowDown className="h-4 w-4" />
            DESPESAS PROJETADAS
          </div>
          <div className="ml-6 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Custos Fixos
              </span>
              <span className="font-light">{fmt(custosFixos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Custos com Pessoas
              </span>
              <span className="font-light">{fmt(custosComPessoas)}</span>
            </div>
            {notasAPagar > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" /> Notas a Pagar
                </span>
                <span className="font-light">{fmt(notasAPagar)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between ml-6 pt-1 border-t text-sm font-light text-destructive">
            <span>TOTAL DESPESAS</span>
            <span>{fmt(totalDespesas)}</span>
          </div>
        </div>

        {/* Saldo Projetado */}
        <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${isDeficit ? "bg-destructive/10 border-destructive/30" : "bg-primary/10 border-primary/30"}`}>
          <div className="flex items-center gap-2">
            {isDeficit && <AlertTriangle className="h-5 w-5 text-destructive" />}
            <div>
              <div className="text-xs text-muted-foreground uppercase font-light">Saldo Projetado (Mensal)</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {fmt(saldoInicial)} + {fmt(totalReceitas)} - {fmt(totalDespesas)}
              </div>
            </div>
          </div>
          <span className={`text-xl font-light ${isDeficit ? "text-destructive" : "text-primary"}`}>
            {isDeficit ? "-" : ""}{fmt(saldoProjetado)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}



