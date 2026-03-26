import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const W = {
  momentum: 0.20,
  smartMoney: 0.20,
  whale: 0.15,
  freshness: 0.15,
  liquidity: 0.15,
  riskPenalty: 0.15,
};

interface SignalRow {
  token_address: string;
  category: string;
  score: number;
  confidence: number;
  severity: string;
  created_at: string;
}

function actionLabel(score: number, riskScore: number): string {
  if (riskScore >= 70) return "avoid";
  if (riskScore >= 50) return "caution";
  if (score >= 80) return "hot";
  if (score >= 60) return "early";
  return "watch";
}

function urgencyLevel(score: number): string {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Auth: admin-only endpoint
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

    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: signals, error: sigErr } = await supabase
      .from("signal_events")
      .select("token_address, category, score, confidence, severity, created_at")
      .gte("created_at", cutoff)
      .gte("score", 20)
      .not("token_address", "is", null)
      .order("score", { ascending: false })
      .limit(500);

    if (sigErr) throw sigErr;

    const tokenMap = new Map<string, SignalRow[]>();
    for (const s of (signals ?? []) as SignalRow[]) {
      if (!s.token_address) continue;
      const arr = tokenMap.get(s.token_address) ?? [];
      arr.push(s);
      tokenMap.set(s.token_address, arr);
    }

    const tokenAddresses = [...tokenMap.keys()];
    const { data: risks } = await supabase
      .from("risk_scores")
      .select("token_address, score")
      .in("token_address", tokenAddresses.length > 0 ? tokenAddresses : ["__none__"]);

    const riskMap = new Map<string, number>();
    for (const r of risks ?? []) {
      riskMap.set(r.token_address, r.score);
    }

    const opportunities = [];
    for (const [addr, sigs] of tokenMap) {
      const catScores: Record<string, number> = {};
      for (const s of sigs) {
        const cur = catScores[s.category] ?? 0;
        catScores[s.category] = Math.max(cur, s.score);
      }

      const momentum = catScores["momentum_burst"] ?? catScores["volume_spike"] ?? 0;
      const smartMoney = catScores["smart_wallet_buy"] ?? 0;
      const whale = catScores["whale_movement"] ?? 0;
      const freshness = catScores["new_launch"] ?? 0;
      const liquidity = catScores["liquidity_change"] ?? 0;
      const riskScore = riskMap.get(addr) ?? 30;
      const riskPenalty = Math.max(0, 100 - riskScore);

      const sniperScore = Math.round(
        momentum * W.momentum +
        smartMoney * W.smartMoney +
        whale * W.whale +
        freshness * W.freshness +
        liquidity * W.liquidity +
        riskPenalty * W.riskPenalty
      );

      const avgConf = Math.round(sigs.reduce((a, s) => a + s.confidence, 0) / sigs.length);

      opportunities.push({
        token_address: addr,
        sniper_score: Math.min(100, sniperScore),
        confidence: avgConf,
        risk_score: riskScore,
        momentum_score: momentum,
        smart_money_score: smartMoney,
        whale_score: whale,
        freshness_score: freshness,
        liquidity_score: liquidity,
        action_label: actionLabel(sniperScore, riskScore),
        urgency: urgencyLevel(sniperScore),
        explanation: `Score ${sniperScore} from ${sigs.length} signals. Risk: ${riskScore}/100.`,
        tags: Object.keys(catScores),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    }

    opportunities.sort((a, b) => b.sniper_score - a.sniper_score);

    const top = opportunities.slice(0, 50);
    if (top.length > 0) {
      const { error: upsertErr } = await supabase
        .from("sniper_opportunities")
        .upsert(top, { onConflict: "token_address", ignoreDuplicates: false });

      if (upsertErr) {
        await supabase
          .from("sniper_opportunities")
          .delete()
          .lt("created_at", cutoff);
        await supabase.from("sniper_opportunities").insert(top);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, ranked: top.length, top3: top.slice(0, 3) }),
      { headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
