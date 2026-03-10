import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, Packer } from "docx";
import { saveAs } from "file-saver";

const bold = (text: string) => new TextRun({ text, bold: true, font: "Calibri", size: 22 });
const normal = (text: string) => new TextRun({ text, font: "Calibri", size: 22 });

const heading = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) =>
  new Paragraph({ heading: level, spacing: { before: 300, after: 100 }, children: [new TextRun({ text, bold: true, font: "Calibri" })] });

const para = (...runs: TextRun[]) => new Paragraph({ spacing: { after: 120 }, children: runs });
const bullet = (text: string) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [normal(text)] });

function simpleTable(headers: string[], rows: string[][]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(h => new TableCell({ borders, width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [bold(h)] })] })),
      }),
      ...rows.map(row => new TableRow({
        children: row.map(cell => new TableCell({ borders, width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [normal(cell)] })] })),
      })),
    ],
  });
}

export async function generateTechDoc() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "DecoAdmin® — Documentação Técnica", bold: true, font: "Calibri", size: 36 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: `Gerado em ${new Date().toLocaleDateString('pt-BR')}`, font: "Calibri", size: 20, italics: true, color: "666666" })],
        }),

        // 1. Visão Geral
        heading("1. Visão Geral"),
        para(normal("O DecoAdmin® é uma plataforma de gestão administrativa e financeira desenvolvida para a Decoding People. O sistema centraliza operações de faturamento, controle de custos, gestão de pessoas, projeção de caixa, contratos inteligentes e dashboards estratégicos em uma interface web moderna e responsiva.")),

        // 2. Stack Tecnológica
        heading("2. Stack Tecnológica"),
        heading("2.1 Frontend", HeadingLevel.HEADING_2),
        simpleTable(["Tecnologia", "Versão", "Finalidade"], [
          ["React", "18.3.x", "Biblioteca de UI (SPA)"],
          ["TypeScript", "5.8.x", "Tipagem estática"],
          ["Vite", "5.4.x", "Bundler e dev server"],
          ["Tailwind CSS", "3.4.x", "Framework de estilos utilitários"],
          ["shadcn/ui + Radix", "Última", "Componentes de UI acessíveis"],
          ["React Router DOM", "6.30.x", "Roteamento SPA"],
          ["TanStack React Query", "5.83.x", "Gerenciamento de estado server-side"],
          ["Recharts", "2.15.x", "Gráficos e visualizações"],
          ["Lucide React", "0.462.x", "Ícones SVG"],
          ["React Hook Form + Zod", "7.x / 3.x", "Formulários e validação"],
          ["Framer Motion (via Radix)", "—", "Animações de componentes"],
        ]),

        heading("2.2 Backend (Lovable Cloud / Supabase)", HeadingLevel.HEADING_2),
        simpleTable(["Serviço", "Uso"], [
          ["PostgreSQL", "Banco de dados relacional com RLS (Row-Level Security)"],
          ["Auth", "Autenticação com e-mail/senha e controle de roles (admin / secretary)"],
          ["Edge Functions (Deno)", "Lógica serverless: geração de contratos, envio de e-mails, validação de NF, IA jurídica"],
          ["Storage", "Armazenamento de PDFs, XMLs e anexos"],
          ["Realtime", "Atualizações em tempo real (disponível, não habilitado em todas as tabelas)"],
        ]),

        heading("2.3 Integrações Externas", HeadingLevel.HEADING_2),
        simpleTable(["Integração", "Finalidade", "Método"], [
          ["Granatum", "Sincronização financeira (contas, lançamentos, categorias, clientes)", "API REST via Edge Function"],
          ["Resend", "Envio de e-mails transacionais (notas fiscais, holerites)", "API via Edge Function"],
          ["Clicksign", "Assinatura digital de contratos", "API via Edge Function"],
          ["OpenAI / Gemini (Lovable AI)", "Assistente jurídico, análise de contratos, geração de conteúdo", "Edge Function com modelos Lovable AI"],
        ]),

        heading("2.4 Bibliotecas Auxiliares", HeadingLevel.HEADING_2),
        simpleTable(["Biblioteca", "Uso"], [
          ["jsPDF + jspdf-autotable", "Geração de PDFs (holerites, relatórios)"],
          ["xlsx", "Exportação de relatórios em Excel"],
          ["docx + file-saver", "Geração de documentos Word"],
          ["react-markdown", "Renderização de conteúdo Markdown (respostas de IA)"],
          ["date-fns", "Manipulação de datas"],
          ["cmdk", "Command palette / busca"],
        ]),

        // 3. Arquitetura
        heading("3. Arquitetura do Projeto"),
        heading("3.1 Estrutura de Pastas", HeadingLevel.HEADING_2),
        bullet("src/pages/ — Páginas da aplicação (rotas)"),
        bullet("src/components/ — Componentes organizados por domínio (cfo/, invoices/, pessoas/, contratos/, etc.)"),
        bullet("src/components/ui/ — Biblioteca de componentes base (shadcn/ui)"),
        bullet("src/components/layout/ — Layout da aplicação (AppLayout, AppSidebar, RoleGuard)"),
        bullet("src/hooks/ — Custom hooks (useFinancialData, usePeople, usePayroll, useInvoiceAutocomplete, etc.)"),
        bullet("src/contexts/ — Contextos React (AuthContext)"),
        bullet("src/types/ — Tipos TypeScript (invoice.ts, supplier-invoice.ts)"),
        bullet("src/lib/ — Utilitários (permissions, cnpj, contract-constants, utils)"),
        bullet("src/integrations/supabase/ — Cliente e tipos gerados automaticamente"),
        bullet("supabase/functions/ — Edge Functions (Deno/TypeScript)"),

        heading("3.2 Sistema de Autenticação e Permissões", HeadingLevel.HEADING_2),
        para(normal("O sistema utiliza autenticação via Supabase Auth com duas roles definidas:")),
        bullet("admin — Acesso total ao sistema"),
        bullet("secretary — Acesso restrito (sem CFO Digital, Projeção de Caixa, Dashboard Estratégico e Configurações)"),
        para(normal("O controle de acesso é implementado via:")),
        bullet("RoleGuard — Componente wrapper que redireciona usuários sem permissão"),
        bullet("canAccessRoute() — Função utilitária que verifica acesso por rota"),
        bullet("RLS Policies — Segurança a nível de banco de dados (cada usuário vê apenas seus dados)"),

        // 4. Módulos
        heading("4. Módulos Funcionais"),
        simpleTable(["Módulo", "Rota", "Descrição"], [
          ["Dashboard Executivo", "/", "KPIs, fluxo de caixa, receita, alertas e recomendações"],
          ["Dashboard Operacional", "/dashboard/operacional", "Visão operacional do dia-a-dia"],
          ["Dashboard Estratégico", "/dashboard/estrategico", "Análises estratégicas (admin only)"],
          ["CFO Digital", "/cfo-digital", "IA financeira: burn rate, rentabilidade, análise ABC (admin only)"],
          ["Emissão de Notas", "/emissao-notas", "Workflow completo de NFs: rascunho → emitida → paga"],
          ["Recebimento de Notas", "/recebimento-notas", "Notas de fornecedores com link público de envio"],
          ["Custos Fixos", "/custos-fixos", "Controle de custos fixos por categoria"],
          ["Projeção de Caixa", "/projecao-caixa", "Projeção anual, análise de risco, projetos (admin only)"],
          ["Pessoas & DP", "/pessoas", "Cadastro PJ, contratos, ausências, comissões, salários"],
          ["Folha PJ", "/folha-pagamento", "Folha de pagamento mensal com validação de NFs"],
          ["Portal PJ", "/portal-pj", "Portal externo para prestadores enviarem NFs"],
          ["Reembolsos", "/reembolsos", "Solicitações de reembolso com workflow de aprovação"],
          ["Contratos Inteligentes", "/contratos", "Geração, análise e assinatura digital de contratos"],
          ["Alertas", "/alertas", "Central de alertas unificados"],
          ["Configurações", "/configuracoes", "Integração Granatum, sincronização (admin only)"],
        ]),

        // 5. Banco de Dados
        heading("5. Banco de Dados"),
        para(normal("O banco PostgreSQL possui as seguintes tabelas principais:")),
        simpleTable(["Tabela", "Descrição"], [
          ["invoice_requests", "Solicitações de emissão de NF com workflow de status"],
          ["invoice_comments", "Comentários/timeline das notas fiscais"],
          ["invoice_status_history", "Histórico de mudanças de status de NFs"],
          ["supplier_invoices", "Notas fiscais de fornecedores recebidas"],
          ["supplier_invoice_status_history", "Histórico de status de NFs de fornecedores"],
          ["fixed_costs", "Custos fixos mensais por categoria"],
          ["people", "Cadastro de prestadores PJ"],
          ["pj_contracts", "Contratos de prestadores PJ"],
          ["pj_absences", "Ausências de prestadores"],
          ["commissions", "Comissões de prestadores"],
          ["salary_history", "Histórico salarial"],
          ["payroll_sheets", "Folhas de pagamento mensais"],
          ["payroll_items", "Itens individuais da folha"],
          ["payroll_nf_validations", "Validações de NFs da folha"],
          ["payroll_status_history", "Histórico de status da folha"],
          ["cash_flow_projects", "Projetos para projeção de caixa"],
          ["revenue_projections", "Projeções de receita por cliente/mês"],
          ["contracts", "Contratos inteligentes gerados"],
          ["contract_templates", "Templates de contratos"],
          ["contract_versions", "Versionamento de contratos"],
          ["contract_signers", "Signatários de contratos"],
          ["contract_analyses", "Análises de contratos por IA"],
          ["contract_ai_logs", "Logs de interações com IA jurídica"],
          ["reimbursement_requests", "Solicitações de reembolso"],
          ["reimbursement_policies", "Políticas de reembolso"],
          ["reimbursement_status_history", "Histórico de status de reembolsos"],
          ["pj_portal_profiles", "Perfis do portal PJ (auth ↔ person)"],
          ["user_roles", "Roles dos usuários (admin / secretary)"],
          ["granatum_*", "Tabelas espelhadas do Granatum (contas, lançamentos, categorias, centros de custo, pessoas)"],
        ]),

        // 6. Edge Functions
        heading("6. Edge Functions (Serverless)"),
        simpleTable(["Função", "Descrição"], [
          ["granatum-sync", "Sincroniza dados do Granatum via API"],
          ["granatum", "Proxy para consultas ao Granatum"],
          ["generate-contract", "Gera contratos com IA (Lovable AI)"],
          ["analyze-contract", "Analisa contratos existentes com IA"],
          ["legal-assistant", "Assistente jurídico conversacional"],
          ["clicksign-integration", "Integração com Clicksign para assinaturas"],
          ["send-invoice-email", "Envio de NF por e-mail (Resend)"],
          ["notify-invoice", "Notificações de notas fiscais"],
          ["validate-nf", "Validação de notas fiscais de fornecedores"],
          ["send-payslip", "Envio de holerites por e-mail"],
          ["create-pj-account", "Criação de conta para prestadores PJ"],
        ]),

        // 7. Segurança
        heading("7. Segurança"),
        bullet("Row-Level Security (RLS) habilitado em todas as tabelas — cada usuário acessa apenas seus próprios dados"),
        bullet("Autenticação obrigatória para acesso ao sistema (exceto rotas públicas: enviar-nota, enviar-nf-pj, solicitar-reembolso, portal-pj)"),
        bullet("Controle de roles no frontend (RoleGuard) e backend (RLS policies + database functions)"),
        bullet("Secrets gerenciados via Lovable Cloud (chaves de API nunca expostas no frontend)"),
        bullet("CORS configurado nas Edge Functions"),

        // 8. Deploy
        heading("8. Deploy e Infraestrutura"),
        bullet("Frontend hospedado via Lovable (build Vite → CDN)"),
        bullet("Backend Lovable Cloud (Supabase gerenciado)"),
        bullet("Edge Functions deployadas automaticamente"),
        bullet("Domínio: *.lovable.app (customizável)"),

        // Footer
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "— Documento gerado automaticamente pelo DecoAdmin® —", font: "Calibri", size: 18, italics: true, color: "999999" }),
        ]}),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `DecoAdmin-Documentacao-Tecnica-${new Date().toISOString().split('T')[0]}.docx`);
}
