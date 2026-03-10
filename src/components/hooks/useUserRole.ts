import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/components/integrations/supabase/client";
import { useAuth } from "@/components/contexts/AuthContext";
import type { AppRole } from "@/components/lib/permissions";

export function useUserRole() {
  const { user } = useAuth();

  const { data: role = null, isLoading: loading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: user.id,
      });
      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      return (data as AppRole) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  return {
    role,
    isAdmin: role === "admin",
    isSecretary: role === "secretary",
    loading,
  };
}
