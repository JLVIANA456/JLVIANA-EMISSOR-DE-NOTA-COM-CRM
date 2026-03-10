import { useState, useMemo } from "react";
import { useAuth } from "@/components/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Sparkles, FileText, Plus, Eye, Brain, FileCheck, Search, AlertTriangle, FileDown, Download, Settings2, AlignLeft, AlignCenter, AlignJustify, Type, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORY_LABELS, CONTRACT_TYPE_OPTIONS, CONTRACT_STATUS_LABELS } from "@/components/lib/contract-constants";
import { formatCNPJ } from "@/components/lib/cnpj";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Polyfill for global if needed by Quill
if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

const ACCOUNTING_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTÁBEIS

CONTRATANTE: [CONTRATANTE_NOME], CNPJ [CONTRATANTE_CNPJ], Endereço [CONTRATANTE_ENDERECO], E-mail [CONTRATANTE_EMAIL].

CONTRATADA: JLVIANA CONSULTORIA CONTÁBIL, CNPJ 07.203.780/0001-16, CRC 2SP023539/O-4, Endereço Rua dos Heliotrópios, 95, Mirandópolis - São Paulo/SP.
Representante: Jefferson Lopes Viana, CPF: 166.962.568-06, CRC: 1SP217513/0-O.

CLÁUSULA 1 – DEFINIÇÕES
Para fins deste contrato, aplicam-se as seguintes definições:
a) CONTRATANTE: Empresa ou pessoa jurídica que contrata os serviços objeto deste instrumento;
b) CONTRATADA: Empresa responsável pela execução dos serviços contábeis aqui descritos;
c) Serviços Ordinários: Atividades essenciais, periódicas e obrigatórias previstas em lei e nas Normas Brasileiras de Contabilidade;
d) Serviços Extraordinários/Complementares: Atividades não abrangidas pelos honorários ordinários, prestadas mediante solicitação formal e aprovação;
e) Documentos/Informações: Dados, papéis, arquivos digitais ou comunicações necessárias para execução adequada dos serviços;
f) Caso Fortuito/Força Maior: Eventos imprevisíveis ou inevitáveis que impeçam temporariamente a execução do contrato.

CLÁUSULA 2 – DO OBJETO
O presente contrato tem por objeto a prestação de serviços contábeis, fiscais, trabalhistas, previdenciários e societários, de forma contínua e mensal, observados os limites técnicos e legais da profissão contábil.

2.1 – Serviços Ordinários (Inclusos nos Honorários Mensais)
Os Serviços Ordinários compreendem as atividades essenciais, recorrentes e contínuas de natureza contábil, fiscal, trabalhista e societária, realizadas em conformidade com a legislação vigente, as Normas Brasileiras de Contabilidade (NBCs) e as obrigações acessórias correspondentes ao regime tributário da CONTRATANTE.
Compreendem, entre outros:
a) Classificação, escrituração, conciliação e processamento contábil das movimentações financeiras, patrimoniais e operacionais, com registro em sistema próprio ou homologado, conforme NBCs aplicáveis;
b) Elaboração e disponibilização das Demonstrações Contábeis obrigatórias, incluindo, quando aplicável: Balanço Patrimonial, Demonstração do Resultado do Exercício (DRE), Demonstração de Lucros ou Prejuízos Acumulados (DLPA), entre outras exigidas por lei;
c) Apuração de tributos conforme o regime tributário adotado (Simples Nacional, Lucro Presumido ou Lucro Real), de acordo com a legislação fiscal vigente;
d) Geração, emissão e encaminhamento das guias de recolhimento de tributos e contribuições dentro dos prazos legais, desde que as informações sejam enviadas pela CONTRATANTE dentro do prazo definido;
e) Entrega das obrigações acessórias aplicáveis, tais como: SPED Fiscal, SPED Contábil, DCTF, EFD-Contribuições, EFD-Reinf, RAIS, DIRF, DEFIS, GFIP/SEFIP, e demais exigidas conforme porte e enquadramento da CONTRATANTE;
f) Atendimento a fiscalizações, intimações, notificações e solicitações perante órgãos públicos, dentro do escopo ordinário, considerando-se as informações fornecidas pela CONTRATANTE;
g) Suporte técnico contábil, fiscal e trabalhista, incluindo orientações quanto ao cumprimento de normas e procedimentos operacionais regulares;
h) Processamento da folha de pagamento, pró-labore, encargos sociais, emissão de contracheques, férias, rescisões, geração de guias e declarações correspondentes (FGTS, GPS/INSS e eSocial), conforme legislação vigente;
i) Controle, manutenção e guarda eletrônica dos livros e registros contábeis e fiscais obrigatórios, em formato físico ou digital;
j) Atualizações decorrentes de alterações legais, normativas ou sistêmicas que afetem procedimentos ordinários;
k) Outros serviços regulares e contínuos da rotina contábil, fiscal e trabalhista previstos na proposta comercial e legislação vigente, não classificados como Serviços Extraordinários, conforme Cláusula 2.2.

2.2 – Serviços Extraordinários e Complementares
Consideram-se Serviços Extraordinários e Complementares todas as atividades não incluídas nos Serviços Ordinários descritos neste contrato ou não previstas na proposta comercial vigente. Tais serviços serão executados somente mediante solicitação formal da CONTRATANTE e aprovação prévia de orçamento contendo descrição do serviço, prazos estimados e valores dos honorários.
Incluem-se, sem limitação:
a) Constituição, alteração societária, mudança de sede, abertura de filiais e encerramento de empresas;
b) Retificação ou entrega extemporânea de declarações e obrigações acessórias;
c) Parcelamento, negociação e regularização de débitos tributários, previdenciários ou administrativos;
d) Defesas, impugnações e recursos perante órgãos públicos;
e) Assistência em fiscalizações e auditorias internas ou externas;
f) Relatórios gerenciais, pareceres técnicos, consultorias e análises específicas;
g) Reconstrução contábil ou fiscal retroativa;
h) Reemissão ou recálculo de guias vencidas ou já emitidas;
i) Atendimento emergencial fora do horário comercial ou com prazo reduzido;
j) Treinamentos, reuniões adicionais ou suporte operacional extra;
k) Suporte em sistemas como PJe, e-SAJ, e-CAC, Redesim, prefeituras etc.;
l) Qualquer serviço não contemplado nos honorários mensais ou que demande esforço adicional da CONTRATADA.

2.3 – Limites de Atuação: A execução de serviços extraordinários depende de aprovação formal e prévia da CONTRATANTE mediante orçamento discriminado.

2.4 – Exclusões: Não constituem objeto deste contrato serviços advocatícios, consultoria jurídica, auditoria independente ou outros que extrapolem os limites técnicos da profissão contábil.

CLÁUSULA 3 – DOS PAGAMENTOS
3.1 Honorários pelos Serviços Ordinários: R$ [HONORARIOS_MENSAIS] ([HONORARIOS_MENSAIS_EXTENSO])
3.2 – Serviços Extraordinários Obrigatórios (13ª Mensalidade)
Em razão da realização de serviços extraordinários e atividades específicas de encerramento do exercício contábil, será cobrada uma 13ª mensalidade anual, destinada a cobrir custos operacionais adicionais, revisões, apurações fiscais e obrigações acessórias pertinentes ao período.
O pagamento dessa 13ª mensalidade será efetuado em duas parcelas iguais, correspondentes a 50% (cinquenta por cento) do valor total cada, com vencimentos em 20 de novembro e 15 de dezembro de cada exercício.
3.3 – Serviços Extraordinários e Complementares: Serão considerados mediante orçamento e aprovação prévia da CONTRATANTE.
3.4 – Despesas Operacionais: Reembolsáveis pela CONTRATANTE, mediante comprovantes.
3.5 – Forma de Pagamento: boleto bancário registrado, enviado até 5 dias antes do vencimento com nota fiscal correspondente.
3.6 – Reajuste: Anual, na data de aniversário do contrato, conforme variação do salário-mínimo nacional.
3.7 – Inadimplemento: Multa de 2%, juros de 0,03% ao dia e correção pelo IGP-M/FGV.
3.8 – Rescisão por Inadimplência: Atraso de 3 mensalidades consecutivas ou 6 intercaladas autoriza rescisão imediata pela CONTRATADA, com multa de 20%, juros de 1% ao mês e correção monetária.
3.9 – O pagamento dos honorários será realizado mensalmente, com vencimento no dia [DATA_VENCIMENTO] de cada mês, sendo o valor devido referente aos serviços prestados no mês anterior.

CLÁUSULA 4 – DA VIGÊNCIA, RESILIÇÃO E RESCISÃO
Vigência: Início em [DATA_INICIO], prazo indeterminado.
Rescisão mediante aviso prévio de 30 dias.
Descumprimento gera multa compensatória de 2 mensalidades.
Valores pagos não serão devolvidos; despesas e encargos pendentes permanecem devidos.

CLÁUSULA 5 – DAS OBRIGAÇÕES DA CONTRATANTE
a) Fornecer informações e documentos verídicos e dentro dos prazos;
b) Comunicar movimentações contábeis e fiscais;
c) Designar representante formal;
d) Efetuar pagamentos e reembolsos pontualmente;
e) Manter sigilo e confidencialidade;
f) Atender comunicados e solicitações;
g) Cumprir a legislação de prevenção à lavagem de dinheiro;
h) Entregar a Carta de Responsabilidade da Administração;
i) Respeitar prazos definidos no ANEXO III.
§1º – O atraso no envio de documentos isenta a CONTRATADA de responsabilidade por penalidades.
§2º – Serão aceitos apenas documentos enviados por meios oficiais com comprovação.
§3º – A CONTRATANTE reconhece os limites técnicos e metodológicos da CONTRATADA.

CLÁUSULA 6 – DAS OBRIGAÇÕES DA CONTRATADA
a) Guardar e manter sob sigilo todos os documentos e dados;
b) Prestar esclarecimentos técnicos no horário comercial;
c) Emitir guias e relatórios dentro dos prazos legais;
d) Processar e arquivar documentos conforme normas contábeis e fiscais;
e) Supervisionar eventuais terceirizados;
f) Prestar assessoria contínua contábil, fiscal e trabalhista;
g) Gerar arquivos apenas em seus sistemas;
h) Cumprir a LGPD, mantendo canal ativo (qualidade@jlviana.com.br).
Parágrafo Primeiro – A CONTRATADA não responde por penalidades decorrentes de informações incorretas ou omissas da CONTRATANTE.
Parágrafo Segundo – Responde apenas por falhas próprias comprovadas, exceto em força maior.

CLÁUSULA 7 – SEGURO DE RESPONSABILIDADE CIVIL PROFISSIONAL
A CONTRATADA mantém apólice de seguro profissional para cobrir danos decorrentes de falhas ou omissões, nos limites da apólice.
§ Único – O seguro não exime a CONTRATANTE de suas obrigações.

CLÁUSULA 8 – PROTEÇÃO DE DADOS PESSOAIS (LGPD)
As partes comprometem-se a cumprir a Lei nº 13.709/2018 (LGPD).
A CONTRATANTE atua como Controladora e a CONTRATADA como Operadora.
Ambas devem adotar medidas de segurança, notificar incidentes e garantir os direitos dos titulares.
Canal: qualidade@jlviana.com.br.

CLÁUSULA 9 – FORÇA MAIOR E CASO FORTUITO
Nenhuma parte será responsabilizada por descumprimento causado por caso fortuito ou força maior.
Incluem-se: indisponibilidade sistêmica, greves, desastres naturais, pandemias, entre outros.
§ Único – A parte afetada deve notificar a outra imediatamente.

CLÁUSULA 10 – CESSÃO E SUBCONTRATAÇÃO
Vedada cessão ou subcontratação sem anuência expressa e escrita da outra parte.
§ Único – Subcontratação parcial permitida com autorização prévia, mantendo a CONTRATADA responsável.

CLÁUSULA 11 – COMUNICAÇÕES CONTRATUAIS
Comunicações por escrito (físico ou eletrônico) serão válidas mediante protocolo ou confirmação de recebimento.
§ Único – Mudança de endereço deve ser comunicada formalmente.

CLÁUSULA 12 – SOLUÇÃO DE CONTROVÉRSIAS
As partes buscarão solução amigável; persistindo divergência, adotarão mediação e, em último caso, foro da Comarca de São Paulo/SP.

CLÁUSULA 13 – INTEGRAÇÃO DO CONTRATO
Este contrato e seus anexos constituem o acordo integral entre as partes.
§ Único – Alterações somente terão validade por escrito e assinadas.

CLÁUSULA 14 – DECLARAÇÕES FINAIS
a) A CONTRATADA atuará com ética, técnica e qualidade profissional;
b) As informações trocadas serão confidenciais;
c) A CONTRATADA manterá equipe técnica qualificada e suporte contínuo;
d) Ambas reconhecem a boa-fé, transparência e cooperação mútua.

CLÁUSULA 15 – PARÂMETROS PARA A PRESTAÇÃO DOS SERVIÇOS CONTÁBEIS
Os serviços serão prestados com base nos seguintes parâmetros:
Quantidade de Funcionários: [PARAM_FUNCIONARIOS];
Quantidade de Sócios: [PARAM_SOCIOS];
Contas Correntes: [PARAM_CONTAS];
Estabelecimentos: [PARAM_ESTABELECIMENTOS];
Regime Tributário: [PARAM_REGIME];
Atividade Econômica: [PARAM_ATIVIDADE].
§1º – Alterações devem ser comunicadas previamente; o não cumprimento poderá gerar revisão retroativa de honorários.
§2º – Cada admissão além do limite informado implicará cobrança de R$ 50,00 por evento.
§3º – Alterações relevantes (porte, faturamento, empregados) ensejarão revisão contratual.

CLÁUSULA 16 – DOS ANEXOS
16.1 – Integram o presente contrato, para todos os fins de direito, os seguintes anexos, disponíveis eletronicamente nos links abaixo, cujo conteúdo é de ciência e concordância das partes:
a) ANEXO II – ESPECIFICAÇÃO DOS SERVIÇOS PROFISSIONAIS
Link de acesso: https://gamma.app/docs/ANEXO-II-ESPECIFICACAO-DOS-SERVICOS-PROFISSIONAISuefdofxk8q7tyo5
b) ANEXO III – RELAÇÃO DE DOCUMENTOS E PRAZOS DE ENTREGA
Link de acesso: https://gamma.app/docs/ANEXO-III-Relacao-de-Documentos-e-Prazos-de-Entrega1iyj1jjw5yplawm
16.2 – Os anexos mencionados possuem validade jurídica equivalente ao corpo deste contrato e poderão ser atualizados mediante comunicação formal por e-mail, desde que mantida a concordância expressa entre as partes.
16.3 – Para fins de integridade e rastreabilidade, as partes comprometem-se a manter cópia eletrônica ou física atualizada dos anexos em local seguro e acessível.

Local e data: São Paulo, [DATA_ASSINATURA]

CONTRATANTE: [CONTRATANTE_NOME]
CONTRATADA: JLVIANA CONSULTORIA CONTÁBIL LTDA.

Testemunhas:
1. JULIANA DE CASTRO BORIM VIANA, CPF: 174.494.178-55
2. [TESTEMUNHA2_NOME], CPF: [TESTEMUNHA2_CPF]`;

interface ContractForm {
  title: string;
  category: string;
  contract_type: string;
  template_id: string;
  // Empresa
  company_cnpj: string;
  company_razao_social: string;
  company_nome_fantasia: string;
  company_address: string;
  company_email: string;
  company_representative: string;
  company_representative_cpf: string;
  company_representative_role: string;
  // Contratada (Fixa JL Viana)
  contractor_cnpj: string;
  contractor_razao_social: string;
  contractor_address: string;
  contractor_representative: string;
  contractor_representative_cpf: string;
  // Dados contratuais
  contract_value: string;
  contract_value_extenso: string;
  payment_method: string;
  due_day: string;
  contract_duration: string;
  start_date: string;
  end_date: string;
  signing_date: string;
  scope_summary: string;
  termination_penalty: string;
  // Parametros Contabilidade
  param_funcionarios: string;
  param_socios: string;
  param_contas: string;
  param_estabelecimentos: string;
  param_regime: string;
  param_atividade: string;
  // Testemunhas
  witness2_name: string;
  witness2_cpf: string;
  // Opcoes
  has_confidentiality: boolean;
  has_intellectual_property: boolean;
  has_exclusivity: boolean;
}

const emptyForm: ContractForm = {
  title: "", category: "contabilidade", contract_type: "servicos_contabeis", template_id: "",
  company_cnpj: "", company_razao_social: "", company_nome_fantasia: "", company_address: "", company_email: "",
  company_representative: "", company_representative_cpf: "", company_representative_role: "",
  contractor_cnpj: "07.203.780/0001-16", contractor_razao_social: "JLVIANA CONSULTORIA CONTÁBIL", contractor_address: "Rua dos Heliotrópios, 95, Mirandópolis - São Paulo/SP",
  contractor_representative: "Jefferson Lopes Viana", contractor_representative_cpf: "166.962.568-06",
  contract_value: "", contract_value_extenso: "", payment_method: "boleto", due_day: "10", contract_duration: "Indeterminado", start_date: "", end_date: "", signing_date: new Date().toLocaleDateString('pt-BR'),
  scope_summary: "", termination_penalty: "2",
  param_funcionarios: "0", param_socios: "1", param_contas: "1", param_estabelecimentos: "1", param_regime: "Simples Nacional", param_atividade: "",
  witness2_name: "", witness2_cpf: "",
  has_confidentiality: true, has_intellectual_property: false, has_exclusivity: false,
};

// ─── Converte valor numérico em texto por extenso (pt-BR) ────────────────────
function valorPorExtenso(valorStr: string): string {
  const limpo = valorStr.replace(/[^0-9,]/g, "").replace(",", ".");
  const num = parseFloat(limpo);
  if (!limpo || isNaN(num) || num === 0) return "";

  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos",
    "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function grupo(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const cStr = c > 0 ? centenas[c] : "";
    let restStr = "";
    if (resto > 0) {
      if (resto < 20) {
        restStr = unidades[resto];
      } else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        restStr = dezenas[d] + (u > 0 ? " e " + unidades[u] : "");
      }
    }
    return cStr && restStr ? cStr + " e " + restStr : cStr + restStr;
  }

  const inteiro = Math.floor(num);
  const centavosNum = Math.round((num - inteiro) * 100);

  const partes: string[] = [];

  if (inteiro >= 1_000_000) {
    const mi = Math.floor(inteiro / 1_000_000);
    const resto = inteiro % 1_000_000;
    partes.push(grupo(mi) + (mi === 1 ? " milhão" : " milhões"));
    if (resto > 0) partes.push(grupo(resto));
  } else if (inteiro >= 1_000) {
    const mil = Math.floor(inteiro / 1_000);
    const resto = inteiro % 1_000;
    partes.push(grupo(mil) + " mil");
    if (resto > 0) partes.push(grupo(resto));
  } else if (inteiro > 0) {
    partes.push(grupo(inteiro));
  }

  const reaisStr = partes.join(" e ");
  const reaisLabel = inteiro === 1 ? "real" : "reais";

  if (centavosNum > 0) {
    const centStr = centavosNum < 20 ? unidades[centavosNum] : dezenas[Math.floor(centavosNum / 10)] + (centavosNum % 10 > 0 ? " e " + unidades[centavosNum % 10] : "");
    const centLabel = centavosNum === 1 ? "centavo" : "centavos";
    if (inteiro > 0) {
      return `${reaisStr} ${reaisLabel} e ${centStr} ${centLabel}`;
    }
    return `${centStr} ${centLabel}`;
  }

  return reaisStr ? `${reaisStr} ${reaisLabel}` : "";
}

const DEFAULT_STYLES = {
  fontFamily: "serif",
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: "justify",
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 30,
  marginRight: 20,
};

export function ContractGenerator({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); // 0=list, 1=type, 2=dados, 3=review, 4=generated
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [generating, setGenerating] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [viewContract, setViewContract] = useState<any>(null);

  // Styling State
  const [docStyles, setDocStyles] = useState(DEFAULT_STYLES);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['clean']
    ]
  }), []);

  const consultCNPJ = async (targetCnpj: string) => {
    const cleanCnpj = targetCnpj.replace(/\D/g, "");
    if (cleanCnpj.length < 14) return;

    setLoadingCnpj(true);
    const toastId = toast.loading("Consultando dados da empresa...");
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      let data;

      if (!response.ok) {
        const fallback = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
        if (!fallback.ok) throw new Error("Erro na consulta do CNPJ.");
        data = await fallback.json();

        update("company_razao_social", data.nome || "");
        update("company_nome_fantasia", data.fantasia || data.nome || "");

        const address = [
          data.logradouro,
          data.numero,
          data.complemento,
          data.bairro,
          data.municipio,
          data.uf,
          data.cep
        ].filter(Boolean).join(", ");

        update("company_address", address);
        update("company_email", data.email || "");
      } else {
        data = await response.json();
        update("company_razao_social", data.razao_social || "");
        update("company_nome_fantasia", data.nome_fantasia || data.razao_social || "");

        const address = [
          data.logradouro,
          data.numero,
          data.complemento,
          data.bairro,
          data.municipio,
          data.uf,
          data.cep
        ].filter(Boolean).join(", ");

        update("company_address", address);
        update("company_email", data.email || "");
      }
      toast.success("Dados da empresa recuperados!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao consultar CNPJ.", { id: toastId });
    } finally {
      setLoadingCnpj(false);
    }
  };

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, contract_templates(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contract_templates").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const update = (field: keyof ContractForm, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const typeOptions = form.category ? CONTRACT_TYPE_OPTIONS.filter((t) => t.category === form.category) : [];
  const matchingTemplates = templates.filter(
    (t: any) => t.category === form.category && t.contract_type === form.contract_type
  );

  const textToHtml = (text: string) => {
    if (!text) return "";

    // Improved check for already HTML content
    const isHtml = /<[a-z][\s\S]*>/i.test(text.trim()) && (text.trim().startsWith("<") || text.trim().includes("</"));
    if (isHtml) return text;

    // Aggressive line break insertion for markers if they are concatenated
    let processedText = text
      .replace(/([^\n])(CL[ÁA]USULA \d+)/gi, "$1\n\n$2")
      .replace(/([^\n])(\d+(\.\d+)+)/g, "$1\n$2") // Matches 3.1, 2.3.1 etc
      .replace(/([^\n])(Parágrafo (Primeiro|Segundo|Terceiro|Único))/gi, "$1\n$2")
      .replace(/([^\n])(CONTRATANTE:|CONTRATADA:)/gi, "$1\n$2")
      .replace(/([^\n])(Representante:)/gi, "$1\n$2")
      .replace(/([^\n])(Testemunhas:)/gi, "$1\n$2")
      .replace(/([^\n])(Local e data:)/gi, "$1\n$2")
      .replace(/([^\n])(§\d+)/g, "$1\n$2");

    return processedText
      .split('\n')
      .map(line => {
        let content = line.trim();
        if (!content) return '<p><br></p>';

        // Headers
        if (content.startsWith('# ')) return `<h1>${content.substring(2)}</h1>`;
        if (content.startsWith('## ')) return `<h2>${content.substring(3)}</h2>`;
        if (content.startsWith('### ')) return `<h3>${content.substring(4)}</h3>`;

        // Bold Clause Titles (custom heuristic)
        if (/^CL[ÁA]USULA/i.test(content) || /^CONTRATO/i.test(content) || /^ANEXO/i.test(content) || /^\d+\.\d+/i.test(content)) {
          return `<p><strong>${content}</strong></p>`;
        }

        // Markdown bold
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        return `<p>${content}</p>`;
      })
      .join('');
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);

    // For accounting services, we pre-fill the model
    if (form.category === 'contabilidade') {
      let content = ACCOUNTING_TEMPLATE;
      content = content.replace(/\[CONTRATANTE_NOME\]/g, form.company_razao_social || "[RAZÃO SOCIAL]");
      content = content.replace(/\[CONTRATANTE_CNPJ\]/g, form.company_cnpj || "[CNPJ]");
      content = content.replace(/\[CONTRATANTE_ENDERECO\]/g, form.company_address || "[ENDEREÇO]");
      content = content.replace(/\[CONTRATANTE_EMAIL\]/g, form.company_email || "[EMAIL]");
      content = content.replace(/\[HONORARIOS_MENSAIS\]/g, form.contract_value || "[VALOR]");
      content = content.replace(/\[HONORARIOS_MENSAIS_EXTENSO\]/g, form.contract_value_extenso || "[VALOR POR EXTENSO]");
      content = content.replace(/\[DATA_VENCIMENTO\]/g, form.due_day || "10");
      content = content.replace(/\[DATA_INICIO\]/g, form.start_date || "[DATA INÍCIO]");
      content = content.replace(/\[PARAM_FUNCIONARIOS\]/g, form.param_funcionarios);
      content = content.replace(/\[PARAM_SOCIOS\]/g, form.param_socios);
      content = content.replace(/\[PARAM_CONTAS\]/g, form.param_contas);
      content = content.replace(/\[PARAM_ESTABELECIMENTOS\]/g, form.param_estabelecimentos);
      content = content.replace(/\[PARAM_REGIME\]/g, form.param_regime);
      content = content.replace(/\[PARAM_ATIVIDADE\]/g, form.param_atividade);
      content = content.replace(/\[DATA_ASSINATURA\]/g, form.signing_date);
      content = content.replace(/\[TESTEMUNHA2_NOME\]/g, form.witness2_name || "________________");
      content = content.replace(/\[TESTEMUNHA2_CPF\]/g, form.witness2_cpf || "________________");

      setGeneratedContent(textToHtml(content));
      setStep(4);
      setGenerating(false);
      toast.success("Contrato contábil estruturado com sucesso!");
      return;
    }

    try {
      const { data, error } = await (supabase as any).functions.invoke("generate-contract", {
        body: { form, userId: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedContent(textToHtml(data.content));
      setStep(4);
      toast.success("Contrato gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar contrato: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getFontMap = (family: string) => {
    if (!family) return { word: 'Times New Roman', pdf: 'times', tailwind: 'font-serif' };
    switch (family) {
      case 'serif': return { word: 'Times New Roman', pdf: 'times', tailwind: 'font-serif' };
      case 'sans': return { word: 'Arial', pdf: 'helvetica', tailwind: 'font-sans' };
      case 'mono': return { word: 'Courier New', pdf: 'courier', tailwind: 'font-mono' };
      default: return { word: 'Times New Roman', pdf: 'times', tailwind: 'font-serif' };
    }
  };

  const exportToWord = async () => {
    if (!generatedContent || !form.company_razao_social) {
      toast.error("Preencha a Razão Social e gere o conteúdo antes de exportar.");
      return;
    }

    try {
      const fontInfo = getFontMap(docStyles.fontFamily);
      const alignmentMap: Record<string, any> = {
        'left': AlignmentType.LEFT,
        'center': AlignmentType.CENTER,
        'justify': AlignmentType.JUSTIFIED,
        'right': AlignmentType.RIGHT
      };

      // Parse HTML content
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(generatedContent, 'text/html');

      const children: Paragraph[] = [];

      const processInline = (node: Node, styles: any = {}): TextRun[] => {
        if (node.nodeType === 3) { // Text
          return [new TextRun({
            text: node.textContent || '',
            ...styles,
            font: fontInfo.word,
            size: (styles.size || docStyles.fontSize) * 2
          })];
        }
        if (node.nodeType === 1) { // Element
          const el = node as HTMLElement;
          const newStyles = { ...styles };
          if (el.tagName === 'STRONG' || el.tagName === 'B') newStyles.bold = true;
          if (el.tagName === 'EM' || el.tagName === 'I') newStyles.italics = true;
          if (el.tagName === 'U') newStyles.underline = { type: "single" };
          if (el.tagName === 'S') newStyles.strike = true;

          // Handle font size from Quill classes (ql-size-large etc) could be complex, skipping for now

          let runs: TextRun[] = [];
          el.childNodes.forEach(child => {
            runs = [...runs, ...processInline(child, newStyles)];
          });
          return runs;
        }
        return [];
      };

      docHtml.body.childNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element (p, h1, etc)
          const el = node as HTMLElement;
          const pOptions: any = {
            spacing: { after: 200, line: docStyles.lineHeight * 240 },
            alignment: alignmentMap[docStyles.textAlign]
          };

          if (el.tagName === 'H1') { pOptions.heading = HeadingLevel.HEADING_1; pOptions.alignment = AlignmentType.CENTER; }
          else if (el.tagName === 'H2') pOptions.heading = HeadingLevel.HEADING_2;
          else if (el.tagName === 'H3') pOptions.heading = HeadingLevel.HEADING_3;

          // Quill alignment classes
          if (el.classList.contains('ql-align-center')) pOptions.alignment = AlignmentType.CENTER;
          if (el.classList.contains('ql-align-right')) pOptions.alignment = AlignmentType.RIGHT;
          if (el.classList.contains('ql-align-justify')) pOptions.alignment = AlignmentType.JUSTIFIED;

          const runs = processInline(node);
          children.push(new Paragraph({ ...pOptions, children: runs }));
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: docStyles.marginTop * 56.7,
                bottom: docStyles.marginBottom * 56.7,
                left: docStyles.marginLeft * 56.7,
                right: docStyles.marginRight * 56.7,
              }
            }
          },
          children: children
        }]
      });

      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Contrato_Contabil_${form.company_razao_social.replace(/\s+/g, '_')}.docx`);
        toast.success("Contrato exportado para DOCX com sucesso!");
      }).catch(err => {
        console.error("Erro ao empacotar DOCX:", err);
        toast.error("Erro ao gerar arquivo DOCX.");
      });
    } catch (err: any) {
      console.error("Erro no exportToWord:", err);
      toast.error("Falha ao preparar exportação DOCX: " + err.message);
    }
  };

  const exportToPDF = () => {
    if (!generatedContent || !form.company_razao_social) {
      toast.error("Preencha a Razão Social e gere o conteúdo antes de exportar.");
      return;
    }

    try {
      const fontInfo = getFontMap(docStyles.fontFamily);
      const docUrl = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      docUrl.setFont(fontInfo.pdf, "normal");
      docUrl.setFontSize(docStyles.fontSize);

      // Configs
      const pageWidth = 210;
      const pageHeight = 297;
      const effectiveWidth = pageWidth - docStyles.marginLeft - docStyles.marginRight;
      const startX = docStyles.marginLeft;
      let cursorY = docStyles.marginTop;
      const lineHeightMm = docStyles.fontSize * 0.3527 * docStyles.lineHeight;

      // Simple HTML to Text for PDF (since jsPDF html() is complex without setup)
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(generatedContent, 'text/html');

      // We iterate paragraphs similar to DOCX but draw text
      docHtml.body.childNodes.forEach((node) => {
        if (node.nodeType === 1) {
          const el = node as HTMLElement;
          const text = el.textContent || "";
          if (!text.trim()) {
            cursorY += lineHeightMm;
            return;
          }

          // Bold headers
          const isHeader = /^H[1-6]/.test(el.tagName);
          if (isHeader) docUrl.setFont(fontInfo.pdf, "bold");
          else docUrl.setFont(fontInfo.pdf, "normal");

          const splitLines = docUrl.splitTextToSize(text, effectiveWidth);

          splitLines.forEach((splitLine: string) => {
            if (cursorY + lineHeightMm > pageHeight - docStyles.marginBottom) {
              docUrl.addPage();
              cursorY = docStyles.marginTop;
            }

            // Alignment
            let xPos = startX;
            let align: "left" | "center" | "right" | "justify" = "left";

            let textAlign = docStyles.textAlign;
            if (el.classList.contains('ql-align-center')) textAlign = 'center';
            if (el.classList.contains('ql-align-right')) textAlign = 'right';
            if (el.classList.contains('ql-align-justify')) textAlign = 'justify';
            if (isHeader) textAlign = 'center';

            if (textAlign === 'center') {
              xPos = pageWidth / 2;
              align = "center";
            } else if (textAlign === 'right') {
              xPos = pageWidth - docStyles.marginRight;
              align = "right";
            } else if (textAlign === 'justify') {
              align = "justify";
            }

            docUrl.text(splitLine, xPos, cursorY, { align: align as any, maxWidth: effectiveWidth });
            cursorY += lineHeightMm;
          });
          cursorY += lineHeightMm * 0.5;
        }
      });

      docUrl.save(`Contrato_Contabil_${form.company_razao_social.replace(/\s+/g, '_')}.pdf`);
      toast.success("Contrato exportado para PDF com sucesso!");
    } catch (err: any) {
      console.error("Erro no exportToPDF:", err);
      toast.error("Falha ao gerar PDF: " + err.message);
    }
  };

  const handleSave = async (redirect: boolean = false) => {
    if (!user) return;
    try {
      if (viewContract) {
        const { error } = await supabase
          .from("contracts")
          .update({
            style_config: docStyles,
          } as any)
          .eq("id", viewContract.id);

        if (error) throw error;
        toast.success("Contrato atualizado!");
      } else {
        const { error } = await supabase.from("contracts").insert({
          user_id: user.id,
          template_id: form.template_id || null,
          category: form.category as any,
          contract_type: form.contract_type as any,
          title: form.title,
          company_cnpj: form.company_cnpj, company_razao_social: form.company_razao_social,
          company_nome_fantasia: form.company_nome_fantasia, company_address: form.company_address,
          company_representative: form.company_representative, company_representative_cpf: form.company_representative_cpf,
          company_representative_role: form.company_representative_role,
          contractor_cnpj: form.contractor_cnpj, contractor_razao_social: form.contractor_razao_social,
          contractor_address: form.contractor_address, contractor_representative: form.contractor_representative,
          contractor_representative_cpf: form.contractor_representative_cpf,
          contract_value: parseFloat(form.contract_value) || 0,
          payment_method: form.payment_method,
          contract_duration: form.contract_duration, start_date: form.start_date || null, end_date: form.end_date || null,
          scope_summary: form.scope_summary, termination_penalty: parseFloat(form.termination_penalty) || 0,
          has_confidentiality: form.has_confidentiality, has_intellectual_property: form.has_intellectual_property,
          has_exclusivity: form.has_exclusivity,
          generated_content: generatedContent,
          status: "rascunho" as any,
          style_config: docStyles,
        } as any);
        if (error) throw error;
        toast.success("Contrato salvo!");
      }

      queryClient.invalidateQueries({ queryKey: ["contracts"] });

      if (redirect && onNavigate) {
        onNavigate("assinatura");
      } else if (!viewContract) {
        setStep(0);
        setForm(emptyForm);
        setGeneratedContent("");
      }
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  // Step 0: List
  if (step === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-light tracking-tight">Gestão de Contratos</h2>
              <p className="text-xs text-muted-foreground font-light uppercase tracking-widest">Documentos Gerados</p>
            </div>
          </div>
          <Button onClick={() => setStep(1)} className="rounded-xl h-11 px-6 bg-primary shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> Novo Contrato</Button>
        </div>
        <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground text-sm font-light">Nenhum contrato gerado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-medium text-[11px] uppercase tracking-wider">Título</TableHead>
                    <TableHead className="font-medium text-[11px] uppercase tracking-wider">Categoria</TableHead>
                    <TableHead className="font-medium text-[11px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-medium text-[11px] uppercase tracking-wider">Contratada</TableHead>
                    <TableHead className="font-medium text-[11px] uppercase tracking-wider">Valor</TableHead>
                    <TableHead className="text-right font-medium text-[11px] uppercase tracking-wider">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-light py-4">{c.title}</TableCell>
                      <TableCell><Badge variant="outline" className="font-light text-[10px]">{CATEGORY_LABELS[c.category] || c.category}</Badge></TableCell>
                      <TableCell><Badge className="font-light text-[10px] bg-primary/10 text-primary border-none">{CONTRACT_STATUS_LABELS[c.status] || c.status}</Badge></TableCell>
                      <TableCell className="text-sm font-light text-muted-foreground">{c.contractor_razao_social || "—"}</TableCell>
                      <TableCell className="text-sm font-light">{c.contract_value ? `R$ ${Number(c.contract_value).toLocaleString("pt-BR")}` : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="rounded-lg h-9" onClick={() => {
                          const content = c.generated_content || "";
                          setGeneratedContent(textToHtml(content));
                          setDocStyles(c.style_config ? { ...DEFAULT_STYLES, ...c.style_config } : DEFAULT_STYLES);
                          setViewContract(c);

                          // Populate form so exports and "Edit Data" work
                          setForm({
                            ...emptyForm,
                            title: c.title || "",
                            category: c.category || "contabilidade",
                            contract_type: c.contract_type || "",
                            template_id: c.template_id || "",
                            company_cnpj: c.company_cnpj || "",
                            company_razao_social: c.company_razao_social || "",
                            company_nome_fantasia: c.company_nome_fantasia || "",
                            company_address: c.company_address || "",
                            company_email: c.company_email || "",
                            company_representative: c.company_representative || "",
                            company_representative_cpf: c.company_representative_cpf || "",
                            company_representative_role: c.company_representative_role || "",
                            contractor_cnpj: c.contractor_cnpj || "07.203.780/0001-16",
                            contractor_razao_social: c.contractor_razao_social || "JLVIANA CONSULTORIA CONTÁBIL",
                            contract_value: c.contract_value ? String(c.contract_value) : "",
                            start_date: c.start_date || "",
                            end_date: c.end_date || "",
                            signing_date: c.signing_date || new Date().toLocaleDateString('pt-BR'),
                            param_funcionarios: c.param_funcionarios ? String(c.param_funcionarios) : "0",
                            param_socios: c.param_socios ? String(c.param_socios) : "1",
                            param_contas: c.param_contas ? String(c.param_contas) : "1",
                            param_estabelecimentos: c.param_estabelecimentos ? String(c.param_estabelecimentos) : "1",
                            param_regime: c.param_regime || "Simples Nacional",
                            param_atividade: c.param_atividade || "",
                            // ... add other fields if they exist in schema
                          });

                          setStep(4);
                        }}>
                          <Eye className="h-4 w-4 mr-1" /> Ver / Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Selecionar tipo
  if (step === 1) {
    return (
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-card/60 backdrop-blur-md">
        <div className="h-2 bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
        <CardHeader className="p-10 pb-4">
          <CardTitle className="text-2xl font-light tracking-tight">Novo Contrato Inteligente</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 italic">Defina a estrutura base</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Título do Documento *</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex: Contrato de Prestação de Serviços - Empresa ABC"
              className="h-12 rounded-2xl bg-muted/30 border-border/40 font-light text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Segmento do Contrato *</Label>
              <Select value={form.category} onValueChange={(v) => { update("category", v); update("contract_type", ""); update("template_id", ""); }}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Modelo de Serviço *</Label>
              <Select value={form.contract_type} onValueChange={(v) => { update("contract_type", v); update("template_id", ""); }} disabled={!form.category}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-border/40"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="rounded-xl border-border">
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="ghost" className="font-light rounded-xl h-11 px-8" onClick={() => { setStep(0); setForm(emptyForm); }}>Cancelar</Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!form.title || !form.category || !form.contract_type}
              className="rounded-xl h-11 px-10 bg-primary shadow-lg shadow-primary/20"
            >
              Próximo Passo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Dados
  if (step === 2) {
    return (
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-xl">
        <CardHeader className="p-10 pb-0">
          <CardTitle className="text-2xl font-light tracking-tight">Parametrizar Contrato</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Mapeamento de Dados e Regras</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-12">
          {/* Empresa contratante */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-primary flex items-center gap-2">
              <div className="h-1 w-6 bg-primary rounded-full" />
              Dados do Contratante
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.company_cnpj}
                    onChange={(e) => {
                      const val = formatCNPJ(e.target.value);
                      update("company_cnpj", val);
                      if (val.replace(/\D/g, "").length === 14) {
                        consultCNPJ(val);
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    className="h-11 rounded-xl bg-muted/20"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-xl bg-muted/20 hover:bg-primary/10 text-primary shrink-0"
                    onClick={() => consultCNPJ(form.company_cnpj)}
                    disabled={loadingCnpj}
                  >
                    {loadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Razão Social</Label>
                <Input value={form.company_razao_social} onChange={(e) => update("company_razao_social", e.target.value)} className="h-11 rounded-xl bg-muted/20" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Endereço Completo</Label>
                <Input value={form.company_address} onChange={(e) => update("company_address", e.target.value)} className="h-11 rounded-xl bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">E-mail para Notificações</Label>
                <Input value={form.company_email} onChange={(e) => update("company_email", e.target.value)} className="h-11 rounded-xl bg-muted/20" />
              </div>
            </div>
          </div>

          {/* Dados Financeiros */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-primary flex items-center gap-2">
              <div className="h-1 w-6 bg-primary rounded-full" />
              Condições Financeiras
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Honorário Mensal (R$)</Label>
                <Input
                  value={form.contract_value}
                  onChange={(e) => {
                    const val = e.target.value;
                    update("contract_value", val);
                    const extenso = valorPorExtenso(val);
                    if (extenso) update("contract_value_extenso", extenso);
                  }}
                  placeholder="0,00"
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">
                  Valor por Extenso
                  {form.contract_value_extenso && (
                    <span className="ml-2 text-[8px] text-emerald-600 font-bold normal-case tracking-normal">✓ preenchido automaticamente</span>
                  )}
                </Label>
                <Input
                  value={form.contract_value_extenso}
                  onChange={(e) => update("contract_value_extenso", e.target.value)}
                  placeholder="Ex: Mil e quinhentos reais"
                  className="h-11 rounded-xl bg-muted/20"
                /></div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Dia do Vencimento</Label>
                <Input value={form.due_day} onChange={(e) => update("due_day", e.target.value)} placeholder="10" className="h-11 rounded-xl bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Data de Início</Label>
                <Input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="h-11 rounded-xl bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Data da Assinatura</Label>
                <Input value={form.signing_date} onChange={(e) => update("signing_date", e.target.value)} className="h-11 rounded-xl bg-muted/20" />
              </div>
            </div>
          </div>

          {/* Parâmetros de Contabilidade */}
          {form.category === 'contabilidade' && (
            <div className="space-y-6 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
              <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Parâmetros Operacionais (Cláusula 15)
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Nr de Funcionários</Label>
                  <Input value={form.param_funcionarios} onChange={(e) => update("param_funcionarios", e.target.value)} className="h-11 rounded-xl border-primary/20 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Nr de Sócios</Label>
                  <Input value={form.param_socios} onChange={(e) => update("param_socios", e.target.value)} className="h-11 rounded-xl border-primary/20 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Nr de Contas Bancárias</Label>
                  <Input value={form.param_contas} onChange={(e) => update("param_contas", e.target.value)} className="h-11 rounded-xl border-primary/20 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Estabelecimentos</Label>
                  <Input value={form.param_estabelecimentos} onChange={(e) => update("param_estabelecimentos", e.target.value)} className="h-11 rounded-xl border-primary/20 bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Regime Tributário</Label>
                  <Select value={form.param_regime} onValueChange={(v) => update("param_regime", v)}>
                    <SelectTrigger className="h-11 rounded-xl border-primary/20 bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60">Atividade Econômica</Label>
                  <Select value={form.param_atividade} onValueChange={(v) => update("param_atividade", v)}>
                    <SelectTrigger className="h-11 rounded-xl border-primary/20 bg-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Comércio">Comércio</SelectItem>
                      <SelectItem value="Serviço">Serviço</SelectItem>
                      <SelectItem value="Indústria">Indústria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" className="font-light h-11 px-8" onClick={() => setStep(1)}>Voltar</Button>
            <Button className="rounded-xl h-11 px-12 bg-primary shadow-lg shadow-primary/20" onClick={() => setStep(3)}>Revisar Minuta</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Review
  if (step === 3) {
    const typeLabel = CONTRACT_TYPE_OPTIONS.find((o) => o.value === form.contract_type)?.label || form.contract_type;
    return (
      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-card/60 backdrop-blur-md">
        <CardHeader className="p-10 pb-0">
          <CardTitle className="text-2xl font-light tracking-tight">Confirmação de Estrutura</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Revise os mapeadores antes de gerar o documento final</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm bg-muted/20 p-8 rounded-3xl border border-border/40">
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Título:</strong> {form.title}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Tipo:</strong> {typeLabel}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Contratante:</strong> {form.company_razao_social || "—"}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">CNPJ:</strong> {form.company_cnpj || "—"}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Honorário:</strong> {form.contract_value ? `R$ ${form.contract_value}` : "—"}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Vencimento:</strong> Dia {form.due_day}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Funcionários:</strong> {form.param_funcionarios}</div>
            <div className="flex justify-between border-b border-border/40 pb-2"><strong className="text-muted-foreground">Regime:</strong> {form.param_regime}</div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" className="font-light h-11 px-8" onClick={() => setStep(2)}>Voltar</Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-xl h-11 px-12 bg-primary shadow-lg shadow-primary/20 text-white font-medium"
            >
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verificando Dados...</> : <><Sparkles className="h-4 w-4 mr-2" /> Gerar Contrato pela IA</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }


  // Step 4: Generated & Customization (Rich Text Editor)
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* ── Header: Actions & Page Settings ───────────────────────────── */}
      <Card className="flex-shrink-0 border-none shadow-md bg-white px-6 py-3 flex items-center justify-between rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium tracking-tight">Editor de Contrato</h2>
            <p className="text-xs text-muted-foreground">Edite o documento livremente como em um editor de texto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Page Settings Popover */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" /> Configurar Página
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuração de Página</DialogTitle>
                <DialogDescription>Defina as margens e a fonte padrão do documento.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Font Family */}
                <div className="space-y-3">
                  <Label>Tipografia Padrão</Label>
                  <Select value={docStyles.fontFamily} onValueChange={(v) => setDocStyles(s => ({ ...s, fontFamily: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serif">Serif (Times)</SelectItem>
                      <SelectItem value="sans">Sans-serif (Arial)</SelectItem>
                      <SelectItem value="mono">Monospace (Courier)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Tamanho Base</Label>
                    <span className="text-xs text-muted-foreground">{docStyles.fontSize}pt</span>
                  </div>
                  <Slider value={[docStyles.fontSize]} min={8} max={18} step={1} onValueChange={([v]) => setDocStyles(s => ({ ...s, fontSize: v }))} />
                </div>
                {/* Line Height */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Espaçamento entre linhas</Label>
                    <span className="text-xs text-muted-foreground">{docStyles.lineHeight}x</span>
                  </div>
                  <Slider value={[docStyles.lineHeight]} min={1} max={2.5} step={0.1} onValueChange={([v]) => setDocStyles(s => ({ ...s, lineHeight: v }))} />
                </div>
                {/* Margins */}
                <div className="space-y-3">
                  <Label>Margens (mm)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><span className="text-[10px]">Esq</span><Input type="number" value={docStyles.marginLeft} onChange={(e) => setDocStyles(s => ({ ...s, marginLeft: Number(e.target.value) }))} /></div>
                    <div className="space-y-1"><span className="text-[10px]">Dir</span><Input type="number" value={docStyles.marginRight} onChange={(e) => setDocStyles(s => ({ ...s, marginRight: Number(e.target.value) }))} /></div>
                    <div className="space-y-1"><span className="text-[10px]">Sup</span><Input type="number" value={docStyles.marginTop} onChange={(e) => setDocStyles(s => ({ ...s, marginTop: Number(e.target.value) }))} /></div>
                    <div className="space-y-1"><span className="text-[10px]">Inf</span><Input type="number" value={docStyles.marginBottom} onChange={(e) => setDocStyles(s => ({ ...s, marginBottom: Number(e.target.value) }))} /></div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="h-6 w-px bg-border mx-2" />

          <Button variant="outline" size="sm" onClick={exportToWord} className="text-indigo-600 border-indigo-100 hover:bg-indigo-50">
            <FileDown className="h-4 w-4 mr-2" /> DOCX
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="text-rose-600 border-rose-100 hover:bg-rose-50">
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          {viewContract ? (
            <Button variant="ghost" size="sm" onClick={() => { setStep(0); setViewContract(null); }}>Voltar</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setStep(3)}>Editar Dados</Button>
          )}

          <Button onClick={() => handleSave(false)} size="sm" variant="ghost" className="text-muted-foreground">
            <FileCheck className="h-4 w-4 mr-2" /> {viewContract ? "Salvar" : "Rascunho"}
          </Button>
          <Button onClick={() => handleSave(true)} size="sm" className="bg-primary text-white shadow-lg shadow-primary/20">
            <Send className="h-4 w-4 mr-2" /> {viewContract ? "Atualizar e Assinar" : "Salvar e Assinar"}
          </Button>
        </div>
      </Card>

      {/* ── Editor Area ─────────────────────────────────────────────────── */}
      <Card className="flex-1 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white flex flex-col relative">
        <ReactQuill
          theme="snow"
          value={generatedContent || ""}
          onChange={setGeneratedContent}
          className="h-full flex flex-col ql-custom-container"
          modules={modules}
        />
      </Card>

      {/* Global styles for Quill to fit full height */}
      <style>{`
        .ql-custom-container .ql-container {
          flex: 1;
          overflow-y: auto;
          font-family: ${getFontMap(docStyles.fontFamily).word}, serif;
          font-size: ${docStyles.fontSize}pt;
        }
        .ql-custom-container .ql-editor {
          min-height: 100%;
          padding: 2rem 3rem; /* Mimic page padding */
        }
      `}</style>
    </div>
  );
}
