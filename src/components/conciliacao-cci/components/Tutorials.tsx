
import React from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Zap, 
  Lightbulb, 
  FileSearch, 
  Database, 
  Upload,
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

const Tutorials: React.FC = () => {
  const steps = [
    { 
      title: 'Importação', 
      desc: 'Selecione o Banco e o Formato (OFX/CSV) e arraste o arquivo.',
      icon: Upload,
      color: 'bg-blue-500'
    },
    { 
      title: 'Análise IA', 
      desc: 'O CCI processa cada linha buscando padrões e sugere a conta contábil.',
      icon: Zap,
      color: 'bg-indigo-500'
    },
    { 
      title: 'Revisão', 
      desc: 'Valide as sugestões da IA e ajuste o favorecido se necessário.',
      icon: FileSearch,
      color: 'bg-amber-500'
    },
    { 
      title: 'Exportação', 
      desc: 'Gere o arquivo .txt formatado para importação direta no Domínio.',
      icon: Database,
      color: 'bg-emerald-500'
    }
  ];

  const tips = [
    {
      title: 'IOF e Juros',
      content: 'Lançamentos de IOF devem ser classificados na conta 4.1.02.01.002. Já os juros de conta corrente vão para 4.1.02.02.001.',
      tag: 'Classificação'
    },
    {
      title: 'Tarifas Bancárias',
      content: 'Mesmo com nomes diferentes (Tarifa Pix, Mensalidade, Custo de Boleto), todas devem centralizar na conta 4.1.02.01.001.',
      tag: 'Padrão'
    },
    {
      title: 'Identificação de Favorecidos',
      content: 'A IA limpa códigos bancários. Sempre revise se o nome da empresa ou pessoa está claro para um bom histórico no Razão.',
      tag: 'Boas Práticas'
    },
    {
      title: 'Domínio Sistemas',
      content: 'Nosso arquivo de exportação usa o layout padrão "Domínio". Certifique-se de que as contas no ERP batem com as do CCI.',
      tag: 'Software'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Guia & Dicas Contábeis</h2>
          </div>
          <p className="text-slate-500 font-medium">Aprenda a dominar o CCI e as melhores práticas de conciliação.</p>
        </div>
      </div>

      {/* Como Usar o Sistema */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
          <HelpCircle className="w-64 h-64 text-slate-900" />
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
          <CheckCircle2 className="text-indigo-500 w-6 h-6" />
          Como usar o sistema CCI
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="flex flex-col gap-4">
                <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <step.icon className="text-white w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{step.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2">{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 -right-4 translate-x-1/2">
                  <ArrowRight className="text-slate-200 w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dicas de Contabilidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[48px] text-white">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3">
            <Lightbulb className="text-amber-400 w-6 h-6" />
            Dicas de Ouro da Contabilidade
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {tips.map((tip, i) => (
              <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full mb-3">
                  {tip.tag}
                </span>
                <h4 className="font-bold text-white mb-2">{tip.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[48px] text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 -mr-20 -mt-20 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
          
          <h3 className="text-xl font-black mb-6 relative z-10 flex items-center gap-3">
            <ShieldAlert className="text-indigo-200 w-6 h-6" />
            Atenção ao Conciliar
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div className="flex gap-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl shrink-0 flex items-center justify-center font-black text-white">1</div>
              <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                <strong className="text-white">Confira o sinal:</strong> A IA identifica saídas (DÉBITO) como números negativos e entradas (CRÉDITO) como positivos.
              </p>
            </div>
            <div className="flex gap-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl shrink-0 flex items-center justify-center font-black text-white">2</div>
              <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                <strong className="text-white">Contas Curinga:</strong> Use a conta 2.1.03.01.001 para valores que não podem ser identificados de imediato.
              </p>
            </div>
            <div className="flex gap-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl shrink-0 flex items-center justify-center font-black text-white">3</div>
              <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                <strong className="text-white">Histórico Limpo:</strong> Evite caracteres especiais (| ou ;) no campo de favorecido, pois podem quebrar a importação do ERP.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 bg-white/10 rounded-[32px] border border-white/20 relative z-10">
            <p className="text-xs font-bold text-indigo-100 italic leading-relaxed">
              "A boa contabilidade começa com uma conciliação bancária impecável. O CCI é seu braço direito nessa jornada."
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-white opacity-60">— Equipe CCI Intelligence</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
