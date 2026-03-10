export type BillStatus = 'rascunho' | 'aguardando_aprovacao' | 'aprovado' | 'programado' | 'pago' | 'cancelada' | 'reprovado';
export type InstallmentStatus = 'pendente' | 'programado' | 'pago' | 'cancelado';

export interface Tenant {
    id: string;
    nome: string;
    ativo: boolean;
}

export interface EmpresaBPO {
    id: string;
    tenant_id: string;
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    regime_tributario?: string;
    municipio?: string;
    uf?: string;
    ativo: boolean;
}

export interface Fornecedor {
    id: string;
    tenant_id: string;
    empresa_id: string;
    nome: string;
    doc_tipo: 'cnpj' | 'cpf';
    doc_numero: string;
    email?: string;
    telefone?: string;
    pix_chave?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    ativo: boolean;
}

export interface APBill {
    id: string;
    tenant_id: string;
    empresa_id: string;
    fornecedor_id: string;
    categoria_id: string;
    centro_custo_id?: string;
    descricao: string;
    competencia_mes: number;
    competencia_year: number;
    data_emissao?: string;
    vencimento?: string;
    forma_pagamento?: string;
    bank_account_id: string;
    possui_retencao: boolean;
    valor_bruto: number;
    base_retencoes: number;
    irrf_aliquota: number;
    irrf_valor: number;
    pis_aliquota: number;
    pis_valor: number;
    cofins_aliquota: number;
    cofins_valor: number;
    csll_aliquota: number;
    csll_valor: number;
    iss_retido_valor: number;
    inss_retido_valor: number;
    total_retencoes: number;
    valor_liquido: number;
    parcelado: boolean;
    qtd_parcelas: number;
    vencimento_primeira_parcela?: string;
    parcelas_geradas: boolean;
    approval_required: boolean;
    status: BillStatus;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    fornecedores?: { nome: string };
    ap_installments?: APInstallment[];
}

export interface APInstallment {
    id: string;
    tenant_id: string;
    empresa_id: string;
    ap_bill_id: string;
    numero: number;
    vencimento: string;
    valor_bruto: number;
    total_retencoes_aplicadas: number;
    valor_liquido: number;
    status: InstallmentStatus;
    data_pagamento?: string;
    valor_pago?: number;
    comprovante_url?: string;
    id_transacao?: string;
}
