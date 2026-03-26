import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

interface SignalInput {
  source: string;
  source_type?: string;
  category: string;
  token_address?: string;
  wallet_address?: string;
  severity?: string;
  confidence?: number;
  tags?: string[];
  summary?: string;
  raw_data?: Record<string, unknown>;
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  smart_wallet_buy: 25,
  whale_movement: 20,
  volume_spike: 18,
  new_launch: 15,
  liquidity_change: 12,
  holder_shift: 10,
  momentum_burst: 22,
  risk_indicator: -15,
  watchlist_activity: 8,
};

function scoreSignal(input: SignalInput): number {
  const base = CATEGORY_WEIGHTS[input.category] ?? 10;
  const conf = (input.confidence ?? 50) / 100;
  const severityMult =
    input.severity === "critical"
      ? 1.5
      : input.severity === "high"
      ? 1.3
      : input.severity === "medium"
      ? 1.0
      : 0.7;
  return Math.max(0, Math.min(100, Math.round(base * conf * severityMult * 2)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Auth: admin-only endpoint (system/internal)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: jsonHeaders });
    }

    const body = await req.json();
    const events: SignalInput[] = Array.isArray(body) ? body : [body];

    if (events.length === 0 || events.length > 100) {
      return new Response(
        JSON.stringify({ error: "Provide 1-100 events" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const rows = events.map((e) => ({
      source: e.source,
      source_type: e.source_type ?? "system",
      category: e.category,
      token_address: e.token_address ?? null,
      wallet_address: e.wallet_address ?? null,
      severity: e.severity ?? "info",
      confidence: Math.max(0, Math.min(100, e.confidence ?? 50)),
      score: scoreSignal(e),
      tags: e.tags ?? [],
      summary: e.summary ?? null,
      raw_data: e.raw_data ?? {},
      processed: true,
    }));

    const { data, error } = await supabase
      .from("signal_events")
      .insert(rows)
      .select("id, score, category, severity");

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, ingested: data?.length ?? 0, signals: data }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
