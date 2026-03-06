import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/contexts/AuthContext";
import { useUnifiedAlerts } from "@/components/hooks/useUnifiedAlerts";
import { useUserRole } from "@/components/hooks/useUserRole";
import { canAccessRoute } from "@/components/lib/permissions";
import {
  Brain,
  BookOpen,
  FileText,
  Receipt,
  Wallet,
  Users,
  TrendingUp,
  LayoutDashboard,
  Settings,
  Bell,
  BarChart3,
  Target,
  LogOut,
  HandCoins,
  ExternalLink,
  FileSignature,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  FileUser,
  RefreshCw,
  Palette,
  Truck,
  Repeat,
  Layers,
  Compass,
  Tag,
  Landmark,
  ChevronDown,
  Building2
} from "lucide-react";

import { cn } from "@/lib/utils";
// No company selector needed in sidebar anymore

const navigation = [
  {
    label: "Acesso Rápido",
    items: [
      { name: "Overview", href: "/overview", icon: Compass },
      { name: "Executivo", href: "/", icon: LayoutDashboard },
      { name: "Guia do Sistema", href: "/guia", icon: BookOpen },
    ],
  },
  {
    label: "Geral (Cadastro)",
    items: [
      { name: "Clientes", href: "/geral/clientes", icon: Users },
      { name: "Fornecedores", href: "/geral/fornecedores", icon: Truck },
      { name: "Categorias", href: "/financeiro/categorias", icon: Tag },
      { name: "Centro de Custos", href: "/financeiro/centro-custos", icon: Layers },
      { name: "Lançamentos", href: "/financeiro/lancamentos", icon: Wallet },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { name: "CFO Digital", href: "/cfo-digital", icon: Brain },
      { name: "Clientes Faturados", href: "/financeiro/faturados", icon: Users },
      { name: "Contas Bancárias", href: "/financeiro/contas-bancarias", icon: Landmark },
      { name: "Projeção de Caixa", href: "/projecao-caixa", icon: TrendingUp },
      { name: "Contas a Pagar", href: "/financeiro/contas-pagar", icon: ArrowDownCircle },
      { name: "Contas a Receber", href: "/financeiro/contas-receber", icon: ArrowUpCircle },
      { name: "Conciliação Bancária", href: "/financeiro/conciliacao", icon: RefreshCw },
      { name: "Custos Fixos", href: "/custos-fixos", icon: Wallet },
    ],
  },
  {
    label: "Fiscal",
    items: [
      { name: "Emissão de Notas", href: "/emissao-notas", icon: FileText },
      { name: "Recebimentos", href: "/recebimento-notas", icon: Receipt },
      { name: "Reembolsos", href: "/reembolsos", icon: HandCoins },
    ],
  },
  {
    label: "Contratos",
    items: [
      { name: "Contratos Inteligentes", href: "/contratos", icon: FileSignature },
    ],
  },
  {
    label: "Pessoas & Estrutura",
    items: [
      { name: "Pessoas & DP", href: "/pessoas", icon: Users },
      { name: "Folha PJ", href: "/folha-pagamento", icon: HandCoins },
      { name: "Portal PJ", href: "/portal-pj", icon: ExternalLink },
    ],
  },
];

interface AppSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ onClose, isCollapsed, onToggleCollapse }: AppSidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { counts } = useUnifiedAlerts();
  const { role } = useUserRole();
  const badgeCount = counts.critical + counts.warning;

  // Navigation items simplified

  // Get system name from localStorage or default
  const systemName = localStorage.getItem("whitelabel_system_name") || "JLVIANA HUB PRO";

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <aside className={cn(
      "flex h-screen flex-col gradient-navy border-r border-sidebar-border transition-all duration-300 ease-in-out z-50",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Section (Text Only) */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-sidebar-border/30 overflow-hidden">
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5 animate-in fade-in duration-500">
            <span className="text-sm font-bold text-white tracking-widest uppercase">
              {systemName.split(' ')[0]}
            </span>
            <span className="text-[10px] font-light text-sidebar-foreground/50 tracking-wider">
              {systemName.split(' ').slice(1).join(' ')}
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto animate-in zoom-in duration-300">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-white/10">
              <span className="text-xs font-bold text-white uppercase">{systemName[0]}</span>
            </div>
          </div>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-hide">
        {navigation.map((group) => {
          const visibleItems = group.items.filter((item) => canAccessRoute(role, item.href));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-light uppercase tracking-widest text-sidebar-foreground/40 animate-in fade-in duration-500">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={handleNavClick}
                        title={isCollapsed ? item.name : ""}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-light transition-all duration-200",
                          isActive
                            ? "bg-sidebar-accent text-primary shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          isCollapsed && "justify-center px-0"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive && "scale-110")} />
                        {!isCollapsed && <span className="animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        <Link
          to="/alertas"
          onClick={handleNavClick}
          title={isCollapsed ? "Alertas" : ""}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-light text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Bell className="h-4 w-4" />
          {!isCollapsed && (
            <>
              <span className="animate-in fade-in duration-300">Alertas</span>
              {badgeCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-light text-destructive-foreground">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </>
          )}
        </Link>
        <Link
          to="/configuracao-whitelabel"
          onClick={handleNavClick}
          title={isCollapsed ? "Personalizar" : ""}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-light text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Palette className="h-4 w-4" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Personalizar</span>}
        </Link>
        {canAccessRoute(role, '/configuracoes') && (
          <Link
            to="/configuracoes"
            onClick={handleNavClick}
            title={isCollapsed ? "Integrações" : ""}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-light text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Settings className="h-4 w-4" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Integrações</span>}
          </Link>
        )}
        <button
          onClick={signOut}
          title={isCollapsed ? "Sair" : ""}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-light text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Sair</span>}
        </button>
        {user && !isCollapsed && (
          <p className="px-3 pt-1 text-[10px] text-sidebar-foreground/30 truncate animate-in fade-in duration-500">{user.email}</p>
        )}

        {/* Toggle Collapse Button (PC only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center mt-2 py-2 text-sidebar-foreground/20 hover:text-sidebar-foreground/60 transition-colors"
        >
          <div className="h-1 w-8 bg-current rounded-full opacity-20 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </aside>
  );
}
