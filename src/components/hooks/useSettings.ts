import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/components/contexts/ClientContext";
import { toast } from "sonner";

export interface SystemSettings {
  id?: string;
  company_id: string;
  openai_api_key: string | null;
}

export function useSettings() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      
      const { data, error } = await supabase
        .from("configuracoes_sistema")
        .select("*")
        .eq("company_id", selectedClient.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as SystemSettings | null;
    },
    enabled: !!selectedClient,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      if (!selectedClient) throw new Error("Cliente não selecionado");

      if (settings?.id) {
        const { error } = await supabase
          .from("configuracoes_sistema")
          .update(newSettings)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("configuracoes_sistema")
          .insert([{ ...newSettings, company_id: selectedClient.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Configurações atualizadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar configurações: " + error.message);
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
