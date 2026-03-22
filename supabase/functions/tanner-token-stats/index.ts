import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TANNER_MINT = "So11111111111111111111111111111111111111112";

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cache.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${TANNER_MINT}`
    );
    if (!res.ok) throw new Error(`DexScreener returned ${res.status}`);

    const json = await res.json();
    const pair = json.pairs?.[0];

    const data = {
      price: pair ? parseFloat(pair.priceUsd ?? "0") : 0,
      priceChange24h: pair?.priceChange?.h24 ?? 0,
      marketCap: pair?.fdv ?? 0,
      volume24h: pair?.volume?.h24 ?? 0,
      liquidity: pair?.liquidity?.usd ?? 0,
      pairAddress: pair?.pairAddress ?? null,
      dexId: pair?.dexId ?? null,
      holders: null,
      lastUpdated: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("tanner-token-stats error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
