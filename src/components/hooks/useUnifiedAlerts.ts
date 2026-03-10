import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { differenceInDays, differenceInMonths } from "date-fns";
import type { PJContract } from "@/components/hooks/useContracts";

export interface UnifiedAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  module: string;
  title: string;
  description: string;
  link?: string;
}

export function useUnifiedAlerts() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Chave estável baseada no userId
  const DISMISSED_KEY = useMemo(
    () => `dismissed-alerts-${userId || "anon"}`,
    [userId]
  );

  // Estado React para IDs dispensados — garante re-render quando muda
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Sincroniza do localStorage quando a chave muda (usuário loga/desloga)
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
      setDismissedIds(stored);
    } catch {
      setDismissedIds([]);
    }
  }, [DISMISSED_KEY]);

  const dismissAlert = useCallback((stableId: string) => {
    setDismissedIds(prev => {
      if (prev.includes(stableId)) return prev;
      const updated = [...prev, stableId];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [DISMISSED_KEY]);

  const clearDismissed = useCallback(() => {
    localStorage.removeItem(DISMISSED_KEY);
    setDismissedIds([]);
  }, [DISMISSED_KEY]);

  // Fetch all data sources in parallel
  const { data: invoiceRequests = [] } = useQuery({
    queryKey: ["alerts-invoices", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("invoice_requests")
        .select("id, client_name, due_date, status, is_recurring, recurring_day, desired_issue_date, gross_value, competency_month, competency_year")
        .not("status", "in", '("cancelada","pagamento_confirmado")');
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: supplierInvoices = [] } = useQuery({
    queryKey: ["alerts-suppliers", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("supplier_invoices")
        .select("id, supplier_name, due_date, status, gross_value")
        .not("status", "eq", "paga");
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["alerts-people", userId],
    queryFn: async () => {
      const { data } = await supabase.from("people").select("*").eq("status", "ativo");
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: salaryHistory = [] } = useQuery({
    queryKey: ["alerts-salary", userId],
    queryFn: async () => {
      const { data } = await supabase.from("salary_history").select("*");
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: fixedCosts = [] } = useQuery({
    queryKey: ["alerts-costs", userId],
    queryFn: async () => {
      const { data } = await supabase.from("fixed_costs").select("*").eq("is_active", true);
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: revenueProjections = [] } = useQuery({
    queryKey: ["alerts-revenue", userId],
    queryFn: async () => {
      const { data } = await supabase.from("revenue_projections").select("*").eq("year", new Date().getFullYear());
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: reimbursements = [] } = useQuery({
    queryKey: ["alerts-reimbursements", userId],
    queryFn: async () => {
      const { data } = await supabase.from("reimbursement_requests").select("id, requester_name, status, created_at, amount").eq("status", "aguardando_aprovacao");
      return (data as any[]) || [];
    },
    enabled: !!userId,
  });

  const { data: pjContracts = [] } = useQuery({
    queryKey: ["alerts-pj-contracts", userId],
    queryFn: async () => {
      const { data } = await supabase.from("pj_contracts").select("*").eq("status", "ativo");
      return (data as PJContract[]) || [];
    },
    enabled: !!userId,
  });

  const alerts = useMemo(() => {
    const result: UnifiedAlert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let idx = 0;
    const id = () => `alert-${idx++}`;

    // ═══════════════════════════════════════
    // EMISSÃO DE NOTAS
    // ═══════════════════════════════════════

    // Notas vencidas
    for (const inv of invoiceRequests) {
      if (!inv.due_date) continue;
      const diff = differenceInDays(now, new Date(inv.due_date));
      if (diff > 0) {
        result.push({
          id: id(), severity: "critical", module: "Emissão de Notas",
          title: `Nota de ${inv.client_name} vencida há ${diff} dia(s)`,
          description: `Valor: R$ ${Number(inv.gross_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — vencimento: ${new Date(inv.due_date).toLocaleDateString("pt-BR")}. Status: ${inv.status}.`,
          link: "/emissao-notas",
        });
      } else if (diff >= -7) {
        result.push({
          id: id(), severity: "warning", module: "Emissão de Notas",
          title: `Nota de ${inv.client_name} vence em ${Math.abs(diff)} dia(s)`,
          description: `Valor: R$ ${Number(inv.gross_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — vencimento: ${new Date(inv.due_date).toLocaleDateString("pt-BR")}.`,
          link: "/emissao-notas",
        });
      }
    }

    // Notas recorrentes próximas da emissão
    const recurringInvoices = invoiceRequests.filter((i: any) => i.is_recurring && i.recurring_day);
    for (const inv of recurringInvoices) {
      const dayOfMonth = now.getDate();
      const daysUntil = inv.recurring_day - dayOfMonth;
      if (daysUntil >= 0 && daysUntil <= 5) {
        result.push({
          id: id(), severity: "info", module: "Emissão de Notas",
          title: `Emissão recorrente de ${inv.client_name} em ${daysUntil === 0 ? "hoje" : `${daysUntil} dia(s)`}`,
          description: `Nota recorrente programada para o dia ${inv.recurring_day} de cada mês.`,
          link: "/emissao-notas",
        });
      }
    }

    // ═══════════════════════════════════════
    // RECEBIMENTO DE NOTAS (FORNECEDORES)
    // ═══════════════════════════════════════

    for (const inv of supplierInvoices) {
      if (!inv.due_date) continue;
      const diff = differenceInDays(now, new Date(inv.due_date));
      if (diff > 0) {
        result.push({
          id: id(), severity: "critical", module: "Contas a Pagar",
          title: `Nota de ${inv.supplier_name} vencida há ${diff} dia(s)`,
          description: `Valor: R$ ${Number(inv.gross_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Status: ${inv.status}.`,
          link: "/recebimento-notas",
        });
      } else if (diff >= -7) {
        result.push({
          id: id(), severity: "warning", module: "Contas a Pagar",
          title: `Nota de ${inv.supplier_name} vence em ${Math.abs(diff)} dia(s)`,
          description: `Valor: R$ ${Number(inv.gross_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
          link: "/recebimento-notas",
        });
      }
    }

    // ═══════════════════════════════════════
    // PESSOAS & COMPLIANCE
    // ═══════════════════════════════════════

    const CONTRACT_LABELS: Record<string, string> = {
      clt: "CLT", temporario: "Temporário", estagio: "Estágio", jovem_aprendiz: "Jovem Aprendiz",
      intermitente: "Intermitente", prazo_determinado: "Prazo Determinado", autonomo: "Autônomo",
      representacao_comercial: "Representação Comercial", prestacao_servicos_pj: "PJ",
      fornecimento_servicos: "Fornecimento", pj: "PJ",
    };
    const pjTypes = ["prestacao_servicos_pj", "fornecimento_servicos", "autonomo", "representacao_comercial", "pj"];

    for (const person of people) {
      if (!person.admission_date) continue;
      const months = differenceInMonths(now, new Date(person.admission_date));
      const ct = person.contract_type;
      const label = CONTRACT_LABELS[ct] || ct;

      if (ct === "estagio" && months >= 22) {
        result.push({
          id: id(), severity: months >= 24 ? "critical" : "warning", module: "Pessoas",
          title: `${person.name} — Estágio há ${months} meses`,
          description: months >= 24
            ? "Excedeu limite legal de 2 anos (Lei 11.788/08). Regularize imediatamente."
            : "Próximo do limite de 2 anos. Planeje efetivação ou término.",
          link: "/pessoas",
        });
      }

      if (ct === "jovem_aprendiz" && months >= 22) {
        result.push({
          id: id(), severity: months >= 24 ? "critical" : "warning", module: "Pessoas",
          title: `${person.name} — Jovem Aprendiz há ${months} meses`,
          description: months >= 24
            ? "Excedeu limite de 2 anos (CLT art. 428). Regularize."
            : "Próximo do limite de 2 anos.",
          link: "/pessoas",
        });
      }

      if (ct === "temporario" && months >= 6) {
        result.push({
          id: id(), severity: months >= 9 ? "critical" : "warning", module: "Pessoas",
          title: `${person.name} — Temporário há ${months} meses`,
          description: months >= 9
            ? "Excedeu limite de 270 dias (Lei 6.019/74). Risco de vínculo."
            : "Aproxima-se do limite de 270 dias.",
          link: "/pessoas",
        });
      }

      if (ct === "prazo_determinado" && months >= 22) {
        result.push({
          id: id(), severity: months >= 24 ? "critical" : "warning", module: "Pessoas",
          title: `${person.name} — Prazo Determinado há ${months} meses`,
          description: months >= 24
            ? "Excedeu 2 anos. Passa a vigorar como prazo indeterminado (CLT art. 445)."
            : "Próximo do limite de 2 anos.",
          link: "/pessoas",
        });
      }

      if (pjTypes.includes(ct) && months >= 12) {
        result.push({
          id: id(), severity: months >= 24 ? "critical" : "warning", module: "Pessoas",
          title: `${person.name} (${label}) — ${months} meses de contrato`,
          description: months >= 24
            ? "Risco elevado de caracterização de vínculo CLT. Avalie exclusividade e subordinação."
            : "Contratos longos com pessoalidade podem configurar vínculo. Documente autonomia.",
          link: "/pessoas",
        });
      }

      if (ct === "clt" && months >= 12) {
        result.push({
          id: id(), severity: "info", module: "Pessoas",
          title: `${person.name} — ${Math.floor(months / 12)} ano(s) CLT`,
          description: "Verifique se as férias do período aquisitivo estão programadas (CLT art. 137).",
          link: "/pessoas",
        });
      }
    }

    // PJs sem NF no mês
    const pjPeople = people.filter((p: any) => pjTypes.includes(p.contract_type));
    const missingNF = pjPeople.filter((p: any) =>
      !salaryHistory.some((h: any) => h.person_id === p.id && h.month === currentMonth && h.year === currentYear)
    );
    if (missingNF.length > 0) {
      result.push({
        id: id(), severity: "critical", module: "Pessoas",
        title: `${missingNF.length} prestador(es) sem NF no mês`,
        description: missingNF.map((p: any) => p.name).join(", "),
        link: "/pessoas",
      });
    }

    // Novos colaboradores sem registro de salário
    const noSalary = people.filter((p: any) =>
      !salaryHistory.some((h: any) => h.person_id === p.id)
    );
    if (noSalary.length > 0) {
      result.push({
        id: id(), severity: "info", module: "Pessoas",
        title: `${noSalary.length} colaborador(es) sem registro de salário`,
        description: noSalary.map((p: any) => p.name).join(", "),
        link: "/pessoas",
      });
    }

    // ═══════════════════════════════════════
    // CUSTOS FIXOS
    // ═══════════════════════════════════════

    const costsOverTarget = fixedCosts.filter((c: any) =>
      c.target_value && c.target_value > 0 && Number(c.monthly_value) > Number(c.target_value)
    );
    for (const cost of costsOverTarget) {
      const pct = ((Number(cost.monthly_value) - Number(cost.target_value)) / Number(cost.target_value) * 100).toFixed(0);
      result.push({
        id: id(), severity: "warning", module: "Custos Fixos",
        title: `${cost.item_name} acima da meta (+${pct}%)`,
        description: `Atual: R$ ${Number(cost.monthly_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — Meta: R$ ${Number(cost.target_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        link: "/custos-fixos",
      });
    }

    // Custos sem revisão há 6+ meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const stale = fixedCosts.filter((c: any) => new Date(c.updated_at) < sixMonthsAgo);
    if (stale.length > 0) {
      result.push({
        id: id(), severity: "info", module: "Custos Fixos",
        title: `${stale.length} custo(s) fixo(s) sem revisão há 6+ meses`,
        description: "Revise valores e contratos para garantir que estão atualizados.",
        link: "/custos-fixos",
      });
    }

    // ═══════════════════════════════════════
    // PROJEÇÃO DE CAIXA
    // ═══════════════════════════════════════

    // Concentração de receita > 40% em 1 cliente
    const totalRevenue = revenueProjections.reduce((s: number, p: any) => s + Number(p.value), 0);
    if (totalRevenue > 0) {
      const byClient: Record<string, number> = {};
      for (const p of revenueProjections) {
        byClient[p.client_name] = (byClient[p.client_name] || 0) + Number(p.value);
      }
      for (const [client, value] of Object.entries(byClient)) {
        const pct = (value / totalRevenue) * 100;
        if (pct > 40) {
          result.push({
            id: id(), severity: "warning", module: "Projeção de Caixa",
            title: `${client} concentra ${pct.toFixed(0)}% da receita projetada`,
            description: "Alta dependência de um único cliente. Diversifique a carteira para reduzir risco.",
            link: "/projecao-caixa",
          });
        }
      }
    }

    // Meses com receita projetada zero
    const totalCosts = fixedCosts.reduce((s: number, c: any) => s + Number(c.monthly_value), 0);
    if (totalCosts > 0) {
      for (let m = currentMonth; m <= 12; m++) {
        const monthRevenue = revenueProjections
          .filter((p: any) => p.month === m)
          .reduce((s: number, p: any) => s + Number(p.value), 0);
        if (monthRevenue < totalCosts * 0.5) {
          result.push({
            id: id(), severity: monthRevenue === 0 ? "critical" : "warning", module: "Projeção de Caixa",
            title: `${String(m).padStart(2, "0")}/${currentYear} — receita projetada insuficiente`,
            description: monthRevenue === 0
              ? `Nenhuma receita projetada para este mês. Custos fixos: R$ ${totalCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`
              : `Receita (R$ ${monthRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) cobre menos de 50% dos custos fixos.`,
            link: "/projecao-caixa",
          });
        }
      }
    }

    // ═══════════════════════════════════════
    // REEMBOLSOS
    // ═══════════════════════════════════════

    for (const r of reimbursements) {
      const daysWaiting = differenceInDays(now, new Date(r.created_at));
      if (daysWaiting > 15) {
        result.push({
          id: id(), severity: daysWaiting > 30 ? "critical" : "warning", module: "Reembolsos",
          title: `Reembolso de ${r.requester_name} pendente há ${daysWaiting} dias`,
          description: `Valor: R$ ${Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. Aguardando aprovação.`,
          link: "/reembolsos",
        });
      }
    }
    if (reimbursements.length > 0 && reimbursements.every((r: any) => differenceInDays(now, new Date(r.created_at)) <= 15)) {
      result.push({
        id: id(), severity: "info", module: "Reembolsos",
        title: `${reimbursements.length} reembolso(s) aguardando aprovação`,
        description: `Total: R$ ${reimbursements.reduce((s: number, r: any) => s + Number(r.amount), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        link: "/reembolsos",
      });
    }

    // ═══════════════════════════════════════
    // CONTRATOS PJ
    // ═══════════════════════════════════════
    for (const contract of pjContracts) {
      if (!contract.end_date) continue;
      const days = differenceInDays(new Date(contract.end_date), now);
      const personName = people.find((p: any) => p.id === contract.person_id)?.name || "PJ";
      if (days < 0) {
        result.push({
          id: id(), severity: "critical", module: "Contratos PJ",
          title: `Contrato de ${personName} vencido há ${Math.abs(days)} dia(s)`,
          description: `Renove ou encerre o contrato imediatamente.`,
          link: "/pessoas",
        });
      } else if (days <= 7) {
        result.push({
          id: id(), severity: "critical", module: "Contratos PJ",
          title: `Contrato de ${personName} vence em ${days} dia(s)`,
          description: `Providencie a renovação urgente.`,
          link: "/pessoas",
        });
      } else if (days <= 15) {
        result.push({
          id: id(), severity: "warning", module: "Contratos PJ",
          title: `Contrato de ${personName} vence em ${days} dia(s)`,
          description: `Planeje a renovação do contrato.`,
          link: "/pessoas",
        });
      } else if (days <= 30) {
        result.push({
          id: id(), severity: "info", module: "Contratos PJ",
          title: `Contrato de ${personName} vence em ${days} dia(s)`,
          description: `Acompanhe o vencimento do contrato.`,
          link: "/pessoas",
        });
      }
    }

    // ═══════════════════════════════════════
    // RESUMO: A RECEBER vs A PAGAR
    // ═══════════════════════════════════════
    const totalAReceber = invoiceRequests.reduce((s: number, i: any) => s + Number(i.gross_value || 0), 0);
    const totalAPagar = supplierInvoices.reduce((s: number, i: any) => s + Number(i.gross_value || 0), 0);
    if (totalAReceber > 0 || totalAPagar > 0) {
      const saldo = totalAReceber - totalAPagar;
      result.push({
        id: id(), severity: saldo < 0 ? "warning" : "info", module: "Financeiro",
        title: `Balanço: R$ ${Math.abs(saldo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${saldo >= 0 ? "positivo" : "negativo"}`,
        description: `A receber: R$ ${totalAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | A pagar: R$ ${totalAPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
      });
    }

    // Sort: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 };
    const sorted = result.sort((a, b) => order[a.severity] - order[b.severity]);

    // Filter out dismissed alerts using React state (not localStorage direct read)
    return sorted.filter(a => !dismissedIds.includes(a.id));
  }, [invoiceRequests, supplierInvoices, people, salaryHistory, fixedCosts, revenueProjections, reimbursements, pjContracts, dismissedIds]);

  const counts = useMemo(() => ({
    critical: alerts.filter(a => a.severity === "critical").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
    total: alerts.length,
  }), [alerts]);

  const modules = useMemo(() =>
    [...new Set(alerts.map(a => a.module))].sort(),
    [alerts]
  );

  return { alerts, counts, modules, dismissAlert, clearDismissed };
}
