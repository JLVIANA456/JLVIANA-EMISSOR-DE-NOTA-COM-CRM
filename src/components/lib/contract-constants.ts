export const CATEGORY_LABELS: Record<string, string> = {
  cliente: "Clientes",
  consultor_parceiro: "Consultor Parceiro",
  pj: "PJ",
  contabilidade: "Contabilidade",
};

export const CONTRACT_TYPE_OPTIONS = [
  // Cliente
  { value: "rh_as_a_service", label: "RH as a Service", category: "cliente" },
  { value: "consultoria_rh", label: "Consultoria de RH", category: "cliente" },
  { value: "comunicacao_interna", label: "Comunicação Interna", category: "cliente" },
  { value: "contrato_vagas", label: "Contrato para Vagas", category: "cliente" },
  // Consultor Parceiro
  { value: "parceiro_geral", label: "Contrato Padrão Geral", category: "consultor_parceiro" },
  { value: "parceiro_projeto", label: "Contrato Específico por Projeto", category: "consultor_parceiro" },
  // PJ
  { value: "prestacao_servicos", label: "Prestação de Serviços", category: "pj" },
  { value: "aditivo_contratual", label: "Aditivo Contratual", category: "pj" },
  { value: "distrato", label: "Distrato", category: "pj" },
  { value: "propriedade_intelectual", label: "Cláusulas de Propriedade Intelectual", category: "pj" },
  // Contabilidade
  { value: "servicos_contabeis", label: "Prestação de Serviços Contábeis", category: "contabilidade" },
  { value: "servicos_extraordinarios", label: "Serviços Extraordinários", category: "contabilidade" },
  { value: "assessoria_contabil", label: "Assessoria Contábil Mensal", category: "contabilidade" },
];

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em Revisão",
  aprovado: "Aprovado",
  enviado_assinatura: "Enviado p/ Assinatura",
  assinado_parcialmente: "Assinado Parcialmente",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

export const COMPLIANCE_CRITERIA = [
  { key: "objeto_claro", label: "Objeto contratual claro", weight: 10 },
  { key: "prazo_definido", label: "Prazo definido", weight: 10 },
  { key: "pagamento_claro", label: "Pagamento claro", weight: 15 },
  { key: "multa_definida", label: "Multa definida", weight: 10 },
  { key: "rescisao_clara", label: "Rescisão clara", weight: 10 },
  { key: "nao_vinculo", label: "Não vínculo empregatício", weight: 15 },
  { key: "confidencialidade", label: "Confidencialidade", weight: 10 },
  { key: "propriedade_intelectual", label: "Propriedade intelectual", weight: 10 },
  { key: "lgpd", label: "LGPD", weight: 10 },
];
