
import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  UploadCloud, 
  FileJson, 
  Cpu, 
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Database,
  Search,
  Trophy,
  Sparkles,
  MousePointer2,
  Info,
  ChevronRight,
  XCircle
} from 'lucide-react';
import { Transaction, Rule } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  onNavigateToReconciliation: () => void;
  onNavigateToTutorials: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, onNavigateToReconciliation, onNavigateToTutorials }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [simulationText, setSimulationText] = useState('');
  const [dashboardSearch, setDashboardSearch] = useState('');
  
  // Simulação de regras para o "Intelligence Score"
  const intelligenceScore = useMemo(() => {
    const base = 40; 
    return Math.min(98, base + 50); 
  }, []);

  const steps = useMemo(() => [
    { 
      id: 0,
      title: 'Importação', 
      icon: UploadCloud, 
      color: 'bg-blue-500', 
      detail: 'O CCI limpa automaticamente caracteres especiais e prefixos bancários inúteis antes mesmo de você ver a tela.',
      proTip: 'Dica: Use sempre o formato OFX para garantir que os saldos diários sejam importados corretamente.'
    },
    { 
      id: 1,
      title: 'Análise IA', 
      icon: Cpu, 
      color: 'bg-indigo-500', 
      detail: 'Nossa rede neural processa 42 camadas de padrões contábeis para encontrar o melhor favorecido.',
      proTip: 'A IA aprende com o contexto: se você importar 10 notas de "Uber", ela entende o padrão de transporte.'
    },
    { 
      id: 2,
      title: 'Regras', 
      icon: ShieldCheck, 
      color: 'bg-emerald-500', 
      detail: 'Regras customizadas sobrepõem a IA global, permitindo ajustes específicos para nichos de clientes.',
      proTip: 'Crie regras "Curinga" usando o símbolo * para classificar tudo que a IA não conhecer.'
    },
    { 
      id: 3,
      title: 'Exportação', 
      icon: FileJson, 
      color: 'bg-amber-500', 
      detail: 'O layout Domínio é atualizado mensalmente para garantir compatibilidade com as novas versões do ERP.',
      proTip: 'Dica: Você pode exportar lotes parciais ou apenas itens que já foram revisados.'
    }
  ], []);

  const tips = useMemo(() => [
    { title: 'Limpeza Automática', desc: 'A IA remove códigos como "DOC 123", "TAR" e "PGTO" para que seu histórico fique limpo.', color: 'bg-indigo-600' },
    { title: 'Mapeamento Dinâmico', desc: 'Se você alterar uma conta contábil, o sistema sugere criar uma regra para automatizar.', color: 'bg-emerald-600' },
    { title: 'Importação do Domínio', desc: 'Ao exportar o .txt, use o menu Utilitários > Importação > Lançamentos no ERP Domínio.', color: 'bg-amber-600' },
    { title: 'Identificação de Valores', desc: 'Valores desconhecidos caem na conta 2.1.03.01.001 para revisão pré-fechamento.', color: 'bg-rose-600' }
  ], []);

  const filteredSteps = useMemo(() => {
    if (!dashboardSearch) return steps;
    return steps.filter(s => 
      s.title.toLowerCase().includes(dashboardSearch.toLowerCase()) || 
      s.detail.toLowerCase().includes(dashboardSearch.toLowerCase())
    );
  }, [dashboardSearch, steps]);

  const filteredTips = useMemo(() => {
    if (!dashboardSearch) return tips;
    return tips.filter(t => 
      t.title.toLowerCase().includes(dashboardSearch.toLowerCase()) || 
      t.desc.toLowerCase().includes(dashboardSearch.toLowerCase())
    );
  }, [dashboardSearch, tips]);

  const handleSimulate = () => {
    if (!simulationText) return "Digite algo para testar...";
    const text = simulationText.toUpperCase();
    if (text.includes('TAR') || text.includes('TAX')) return "Conta: 4.1.02.01.001 (Tarifas)";
    if (text.includes('PIX') && (text.includes('REC') || text.includes('CRED'))) return "Conta: 3.1.01.01.002 (Receita)";
    if (text.includes('DARF') || text.includes('SIMPLES')) return "Conta: 2.1.02.01.001 (Impostos)";
    return "Conta: 2.1.03.01.001 (Valores a Identificar)";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-12">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[48px] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Intelligence Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Seu escritório está <span className="text-indigo-400">{intelligenceScore}%</span> mais inteligente hoje.
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-2xl">
              O CCI já vem pré-configurado com as melhores práticas contábeis da JLVIANA Consultoria para automatizar 98% dos seus lançamentos diários.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={onNavigateToReconciliation} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-2 group">
                Começar Conciliação
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="shrink-0 relative">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative group">
              <div className="absolute inset-0 rounded-full border-[12px] border-indigo-500 border-t-transparent animate-[spin_3s_linear_infinite] opacity-40"></div>
              <div className="text-center">
                <Trophy className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
                <p className="text-4xl font-black">{intelligenceScore}%</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-Precisão</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workflow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Explorador de Fluxo */}
        <div className="lg:col-span-2 bg-white rounded-[48px] border border-slate-200 p-10 shadow-sm relative">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <MousePointer2 className="text-indigo-500 w-7 h-7" />
            Trilha de Conhecimento {dashboardSearch && <span className="text-sm font-bold text-indigo-400">(Filtrado)</span>}
          </h3>

          <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide">
            {(dashboardSearch ? filteredSteps : steps).map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex-1 min-w-[140px] p-5 rounded-3xl border-2 transition-all ${
                  activeStep === step.id 
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100' 
                  : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <step.icon className="text-white w-6 h-6" />
                </div>
                <p className={`text-xs font-black uppercase tracking-widest ${activeStep === step.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {step.title}
                </p>
              </button>
            ))}
            {filteredSteps.length === 0 && (
              <div className="py-4 text-slate-400 font-bold italic text-sm">Nenhum passo encontrado...</div>
            )}
          </div>

          {filteredSteps.length > 0 && (
            <div className="bg-slate-50 rounded-4xl p-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-4">
                  <h4 className="text-xl font-black text-slate-900">Como funciona a {steps.find(s => s.id === activeStep)?.title}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {steps.find(s => s.id === activeStep)?.detail}
                  </p>
                  <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <p className="text-xs font-bold text-slate-700 italic">{steps.find(s => s.id === activeStep)?.proTip}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Simulador Interativo */}
        <div className="bg-indigo-600 rounded-[48px] p-10 text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex-1">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-200" fill="currentColor" />
              IA Playground
            </h3>
            <p className="text-sm text-indigo-100 font-medium mb-8">
              Teste o cérebro do CCI. Digite uma descrição de extrato para ver como ele classificaria.
            </p>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Ex: TAR MENSALIDADE PIX..."
                value={simulationText}
                onChange={(e) => setSimulationText(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-white/30 focus:bg-white/20 outline-none transition-all"
              />
              
              <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/10 min-h-[100px] flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Resultado da Predição</p>
                <p className="text-sm font-black text-white italic">
                  {handleSimulate()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Busca Dinâmica Ativada */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.01]">
          <Database className="w-64 h-64 text-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-3xl font-black text-slate-900">Como podemos ajudar hoje?</h3>
          <div className="relative max-w-2xl mx-auto">
            <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquise por: 'Importar', 'Layout', 'Domínio', 'Tarifa'..."
              value={dashboardSearch}
              onChange={(e) => setDashboardSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-lg font-bold outline-none focus:bg-white focus:border-indigo-300 shadow-inner transition-all"
            />
            {dashboardSearch && (
              <button 
                onClick={() => setDashboardSearch('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {filteredTips.map((tip, idx) => (
              <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-xl ${tip.color} flex items-center justify-center mb-4`}>
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-black text-slate-900 text-sm mb-2">{tip.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{tip.desc}</p>
              </div>
            ))}
            {filteredTips.length === 0 && (
              <div className="col-span-full py-10 text-center">
                <p className="text-slate-400 font-bold italic">Nenhuma dica encontrada para "{dashboardSearch}". Tente outro termo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
