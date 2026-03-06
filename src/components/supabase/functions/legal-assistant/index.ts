import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, contractContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um assistente jurídico especializado em direito contratual empresarial brasileiro. Sua expertise inclui:

ÁREAS DE ESPECIALIDADE:
- Direito contratual empresarial brasileiro
- Contratos de prestação de serviços
- Risco de vínculo trabalhista e subordinação
- Propriedade intelectual
- Lei Geral de Proteção de Dados (LGPD)
- Contratos de consultoria e parceria

REGRAS DE COMPORTAMENTO:
1. NÃO altere cláusulas estruturais sem autorização explícita
2. NÃO remova cláusulas obrigatórias
3. SEMPRE identifique riscos de subordinação e vínculo empregatício
4. SEMPRE identifique cláusulas ambíguas
5. SEMPRE sugira melhorias técnicas com base na legislação vigente
6. SEMPRE recomende revisão jurídica final
7. Responda em português brasileiro formal mas acessível
8. Use formatação markdown para organizar suas respostas
9. Cite artigos de lei quando relevante (CLT, Código Civil, LGPD, etc.)

MENSAGEM OBRIGATÓRIA: Ao final de qualquer análise ou sugestão de redação, SEMPRE inclua:
"⚠️ **Aviso:** Este conteúdo é informativo e não substitui aconselhamento jurídico profissional. Todo contrato deve passar por revisão jurídica final antes da assinatura."

${contractContext ? `\nCONTEXTO DO CONTRATO VINCULADO:\n${contractContext.slice(0, 8000)}` : ""}`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no serviço de IA");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("legal-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
