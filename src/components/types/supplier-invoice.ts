export type SupplierInvoiceStatus = 'recebida' | 'aguardando_aprovacao' | 'aprovada' | 'paga' | 'contestada';

export interface SupplierInvoice {
  id: string;
  user_id: string;
  supplier_name: string;
  supplier_document: string;
  supplier_email: string | null;
  supplier_contact: string | null;
  description: string;
  gross_value: number;
  due_date: string;
  competency_month: number;
  competency_year: number;
  category: string;
  cost_center: string;
  payment_method: string | null;
  status: SupplierInvoiceStatus;
  notes: string | null;
  invoice_pdf_url: string | null;
  share_token: string;
  submitted_via: 'manual' | 'link_compartilhado';
  paid_at: string | null;
  approved_at: string | null;
  contested_at: string | null;
  created_at: string;
  updated_at: string;
}

export const supplierInvoiceStatusLabels: Record<SupplierInvoiceStatus, string> = {
  recebida: 'Recebida',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aprovada: 'Aprovada',
  paga: 'Paga',
  contestada: 'Contestada',
};

export const supplierInvoiceStatusColors: Record<SupplierInvoiceStatus, { text: string; bg: string }> = {
  recebida: { text: 'text-blue-700', bg: 'bg-blue-100' },
  aguardando_aprovacao: { text: 'text-amber-700', bg: 'bg-amber-100' },
  aprovada: { text: 'text-emerald-700', bg: 'bg-emerald-100' },
  paga: { text: 'text-green-700', bg: 'bg-green-100' },
  contestada: { text: 'text-red-700', bg: 'bg-red-100' },
};
