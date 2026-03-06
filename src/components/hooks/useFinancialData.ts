import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInDays, isAfter, isBefore, isWithinInterval } from "date-fns";

const MONTH_NAMES_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatCurrency(value: number): string {
  return `R$ ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

export function useFinancialData() {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const userId = session?.user?.id;

  const { data: lancamentos = [], isLoading: loadingLancamentos } = useQuery({
    queryKey: ["finance-transactions-dashboard", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("finance_transactions")
        .select(`
          *,
          finance_categories(nome)
        `)
        .eq("empresa_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: contas = [], isLoading: loadingContas } = useQuery({
    queryKey: ["finance-accounts-dashboard", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("finance_bank_accounts")
        .select("*")
        .eq("empresa_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  // === Monthly aggregation (last 7 months) ===
  const monthlyData = useMemo(() => {
    const months: { label: string; month: number; year: number; receita: number; despesa: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        label: MONTH_NAMES_SHORT[d.getMonth()],
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        receita: 0,
        despesa: 0,
      });
    }

    lancamentos.forEach((l) => {
      if (!l.data) return;
      const date = parseISO(l.data);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const entry = months.find((e) => e.month === m && e.year === y);
      if (!entry) return;

      const val = Number(l.valor);
      if (l.tipo === 'entrada') entry.receita += val;
      else if (l.tipo === 'saida') entry.despesa += val;
    });

    return months;
  }, [lancamentos]);

  const currentMonthData = monthlyData[monthlyData.length - 1] || { receita: 0, despesa: 0 };
  const previousMonthData = monthlyData[monthlyData.length - 2] || { receita: 0, despesa: 0 };

  const receitaAtual = currentMonthData.receita;
  const despesaAtual = currentMonthData.despesa;
  const receitaAnterior = previousMonthData.receita;

  const saldoTotal = contas.reduce((sum, c) => sum + Number(c.saldo || 0), 0);
  const dayOfMonth = now.getDate();
  const burnRateDiario = dayOfMonth > 0 ? despesaAtual / dayOfMonth : 0;

  const revenueChartData = monthlyData.slice(-6).map((m) => ({
    month: m.label,
    receita: Math.round(m.receita),
    despesas: Math.round(m.despesa),
  }));

  const healthScore = useMemo(() => {
    let score = 70;
    if (receitaAtual > despesaAtual) score += 15;
    if (saldoTotal > despesaAtual) score += 15;
    return Math.min(100, score);
  }, [receitaAtual, despesaAtual, saldoTotal]);

  const alerts = useMemo(() => {
    const list: any[] = [];
    if (saldoTotal < despesaAtual * 0.3) {
      list.push({
        id: "low-cash",
        level: "critical",
        title: "Caixa Crítico",
        description: "Saldo atual cobre menos de 10 dias de operação."
      });
    }
    if (list.length === 0) {
      list.push({
        id: "all-good",
        level: "info",
        title: "Operação Estável",
        description: "Indicadores dentro da normalidade."
      });
    }
    return list;
  }, [saldoTotal, despesaAtual]);

  const recommendations = useMemo(() => {
    const recs: any[] = [];
    if (receitaAtual < despesaAtual) {
      recs.push({
        id: "reduce-burn",
        category: "Custos",
        action: "Revisar despesas fixas para equilibrar fluxo",
        impact: formatCurrency(despesaAtual - receitaAtual),
        impactLevel: "alto"
      });
    }
    return recs;
  }, [receitaAtual, despesaAtual]);

  const cashFlowData = useMemo(() => {
    const weeks: { period: string; entradas: number; saidas: number; saldo: number }[] = [];
    for (let i = 0; i < 6; i++) {
      weeks.push({ period: `Sem ${i + 1}`, entradas: 0, saidas: 0, saldo: 0 });
    }
    const avgEntrada = monthlyData.reduce((prev, curr) => prev + curr.receita, 0) / Math.max(1, monthlyData.length) / 4;
    const avgSaida = monthlyData.reduce((prev, curr) => prev + curr.despesa, 0) / Math.max(1, monthlyData.length) / 4;

    return weeks.map(w => ({
      ...w,
      entradas: Math.round(avgEntrada),
      saidas: Math.round(-avgSaida),
      saldo: Math.round(avgEntrada - avgSaida)
    }));
  }, [monthlyData]);

  return {
    isLoading: (loadingLancamentos || loadingContas) && !!selectedClient,
    lastSync: new Date().toISOString(),
    saldoTotal,
    healthScore,
    alerts,
    recommendations,
    revenueChartData,
    cashFlowData,
    formatCurrency,
    receitaAtual,
    despesaAtual,
    burnRateDiario: Math.round(burnRateDiario),
  };
}
