
import React, { useState, useCallback } from 'react';
import { Transaction, TransactionStatus, MovementType, Rule, BatchHistory } from './types';
import { analyzeTransactions } from './geminiService';
import Dashboard from './components/Dashboard';
import ReconciliationList from './components/ReconciliationList';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RulesManager from './components/RulesManager';
import HistoryList from './components/HistoryList';
import ManualEntryModal from './components/ManualEntryModal';
import Tutorials from './components/Tutorials';

const INITIAL_RULES: Rule[] = [
  // 🔹 RECEITAS OPERACIONAIS (3.1.01.01.002)
  { id: 'r1', pattern: 'PIX RECEB', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r2', pattern: 'PIX CRED', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r3', pattern: 'TED RECEB', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r4', pattern: 'DOC RECEB', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r5', pattern: 'BOLETO', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r6', pattern: 'LIQUIDACAO', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r7', pattern: 'COBRANCA', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r8', pattern: 'HONORARIO', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },
  { id: 'r9', pattern: 'HONORARIOS', category: MovementType.REVENUE, account: '3.1.01.01.002 - Receita de Prestação de Serviços', scope: 'GLOBAL' },

  // 🔹 ADIANTAMENTO DE CLIENTES (2.1.04.01.001)
  { id: 'a1', pattern: 'ADIANTAMENTO', category: MovementType.REVENUE, account: '2.1.04.01.001 - Adiantamento de Clientes', scope: 'GLOBAL' },
  { id: 'a2', pattern: 'ANTECIPACAO', category: MovementType.REVENUE, account: '2.1.04.01.001 - Adiantamento de Clientes', scope: 'GLOBAL' },

  // 🔹 TARIFAS E TAXAS BANCÁRIAS (4.1.02.01.001)
  { id: 't1', pattern: 'TAR BANC', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't2', pattern: 'MANUT CT', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't3', pattern: 'PACOTE SERV', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't4', pattern: 'TAR PIX', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't5', pattern: 'TAXA PIX', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't6', pattern: 'TAR TED', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't7', pattern: 'TAR DOC', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't8', pattern: 'TAR BOLETO', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't9', pattern: 'TAR COBRANCA', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't10', pattern: 'REGISTRO BOLETO', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't11', pattern: 'BAIXA BOLETO', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't12', pattern: 'TAXA', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't13', pattern: 'TARIFA', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },
  { id: 't14', pattern: 'CUSTO', category: MovementType.FEE, account: '4.1.02.01.001 - Tarifas Bancárias', scope: 'GLOBAL' },

  // 🔹 DESPESAS FINANCEIRAS / ENCARGOS (4.1.02.02.001)
  { id: 'f1', pattern: 'JUROS CONTA', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },
  { id: 'f2', pattern: 'JUROS', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },
  { id: 'f3', pattern: 'ENCARGOS', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },
  { id: 'f4', pattern: 'MULTA', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },
  { id: 'f5', pattern: 'JUROS EMPREST', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },
  { id: 'f6', pattern: 'JUROS APLIC', category: MovementType.FEE, account: '4.1.02.02.001 - Juros e Encargos Financeiros', scope: 'GLOBAL' },

  // 🔹 IMPOSTOS E TRIBUTOS
  { id: 'tx1', pattern: 'SIMPLES NAC', category: MovementType.TAX, account: '2.1.02.01.001 - Simples Nacional', scope: 'GLOBAL' },
  { id: 'tx2', pattern: 'DARF', category: MovementType.TAX, account: '2.1.02.01.002 - Tributos Federais a Recolher', scope: 'GLOBAL' },
  { id: 'tx3', pattern: 'IRRF', category: MovementType.TAX, account: '2.1.02.01.002 - Tributos Federais a Recolher', scope: 'GLOBAL' },
  { id: 'tx4', pattern: 'PIS', category: MovementType.TAX, account: '2.1.02.01.002 - Tributos Federais a Recolher', scope: 'GLOBAL' },
  { id: 'tx5', pattern: 'COFINS', category: MovementType.TAX, account: '2.1.02.01.002 - Tributos Federais a Recolher', scope: 'GLOBAL' },
  { id: 'tx6', pattern: 'CSLL', category: MovementType.TAX, account: '2.1.02.01.002 - Tributos Federais a Recolher', scope: 'GLOBAL' },
  { id: 'tx7', pattern: 'GPS', category: MovementType.TAX, account: '2.1.02.01.003 - INSS a Recolher', scope: 'GLOBAL' },
  { id: 'tx8', pattern: 'INSS', category: MovementType.TAX, account: '2.1.02.01.003 - INSS a Recolher', scope: 'GLOBAL' },
  { id: 'tx9', pattern: 'FGTS', category: MovementType.TAX, account: '2.1.02.01.003 - INSS a Recolher', scope: 'GLOBAL' },
  { id: 'tx10', pattern: 'ISS', category: MovementType.TAX, account: '2.1.02.02.001 - ISS a Recolher', scope: 'GLOBAL' },

  // 🔹 DESPESAS OPERACIONAIS - GERAIS (4.1.03.01.001)
  { id: 'dg1', pattern: 'ALIMENTACAO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg2', pattern: 'RESTAURANTE', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg3', pattern: 'LANCHONETE', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg4', pattern: 'UBER', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg5', pattern: '99APP', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg6', pattern: 'POSTO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg7', pattern: 'COMBUSTIVEL', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg8', pattern: 'SOFTWARE', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg9', pattern: 'ASSINATURA', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg10', pattern: 'SAAS', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg11', pattern: 'LICENCA', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg12', pattern: 'COMPRA CARTAO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'dg13', pattern: 'CARTAO DE CREDITO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },

  // 🔹 MATERIAL DE ESCRITÓRIO (4.1.03.01.002)
  { id: 'me1', pattern: 'PAPELARIA', category: MovementType.EXPENSE, account: '4.1.03.01.002 - Material de Escritório', scope: 'GLOBAL' },
  { id: 'me2', pattern: 'SUPRIMENTOS', category: MovementType.EXPENSE, account: '4.1.03.01.002 - Material de Escritório', scope: 'GLOBAL' },
  { id: 'me3', pattern: 'MATERIAL ESCRITORIO', category: MovementType.EXPENSE, account: '4.1.03.01.002 - Material de Escritório', scope: 'GLOBAL' },

  // 🔹 HONORÁRIOS PROFISSIONAIS (4.1.03.02.001)
  { id: 'hp1', pattern: 'CONTABIL', category: MovementType.EXPENSE, account: '4.1.03.02.001 - Honorários Profissionais', scope: 'GLOBAL' },
  { id: 'hp2', pattern: 'CONSULTORIA', category: MovementType.EXPENSE, account: '4.1.03.02.001 - Honorários Profissionais', scope: 'GLOBAL' },
  { id: 'hp3', pattern: 'ASSESSORIA', category: MovementType.EXPENSE, account: '4.1.03.02.001 - Honorários Profissionais', scope: 'GLOBAL' },

  // 🔹 ALUGUÉIS E UTILIDADES (4.1.03.03.001)
  { id: 'alu1', pattern: 'ALUGUEL', category: MovementType.EXPENSE, account: '4.1.03.03.001 - Aluguéis', scope: 'GLOBAL' },
  { id: 'alu2', pattern: 'CONDOMINIO', category: MovementType.EXPENSE, account: '4.1.03.03.001 - Aluguéis', scope: 'GLOBAL' },
  { id: 'alu3', pattern: 'ENERGIA', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'alu4', pattern: 'AGUA', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'alu5', pattern: 'TELEFONE', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'alu6', pattern: 'INTERNET', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'alu7', pattern: 'VIVO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },
  { id: 'alu8', pattern: 'CLARO', category: MovementType.EXPENSE, account: '4.1.03.01.001 - Despesas Gerais', scope: 'GLOBAL' },

  // 🔹 PESSOAL
  { id: 'p1', pattern: 'PRO LABORE', category: MovementType.EXPENSE, account: '4.1.01.01.001 - Pró-labore', scope: 'GLOBAL' },
  { id: 'p2', pattern: 'SALARIO', category: MovementType.EXPENSE, account: '4.1.01.01.002 - Salários', scope: 'GLOBAL' },
  { id: 'p3', pattern: 'TICKET', category: MovementType.EXPENSE, account: '4.1.01.02.001 - Benefícios a Empregados', scope: 'GLOBAL' },
  { id: 'p4', pattern: 'VR', category: MovementType.EXPENSE, account: '4.1.01.02.001 - Benefícios a Empregados', scope: 'GLOBAL' },
  { id: 'p5', pattern: 'VA', category: MovementType.EXPENSE, account: '4.1.01.02.001 - Benefícios a Empregados', scope: 'GLOBAL' },
  { id: 'p6', pattern: 'VALE REFEICAO', category: MovementType.EXPENSE, account: '4.1.01.02.001 - Benefícios a Empregados', scope: 'GLOBAL' },
  { id: 'p7', pattern: 'VALE TRANSPORTE', category: MovementType.EXPENSE, account: '4.1.01.02.001 - Benefícios a Empregados', scope: 'GLOBAL' },

  // 🔹 CARTÃO DE CRÉDITO
  { id: 'cc1', pattern: 'PAGAMENTO FATURA', category: MovementType.EXPENSE, account: '2.1.01.02.001 - Cartão de Crédito a Pagar', scope: 'GLOBAL' },
  { id: 'cc2', pattern: 'ESTORNO', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },
  { id: 'cc3', pattern: 'ESTORNO CARTAO', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },

  // 🔹 EMPRÉSTIMOS E FINANCIAMENTOS
  { id: 'emp1', pattern: 'CREDITO EMPRESTIMO', category: MovementType.REVENUE, account: '2.2.01.01.001 - Empréstimos Bancários', scope: 'GLOBAL' },
  { id: 'emp2', pattern: 'AMORTIZACAO', category: MovementType.EXPENSE, account: '2.2.01.01.001 - Empréstimos Bancários', scope: 'GLOBAL' },

  // 🔹 APLICAÇÕES FINANCEIRAS
  { id: 'inv1', pattern: 'APLICACAO', category: MovementType.INVESTMENT, account: '1.1.02.01.001 - Aplicações Financeiras', scope: 'GLOBAL' },
  { id: 'inv2', pattern: 'RESGATE', category: MovementType.INVESTMENT, account: '1.1.02.01.001 - Aplicações Financeiras', scope: 'GLOBAL' },
  { id: 'inv3', pattern: 'RENDIMENTO', category: MovementType.REVENUE, account: '3.2.01.01.001 - Rendimentos de Aplicações Financeiras', scope: 'GLOBAL' },
  { id: 'inv4', pattern: 'REND APLIC', category: MovementType.REVENUE, account: '3.2.01.01.001 - Rendimentos de Aplicações Financeiras', scope: 'GLOBAL' },

  // 🔹 TRANSFERÊNCIAS
  { id: 'tr1', pattern: 'TRANSF', category: MovementType.TRANSFER, account: '1.1.01.01.001 - Bancos Conta Movimento', scope: 'GLOBAL' },
  { id: 'tr2', pattern: 'TRANSFERENCIA', category: MovementType.TRANSFER, account: '1.1.01.01.001 - Bancos Conta Movimento', scope: 'GLOBAL' },
  { id: 'tr3', pattern: 'PIX TRANSF', category: MovementType.TRANSFER, account: '1.1.01.01.001 - Bancos Conta Movimento', scope: 'GLOBAL' },
  { id: 'tr4', pattern: 'TED TRANSF', category: MovementType.TRANSFER, account: '1.1.01.01.001 - Bancos Conta Movimento', scope: 'GLOBAL' },
  { id: 'tr5', pattern: 'TRANSF ENTRE CONTAS', category: MovementType.TRANSFER, account: '1.1.01.01.001 - Bancos Conta Movimento', scope: 'GLOBAL' },

  // 🔹 AJUSTES / DEVOLUÇÕES
  { id: 'aj1', pattern: 'DEVOLUCAO', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },
  { id: 'aj2', pattern: 'DEVOLUCAO PIX', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },
  { id: 'aj3', pattern: 'PIX DEVOLVIDO', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },
  { id: 'aj4', pattern: 'AJUSTE', category: MovementType.REVENUE, account: '3.9.02.01.001 - Ajustes Diversos', scope: 'GLOBAL' },

  // 🔹 VALORES A IDENTIFICAR (FALLBACK)
  { id: 'fb1', pattern: 'CARTAO CRED', category: MovementType.EXPENSE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb2', pattern: 'VALOR ADICIONADO', category: MovementType.REVENUE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb3', pattern: 'DEPOSITO', category: MovementType.REVENUE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb4', pattern: 'DEP DINHEIRO', category: MovementType.REVENUE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb5', pattern: 'DESCONHECIDO', category: MovementType.EXPENSE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb6', pattern: 'DIVERSOS', category: MovementType.EXPENSE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb7', pattern: 'NAO IDENTIFICADO', category: MovementType.EXPENSE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
  { id: 'fb8', pattern: '*', category: MovementType.EXPENSE, account: '2.1.03.01.001 - Valores a Identificar', scope: 'GLOBAL' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconciliation' | 'rules' | 'history' | 'tutorials'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [history, setHistory] = useState<BatchHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBank || !selectedFormat) return;

    setCurrentFileName(file.name);
    setIsProcessing(true);
    setActiveTab('reconciliation');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (!content) {
        setIsProcessing(false);
        return;
      }
      try {
        const enrichedTransactions = await analyzeTransactions(
          content as string, 
          file.name, 
          selectedBank,
          selectedFormat
        );
        setTransactions(enrichedTransactions);
      } catch (error) {
        console.error("Erro no processamento:", error);
        alert("Erro ao ler o arquivo. Certifique-se de que é um CSV ou OFX válido.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleManualAdd = (manualTx: Partial<Transaction>) => {
    const newTx: Transaction = {
      ...manualTx,
      id: Math.random().toString(36).substring(2, 11),
      suggestedAccount: manualTx.accountingAccount || 'MANUAL',
    } as Transaction;
    setTransactions(prev => [newTx, ...prev]);
    setActiveTab('reconciliation');
  };

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAddRule = (newRule: Omit<Rule, 'id'>) => {
    const rule: Rule = { ...newRule, id: Math.random().toString(36).substring(2, 9) };
    setRules(prev => [rule, ...prev]);
  };

  const handleDeleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const bankAccountMap: Record<string, string> = {
    'Itaú': '110102001', 'Bradesco': '110102002', 'Santander': '110102003', 'Banco do Brasil': '110102004',
    'Nubank': '110102005', 'Inter': '110102006', 'C6 Bank': '110102007', 'BTG Pactual': '110102008', 'Outros': '110101001'
  };

  const getHistoricoCode = (t: Transaction): string => {
    const desc = (t.description + t.originalDescription).toUpperCase();
    if (desc.includes('TARIFA') || t.movementType === MovementType.FEE) return '9';
    if (desc.includes('IOF')) return '10';
    return '1';
  };

  const handleExportTxt = useCallback(() => {
    const reviewed = transactions.filter(t => t.status === TransactionStatus.REVIEWED);
    if (reviewed.length === 0) return;
    const lines: string[] = [];
    const bankAcc = bankAccountMap[selectedBank] || '110101001';
    reviewed.forEach((t) => {
      const dateParts = t.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : t.date;
      const contraAcc = (t.accountingAccount || '').split(' - ')[0].replace(/\D/g, '');
      const debitAcc = t.type === 'DEBIT' ? contraAcc : bankAcc;
      const creditAcc = t.type === 'DEBIT' ? bankAcc : contraAcc;
      const formattedValue = Math.abs(t.amount).toFixed(2).replace('.', ',');
      const histCode = getHistoricoCode(t);
      const cleanComplement = `${t.description} ${t.entity || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase().trim().substring(0, 255);
      lines.push(`${formattedDate};${debitAcc};${creditAcc};${formattedValue};${histCode};${cleanComplement};;;;`);
    });
    const blob = new Blob([lines.join("\r\n")], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dominio_importacao_${new Date().getTime()}.txt`;
    link.click();
  }, [transactions, selectedBank]);

  const handleCompleteBatch = useCallback(() => {
    handleExportTxt();
    const newBatch: BatchHistory = {
      id: Math.random().toString(36).substring(2, 9),
      fileName: currentFileName || 'Lote Manual',
      bank: selectedBank || 'Manual',
      timestamp: new Date().toLocaleString('pt-BR'),
      count: transactions.length,
      totalValue: transactions.reduce((acc, t) => acc + Math.abs(t.amount), 0)
    };
    setHistory(prev => [newBatch, ...prev]);
    setTransactions([]);
    setCurrentFileName(null);
    setActiveTab('dashboard');
  }, [handleExportTxt, currentFileName, selectedBank, transactions]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300`}>
        <Header 
          onUpload={handleFileUpload} 
          onManualAdd={() => setIsManualModalOpen(true)}
          isProcessing={isProcessing} 
          fileName={currentFileName}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
          searchTerm={globalSearchTerm}
          onSearchChange={setGlobalSearchTerm}
        />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} onNavigateToReconciliation={() => setActiveTab('reconciliation')} onNavigateToTutorials={() => setActiveTab('tutorials')} />}
          {activeTab === 'reconciliation' && <ReconciliationList transactions={transactions} isProcessing={isProcessing} onUpdate={updateTransaction} onDelete={deleteTransaction} onExportCsv={() => {}} onExportTxt={handleExportTxt} onComplete={handleCompleteBatch} globalSearchTerm={globalSearchTerm} />}
          {activeTab === 'rules' && <RulesManager rules={rules} onAddRule={handleAddRule} onDeleteRule={handleDeleteRule} />}
          {activeTab === 'history' && <HistoryList history={history} onNewBatch={() => setActiveTab('dashboard')} />}
          {activeTab === 'tutorials' && <Tutorials />}
        </main>
      </div>
      {isManualModalOpen && <ManualEntryModal onClose={() => setIsManualModalOpen(false)} onSave={handleManualAdd} />}
    </div>
  );
};

export default App;
