import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvoiceEmailRequest {
  to: string;
  subject: string;
  body: string;
  invoiceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, invoiceId }: InvoiceEmailRequest = await req.json();

    if (!to || !subject || !body) {
      throw new Error("Campos obrigatórios ausentes: to, subject, body");
    }

    // Convert plain text to HTML preserving line breaks and bullet points
    const htmlBody = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/•/g, "&#8226;")
      .replace(/\n/g, "<br>");

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="border-bottom: 3px solid #1a1f36; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #1a1f36; font-size: 18px;">Decoding People</h2>
          <p style="margin: 4px 0 0; color: #666; font-size: 12px;">Gestão Financeira</p>
        </div>
        <div style="font-size: 14px; line-height: 1.6;">
          ${htmlBody}
        </div>
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
          <p>Este é um e-mail automático gerado pelo sistema financeiro da Decoding People.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Financeiro Decoding <financeiro@decodingp.com>",
      to: [to],
      subject,
      html: emailHtml,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
