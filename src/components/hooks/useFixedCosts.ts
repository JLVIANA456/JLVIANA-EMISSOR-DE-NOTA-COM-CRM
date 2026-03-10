import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export interface FixedCost {
  id: string;
  company_id: string;
  descricao: string;
  "categori-id": string;
  valor: number;
  frequencia: 'Mensal' | 'Trimestral' | 'Anual';
  dia_vencimento: number | null;
  "conta_bancari-id": string | null;
  centro_custo_id: string | null;
  ativo: boolean;
  gerar_ap: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categoria?: { nome: string };
}

export function useFixedCosts() {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: costs = [], isLoading, refetch } = useQuery({
    queryKey: ["fixed-costs", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("fixed_costs")
        .select("*, categoria:\"categori-id\"(nome)")
        .eq("company_id", selectedClient.id)
        .order("descricao", { ascending: true });
      if (error) throw error;
      return data as FixedCost[];
    },
    enabled: !!selectedClient,
  });

  const addCost = useMutation({
    mutationFn: async (cost: Omit<FixedCost, "id" | "created_at" | "updated_at">) => {
      if (!selectedClient) throw new Error("No client selected");
      const { error } = await (supabase as any).from("fixed_costs").insert({
        ...cost,
        company_id: selectedClient.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
      toast.success("Custo adicionado!");
    },
    onError: (error: any) => toast.error("Erro ao adicionar custo: " + error.message),
  });

  const updateCost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FixedCost> & { id: string }) => {
      const { error } = await (supabase as any).from("fixed_costs").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
      toast.success("Custo atualizado!");
    },
    onError: (error: any) => toast.error("Erro ao atualizar custo: " + error.message),
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("fixed_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-costs"] });
      toast.success("Custo removido!");
    },
    onError: (error: any) => toast.error("Erro ao remover custo: " + error.message),
  });

  // Computed data
  const activeCosts = costs.filter((c) => c.ativo && c.valor > 0);
  const totalMonthly = activeCosts.reduce((sum, c) => sum + Number(c.valor), 0);

  const categoryTotals = activeCosts.reduce((acc, c) => {
    const categoryName = c.categoria?.nome || 'Sem Categoria';
    acc[categoryName] = (acc[categoryName] || 0) + Number(c.valor);
    return acc;
  }, {} as Record<string, number>);

  return {
    costs,
    activeCosts,
    isLoading: isLoading && !!selectedClient,
    totalMonthly,
    categoryTotals,
    addCost,
    updateCost,
    deleteCost,
    refetch,
    selectedClient
  };
}
