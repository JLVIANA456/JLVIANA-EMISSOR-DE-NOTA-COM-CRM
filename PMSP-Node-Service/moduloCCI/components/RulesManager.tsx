
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  Filter,
  ArrowRight,
  Database,
  X,
  Target,
  Tag,
  ChevronDown
} from 'lucide-react';
import { Rule, MovementType } from '../types';

interface RulesManagerProps {
  rules: Rule[];
  onAddRule: (rule: Omit<Rule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
}

const SCOPES = [
  { id: 'ALL', label: 'Todos os Escopos' },
  { id: 'GLOBAL', label: 'Global (Padrão)' },
  { id: 'OFFICE', label: 'Escritório (JLVIANA)' },
  { id: 'CLIENT', label: 'Cliente Específico' }
];

const CATEGORIES = Object.values(MovementType);

const RulesManager: React.FC<RulesManagerProps> = ({ rules, onAddRule, onDeleteRule }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newRule, setNewRule] = useState<Omit<Rule, 'id'>>({
    pattern: '',
    category: MovementType.EXPENSE,
    account: '',
    scope: 'GLOBAL'
  });

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = r.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.account.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesScope = scopeFilter === 'ALL' || r.scope === scopeFilter;
      return matchesSearch && matchesScope;
    });
  }, [rules, searchTerm, scopeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.pattern || !newRule.account) {
      alert("Por favor, preencha o padrão e a conta contábil.");
      return;
    }
    onAddRule(newRule);
    setIsModalOpen(false);
    setNewRule({
      pattern: '',
      category: MovementType.EXPENSE,
      account: '',
      scope: 'GLOBAL'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto relative">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Regras de IA</h2>
          </div>
          <p className="text-slate-500 font-medium">Configure padrões para automatizar a classificação de lançamentos recorrentes.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Regra de Padrão
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por termo ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-200 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 relative">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 rounded-2xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer appearance-none pr-6"
            >
              {SCOPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => (
            <div key={rule.id} className="group bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 -mr-8 -mt-8 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-500" fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Padrão de Texto</p>
                    <p className="text-lg font-black text-slate-900 uppercase">"{rule.pattern}"</p>
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 rounded-2xl">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoria</p>
                    <p className="text-xs font-bold text-slate-700">{rule.category}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <div className="flex-1 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Âmbito</p>
                    <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-black rounded-md">
                      {rule.scope}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conta de Destino</p>
                    <p className="text-[11px] font-black text-indigo-600 truncate">{rule.account}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-slate-200" />
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Nenhuma regra encontrada</h4>
            <p className="text-slate-400 font-medium max-w-xs mt-2">Crie padrões para acelerar o trabalho da JLVIANA Consultoria.</p>
          </div>
        )}
      </div>

      {/* New Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Zap className="w-5 h-5 text-white" fill="white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Nova Regra Inteligente</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Padrão de Texto (Ex: TAR BANC)</label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      autoFocus
                      type="text" 
                      required
                      placeholder="Qual termo a IA deve procurar?"
                      value={newRule.pattern}
                      onChange={(e) => setNewRule({...newRule, pattern: e.target.value.toUpperCase()})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Categoria de Movimento</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner appearance-none cursor-pointer"
                      value={newRule.category}
                      onChange={(e) => setNewRule({...newRule, category: e.target.value as MovementType})}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Âmbito da Regra</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner appearance-none cursor-pointer"
                      value={newRule.scope}
                      onChange={(e) => setNewRule({...newRule, scope: e.target.value as any})}
                    >
                      {SCOPES.filter(s => s.id !== 'ALL').map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Conta Contábil de Destino</label>
                  <div className="relative">
                    <Database className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: 4.1.02.01.001 - Tarifas Bancárias"
                      value={newRule.account}
                      onChange={(e) => setNewRule({...newRule, account: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Zap className="w-7 h-7 text-indigo-400" fill="currentColor" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Automação Ativa</h4>
            <p className="text-slate-400 text-sm">Suas regras estão processando {rules.length} padrões conhecidos.</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Precisão Estimada</p>
            <p className="text-2xl font-black">98.4%</p>
          </div>
          <div className="w-px h-10 bg-slate-800"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Horas Poupadas</p>
            <p className="text-2xl font-black">+142h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesManager;
