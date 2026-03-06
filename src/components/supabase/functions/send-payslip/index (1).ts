import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHS_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { payroll_id } = await req.json();
    if (!payroll_id) {
      return new Response(JSON.stringify({ error: "payroll_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch sheet
    const { data: sheet, error: sheetError } = await supabase
      .from("payroll_sheets")
      .select("*")
      .eq("id", payroll_id)
      .single();
    if (sheetError || !sheet) {
      return new Response(JSON.stringify({ error: "Folha não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from("payroll_items")
      .select("*")
      .eq("payroll_id", payroll_id);
    if (itemsError) throw itemsError;

    // Fetch people
    const personIds = items.map((i: any) => i.person_id);
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select("id, name, email, cnpj, role")
      .in("id", personIds);
    if (peopleError) throw peopleError;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results: Array<{ person: string; email: string; status: string; error?: string }> = [];

    for (const item of items) {
      const person = people.find((p: any) => p.id === item.person_id);
      if (!person || !person.email) {
        results.push({ person: person?.name || item.person_id, email: "—", status: "skipped", error: "Sem e-mail cadastrado" });
        continue;
      }

      const period = `${MONTHS_FULL[sheet.month - 1]} / ${sheet.year}`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
  .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1e3a5f; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .content { padding: 24px 32px; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .info-row:last-child { border-bottom: none; }
  .label { color: #666; }
  .value { font-weight: 600; color: #1e3a5f; }
  .total-row { background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .total-label { font-size: 15px; font-weight: 600; color: #333; }
  .total-value { font-size: 20px; font-weight: 700; color: #1e3a5f; }
  .footer { padding: 16px 32px; background: #f8fafc; text-align: center; font-size: 11px; color: #999; }
  .notes { margin-top: 16px; padding: 12px; background: #fef9e7; border-radius: 8px; font-size: 12px; color: #856404; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Holerite PJ — ${period}</h1>
    <p>Recibo de pagamento</p>
  </div>
  <div class="content">
    <div class="info-row"><span class="label">Prestador</span><span class="value">${person.name}</span></div>
    ${person.cnpj ? `<div class="info-row"><span class="label">CNPJ</span><span class="value">${person.cnpj}</span></div>` : ""}
    ${person.role ? `<div class="info-row"><span class="label">Função</span><span class="value">${person.role}</span></div>` : ""}
    <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
    <div class="info-row"><span class="label">Valor Base</span><span class="value">${fmt(Number(item.base_value))}</span></div>
    <div class="info-row"><span class="label">Ajustes</span><span class="value">${fmt(Number(item.adjustments))}</span></div>
    <div class="info-row"><span class="label">Reembolsos</span><span class="value">${fmt(Number(item.reimbursements))}</span></div>
    <div class="info-row"><span class="label">Bonificação</span><span class="value">${fmt(Number(item.bonus))}</span></div>
    ${item.adjustment_reason ? `<div class="info-row"><span class="label">Motivo Ajuste</span><span class="value" style="font-weight:normal;font-size:12px">${item.adjustment_reason}</span></div>` : ""}
    ${item.bonus_reason ? `<div class="info-row"><span class="label">Motivo Bônus</span><span class="value" style="font-weight:normal;font-size:12px">${item.bonus_reason}</span></div>` : ""}
    <div class="total-row">
      <span class="total-label">Total Líquido</span>
      <span class="total-value">${fmt(Number(item.total_value))}</span>
    </div>
    ${item.debit_note ? `<div class="notes">⚠️ Este pagamento inclui nota de débito.${item.debit_note_reason ? ` Motivo: ${item.debit_note_reason}` : ""}</div>` : ""}
  </div>
  <div class="footer">
    Gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} • DecoFinance®
  </div>
</div>
</body>
</html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DecoFinance <onboarding@resend.dev>",
            to: [person.email],
            subject: `Holerite PJ — ${period}`,
            html: htmlBody,
          }),
        });

        const resBody = await res.json();
        if (res.ok) {
          results.push({ person: person.name, email: person.email, status: "sent" });
        } else {
          results.push({ person: person.name, email: person.email, status: "error", error: resBody.message || "Erro no envio" });
        }
      } catch (err) {
        results.push({ person: person.name, email: person.email, status: "error", error: String(err) });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(JSON.stringify({ sent, skipped, errors, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
