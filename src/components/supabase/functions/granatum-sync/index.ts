import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRANATUM_BASE = "https://api.granatum.com.br/v1";

async function fetchGranatum(endpoint: string, params: Record<string, string> = {}) {
  const token = Deno.env.get("GRANATUM_API_TOKEN")!;
  const url = new URL(`${GRANATUM_BASE}/${endpoint}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Granatum ${endpoint} error ${res.status}: ${text}`);
  }
  return res.json();
}

function flattenCategories(categories: any[], userId: string, parentId: number | null = null): any[] {
  const result: any[] = [];
  for (const cat of categories) {
    result.push({
      id: cat.id,
      descricao: cat.descricao,
      parent_id: parentId || cat.parent_id || null,
      tipo_categoria_id: cat.tipo_categoria_id,
      cor: cat.cor || null,
      ativo: cat.ativo,
      user_id: userId,
      synced_at: new Date().toISOString(),
    });
    if (cat.categorias_filhas?.length) {
      result.push(...flattenCategories(cat.categorias_filhas, userId, cat.id));
    }
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate user
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const results: Record<string, any> = {};

    // 1. Sync Contas
    try {
      const contas = await fetchGranatum("contas");
      // Delete old, insert new
      await supabase.from("granatum_contas").delete().eq("user_id", userId);
      if (contas.length > 0) {
        const rows = contas.map((c: any) => ({
          id: c.id,
          descricao: c.descricao,
          saldo: parseFloat(c.saldo) || 0,
          ativo: c.ativo,
          user_id: userId,
          synced_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("granatum_contas").upsert(rows);
        if (error) throw error;
      }
      results.contas = { count: contas.length, status: "ok" };
    } catch (e) {
      results.contas = { status: "error", message: String(e) };
    }

    // 2. Sync Categorias
    try {
      const categorias = await fetchGranatum("categorias");
      await supabase.from("granatum_categorias").delete().eq("user_id", userId);
      const flat = flattenCategories(categorias, userId);
      if (flat.length > 0) {
        const { error } = await supabase.from("granatum_categorias").upsert(flat);
        if (error) throw error;
      }
      results.categorias = { count: flat.length, status: "ok" };
    } catch (e) {
      results.categorias = { status: "error", message: String(e) };
    }

    // 3. Sync Centros de Custo
    try {
      const centros = await fetchGranatum("centros_custo_lucro");
      await supabase.from("granatum_centros_custo").delete().eq("user_id", userId);
      if (centros.length > 0) {
        const rows = centros.map((c: any) => ({
          id: c.id,
          descricao: c.descricao,
          ativo: c.ativo,
          user_id: userId,
          synced_at: new Date().toISOString(),
        }));
        const { error } = await supabase.from("granatum_centros_custo").upsert(rows);
        if (error) throw error;
      }
      results.centros_custo = { count: centros.length, status: "ok" };
    } catch (e) {
      results.centros_custo = { status: "error", message: String(e) };
    }

    // 4. Sync Clientes
    try {
      const clientes = await fetchGranatum("clientes");
      const fornecedores = await fetchGranatum("fornecedores");

      // Merge into unified pessoas table
      const pessoasMap = new Map<number, any>();
      for (const c of clientes) {
        pessoasMap.set(c.id, {
          id: c.id,
          nome: c.nome,
          nome_fantasia: c.nome_fantasia || null,
          documento: c.documento || null,
          email: c.email || null,
          telefone: c.telefone || null,
          is_cliente: true,
          is_fornecedor: false,
          ativo: c.ativo,
          user_id: userId,
          synced_at: new Date().toISOString(),
        });
      }
      for (const f of fornecedores) {
        if (pessoasMap.has(f.id)) {
          pessoasMap.get(f.id).is_fornecedor = true;
        } else {
          pessoasMap.set(f.id, {
            id: f.id,
            nome: f.nome,
            nome_fantasia: f.nome_fantasia || null,
            documento: f.documento || null,
            email: f.email || null,
            telefone: f.telefone || null,
            is_cliente: false,
            is_fornecedor: true,
            ativo: f.ativo,
            user_id: userId,
            synced_at: new Date().toISOString(),
          });
        }
      }

      await supabase.from("granatum_pessoas").delete().eq("user_id", userId);
      const pessoas = Array.from(pessoasMap.values());
      if (pessoas.length > 0) {
        // Insert in batches of 500
        for (let i = 0; i < pessoas.length; i += 500) {
          const batch = pessoas.slice(i, i + 500);
          const { error } = await supabase.from("granatum_pessoas").upsert(batch);
          if (error) throw error;
        }
      }
      results.pessoas = { count: pessoas.length, status: "ok" };
    } catch (e) {
      results.pessoas = { status: "error", message: String(e) };
    }

    // 5. Sync Lancamentos (for each conta)
    try {
      const contas = await fetchGranatum("contas");
      await supabase.from("granatum_lancamentos").delete().eq("user_id", userId);

      let totalLancamentos = 0;
      for (const conta of contas) {
        if (!conta.permite_lancamento) continue;
        const lancamentos = await fetchGranatum("lancamentos", { conta_id: String(conta.id) });
        if (lancamentos.length > 0) {
          const rows = lancamentos.map((l: any) => ({
            id: l.id,
            descricao: l.descricao || "",
            valor: parseFloat(l.valor) || 0,
            data_competencia: l.data_competencia || null,
            data_vencimento: l.data_vencimento || null,
            data_pagamento: l.data_pagamento || null,
            status: l.status || "",
            tipo_lancamento_id: l.tipo_lancamento_id,
            categoria_id: l.categoria_id || null,
            centro_custo_lucro_id: l.centro_custo_lucro_id || null,
            conta_id: l.conta_id || null,
            pessoa_id: l.pessoa_id || null,
            observacao: l.observacao || null,
            user_id: userId,
            synced_at: new Date().toISOString(),
          }));
          // Insert in batches
          for (let i = 0; i < rows.length; i += 500) {
            const batch = rows.slice(i, i + 500);
            const { error } = await supabase.from("granatum_lancamentos").upsert(batch);
            if (error) throw error;
          }
          totalLancamentos += lancamentos.length;
        }
      }
      results.lancamentos = { count: totalLancamentos, status: "ok" };
    } catch (e) {
      results.lancamentos = { status: "error", message: String(e) };
    }

    // Log sync
    await supabase.from("granatum_sync_log").insert({
      user_id: userId,
      endpoint: "full_sync",
      records_synced: Object.values(results).reduce((sum: number, r: any) => sum + (r.count || 0), 0),
      status: Object.values(results).every((r: any) => r.status === "ok") ? "success" : "partial",
      completed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Sync failed", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
