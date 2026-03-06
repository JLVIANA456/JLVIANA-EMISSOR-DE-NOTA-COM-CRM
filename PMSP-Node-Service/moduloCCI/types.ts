
export enum TransactionStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  REJECTED = 'REJECTED'
}

export enum MovementType {
  REVENUE = 'Receita',
  EXPENSE = 'Despesa',
  TRANSFER = 'Transferência',
  TAX = 'Imposto',
  FEE = 'Tarifa/Taxa',
  INVESTMENT = 'Aplicação/Resgate'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  balance?: number;
  type: 'CREDIT' | 'DEBIT';
  movementType?: MovementType;
  suggestedAccount?: string; // Campo imutável da IA
  accountingAccount?: string; // Campo editável pelo usuário
  reasoning: string;
  status: TransactionStatus;
  entity?: string;
  cpf_cnpj?: string;
  bank?: string;
  originBank?: string;
  destinationBank?: string;
}

export interface ConciliationState {
  transactions: Transaction[];
  isProcessing: boolean;
  progress: number;
  fileName?: string;
}

export interface Rule {
  id: string;
  pattern: string;
  category: MovementType;
  account: string;
  scope: 'CLIENT' | 'OFFICE' | 'GLOBAL';
}

export interface BatchHistory {
  id: string;
  fileName: string;
  bank: string;
  timestamp: string;
  count: number;
  totalValue: number;
}
