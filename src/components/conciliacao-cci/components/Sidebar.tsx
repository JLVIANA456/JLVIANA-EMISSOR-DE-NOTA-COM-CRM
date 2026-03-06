
import React from 'react';
import {
  LayoutDashboard,
  Settings,
  History,
  ShieldCheck,
  Zap,
  LogOut,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Star,
  Command
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reconciliation', label: 'Conciliação', icon: Zap },
    { id: 'rules', label: 'Regras de IA', icon: ShieldCheck },
    { id: 'history', label: 'Lotes Históricos', icon: History },
    { id: 'tutorials', label: 'Central de Ajuda', icon: BookOpen },
  ];

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do sistema CCI?")) {
      window.location.reload();
    }
  };

  return (
    <aside
      className={`relative h-[calc(100vh-2rem)] m-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-slate-950 flex flex-col shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] rounded-[40px] border border-white/[0.08] backdrop-blur-3xl overflow-visible z-50 ${isCollapsed ? 'w-24' : 'w-80'
        }`}
    >
      {/* Botão Toggle Magnético */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-12 -right-4 z-[60] w-9 h-9 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:scale-110 active:scale-90 transition-all border-4 border-slate-950 group"
      >
        <div className={`transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>
          <ChevronRight size={16} className="stroke-[3px]" />
        </div>
      </button>

      {/* Brand & Logo Section */}
      <div className={`pt-10 pb-8 transition-all duration-500 ${isCollapsed ? 'px-6' : 'px-10'}`}>
        <div
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-red-500/40 blur-2xl group-hover:blur-3xl transition-all"></div>
            <div className="relative bg-gradient-to-tr from-red-500 via-red-600 to-red-800 p-3.5 rounded-2xl shadow-2xl shadow-red-500/40 group-hover:rotate-[10deg] transition-all duration-500">
              <Zap className="text-white w-6 h-6" fill="white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-6 duration-700">
              <h1 className="text-white font-black text-2xl tracking-tighter leading-none flex items-center gap-1">
                CCI
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black mt-2">Smart Engine</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide py-6">
        {!isCollapsed && (
          <div className="px-6 flex items-center justify-between mb-6 animate-in fade-in duration-1000">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Navegação</span>
            <Command className="w-3 h-3 text-slate-700" />
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center transition-all duration-500 relative group rounded-3xl overflow-hidden ${isCollapsed ? 'justify-center p-4' : 'px-6 py-4.5'
                } ${isActive
                  ? 'bg-gradient-to-br from-white/[0.08] to-transparent text-white'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-red-500 rounded-r-full shadow-[0_0_20px_#ef4444] animate-in slide-in-from-left-1"></div>
              )}

              <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <item.icon className={`w-5.5 h-5.5 transition-all duration-500 ${isActive ? 'text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : 'text-slate-600 group-hover:text-slate-400'
                  }`} />
                {!isCollapsed && (
                  <span className={`text-sm font-bold tracking-tight transition-all duration-500 ${isActive ? 'translate-x-1.5' : 'group-hover:translate-x-1.5'
                    }`}>
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && isActive && (
                <ChevronRight className="ml-auto w-4 h-4 text-red-500/50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Card Refined */}
      <div className={`mt-auto p-5 transition-all duration-500 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`relative group transition-all duration-500 rounded-[35px] border border-white/[0.05] overflow-hidden ${isCollapsed ? 'bg-transparent border-none' : 'bg-slate-900/40 p-5 backdrop-blur-2xl'
          }`}>
          {/* Subtle Background Glow */}
          {!isCollapsed && (
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-600/10 blur-[40px] rounded-full"></div>
          )}

          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : 'mb-6'}`}>
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-red-600 via-red-500 to-red-400 flex items-center justify-center text-xs font-black text-white shadow-xl group-hover:scale-110 transition-transform duration-500 ring-4 ring-slate-950">
                JV
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-950 rounded-full"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-4 duration-700">
                <p className="text-xs font-black text-white truncate tracking-tight">JLVIANA Consultoria</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-3 h-3 text-amber-500" />
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Enterprise</p>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05] animate-in fade-in duration-1000">
              <button
                title="Configurações"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="w-12 h-12 flex items-center justify-center text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                title="Sair do Sistema"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
