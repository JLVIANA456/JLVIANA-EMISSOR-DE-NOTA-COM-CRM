
import React, { useState, useMemo } from 'react';
import { 
  History, 
  FileCheck, 
  Calendar, 
  Landmark, 
  Layers, 
  ArrowRight,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { BatchHistory } from '../types';

interface HistoryListProps {
  history: BatchHistory[];
  onNewBatch: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onNewBatch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    const term = searchTerm.toLowerCase();
    return history.filter(item => 
      item.fileName.toLowerCase().includes(term) || 
      item.bank.toLowerCase().includes(term)
    );
  }, [history, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-100 p-2 rounded-xl">
              <History className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Lotes</h2>
          </div>
          <p className="text-slate-500 font-medium">Visualize todos os extratos já processados pela JLVIANA Consultoria.</p>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lotes Concluídos</p>
            <p className="text-2xl font-black text-slate-900">{history.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Layers className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total de Itens</p>
            <p className="text-2xl font-black text-slate-900">
              {history.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exportações Realizadas</p>
            <p className="text-2xl font-black text-slate-900">{history.length}</p>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por arquivo ou banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-100 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Data Processamento</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Arquivo Origem</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Instituição</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Volume</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Valor Total</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        <span className="text-sm font-bold text-slate-700">{item.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                          <FileCheck className="w-4 h-4 text-indigo-500" />
                        </div>
                        <span className="text-sm font-black text-slate-900">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Landmark className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-600">{item.bank}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg">
                        {item.count} lançamentos
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-black text-slate-900">
                        {item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-emerald-600">
                        <span className="text-[10px] font-black uppercase tracking-widest">Finalizado</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <History className="w-10 h-10 text-slate-200" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">Nenhum lote histórico</h4>
                      <p className="text-slate-400 font-medium max-w-xs mt-2">
                        {searchTerm ? 'Nenhum resultado para sua pesquisa.' : 'Comece importando um extrato na tela principal para ver o histórico aqui.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <FileCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Pronto para mais?</h4>
            <p className="text-slate-400 text-sm">O CCI já otimizou o processamento de {history.length} lotes.</p>
          </div>
        </div>
        <button 
          onClick={onNewBatch}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all active:scale-95 relative z-10"
        >
          Processar Novo Extrato
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default HistoryList;
