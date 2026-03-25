import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authErr } = await supabaseAnon.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Parallel queries for brief
    const [
      { count: totalUsers },
      { count: newUsers24h },
      { count: signalCount24h },
      { count: sniperOppCount },
      { data: topSignals },
      { data: highRisk },
      { count: alertCount },
      { count: launchCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", day1),
      supabase.from("signal_events").select("*", { count: "exact", head: true }).gte("created_at", day1),
      supabase.from("sniper_opportunities").select("*", { count: "exact", head: true }).gte("created_at", day1),
      supabase.from("signal_events").select("category, score").gte("created_at", day1).gte("score", 70).order("score", { ascending: false }).limit(5),
      supabase.from("risk_scores").select("token_address, score, verdict").gte("score", 70).order("score", { ascending: false }).limit(5),
      supabase.from("alerts").select("*", { count: "exact", head: true }).gte("created_at", day7),
      supabase.from("launches").select("*", { count: "exact", head: true }).gte("created_at", day7),
    ]);

    const brief = {
      generated_at: now.toISOString(),
      period: "24h",
      metrics: {
        total_users: totalUsers ?? 0,
        new_users_24h: newUsers24h ?? 0,
        signals_24h: signalCount24h ?? 0,
        sniper_opportunities_24h: sniperOppCount ?? 0,
        alerts_7d: alertCount ?? 0,
        launches_7d: launchCount ?? 0,
      },
      top_signals: topSignals ?? [],
      high_risk_tokens: highRisk ?? [],
      what_matters_now: [] as string[],
      urgent_issues: [] as string[],
      opportunities: [] as string[],
    };

    // Generate insights
    if ((newUsers24h ?? 0) > 10) brief.what_matters_now.push(`${newUsers24h} new users in 24h — growth spike`);
    if ((signalCount24h ?? 0) === 0) brief.urgent_issues.push("No signals ingested in 24h — check pipeline");
    if ((highRisk?.length ?? 0) > 3) brief.urgent_issues.push(`${highRisk?.length} high-risk tokens detected`);
    if ((sniperOppCount ?? 0) > 20) brief.opportunities.push("High sniper activity — consider premium push");
    if (brief.what_matters_now.length === 0) brief.what_matters_now.push("System operating normally");

    return new Response(JSON.stringify({ ok: true, brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
