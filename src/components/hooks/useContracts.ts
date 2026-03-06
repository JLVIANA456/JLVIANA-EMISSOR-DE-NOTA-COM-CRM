import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PJContract {
  id: string;
  person_id: string;
  user_id: string;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  monthly_value: number;
  file_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  salary_adjustment_id?: string | null;
}

export type ContractInsert = Omit<PJContract, "id" | "created_at" | "updated_at" | "user_id">;

export function useContracts() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const userId = session?.user?.id;

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["pj-contracts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_contracts")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as PJContract[];
    },
    enabled: !!userId,
  });

  const addContract = useMutation({
    mutationFn: async (contract: ContractInsert) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase.from("pj_contracts").insert({ ...contract, user_id: userId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-contracts"] }); toast.success("Contrato adicionado!"); },
    onError: () => toast.error("Erro ao adicionar contrato"),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PJContract> & { id: string }) => {
      const { error } = await supabase.from("pj_contracts").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-contracts"] }); toast.success("Contrato atualizado!"); },
    onError: () => toast.error("Erro ao atualizar contrato"),
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pj_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-contracts"] }); toast.success("Contrato removido!"); },
    onError: () => toast.error("Erro ao remover contrato"),
  });

  return { contracts, isLoading, addContract, updateContract, deleteContract };
}
