import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CashFlowProject {
  id: string;
  user_id: string;
  name: string;
  client_name: string | null;
  project_type: string;
  monthly_value: number;
  start_date: string;
  end_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = Omit<CashFlowProject, "id" | "created_at" | "updated_at" | "user_id">;

export function useProjects() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["cash-flow-projects", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_projects")
        .select("*")
        .order("status")
        .order("name");
      if (error) throw error;
      return data as CashFlowProject[];
    },
    enabled: !!userId,
  });

  const addProject = useMutation({
    mutationFn: async (project: ProjectInsert) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase.from("cash_flow_projects").insert({ ...project, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-flow-projects"] });
      toast.success("Projeto adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar projeto"),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CashFlowProject> & { id: string }) => {
      const { error } = await supabase.from("cash_flow_projects").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-flow-projects"] });
      toast.success("Projeto atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar projeto"),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_flow_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-flow-projects"] });
      toast.success("Projeto removido!");
    },
    onError: () => toast.error("Erro ao remover projeto"),
  });

  // Computed
  const activeProjects = projects.filter((p) => p.status === "ativo");
  const totalMonthlyRevenue = activeProjects.reduce((sum, p) => sum + Number(p.monthly_value), 0);

  return {
    projects,
    activeProjects,
    totalMonthlyRevenue,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
  };
}
