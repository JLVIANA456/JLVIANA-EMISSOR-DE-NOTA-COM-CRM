const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRANATUM_BASE = "https://api.granatum.com.br/v1";

const ALLOWED_ENDPOINTS = [
  "lancamentos",
  "contas",
  "categorias",
  "centros_custo_lucro",
  "clientes",
  "fornecedores",
  "formas_pagamento",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT using Supabase Auth API
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const jwtToken = authHeader.replace("Bearer ", "");

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        apikey: supabaseKey,
      },
    });

    if (!userRes.ok) {
      await userRes.text();
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await userRes.json();

    // Parse request
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint", allowed: ALLOWED_ENDPOINTS }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const granatumToken = Deno.env.get("GRANATUM_API_TOKEN");
    if (!granatumToken) {
      return new Response(
        JSON.stringify({ error: "Granatum token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Granatum URL
    const granatumUrl = new URL(`${GRANATUM_BASE}/${endpoint}`);
    granatumUrl.searchParams.set("access_token", granatumToken);

    for (const [key, value] of url.searchParams.entries()) {
      if (key !== "endpoint" && key !== "access_token") {
        granatumUrl.searchParams.set(key, value);
      }
    }

    const method = req.method;
    const fetchOptions: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (["POST", "PUT"].includes(method)) {
      const body = await req.text();
      if (body) fetchOptions.body = body;
    }

    const granatumResponse = await fetch(granatumUrl.toString(), fetchOptions);
    const data = await granatumResponse.json();

    return new Response(JSON.stringify(data), {
      status: granatumResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Granatum proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
