import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  rh_as_a_service: "RH as a Service",
  consultoria_rh: "Consultoria de RH",
  comunicacao_interna: "Comunicação Interna",
  contrato_vagas: "Contrato para Vagas",
  parceiro_geral: "Contrato Padrão Geral de Parceria",
  parceiro_projeto: "Contrato Específico por Projeto de Parceria",
  prestacao_servicos: "Prestação de Serviços PJ",
  aditivo_contratual: "Aditivo Contratual",
  distrato: "Distrato",
  propriedade_intelectual: "Cláusulas de Propriedade Intelectual",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { form } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeLabel = CONTRACT_TYPE_LABELS[form.contract_type] || form.contract_type;

    const systemPrompt = `Você é um especialista em direito contratual empresarial brasileiro. Sua função é redigir contratos completos e profissionais com base nos dados fornecidos.

REGRAS OBRIGATÓRIAS:
1. Redija o contrato completo em português jurídico formal brasileiro
2. Inclua todas as cláusulas obrigatórias para o tipo de contrato
3. Inclua cláusula de não vínculo empregatício (para contratos PJ)
4. Inclua cláusula de confidencialidade se solicitado
5. Inclua cláusula de propriedade intelectual se solicitado
6. Inclua cláusula de exclusividade se solicitado
7. Inclua cláusula LGPD
8. Inclua foro competente
9. Inclua cláusula de rescisão com multa definida
10. Use formato profissional com numeração de cláusulas
11. Identifique e mitigue riscos de subordinação e vínculo trabalhista
12. NÃO invente dados não fornecidos - use [A PREENCHER] para dados faltantes
13. Ao final, SEMPRE inclua: "⚠️ AVISO: Este documento deve passar por revisão jurídica final antes da assinatura."`;

    const userPrompt = `Gere um contrato do tipo "${typeLabel}" com os seguintes dados:

EMPRESA CONTRATANTE:
- CNPJ: ${form.company_cnpj || "[A PREENCHER]"}
- Razão Social: ${form.company_razao_social || "[A PREENCHER]"}
- Nome Fantasia: ${form.company_nome_fantasia || "[A PREENCHER]"}
- Endereço: ${form.company_address || "[A PREENCHER]"}
- Representante Legal: ${form.company_representative || "[A PREENCHER]"}
- CPF do Representante: ${form.company_representative_cpf || "[A PREENCHER]"}
- Cargo: ${form.company_representative_role || "[A PREENCHER]"}

CONTRATADA:
- CNPJ: ${form.contractor_cnpj || "[A PREENCHER]"}
- Razão Social: ${form.contractor_razao_social || "[A PREENCHER]"}
- Endereço: ${form.contractor_address || "[A PREENCHER]"}
- Representante: ${form.contractor_representative || "[A PREENCHER]"}
- CPF: ${form.contractor_representative_cpf || "[A PREENCHER]"}
- Dados Bancários: ${form.contractor_bank_details || "[A PREENCHER]"}
- PIX: ${form.contractor_pix || "[A PREENCHER]"}
- Regime Tributário: ${form.contractor_tax_regime || "[A PREENCHER]"}

DADOS CONTRATUAIS:
- Valor: R$ ${form.contract_value || "[A PREENCHER]"}
- Forma de Pagamento: ${form.payment_method || "PIX"}
- Prazo: ${form.contract_duration || "[A PREENCHER]"}
- Data de Início: ${form.start_date || "[A PREENCHER]"}
- Data de Término: ${form.end_date || "[A PREENCHER]"}
- Escopo: ${form.scope_summary || "[A PREENCHER]"}
- Multa Rescisória: ${form.termination_penalty || "10"}%
- Confidencialidade: ${form.has_confidentiality ? "SIM" : "NÃO"}
- Propriedade Intelectual: ${form.has_intellectual_property ? "SIM" : "NÃO"}
- Exclusividade: ${form.has_exclusivity ? "SIM" : "NÃO"}

Gere o contrato completo e profissional.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no serviço de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Erro ao gerar conteúdo.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-contract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
