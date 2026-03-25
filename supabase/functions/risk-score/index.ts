import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RiskInput {
  token_address: string;
  liquidity?: number;
  top_holder_pct?: number;
  holder_count?: number;
  volume_24h?: number;
  age_minutes?: number;
  lp_locked?: boolean;
  deployer_suspicious?: boolean;
  wash_trading_detected?: boolean;
  rapid_lp_removal?: boolean;
}

function computeRisk(input: RiskInput): {
  score: number;
  verdict: string;
  factors: Record<string, unknown>;
  liquidity_warning: boolean;
  concentration_warning: boolean;
  suspicious_activity: boolean;
  summary: string;
} {
  let score = 0;
  const factors: Record<string, number> = {};

  // Liquidity risk (0-25)
  const liq = input.liquidity ?? 0;
  if (liq < 1000) { factors.liquidity = 25; score += 25; }
  else if (liq < 5000) { factors.liquidity = 18; score += 18; }
  else if (liq < 20000) { factors.liquidity = 10; score += 10; }
  else if (liq < 100000) { factors.liquidity = 5; score += 5; }
  else { factors.liquidity = 0; }

  // Holder concentration (0-20)
  const topPct = input.top_holder_pct ?? 0;
  if (topPct > 80) { factors.concentration = 20; score += 20; }
  else if (topPct > 50) { factors.concentration = 15; score += 15; }
  else if (topPct > 30) { factors.concentration = 8; score += 8; }
  else { factors.concentration = 0; }

  // Holder count (0-10)
  const holders = input.holder_count ?? 0;
  if (holders < 10) { factors.holder_count = 10; score += 10; }
  else if (holders < 50) { factors.holder_count = 5; score += 5; }
  else { factors.holder_count = 0; }

  // Age (0-10)
  const age = input.age_minutes ?? 0;
  if (age < 5) { factors.age = 10; score += 10; }
  else if (age < 30) { factors.age = 5; score += 5; }
  else { factors.age = 0; }

  // LP locked (0-10)
  if (input.lp_locked === false) { factors.lp_unlocked = 10; score += 10; }

  // Deployer (0-10)
  if (input.deployer_suspicious) { factors.deployer = 10; score += 10; }

  // Wash trading (0-10)
  if (input.wash_trading_detected) { factors.wash_trading = 10; score += 10; }

  // Rapid LP removal (0-15)
  if (input.rapid_lp_removal) { factors.lp_removal = 15; score += 15; }

  score = Math.min(100, score);
  const verdict =
    score >= 75 ? "high_risk" :
    score >= 50 ? "risky" :
    score >= 25 ? "caution" : "safer";

  const warnings = [];
  if (factors.liquidity >= 18) warnings.push("Very low liquidity");
  if (factors.concentration >= 15) warnings.push("High holder concentration");
  if (factors.deployer) warnings.push("Suspicious deployer");
  if (factors.wash_trading) warnings.push("Wash trading detected");
  if (factors.lp_removal) warnings.push("Rapid LP removal");

  return {
    score,
    verdict,
    factors,
    liquidity_warning: (factors.liquidity ?? 0) >= 10,
    concentration_warning: (factors.concentration ?? 0) >= 10,
    suspicious_activity: !!(factors.deployer || factors.wash_trading || factors.lp_removal),
    summary: warnings.length > 0
      ? `Risk ${score}/100 (${verdict}): ${warnings.join(", ")}`
      : `Risk ${score}/100 (${verdict}): No major flags detected`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const inputs: RiskInput[] = Array.isArray(body) ? body : [body];

    if (inputs.length === 0 || inputs.length > 50) {
      return new Response(
        JSON.stringify({ error: "Provide 1-50 tokens" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    for (const input of inputs) {
      if (!input.token_address) continue;
      const risk = computeRisk(input);
      const row = { token_address: input.token_address, ...risk };

      const { error } = await supabase
        .from("risk_scores")
        .upsert(row, { onConflict: "token_address" });

      if (error) {
        // If no unique constraint yet, insert
        await supabase.from("risk_scores").insert(row);
      }
      results.push(row);
    }

    return new Response(
      JSON.stringify({ ok: true, scored: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
