import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export interface Person {
  id: string;
  user_id: string;
  name: string;
  role: string;
  email: string | null;
  base_salary: number;
  status: string;
  contract_type: string;
  admission_date: string | null;
  termination_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New PJ fields
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  tax_regime: string | null;
  phone: string | null;
  address: string | null;
  status_justification: string | null;
}

export interface SalaryHistory {
  id: string;
  person_id: string;
  user_id: string;
  month: number;
  year: number;
  value: number;
  notes: string | null;
  created_at: string;
}

export interface Commission {
  id: string;
  person_id: string;
  user_id: string;
  month: number;
  year: number;
  value: number;
  description: string | null;
  created_at: string;
}

export interface SalaryAdjustment {
  id: string;
  person_id: string;
  user_id: string;
  old_value: number;
  new_value: number;
  change_percentage: number;
  effective_date: string;
  reason: string | null;
  created_at: string;
}

export type PersonInsert = Omit<Person, "id" | "created_at" | "updated_at" | "user_id">;

export function usePeople() {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: people = [], isLoading: loadingPeople } = useQuery({
    queryKey: ["people", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("people")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("name");
      if (error) throw error;
      return data as Person[];
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: salaryHistory = [], isLoading: loadingSalaries } = useQuery({
    queryKey: ["salary-history", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("salary_history")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as SalaryHistory[];
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: commissions = [], isLoading: loadingCommissions } = useQuery({
    queryKey: ["commissions", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("commissions")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: salaryAdjustments = [], isLoading: loadingAdjustments } = useQuery({
    queryKey: ["salary-adjustments", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("salary_adjustments")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return data as SalaryAdjustment[];
    },
    enabled: !!userId && !!selectedClient,
  });

  const addPerson = useMutation({
    mutationFn: async (person: PersonInsert) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any).from("people").insert({
        ...person,
        user_id: userId,
        empresa_id: selectedClient.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Colaborador adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar colaborador"),
  });

  const updatePerson = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Person> & { id: string }) => {
      const { error } = await (supabase as any).from("people").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast.success("Colaborador atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar colaborador"),
  });

  const deletePerson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("people").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Colaborador removido!");
    },
    onError: () => toast.error("Erro ao remover colaborador"),
  });

  const addSalary = useMutation({
    mutationFn: async (salary: Omit<SalaryHistory, "id" | "created_at" | "user_id">) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any).from("salary_history").insert({
        ...salary,
        user_id: userId,
        empresa_id: selectedClient.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      toast.success("Salário registrado!");
    },
    onError: () => toast.error("Erro ao registrar salário"),
  });

  const updateSalary = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalaryHistory> & { id: string }) => {
      const { error } = await (supabase as any).from("salary_history").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      toast.success("Salário atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar salário"),
  });

  const deleteSalary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("salary_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-history"] });
      toast.success("Salário removido!");
    },
    onError: () => toast.error("Erro ao remover salário"),
  });

  const addCommission = useMutation({
    mutationFn: async (commission: Omit<Commission, "id" | "created_at" | "user_id">) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any).from("commissions").insert({
        ...commission,
        user_id: userId,
        empresa_id: selectedClient.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Comissão registrada!");
    },
    onError: () => toast.error("Erro ao registrar comissão"),
  });

  const updateCommission = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Commission> & { id: string }) => {
      const { error } = await (supabase as any).from("commissions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Comissão atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar comissão"),
  });

  const deleteCommission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("commissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Comissão removida!");
    },
    onError: () => toast.error("Erro ao remover comissão"),
  });

  const addSalaryAdjustment = useMutation({
    mutationFn: async (adj: Omit<SalaryAdjustment, "id" | "created_at" | "user_id">) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any).from("salary_adjustments").insert({
        ...adj,
        user_id: userId,
        empresa_id: selectedClient.id
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-adjustments"] });
    },
    onError: () => toast.error("Erro ao registrar reajuste"),
  });

  // Auto-terminate people whose termination_date has passed
  React.useEffect(() => {
    if (!people.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const toTerminate = people.filter(
      (p) => p.status === "ativo" && p.termination_date && p.termination_date <= today
    );
    for (const p of toTerminate) {
      updatePerson.mutate({
        id: p.id,
        status: "finalizado",
        is_active: false,
        status_justification: `Desligamento automático — data programada: ${p.termination_date}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);

  // Computed
  const activePeople = people.filter((p) => p.status === "ativo");
  const totalMonthlySalary = activePeople.reduce((sum, p) => sum + Number(p.base_salary), 0);

  // Real monthly cost: salary_history + commissions for a given month/year
  const getRealMonthlyCost = (month: number, year: number) => {
    const salaryTotal = salaryHistory
      .filter((s) => s.month === month && s.year === year)
      .reduce((sum, s) => sum + Number(s.value), 0);
    const commissionTotal = commissions
      .filter((c) => c.month === month && c.year === year)
      .reduce((sum, c) => sum + Number(c.value), 0);
    return salaryTotal + commissionTotal;
  };

  const alerts = generateAlerts(people, salaryHistory);

  return {
    people,
    salaryHistory,
    commissions,
    salaryAdjustments,
    activePeople,
    totalMonthlySalary,
    getRealMonthlyCost,
    alerts,
    isLoading: loadingPeople || loadingSalaries || loadingCommissions || loadingAdjustments,
    addPerson,
    updatePerson,
    deletePerson,
    addSalary,
    updateSalary,
    deleteSalary,
    addCommission,
    updateCommission,
    deleteCommission,
    addSalaryAdjustment,
  };
}

export interface PeopleAlert {
  type: "warning" | "info" | "error";
  category: "compliance" | "financeiro" | "operacional";
  title: string;
  description: string;
}

function generateAlerts(people: Person[], history: SalaryHistory[]): PeopleAlert[] {
  const alerts: PeopleAlert[] = [];
  const activePeople = people.filter((p) => p.status === "ativo");
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const CONTRACT_LABELS: Record<string, string> = {
    clt: 'CLT', temporario: 'Temporário', estagio: 'Estágio', jovem_aprendiz: 'Jovem Aprendiz',
    intermitente: 'Intermitente', prazo_determinado: 'Prazo Determinado', autonomo: 'Autônomo',
    representacao_comercial: 'Representação Comercial', prestacao_servicos_pj: 'Prestação de Serviços (PJ)',
    fornecimento_servicos: 'Fornecimento de Serviços', pj: 'PJ',
  };
  const getLabel = (p: Person) => CONTRACT_LABELS[p.contract_type] || p.contract_type;

  // PJ-like types that need NF
  const pjTypes = ['prestacao_servicos_pj', 'fornecimento_servicos', 'autonomo', 'representacao_comercial', 'pj'];
  const pjPeople = activePeople.filter(p => pjTypes.includes(p.contract_type));

  // 1. PJs/Autônomos sem NF no mês atual
  const missingNF = pjPeople.filter(p => !history.some(h => h.person_id === p.id && h.month === currentMonth && h.year === currentYear));
  if (missingNF.length > 0) {
    alerts.push({
      type: "error", category: "operacional",
      title: `${missingNF.length} prestador(es) sem NF no mês atual`,
      description: `${missingNF.map(p => `${p.name} (${getLabel(p)})`).join(", ")} ainda não possuem nota fiscal em ${String(currentMonth).padStart(2, '0')}/${currentYear}.`,
    });
  }

  // 2. Alertas por tipo de contrato e tempo
  for (const person of activePeople) {
    if (!person.admission_date) continue;
    const admDate = new Date(person.admission_date);
    const monthsDiff = (now.getFullYear() - admDate.getFullYear()) * 12 + (now.getMonth() - admDate.getMonth());
    const ct = person.contract_type;

    // Estágio: máximo 2 anos por lei
    if (ct === 'estagio' && monthsDiff >= 22) {
      alerts.push({
        type: monthsDiff >= 24 ? "error" : "warning", category: "compliance",
        title: `${person.name} — Estágio há ${monthsDiff} meses`,
        description: monthsDiff >= 24
          ? `Estágio excedeu o limite legal de 2 anos (Lei 11.788/08). Regularize imediatamente: efetive ou encerre o contrato.`
          : `Estágio próximo do limite legal de 2 anos. Planeje a efetivação ou término do contrato.`,
      });
    }

    // Jovem Aprendiz: máximo 2 anos, idade 14-24
    if (ct === 'jovem_aprendiz' && monthsDiff >= 22) {
      alerts.push({
        type: monthsDiff >= 24 ? "error" : "warning", category: "compliance",
        title: `${person.name} — Jovem Aprendiz há ${monthsDiff} meses`,
        description: monthsDiff >= 24
          ? `Contrato de aprendizagem excedeu o limite de 2 anos (CLT art. 428). Regularize imediatamente.`
          : `Contrato de aprendizagem próximo do limite de 2 anos. Planeje a continuidade.`,
      });
    }

    // Trabalho temporário: máximo 180 dias + 90 dias = 270 dias (~9 meses)
    if (ct === 'temporario' && monthsDiff >= 6) {
      alerts.push({
        type: monthsDiff >= 9 ? "error" : "warning", category: "compliance",
        title: `${person.name} — Temporário há ${monthsDiff} meses`,
        description: monthsDiff >= 9
          ? `Trabalho temporário excedeu o limite legal de 270 dias (Lei 6.019/74). Risco de vínculo empregatício.`
          : `Trabalho temporário se aproxima do limite de 270 dias. Avalie prorrogação ou contratação definitiva.`,
      });
    }

    // Prazo determinado: máximo 2 anos
    if (ct === 'prazo_determinado' && monthsDiff >= 22) {
      alerts.push({
        type: monthsDiff >= 24 ? "error" : "warning", category: "compliance",
        title: `${person.name} — Prazo Determinado há ${monthsDiff} meses`,
        description: monthsDiff >= 24
          ? `Contrato por prazo determinado excedeu 2 anos (CLT art. 445). Passa a vigorar como prazo indeterminado.`
          : `Contrato por prazo determinado próximo do limite de 2 anos. Defina a continuidade.`,
      });
    }

    // Intermitente: alerta se inativo há mais de 3 meses
    if (ct === 'intermitente') {
      const lastRecord = history
        .filter(h => h.person_id === person.id)
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      if (lastRecord) {
        const lastPeriod = lastRecord.year * 12 + lastRecord.month;
        const currentPeriod = currentYear * 12 + currentMonth;
        if (currentPeriod - lastPeriod >= 3) {
          alerts.push({
            type: "info", category: "compliance",
            title: `${person.name} — Intermitente sem convocação há ${currentPeriod - lastPeriod} meses`,
            description: `Trabalhador intermitente sem registros recentes. Avalie se o contrato ainda é necessário ou se deve ser rescindido.`,
          });
        }
      }
    }

    // PJ/Autônomo/Representação: risco de vínculo
    if (pjTypes.includes(ct)) {
      if (monthsDiff >= 24) {
        alerts.push({
          type: "error", category: "compliance",
          title: `${person.name} (${getLabel(person)}) — ${monthsDiff} meses`,
          description: `Contrato ativo há mais de 2 anos. Risco elevado de caracterização de vínculo empregatício (CLT). Avalie exclusividade, subordinação e pessoalidade.`,
        });
      } else if (monthsDiff >= 12) {
        alerts.push({
          type: "warning", category: "compliance",
          title: `${person.name} (${getLabel(person)}) — ${monthsDiff} meses`,
          description: `Contratos de longo prazo com pessoalidade e subordinação podem configurar vínculo CLT. Documente a autonomia.`,
        });
      }
    }

    // CLT: férias vencidas (> 12 meses sem registro de férias no notes — simplificado)
    if (ct === 'clt' && monthsDiff >= 12) {
      const anosCLT = Math.floor(monthsDiff / 12);
      alerts.push({
        type: "info", category: "compliance",
        title: `${person.name} — ${anosCLT} ano(s) de CLT`,
        description: `Verifique se as férias do período aquisitivo estão programadas. Férias vencidas geram pagamento em dobro (CLT art. 137).`,
      });
    }
  }

  // 3. Concentração de custo
  if (activePeople.length > 1) {
    const total = activePeople.reduce((s, p) => s + Number(p.base_salary), 0);
    for (const person of activePeople) {
      const pct = total > 0 ? (Number(person.base_salary) / total) * 100 : 0;
      if (pct > 25) {
        alerts.push({
          type: "warning", category: "financeiro",
          title: `${person.name} (${getLabel(person)}) concentra ${pct.toFixed(0)}% do custo`,
          description: `Alta dependência (${fmt(Number(person.base_salary))} de ${fmt(total)}). Risco operacional em caso de desligamento.`,
        });
      }
    }
  }

  // 4. Variação anormal recente
  const recentThreshold = (currentYear * 12 + currentMonth) - 2;
  for (const person of activePeople) {
    const personHistory = history.filter(h => h.person_id === person.id).sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
    for (let i = 1; i < personHistory.length; i++) {
      const curr = personHistory[i];
      const prev = personHistory[i - 1];
      if (curr.year * 12 + curr.month >= recentThreshold && prev.value > 0) {
        const change = ((curr.value - prev.value) / prev.value) * 100;
        if (Math.abs(change) > 20) {
          alerts.push({
            type: "warning", category: "financeiro",
            title: `Variação de ${change > 0 ? "+" : ""}${change.toFixed(0)}% em ${person.name}`,
            description: `De ${fmt(prev.value)} para ${fmt(curr.value)} (${getLabel(person)}). Verifique se houve mudança de escopo ou reajuste contratual.`,
          });
        }
      }
    }
  }

  // 5. Sem e-mail
  const noEmail = activePeople.filter(p => !p.email);
  if (noEmail.length > 0) {
    alerts.push({
      type: "info", category: "operacional",
      title: `${noEmail.length} colaborador(es) sem e-mail`,
      description: `${noEmail.map(p => `${p.name} (${getLabel(p)})`).join(", ")}. Necessário para notificações e envio de NF.`,
    });
  }

  // 6. Resumo por tipo de contrato
  const byType = activePeople.reduce((acc, p) => {
    const label = getLabel(p);
    if (!acc[label]) acc[label] = { count: 0, total: 0 };
    acc[label].count++;
    acc[label].total += Number(p.base_salary);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const totalGeral = activePeople.reduce((s, p) => s + Number(p.base_salary), 0);
  const breakdown = Object.entries(byType).map(([label, { count, total }]) => `${count} ${label} (${fmt(total)})`).join(" · ");

  if (activePeople.length > 0) {
    alerts.push({
      type: "info", category: "financeiro",
      title: `Folha total: ${fmt(totalGeral)}/mês — ${activePeople.length} colaboradores`,
      description: `${breakdown}. Custo anual projetado: ${fmt(totalGeral * 12)}.`,
    });
  }

  return alerts;
}
