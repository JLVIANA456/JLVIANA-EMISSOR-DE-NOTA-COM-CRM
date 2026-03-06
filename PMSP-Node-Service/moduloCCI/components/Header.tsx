
import React, { useRef } from 'react';
import { Upload, Search, Loader2, FileCheck, Landmark, FileType, ChevronDown, PlusCircle } from 'lucide-react';

interface HeaderProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onManualAdd: () => void;
  isProcessing: boolean;
  fileName: string | null;
  selectedBank: string;
  setSelectedBank: (bank: string) => void;
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const BANKS = [
  "Itaú", "Bradesco", "Santander", "Banco do Brasil", "Nubank", "Inter", "C6 Bank", "BTG Pactual", "Outros"
];

const FORMATS = [
  { id: 'ofx', label: 'Bancário OFX' },
  { id: 'csv', label: 'Planilha CSV / Excel' }
];

const Header: React.FC<HeaderProps> = ({ 
  onUpload, 
  onManualAdd,
  isProcessing, 
  fileName,
  selectedBank,
  setSelectedBank,
  selectedFormat,
  setSelectedFormat,
  searchTerm,
  onSearchChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedBank && selectedFormat) {
      onUpload(e);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isReadyToUpload = selectedBank !== '' && selectedFormat !== '';

  return (
    <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-50">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative group hidden lg:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar lançamentos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-72 pl-11 pr-4 py-2.5 bg-slate-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200/60 group">
            <Landmark className="w-4 h-4 text-indigo-500" />
            <div className="relative">
              <select 
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                disabled={isProcessing}
                className="appearance-none bg-transparent pr-6 text-xs font-bold text-slate-700 outline-none border-none p-0 focus:ring-0 cursor-pointer disabled:opacity-50"
              >
                <option value="">Banco</option>
                {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200/60 group">
            <FileType className="w-4 h-4 text-indigo-500" />
            <div className="relative">
              <select 
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                disabled={isProcessing}
                className="appearance-none bg-transparent pr-6 text-xs font-bold text-slate-700 outline-none border-none p-0 focus:ring-0 cursor-pointer disabled:opacity-50"
              >
                <option value="">Formato</option>
                {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {fileName && (
          <div className="flex items-center gap-3 text-xs text-indigo-700 font-extrabold px-5 py-2.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-300">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <FileCheck className="w-4 h-4" />
            {fileName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onManualAdd}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Lançamento Manual</span>
        </button>

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={selectedFormat === 'ofx' ? '.ofx' : '.csv,.xls,.xlsx'}
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || !isReadyToUpload}
          className={`relative group flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-95 ${
            isProcessing || !isReadyToUpload
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
              : 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-200'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Importar Extrato</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
