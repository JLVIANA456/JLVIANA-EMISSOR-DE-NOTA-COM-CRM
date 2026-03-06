import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an admin
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar acessos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { person_id, email, temp_password } = await req.json();

    if (!person_id || !email || !temp_password) {
      return new Response(
        JSON.stringify({ error: "person_id, email e temp_password são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if person exists and is PJ
    const { data: person, error: personError } = await adminClient
      .from("people")
      .select("id, name, contract_type, is_active, email")
      .eq("id", person_id)
      .single();

    if (personError || !person) {
      return new Response(
        JSON.stringify({ error: "Colaborador não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["pj", "prestacao_servicos_pj"].includes(person.contract_type)) {
      return new Response(
        JSON.stringify({ error: "Apenas colaboradores PJ podem ter acesso ao portal" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if profile already exists for this person
    const { data: existingProfile } = await adminClient
      .from("pj_portal_profiles")
      .select("id")
      .eq("person_id", person_id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Este colaborador já possui acesso ao portal" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: temp_password,
        email_confirm: true,
      });

    if (createError) {
      // If user already exists, try to get the existing user
      if (createError.message?.includes("already been registered")) {
        const { data: { users } } = await adminClient.auth.admin.listUsers();
        const existing = users?.find((u: any) => u.email === email);
        if (existing) {
          // Link profile
          await adminClient.from("pj_portal_profiles").insert({
            auth_user_id: existing.id,
            person_id,
          });
          return new Response(
            JSON.stringify({
              success: true,
              message: "Conta já existia. Perfil vinculado com sucesso.",
              user_id: existing.id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      return new Response(
        JSON.stringify({ error: "Erro ao criar conta: " + createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create portal profile link
    await adminClient.from("pj_portal_profiles").insert({
      auth_user_id: newUser.user.id,
      person_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Acesso criado para ${person.name}`,
        user_id: newUser.user.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
