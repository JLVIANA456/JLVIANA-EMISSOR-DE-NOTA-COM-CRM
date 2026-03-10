import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const payrollItemId = formData.get("payroll_item_id") as string;
    const expectedValue = parseFloat(formData.get("expected_value") as string);
    const expectedCnpj = formData.get("expected_cnpj") as string || "";

    if (!file || !payrollItemId) {
      return new Response(JSON.stringify({ error: "Missing file or payroll_item_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload file to storage
    const fileExt = file.name.split(".").pop();
    const filePath = `nf/${user.id}/${payrollItemId}/${Date.now()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("pj-documents")
      .upload(filePath, fileBuffer, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from("pj-documents").getPublicUrl(filePath);
    const fileUrl = urlData.publicUrl;

    // Convert file to base64 for AI
    const base64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    const mimeType = file.type || "image/png";

    // Call Lovable AI to extract NF data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em extrair dados de Notas Fiscais brasileiras.
Extraia os seguintes dados da NF:
- CNPJ do prestador
- Valor total da NF
- Data de emissão
- Número da NF
- Descrição do serviço

Responda APENAS com um JSON válido no formato:
{"cnpj": "XX.XXX.XXX/XXXX-XX", "valor": 1234.56, "data": "YYYY-MM-DD", "numero": "123", "descricao": "texto"}

Se não conseguir extrair algum campo, use null.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os dados desta Nota Fiscal:" },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let extracted = { cnpj: null as string | null, valor: null as number | null, data: null as string | null, numero: null as string | null, descricao: null as string | null };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
    }

    // Validate extracted data
    let validationStatus = "valida";
    const notes: string[] = [];

    if (extracted.valor !== null && !isNaN(expectedValue)) {
      const diff = Math.abs(extracted.valor - expectedValue);
      const pct = (diff / expectedValue) * 100;
      if (pct > 10) {
        validationStatus = "alerta";
        notes.push(`Valor da NF (R$ ${extracted.valor?.toFixed(2)}) difere ${pct.toFixed(1)}% do esperado (R$ ${expectedValue.toFixed(2)})`);
      }
    }

    if (expectedCnpj && extracted.cnpj) {
      const cleanExpected = expectedCnpj.replace(/\D/g, "");
      const cleanExtracted = extracted.cnpj.replace(/\D/g, "");
      if (cleanExpected && cleanExtracted && cleanExpected !== cleanExtracted) {
        validationStatus = "alerta";
        notes.push(`CNPJ da NF (${extracted.cnpj}) difere do cadastrado (${expectedCnpj})`);
      }
    }

    if (!extracted.valor && !extracted.cnpj) {
      validationStatus = "invalida";
      notes.push("Não foi possível extrair dados da NF. Verifique se o arquivo está legível.");
    }

    // Save validation to DB
    const { data: validation, error: insertError } = await supabase
      .from("payroll_nf_validations")
      .insert({
        payroll_item_id: payrollItemId,
        user_id: user.id,
        file_url: fileUrl,
        extracted_cnpj: extracted.cnpj,
        extracted_value: extracted.valor,
        extracted_date: extracted.data,
        expected_value: expectedValue,
        validation_status: validationStatus,
        validation_notes: notes.join("; ") || null,
      })
      .select()
      .single();

    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    // Update payroll item NF status
    await supabase
      .from("payroll_items")
      .update({ nf_status: validationStatus, nf_url: fileUrl })
      .eq("id", payrollItemId);

    return new Response(JSON.stringify({
      success: true,
      validation,
      extracted,
      validation_status: validationStatus,
      notes,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-nf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
