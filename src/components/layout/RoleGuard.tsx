import { Navigate } from "react-router-dom";
import { useUserRole } from "@/components/hooks/useUserRole";
import { canAccessRoute } from "@/components/lib/permissions";

export function RoleGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!canAccessRoute(role, path)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}



