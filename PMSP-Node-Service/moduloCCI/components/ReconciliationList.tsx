
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, 
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  Sparkles,
  ChevronRight,
  Trash2,
  FileText,
  AlertTriangle,
  Search,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { Transaction, TransactionStatus, MovementType } from '../types';

interface ReconciliationListProps {
  transactions: Transaction[];
  isProcessing: boolean;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onExportCsv: () => void;
  onExportTxt: () => void;
  onComplete: () => void;
  globalSearchTerm: string;
}

const PAGE_SIZE = 50;

const ACCOUNT_GROUPS: Record<string, string[]> = {
  '1. ATIVO': [
    '1.1.01.01.001 - Caixa Geral',
    '1.1.01.02.001 - Banco Itaú S/A',
    '1.1.01.02.002 - Banco Bradesco S/A',
    '1.1.02.01.001 - Aplicações Financeiras',
  ],
  '2. PASSIVO': [
    '2.1.01.01.001 - Fornecedores Nacionais',
    '2.1.01.02.001 - Cartão de Crédito a Pagar',
    '2.1.02.01.001 - Simples Nacional',
    '2.1.02.01.002 - Tributos Federais a Recolher',
    '2.1.02.01.003 - INSS a Recolher',
    '2.1.02.02.001 - ISS a Recolher',
    '2.1.03.01.001 - Valores a Identificar',
    '2.1.04.01.001 - Adiantamento de Clientes',
    '2.2.01.01.001 - Empréstimos Bancários',
  ],
  '3. RECEITAS': [
    '3.1.01.01.002 - Receita de Prestação de Serviços',
    '3.2.01.01.001 - Rendimentos de Aplicações Financeiras',
    '3.9.02.01.001 - Ajustes Diversos',
  ],
  '4. DESPESAS': [
    '4.1.01.01.001 - Pró-labore',
    '4.1.01.01.002 - Salários',
    '4.1.01.02.001 - Benefícios a Empregados',
    '4.1.02.01.001 - Tarifas Bancárias',
    '4.1.02.02.001 - Juros e Encargos Financeiros',
    '4.1.03.01.001 - Despesas Gerais',
    '4.1.03.01.002 - Material de Escritório',
    '4.1.03.02.001 - Honorários Profissionais',
    '4.1.03.03.001 - Aluguéis',
  ],
  '5. TRANSFERÊNCIAS': [
    '1.1.01.01.001 - Bancos Conta Movimento',
  ]
};

const ReconciliationList: React.FC<ReconciliationListProps> = ({ 
  transactions, 
  isProcessing,
  onUpdate,
  onDelete,
  onExportCsv,
  onExportTxt,
  onComplete,
  globalSearchTerm
}) => {
  const [filter, setFilter] = useState<TransactionStatus | 'ALL'>(TransactionStatus.PENDING);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, transactions.length, globalSearchTerm]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesStatus = filter === 'ALL' ? true : t.status === filter;
      
      const term = globalSearchTerm.toLowerCase();
      const matchesSearch = !globalSearchTerm || 
        t.description.toLowerCase().includes(term) ||
        t.originalDescription.toLowerCase().includes(term) ||
        (t.entity || '').toLowerCase().includes(term) ||
        (t.accountingAccount || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [transactions, filter, globalSearchTerm]);

  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const pendingCount = useMemo(() => transactions.filter(t => t.status === TransactionStatus.PENDING).length, [transactions]);
  const reviewedCount = useMemo(() => transactions.filter(t => t.status === TransactionStatus.REVIEWED).length, [transactions]);

  const handleExportWithValidation = () => {
    if (pendingCount > 0) {
      alert(`Atenção: Existem ${pendingCount} lançamentos pendentes. Para exportar para o Domínio, você deve revisar e validar todos os itens.`);
      return;
    }
    onExportTxt();
  };

  const filteredAccountGroups = useMemo(() => {
    if (!searchTerm) return ACCOUNT_GROUPS;
    const term = searchTerm.toLowerCase();
    const result: Record<string, string[]> = {};
    Object.entries(ACCOUNT_GROUPS).forEach(([group, accounts]) => {
      const filtered = accounts.filter(acc => acc.toLowerCase().includes(term));
      if (filtered.length > 0) result[group] = filtered;
    });
    return result;
  }, [searchTerm]);

  if (transactions.length === 0 && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-[40px] border-2 border-dashed border-slate-200">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <BrainCircuit className="w-12 h-12 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">IA pronta para conciliar</h3>
        <p className="text-slate-400 font-medium max-w-xs text-center mt-2">Importe um extrato bancário para iniciar o processamento automatizado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32 max-w-[1700px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/95 p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-0 z-[60] gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button onClick={() => setFilter(TransactionStatus.PENDING)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === TransactionStatus.PENDING ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            Pendentes ({pendingCount})
          </button>
          <button onClick={() => setFilter(TransactionStatus.REVIEWED)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === TransactionStatus.REVIEWED ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            Revisados ({reviewedCount})
          </button>
          <button onClick={() => setFilter('ALL')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            Todos
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportWithValidation} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${pendingCount > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-900 hover:bg-slate-200 hover:shadow-lg'}`}>
            <FileText className="w-4 h-4" />
            Exportar Domínio
          </button>
          <button onClick={onComplete} disabled={pendingCount > 0} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-xl ${pendingCount > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
            <CheckCircle2 className="w-5 h-5" />
            Finalizar Processamento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 relative flex flex-col min-h-[500px]">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1400px] table-fixed">
            <thead className="sticky top-0 z-40 bg-white">
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] w-44 text-center">Data Ref.</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] w-72">Lançamento / Histórico</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] w-72">Identificação / Favorecido</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] w-40 text-right">Valor Líquido</th>
                <th className="px-6 py-5 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50/30 w-52">IA Sugestão</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] w-72">Classificação ERP</th>
                <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] text-right w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className={`group transition-all duration-300 ${t.status === TransactionStatus.REVIEWED ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'} ${editingId === t.id ? 'z-[90] relative bg-white shadow-2xl' : 'z-0 relative'}`}>
                  <td className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <input type="date" value={t.date} onChange={(e) => onUpdate(t.id, { date: e.target.value })} className="bg-transparent text-xs font-black text-slate-800 outline-none p-1 transition-all focus:text-indigo-600" />
                    </div>
                  </td>
                  <td className="px-6 py-6 overflow-hidden">
                    <p className="text-[13px] font-black text-slate-900 truncate uppercase">{t.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold truncate tracking-wide">{t.originalDescription}</p>
                  </td>
                  <td className="px-6 py-6 overflow-hidden">
                    <input type="text" value={t.entity || ''} onChange={(e) => onUpdate(t.id, { entity: e.target.value })} placeholder="Identificar..." className="w-full bg-transparent text-xs text-slate-700 outline-none font-bold py-1 border-b border-transparent group-hover:border-slate-200 focus:border-indigo-500" />
                  </td>
                  <td className="px-6 py-6 text-right">
                    <p className={`text-sm font-black tabular-nums ${t.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {t.type === 'DEBIT' ? '-' : '+'} {Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </td>
                  <td className="px-6 py-6 bg-indigo-50/10">
                    <div className="text-[11px] font-black text-indigo-700 truncate uppercase">{t.suggestedAccount || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-6 relative">
                    <div className={`w-full text-left text-[11px] font-black px-4 py-3 rounded-2xl border flex items-center gap-2 ${t.status === TransactionStatus.REVIEWED ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-indigo-200 text-indigo-900'}`}>
                      <Database className="w-4 h-4 shrink-0 text-indigo-400" />
                      <input 
                        type="text" 
                        value={t.accountingAccount || ''} 
                        onChange={(e) => onUpdate(t.id, { accountingAccount: e.target.value })} 
                        onFocus={() => { setEditingId(t.id); setSearchTerm(''); }}
                        className="w-full bg-transparent outline-none truncate font-black"
                        placeholder="Conta..."
                      />
                      <ChevronDown className="w-4 h-4 opacity-40" />
                    </div>
                    {editingId === t.id && (
                      <div className="absolute top-full left-0 mt-3 w-96 bg-white border border-slate-200 rounded-[32px] shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 shrink-0">
                          <input autoFocus type="text" placeholder="Filtre por conta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[13px] outline-none font-bold" />
                        </div>
                        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1 bg-white custom-account-scroll">
                          {(Object.entries(filteredAccountGroups) as [string, string[]][]).map(([group, accounts]) => (
                            <div key={group}>
                              <p className="px-3 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">{group}</p>
                              {accounts.map((acc) => (
                                <button key={acc} onClick={() => { onUpdate(t.id, { accountingAccount: acc }); setEditingId(null); }} className={`w-full text-left px-4 py-3 text-[13px] rounded-2xl font-bold transition-all ${t.accountingAccount === acc ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
                                  {acc}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === TransactionStatus.PENDING ? (
                        <button onClick={() => onUpdate(t.id, { status: TransactionStatus.REVIEWED })} disabled={!t.accountingAccount} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${!t.accountingAccount ? 'bg-slate-50 text-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                          <Check className="w-6 h-6 stroke-[3px]" />
                        </button>
                      ) : (
                        <button onClick={() => onUpdate(t.id, { status: TransactionStatus.PENDING })} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Reabrir</button>
                      )}
                      <button onClick={() => onDelete(t.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingId && <div className="fixed inset-0 z-[85] bg-slate-900/5 backdrop-blur-[1px]" onClick={() => setEditingId(null)} />}
    </div>
  );
};

export default ReconciliationList;
