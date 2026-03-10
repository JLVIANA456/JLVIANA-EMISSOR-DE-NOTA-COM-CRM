
import React, { useState } from 'react';
// Added ChevronDown and PlusCircle to the main import list and removed the trailing import at the end of file
import { X, Calendar, Tag, User, DollarSign, ArrowRightLeft, Database, Check, ChevronDown, PlusCircle } from 'lucide-react';
import { Transaction, TransactionStatus, MovementType } from '../types';

interface ManualEntryModalProps {
  onClose: () => void;
  onSave: (transaction: Partial<Transaction>) => void;
}

const CATEGORIES = Object.values(MovementType);

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    entity: '',
    amount: '',
    type: 'DEBIT' as 'CREDIT' | 'DEBIT',
    movementType: MovementType.EXPENSE,
    accountingAccount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    onSave({
      date: formData.date,
      description: formData.description,
      originalDescription: `MANUAL: ${formData.description}`,
      amount: formData.type === 'DEBIT' ? -Math.abs(Number(formData.amount)) : Math.abs(Number(formData.amount)),
      type: formData.type,
      movementType: formData.movementType,
      entity: formData.entity,
      accountingAccount: formData.accountingAccount,
      reasoning: 'Lançamento inserido manualmente pelo usuário.',
      status: TransactionStatus.PENDING
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Novo Lançamento Manual</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data do Movimento</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Lançamento</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'DEBIT'})}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${formData.type === 'DEBIT' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  DÉBITO (-)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'CREDIT'})}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${formData.type === 'CREDIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  CRÉDITO (+)
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Histórico / Descrição</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Aluguel Ref. 05/2025"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Favorecido / Entidade</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Nome do cliente ou fornecedor"
                  value={formData.entity}
                  onChange={e => setFormData({...formData, entity: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Valor (R$)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Categoria Contábil</label>
              <div className="relative">
                <ArrowRightLeft className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner appearance-none cursor-pointer"
                  value={formData.movementType}
                  onChange={e => setFormData({...formData, movementType: e.target.value as MovementType})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Conta ERP (Opcional)</label>
              <div className="relative">
                <Database className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="X.X.XX.XX.XXX"
                  value={formData.accountingAccount}
                  onChange={e => setFormData({...formData, accountingAccount: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-300 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;
