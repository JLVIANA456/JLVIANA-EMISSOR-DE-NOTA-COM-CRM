export type InvoiceRequestStatus =
  | 'rascunho'
  | 'enviada_analista'
  | 'emissao_andamento'
  | 'emitida'
  | 'enviada_cliente'
  | 'pagamento_confirmado'
  | 'cancelada';

export type RevenueType =
  | 'consultoria_rh'
  | 'rh_as_a_service'
  | 'marketing_digital'
  | 'treinamentos_workshops'
  | 'comunicacao_interna'
  | 'parceria_co_branding'
  | 'vagas'
  | 'outro';

export type PaymentMethod = 'transferencia' | 'pix' | 'boleto' | 'outro';
export type FinancialCategory = 'receita_servico' | 'receita_parceria' | 'receita_treinamento';
export type CostCenter = 'operacoes' | 'comercial' | 'marketing';

export interface InvoiceRequest {
  id: string;
  user_id: string;
  client_name: string;
  client_document: string;
  client_type: 'F' | 'J' | 'E';
  client_inscricao_municipal: string | null;
  client_address: string;
  client_address_number: string | null;
  client_address_complement: string | null;
  client_neighborhood: string | null;
  client_zip_code: string | null;
  client_city: string | null;
  client_state: string | null;
  client_country: string | null;
  client_email: string;
  client_contact: string | null;
  client_phone: string | null;
  revenue_type: RevenueType;
  description: string;
  service_code: string | null;
  service_code_municipal: string | null;
  iss_retained: boolean;
  iss_aliq: number | null;
  nature_operation: string | null;
  competency_month: number;
  competency_year: number;
  desired_issue_date: string;
  due_date: string;
  gross_value: number;
  deductions_value: number | null;
  discount_value: number | null;
  payment_method: PaymentMethod;
  show_bank_details: boolean;
  financial_category: FinancialCategory;
  cost_center: CostCenter;
  tags: string[] | null;
  is_recurring: boolean;
  recurring_day: number | null;
  recurring_end_date: string | null;
  contract_attachment_url: string | null;
  analyst_notes: string | null;
  status: InvoiceRequestStatus;
  invoice_pdf_url: string | null;
  invoice_xml_url: string | null;
  sent_to_analyst_at: string | null;
  issued_at: string | null;
  sent_to_client_at: string | null;
  payment_confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export const REVENUE_TYPE_LABELS: Record<RevenueType, string> = {
  consultoria_rh: 'Consultoria de RH',
  rh_as_a_service: 'RH as a Service',
  marketing_digital: 'Marketing Digital',
  treinamentos_workshops: 'Treinamentos / Workshops',
  comunicacao_interna: 'Comunicação Interna',
  parceria_co_branding: 'Parceria / Co-Branding',
  vagas: 'Vagas',
  outro: 'Outro',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: 'Transferência',
  pix: 'PIX',
  boleto: 'Boleto',
  outro: 'Outro',
};

export const FINANCIAL_CATEGORY_LABELS: Record<FinancialCategory, string> = {
  receita_servico: 'Receita de Serviço',
  receita_parceria: 'Receita de Parceria',
  receita_treinamento: 'Receita de Treinamento',
};

export const COST_CENTER_LABELS: Record<CostCenter, string> = {
  operacoes: 'Operações',
  comercial: 'Comercial',
  marketing: 'Marketing',
};

export const STATUS_LABELS: Record<InvoiceRequestStatus, string> = {
  rascunho: 'Rascunho',
  enviada_analista: 'Enviada para Analista',
  emissao_andamento: 'Emissão em Andamento',
  emitida: 'Emitida',
  enviada_cliente: 'Enviada ao Cliente',
  pagamento_confirmado: 'Pagamento Confirmado',
  cancelada: 'Cancelada / Reemitir',
};

export const STATUS_COLORS: Record<InvoiceRequestStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  enviada_analista: 'bg-blue-100 text-blue-800',
  emissao_andamento: 'bg-amber-100 text-amber-800',
  emitida: 'bg-cyan/20 text-cyan-800',
  enviada_cliente: 'bg-indigo-100 text-indigo-800',
  pagamento_confirmado: 'bg-lime/20 text-green-800',
  cancelada: 'bg-destructive/20 text-destructive',
};

export const WORKFLOW_ORDER: InvoiceRequestStatus[] = [
  'rascunho',
  'enviada_analista',
  'emissao_andamento',
  'emitida',
  'enviada_cliente',
  'pagamento_confirmado',
];

export const BANK_DETAILS = {
  banco: 'Itaú',
  agencia: '0196',
  conta: '99213-5',
  cnpj: '53.497.516/0001-50',
  pix: 'financeiro@decodingp.com',
};
