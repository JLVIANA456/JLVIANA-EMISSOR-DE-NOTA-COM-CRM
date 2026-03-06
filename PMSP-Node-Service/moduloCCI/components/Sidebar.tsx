
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
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'reconciliation', label: 'Conciliação', icon: Zap },
    { id: 'rules', label: 'Regras de IA', icon: ShieldCheck },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'tutorials', label: 'Guia & Dicas', icon: BookOpen },
  ];

  const handleLogout = () => {
    if (confirm("Deseja realmente sair do CCI?")) {
      window.location.reload();
    }
  };

  return (
    <div 
      className={`relative h-[calc(100vh-2rem)] m-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] bg-slate-950 flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[40px] border border-white/5 overflow-visible ${
        isCollapsed ? 'w-24' : 'w-72'
      }`}
    >
      {/* Botão de Toggle - Design Minimalista e Integrado */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-10 -right-4 z-50 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all border-4 border-slate-950 group"
      >
        <div className={`transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`}>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* Brand Logo Area */}
      <div className={`p-8 mb-4 transition-all duration-500 ${isCollapsed ? 'px-6' : 'px-9'}`}>
        <div 
          className="flex items-center gap-4 group cursor-pointer" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-3 rounded-[18px] shadow-xl shadow-indigo-500/20 group-hover:rotate-6 transition-all duration-300">
              <Zap className="text-white w-6 h-6" fill="white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-white font-black text-2xl tracking-tighter leading-none flex items-center gap-1">
                CCI
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-black mt-1.5">Intelligence</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide py-4">
        {!isCollapsed && (
          <p className="px-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6 animate-in fade-in duration-700 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-800"></span>
            Navegação
          </p>
        )}
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center transition-all duration-300 relative group rounded-[22px] overflow-hidden ${
                isCollapsed ? 'justify-center p-4' : 'px-5 py-4'
              } ${
                isActive 
                  ? 'bg-white/5 text-white' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
              }`}
            >
              {/* Indicador Ativo Lateral */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
              )}

              <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <item.icon className={`w-5 h-5 transition-all duration-300 ${
                  isActive ? 'text-indigo-400 scale-110' : 'text-slate-600 group-hover:text-slate-400'
                }`} />
                {!isCollapsed && (
                  <span className={`text-sm font-bold tracking-tight transition-all duration-300 ${
                    isActive ? 'translate-x-1' : 'group-hover:translate-x-1'
                  }`}>
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Card / Footer */}
      <div className={`mt-auto p-4 transition-all duration-500 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div className={`relative group transition-all duration-500 rounded-[32px] overflow-hidden border border-white/5 ${
          isCollapsed ? 'bg-transparent border-none' : 'bg-white/[0.03] p-5 backdrop-blur-xl'
        }`}>
          {/* Background Detail for Open Sidebar */}
          {!isCollapsed && (
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none"></div>
          )}

          <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center' : 'mb-6'}`}>
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20 ring-2 ring-slate-900 group-hover:scale-105 transition-transform">
                JV
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-slate-900 rounded-full"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-xs font-black text-white truncate tracking-tight">JLVIANA Consultoria</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Plano Premium</p>
                </div>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 pt-4 border-t border-white/5 animate-in fade-in duration-700">
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
              >
                <Settings className="w-3.5 h-3.5" />
                Ajustes
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
