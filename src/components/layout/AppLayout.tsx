import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, Menu, X, Building2, ChevronDown, AlertTriangle, LogOut, Settings } from "lucide-react";
import { useUnifiedAlerts } from "@/components/hooks/useUnifiedAlerts";
import { cn } from "@/lib/utils";
import { useClient } from "@/components/contexts/ClientContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/components/contexts/AuthContext";

export function AppLayout() {
  const { counts } = useUnifiedAlerts();
  const { selectedClient, setSelectedClient, clients } = useClient();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const badgeCount = counts.critical + counts.warning;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pendingClient, setPendingClient] = useState<any>(null);

  // Get system name from localStorage or default
  const systemName = localStorage.getItem("whitelabel_system_name") || "JLVIANA HUB PRO";

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <AppSidebar
          onClose={() => setSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-4 lg:px-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/alertas")}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Bell className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-light text-destructive-foreground">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-1 rounded-full hover:bg-muted/50 transition-all focus:outline-none">
                    <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                      {selectedClient ? selectedClient.nome_fantasia?.substring(0, 2).toUpperCase() : "GA"}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-semibold leading-none text-foreground mb-1">
                        Gestor Administrativo
                      </p>
                      <p className="text-[10px] text-muted-foreground font-light flex items-center gap-1 group">
                        <Building2 className="h-2.5 w-2.5" />
                        <span className="max-w-[120px] truncate">
                          {selectedClient?.nome_fantasia || selectedClient?.razao_social || "Selecionar Empresa"}
                        </span>
                        <ChevronDown className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 mt-2 p-2 shadow-xl border-muted/20 animate-in slide-in-from-top-2">
                  <DropdownMenuLabel className="font-bold text-[10px] uppercase tracking-widest px-2 py-3 text-muted-foreground">Sessão & Empresa</DropdownMenuLabel>
                  <div className="px-2 pb-3 mb-2 border-b border-muted/20">
                    <p className="text-sm font-medium text-foreground">Gestor Administrativo</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>

                  <div className="py-2">
                    <DropdownMenuLabel className="font-bold text-[9px] uppercase tracking-widest px-2 py-1 text-primary">Alterar Contexto Empresa</DropdownMenuLabel>
                    <div className="max-h-[250px] overflow-y-auto space-y-0.5 mt-1 px-1">
                      {clients.map((client) => (
                        <DropdownMenuItem
                          key={client.id}
                          className={cn(
                            "text-xs font-light rounded-md flex items-center justify-between p-2 cursor-pointer transition-colors",
                            selectedClient?.id === client.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                          )}
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="flex items-center">
                            <Building2 className={cn("h-4 w-4 mr-2 opacity-50", selectedClient?.id === client.id && "text-primary opacity-100")} />
                            <span className="truncate max-w-[180px]">{client.nome_fantasia || client.razao_social}</span>
                          </div>
                          {selectedClient?.id === client.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1.5 opacity-50" />

                  <DropdownMenuItem
                    className="text-xs font-medium hover:bg-muted cursor-pointer rounded-md p-2.5 flex items-center gap-2"
                    onClick={() => navigate('/configuracoes')}
                  >
                    <Settings className="h-4 w-4 opacity-70" />
                    Preferências do Sistema
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1.5 opacity-50" />

                  <DropdownMenuItem
                    className="text-xs font-semibold text-destructive hover:bg-destructive/5 cursor-pointer rounded-md p-2.5 flex items-center gap-2"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Encerrar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}






