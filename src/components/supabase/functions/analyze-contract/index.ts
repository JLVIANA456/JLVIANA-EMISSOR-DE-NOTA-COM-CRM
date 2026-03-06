import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPLIANCE_CHECKLIST = [
  { id: "objeto", label: "Cláusula de Objeto/Escopo", weight: 15 },
  { id: "valor", label: "Cláusula de Valor e Forma de Pagamento", weight: 12 },
  { id: "prazo", label: "Cláusula de Prazo/Vigência", weight: 10 },
  { id: "rescisao", label: "Cláusula de Rescisão", weight: 10 },
  { id: "confidencialidade", label: "Cláusula de Confidencialidade/NDA", weight: 8 },
  { id: "propriedade_intelectual", label: "Cláusula de Propriedade Intelectual", weight: 8 },
  { id: "lgpd", label: "Cláusula LGPD/Proteção de Dados", weight: 10 },
  { id: "nao_vinculo", label: "Cláusula de Não Vínculo Empregatício", weight: 10 },
  { id: "multa", label: "Cláusula de Multa/Penalidade", weight: 5 },
  { id: "foro", label: "Cláusula de Foro", weight: 5 },
  { id: "exclusividade", label: "Cláusula de Exclusividade", weight: 3 },
  { id: "anticorrupcao", label: "Cláusula Anticorrupção", weight: 4 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { analysisId, fileUrl, fileName } = await req.json();
    if (!analysisId || !fileUrl) throw new Error("analysisId and fileUrl are required");

    // Update status to processing
    await supabase.from("contract_analyses").update({ status: "processando" }).eq("id", analysisId);

    // Download file content
    let fileContent = "";
    try {
      // If it's a storage URL, download via supabase storage
      if (fileUrl.includes("contract-documents")) {
        const pathMatch = fileUrl.match(/contract-documents\/(.+)$/);
        if (pathMatch) {
          const { data, error } = await supabase.storage.from("contract-documents").download(pathMatch[1]);
          if (error) throw error;
          fileContent = await data.text();
        }
      } else {
        const resp = await fetch(fileUrl);
        fileContent = await resp.text();
      }
    } catch (e) {
      console.error("Error downloading file:", e);
      fileContent = `[Arquivo: ${fileName}] - Conteúdo não pôde ser extraído diretamente. Analisar com base no nome do arquivo.`;
    }

    // Use AI to extract and analyze the contract
    const analysisPrompt = `Você é um especialista jurídico brasileiro em análise de contratos empresariais.

Analise o seguinte conteúdo contratual e retorne uma análise detalhada.

CONTEÚDO DO CONTRATO:
${fileContent.slice(0, 15000)}

INSTRUÇÕES:
Analise o contrato e para CADA item do checklist abaixo, indique:
- "found": true/false (se a cláusula foi encontrada)
- "status": "compliant" | "partial" | "missing" | "risk"
- "details": breve explicação (máx 2 frases)
- "recommendation": sugestão de melhoria se necessário

CHECKLIST DE COMPLIANCE:
${COMPLIANCE_CHECKLIST.map((item) => `- ${item.id}: ${item.label} (peso: ${item.weight}%)`).join("\n")}

Também forneça:
- "summary": resumo geral do contrato (3-5 frases)
- "contract_type_detected": tipo de contrato identificado
- "parties": partes envolvidas identificadas
- "risks": lista dos 3 principais riscos identificados
- "strengths": lista dos 3 pontos fortes do contrato

Use a ferramenta analyze_contract para retornar o resultado.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista jurídico em análise de contratos empresariais brasileiros." },
          { role: "user", content: analysisPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_contract",
              description: "Return the structured contract analysis result",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Resumo geral do contrato" },
                  contract_type_detected: { type: "string", description: "Tipo de contrato identificado" },
                  parties: {
                    type: "array",
                    items: { type: "string" },
                    description: "Partes envolvidas",
                  },
                  checklist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        found: { type: "boolean" },
                        status: { type: "string", enum: ["compliant", "partial", "missing", "risk"] },
                        details: { type: "string" },
                        recommendation: { type: "string" },
                      },
                      required: ["id", "found", "status", "details"],
                      additionalProperties: false,
                    },
                  },
                  risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 risks",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 3 strengths",
                  },
                },
                required: ["summary", "contract_type_detected", "parties", "checklist", "risks", "strengths"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_contract" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        await supabase.from("contract_analyses").update({ status: "erro" }).eq("id", analysisId);
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        await supabase.from("contract_analyses").update({ status: "erro" }).eq("id", analysisId);
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("Erro no serviço de IA");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) throw new Error("AI did not return structured analysis");

    const analysisResult = JSON.parse(toolCall.function.arguments);

    // Calculate compliance score
    let totalScore = 0;
    for (const checkItem of COMPLIANCE_CHECKLIST) {
      const result = analysisResult.checklist?.find((c: any) => c.id === checkItem.id);
      if (result) {
        if (result.status === "compliant") totalScore += checkItem.weight;
        else if (result.status === "partial") totalScore += checkItem.weight * 0.5;
        else if (result.status === "risk") totalScore += checkItem.weight * 0.25;
        // "missing" = 0
      }
    }

    const complianceScore = Math.round(totalScore);

    // Update analysis record
    await supabase.from("contract_analyses").update({
      status: "concluido",
      extracted_text: fileContent.slice(0, 50000),
      analysis_result: analysisResult,
      compliance_score: complianceScore,
    }).eq("id", analysisId);

    return new Response(JSON.stringify({ success: true, complianceScore, analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-contract error:", e);

    // Try to update status to error
    try {
      const { analysisId } = await req.clone().json();
      if (analysisId) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("contract_analyses").update({ status: "erro" }).eq("id", analysisId);
      }
    } catch {}

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
