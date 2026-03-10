import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export function useGranatum() {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: contas = [], isLoading: loadingContas } = useQuery({
    queryKey: ["granatum-contas", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_contas")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("descricao");
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: lancamentos = [], isLoading: loadingLancamentos } = useQuery({
    queryKey: ["granatum-lancamentos", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_lancamentos")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("data_competencia", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ["granatum-categorias", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_categorias")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("descricao");
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: centrosCusto = [], isLoading: loadingCentros } = useQuery({
    queryKey: ["granatum-centros-custo", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_centros_custo")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("descricao");
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: pessoas = [], isLoading: loadingPessoas } = useQuery({
    queryKey: ["granatum-pessoas", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_pessoas")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ["granatum-sync-log", userId, selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("granatum_sync_log")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .order("started_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!selectedClient,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || !selectedClient) throw new Error("Not authenticated or no client selected");

      const res = await supabase.functions.invoke("granatum-sync", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
        body: { empresa_id: selectedClient.id }
      });

      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["granatum-contas"] });
      queryClient.invalidateQueries({ queryKey: ["granatum-lancamentos"] });
      queryClient.invalidateQueries({ queryKey: ["granatum-categorias"] });
      queryClient.invalidateQueries({ queryKey: ["granatum-centros-custo"] });
      queryClient.invalidateQueries({ queryKey: ["granatum-pessoas"] });
      queryClient.invalidateQueries({ queryKey: ["granatum-sync-log"] });
      toast.success("Sincronização concluída!", {
        description: `Dados do Granatum atualizados com sucesso para ${selectedClient?.nome_fantasia || selectedClient?.razao_social}.`,
      });
    },
    onError: (error) => {
      toast.error("Erro na sincronização", {
        description: String(error),
      });
    },
  });

  // Computed data
  const saldoTotal = contas.reduce((sum, c) => sum + Number(c.saldo), 0);
  const clientes = pessoas.filter((p) => p.is_cliente);
  const fornecedores = pessoas.filter((p) => p.is_fornecedor);

  const receitas = lancamentos.filter((l) => l.tipo_lancamento_id === 2);
  const despesas = lancamentos.filter((l) => l.tipo_lancamento_id === 1);

  const totalReceitas = receitas.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalDespesas = despesas.reduce((sum, l) => sum + Math.abs(Number(l.valor)), 0);

  const lastSync = syncLogs[0]?.completed_at
    ? new Date(syncLogs[0].completed_at)
    : null;

  return {
    contas,
    lancamentos,
    categorias,
    centrosCusto,
    pessoas,
    clientes,
    fornecedores,
    syncLogs,
    saldoTotal,
    receitas,
    despesas,
    totalReceitas,
    totalDespesas,
    lastSync,
    isLoading: (loadingContas || loadingLancamentos || loadingCategorias || loadingCentros || loadingPessoas) && !!selectedClient,
    isSyncing: syncMutation.isPending,
    sync: () => syncMutation.mutate(),
    selectedClient
  };
}
