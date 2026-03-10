import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import { toast } from "sonner";

export interface PJAbsence {
  id: string;
  person_id: string;
  user_id: string;
  absence_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  days_count: number;
  created_at: string;
}

export type AbsenceInsert = Omit<PJAbsence, "id" | "created_at" | "user_id">;

export function useAbsences() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const userId = session?.user?.id;

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ["pj-absences", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pj_absences")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as PJAbsence[];
    },
    enabled: !!userId,
  });

  const addAbsence = useMutation({
    mutationFn: async (absence: AbsenceInsert) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase.from("pj_absences").insert({ ...absence, user_id: userId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-absences"] }); toast.success("Ausência registrada!"); },
    onError: () => toast.error("Erro ao registrar ausência"),
  });

  const updateAbsence = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PJAbsence> & { id: string }) => {
      const { error } = await supabase.from("pj_absences").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-absences"] }); toast.success("Ausência atualizada!"); },
    onError: () => toast.error("Erro ao atualizar ausência"),
  });

  const deleteAbsence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pj_absences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pj-absences"] }); toast.success("Ausência removida!"); },
    onError: () => toast.error("Erro ao remover ausência"),
  });

  const pendingCount = absences.filter(a => a.status === "solicitada").length;

  return { absences, isLoading, addAbsence, updateAbsence, deleteAbsence, pendingCount };
}
