import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personName, personEmail, baseSalary, commission, total, month, year, invoiceLink } = await req.json();

    if (!personEmail) {
      return new Response(JSON.stringify({ error: "Email do colaborador não informado" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[(month || 1) - 1] || "—";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0a1e3d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #d4e157; margin: 0; font-size: 20px;">DecoFinance®</h1>
    <p style="color: #7dd3fc; margin: 4px 0 0; font-size: 13px;">Notificação de Faturamento</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <p>Olá <strong>${personName}</strong>,</p>
    <p>Segue abaixo a discriminação dos valores referentes a <strong>${monthName}/${year}</strong>:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600;">Salário Base</td>
        <td style="padding: 10px 12px; border: 1px solid #e0e0e0; text-align: right;">${fmtBRL(baseSalary || 0)}</td>
      </tr>
      ${commission > 0 ? `
      <tr>
        <td style="padding: 10px 12px; border: 1px solid #e0e0e0; font-weight: 600;">Comissão</td>
        <td style="padding: 10px 12px; border: 1px solid #e0e0e0; text-align: right; color: #16a34a;">${fmtBRL(commission)}</td>
      </tr>` : ''}
      <tr style="background: #0a1e3d;">
        <td style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 700; color: #ffffff;">TOTAL DA NOTA</td>
        <td style="padding: 12px; border: 1px solid #e0e0e0; text-align: right; font-weight: 700; color: #d4e157; font-size: 16px;">${fmtBRL(total || 0)}</td>
      </tr>
    </table>

    <p>Por favor, emita a nota fiscal no valor de <strong>${fmtBRL(total || 0)}</strong> para o período de <strong>${monthName}/${year}</strong>.</p>

    ${invoiceLink ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${invoiceLink}" style="background: #0a1e3d; color: #d4e157; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        Emitir Nota Fiscal →
      </a>
    </div>` : ''}

    <p style="font-size: 12px; color: #888; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 12px;">
      Este é um email automático enviado pelo sistema DecoFinance®. Em caso de dúvidas, entre em contato com o financeiro.
    </p>
  </div>
</body>
</html>`;

    // Send email using Supabase Auth admin API (resend)
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: personEmail,
      }),
    });

    // Since we can't send arbitrary emails via Supabase Auth,
    // we'll use a simple SMTP approach or just return the email content
    // For now, we'll use the Supabase edge function's built-in fetch to send via Resend if available
    
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DecoFinance <onboarding@resend.dev>",
          to: [personEmail],
          subject: `Emissão de Nota Fiscal - ${monthName}/${year} - ${fmtBRL(total || 0)}`,
          html: htmlBody,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return new Response(JSON.stringify({ error: "Erro ao enviar email", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "Email enviado com sucesso" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: return email content for manual sending
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notificação preparada (configure RESEND_API_KEY para envio automático)",
      emailContent: {
        to: personEmail,
        subject: `Emissão de Nota Fiscal - ${monthName}/${year} - ${fmtBRL(total || 0)}`,
        html: htmlBody,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
