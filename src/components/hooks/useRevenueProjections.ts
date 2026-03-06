import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export interface RevenueProjection {
  id: string;
  user_id: string;
  empresa_id: string;
  client_name: string;
  month: number;
  year: number;
  value: number;
  notes: string | null;
  is_mrr: boolean;
  color: string | null;
}

export type CellColor = "green" | "yellow" | "red" | null;

export function useRevenueProjections(year: number) {
  const { session } = useAuth();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: projections = [], isLoading } = useQuery({
    queryKey: ["revenue-projections", userId, selectedClient?.id, year],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await (supabase as any)
        .from("revenue_projections")
        .select("*")
        .eq("empresa_id", selectedClient.id)
        .eq("year", year)
        .order("client_name");
      if (error) throw error;
      return data as RevenueProjection[];
    },
    enabled: !!userId && !!selectedClient,
  });

  const upsertProjection = useMutation({
    mutationFn: async (entry: { client_name: string; month: number; year: number; value: number }) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      // Try to find existing
      const { data: existing } = await (supabase as any)
        .from("revenue_projections")
        .select("id")
        .eq("empresa_id", selectedClient.id)
        .eq("client_name", entry.client_name)
        .eq("month", entry.month)
        .eq("year", entry.year)
        .maybeSingle();

      if (existing) {
        if (entry.value === 0) {
          const { error } = await (supabase as any)
            .from("revenue_projections")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from("revenue_projections")
            .update({ value: entry.value })
            .eq("id", existing.id);
          if (error) throw error;
        }
      } else if (entry.value > 0) {
        const { error } = await (supabase as any).from("revenue_projections").insert({
          user_id: userId,
          empresa_id: selectedClient.id,
          client_name: entry.client_name,
          month: entry.month,
          year: entry.year,
          value: entry.value,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
    },
    onError: () => toast.error("Erro ao salvar projeção"),
  });

  const addClient = useMutation({
    mutationFn: async (clientName: string) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      // Insert a placeholder entry for month 1 with value 0 just to register the client
      const { error } = await (supabase as any).from("revenue_projections").insert({
        user_id: userId,
        empresa_id: selectedClient.id,
        client_name: clientName,
        month: 1,
        year,
        value: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
      toast.success("Cliente adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar cliente"),
  });

  const deleteClient = useMutation({
    mutationFn: async (clientName: string) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any)
        .from("revenue_projections")
        .delete()
        .eq("empresa_id", selectedClient.id)
        .eq("client_name", clientName)
        .eq("year", year);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
      toast.success("Cliente removido!");
    },
    onError: () => toast.error("Erro ao remover cliente"),
  });

  const toggleMrr = useMutation({
    mutationFn: async ({ clientName, isMrr }: { clientName: string; isMrr: boolean }) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any)
        .from("revenue_projections")
        .update({ is_mrr: isMrr })
        .eq("empresa_id", selectedClient.id)
        .eq("client_name", clientName)
        .eq("year", year);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
    },
    onError: () => toast.error("Erro ao atualizar MRR"),
  });

  const renameClient = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { error } = await (supabase as any)
        .from("revenue_projections")
        .update({ client_name: newName })
        .eq("empresa_id", selectedClient.id)
        .eq("client_name", oldName)
        .eq("year", year);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
      toast.success("Cliente renomeado!");
    },
    onError: () => toast.error("Erro ao renomear cliente"),
  });

  const updateColor = useMutation({
    mutationFn: async ({ clientName, month, color }: { clientName: string; month: number; color: CellColor }) => {
      if (!userId || !selectedClient) throw new Error("Not authenticated or no client selected");
      const { data: existing } = await (supabase as any)
        .from("revenue_projections")
        .select("id")
        .eq("empresa_id", selectedClient.id)
        .eq("client_name", clientName)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from("revenue_projections")
          .update({ color } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        // Create entry with color
        const { error } = await (supabase as any).from("revenue_projections").insert({
          user_id: userId,
          empresa_id: selectedClient.id,
          client_name: clientName,
          month,
          year,
          value: 0,
          color,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenue-projections"] });
    },
  });

  // Get unique client names
  const clientNames = [...new Set(projections.map((p) => p.client_name))].sort();

  return {
    projections,
    clientNames,
    isLoading: isLoading && !!selectedClient,
    upsertProjection,
    addClient,
    deleteClient,
    toggleMrr,
    renameClient,
    updateColor,
    selectedClient
  };
}
