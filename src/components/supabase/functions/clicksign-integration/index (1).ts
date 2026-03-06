import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLICKSIGN_BASE = "https://app.clicksign.com"; // Use sandbox.clicksign.com for testing

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLICKSIGN_API_KEY = Deno.env.get("CLICKSIGN_API_KEY");
    if (!CLICKSIGN_API_KEY) throw new Error("CLICKSIGN_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, contractId, signers, userId } = await req.json();

    if (!action) throw new Error("action is required");

    // ---- ACTION: upload document to Clicksign ----
    if (action === "upload_document") {
      if (!contractId || !userId) throw new Error("contractId and userId required");

      // Get contract
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single();
      if (contractError || !contract) throw new Error("Contrato não encontrado");

      if (!contract.generated_content) throw new Error("Contrato não possui conteúdo gerado");

      // Generate a valid PDF from contract content
      const pdf = new jsPDF({ format: "a4", unit: "mm" });
      const marginLeft = 20;
      const marginTop = 25;
      const marginBottom = 20;
      const pageWidth = 210 - marginLeft * 2; // A4 width minus margins
      const pageHeight = 297;
      const lineHeight = 6;
      let y = marginTop;

      const rawText = contract.generated_content as string;
      const lines = rawText.split("\n");

      for (const rawLine of lines) {
        // Strip markdown formatting
        let line = rawLine.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").trim();
        
        // Detect titles/clauses
        const isTitle = rawLine.startsWith("#") || rawLine.startsWith("**") || /^CL[ÁA]USULA/i.test(line);

        if (isTitle) {
          pdf.setFont("Helvetica", "bold");
          pdf.setFontSize(12);
        } else {
          pdf.setFont("Helvetica", "normal");
          pdf.setFontSize(10);
        }

        // Handle empty lines as spacing
        if (!line) {
          y += lineHeight * 0.5;
          if (y > pageHeight - marginBottom) {
            pdf.addPage();
            y = marginTop;
          }
          continue;
        }

        // Split long lines to fit page width
        const splitLines: string[] = pdf.splitTextToSize(line, pageWidth);
        for (const sl of splitLines) {
          if (y > pageHeight - marginBottom) {
            pdf.addPage();
            y = marginTop;
          }
          pdf.text(sl, marginLeft, y);
          y += lineHeight;
        }

        // Extra spacing after titles
        if (isTitle) {
          y += lineHeight * 0.3;
        }
      }

      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // Upload to Clicksign
      const safeName = contract.title.replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 60);
      const uploadResp = await fetch(
        `${CLICKSIGN_BASE}/api/v1/documents?access_token=${CLICKSIGN_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            document: {
              path: `/Contratos/${safeName}.pdf`,
              content_base64: `data:application/pdf;base64,${pdfBase64}`,
              deadline_at: contract.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              auto_close: true,
              locale: "pt-BR",
              sequence_enabled: false,
            },
          }),
        }
      );

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        console.error("Clicksign upload error:", uploadResp.status, errText);
        throw new Error(`Erro ao enviar para Clicksign: ${uploadResp.status}`);
      }

      const uploadData = await uploadResp.json();
      const documentKey = uploadData.document?.key;

      if (!documentKey) throw new Error("Clicksign não retornou a chave do documento");

      // Update contract with Clicksign key
      await supabase.from("contracts").update({
        clicksign_document_key: documentKey,
        clicksign_status: "documento_enviado",
        status: "enviado_assinatura",
      }).eq("id", contractId);

      return new Response(JSON.stringify({ success: true, documentKey }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: create signer ----
    if (action === "create_signer") {
      if (!contractId || !signers?.length) throw new Error("contractId and signers required");

      const { data: contract } = await supabase
        .from("contracts")
        .select("clicksign_document_key")
        .eq("id", contractId)
        .single();

      if (!contract?.clicksign_document_key) {
        throw new Error("Contrato não foi enviado para Clicksign ainda");
      }

      const results = [];

      for (const signer of signers) {
        // Create signer in Clicksign
        const signerResp = await fetch(
          `${CLICKSIGN_BASE}/api/v1/signers?access_token=${CLICKSIGN_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              signer: {
                email: signer.email,
                auths: ["email"],
                name: signer.name,
                documentation: signer.cpf || undefined,
                birthday: undefined,
                phone_number: undefined,
              },
            }),
          }
        );

        if (!signerResp.ok) {
          const errText = await signerResp.text();
          console.error("Clicksign signer error:", signerResp.status, errText);
          throw new Error(`Erro ao criar signatário ${signer.name}: ${signerResp.status}`);
        }

        const signerData = await signerResp.json();
        const signerKey = signerData.signer?.key;

        // Add signer to document (create list)
        const listResp = await fetch(
          `${CLICKSIGN_BASE}/api/v1/lists?access_token=${CLICKSIGN_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              list: {
                document_key: contract.clicksign_document_key,
                signer_key: signerKey,
                sign_as: signer.role === "testemunha" ? "witness" : "sign",
                refusable: true,
              },
            }),
          }
        );

        if (!listResp.ok) {
          const errText = await listResp.text();
          console.error("Clicksign list error:", listResp.status, errText);
          throw new Error(`Erro ao vincular signatário ${signer.name} ao documento`);
        }

        const listData = await listResp.json();
        const requestSignatureKey = listData.list?.request_signature_key;

        // Update signer in our DB
        if (signer.id) {
          await supabase.from("contract_signers").update({
            clicksign_signer_key: signerKey,
            request_signature_key: requestSignatureKey || null,
          }).eq("id", signer.id);
        }

        results.push({ name: signer.name, signerKey, requestSignatureKey });
      }

      // Update contract status
      await supabase.from("contracts").update({
        clicksign_status: "aguardando_assinaturas",
      }).eq("id", contractId);

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: check status ----
    if (action === "check_status") {
      if (!contractId) throw new Error("contractId required");

      const { data: contract } = await supabase
        .from("contracts")
        .select("clicksign_document_key")
        .eq("id", contractId)
        .single();

      if (!contract?.clicksign_document_key) {
        throw new Error("Contrato sem chave Clicksign");
      }

      const statusResp = await fetch(
        `${CLICKSIGN_BASE}/api/v1/documents/${contract.clicksign_document_key}?access_token=${CLICKSIGN_API_KEY}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!statusResp.ok) {
        const errText = await statusResp.text();
        console.error("Clicksign status error:", statusResp.status, errText);
        throw new Error("Erro ao consultar status na Clicksign");
      }

      const statusData = await statusResp.json();
      const doc = statusData.document;

      // Map Clicksign status
      let newStatus = "aguardando_assinaturas";
      if (doc?.status === "closed") newStatus = "assinado";
      else if (doc?.status === "canceled") newStatus = "cancelado";
      else if (doc?.status === "running") newStatus = "aguardando_assinaturas";

      // Update signers status from events and extract request_signature_keys
      const signerEvents = doc?.events || [];
      for (const event of signerEvents) {
        if (event.name === "sign" && event.signer?.key) {
          await supabase.from("contract_signers")
            .update({ signed_at: event.occurred_at })
            .eq("clicksign_signer_key", event.signer.key)
            .eq("contract_id", contractId);
        }
      }

      // Extract request_signature_keys from document signers list
      const docSigners = doc?.signers || [];
      for (const ds of docSigners) {
        if (ds.key && ds.request_signature_key) {
          await supabase.from("contract_signers")
            .update({ request_signature_key: ds.request_signature_key })
            .eq("clicksign_signer_key", ds.key)
            .eq("contract_id", contractId);
        }
      }

      // Update contract
      await supabase.from("contracts").update({
        clicksign_status: newStatus,
        status: newStatus === "assinado" ? "assinado" : "enviado_assinatura",
        final_pdf_url: doc?.downloads?.signed_file_url || null,
      }).eq("id", contractId);

      return new Response(JSON.stringify({
        success: true,
        status: newStatus,
        document: {
          status: doc?.status,
          created_at: doc?.created_at,
          updated_at: doc?.updated_at,
          downloads: doc?.downloads,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: notify signers (resend) ----
    if (action === "notify_signers") {
      if (!contractId) throw new Error("contractId required");

      // Get signers with request_signature_key
      const { data: signersList, error: signersError } = await supabase
        .from("contract_signers")
        .select("id, name, request_signature_key, signed_at")
        .eq("contract_id", contractId)
        .is("signed_at", null);

      if (signersError) throw signersError;
      if (!signersList?.length) throw new Error("Nenhum signatário pendente encontrado");

      const notifyResults = [];
      for (const s of signersList) {
        if (!s.request_signature_key) {
          notifyResults.push({ name: s.name, status: "sem_chave" });
          continue;
        }

        const notifyResp = await fetch(
          `${CLICKSIGN_BASE}/api/v1/notifications?access_token=${CLICKSIGN_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              request_signature_key: s.request_signature_key,
              message: "Por favor, assine o contrato.",
            }),
          }
        );

        if (!notifyResp.ok) {
          const errText = await notifyResp.text();
          console.error(`Clicksign notify error for ${s.name}:`, notifyResp.status, errText);
          notifyResults.push({ name: s.name, status: "erro", error: errText });
        } else {
          notifyResults.push({ name: s.name, status: "notificado" });
        }
      }

      return new Response(JSON.stringify({ success: true, results: notifyResults }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (e) {
    console.error("clicksign-integration error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
