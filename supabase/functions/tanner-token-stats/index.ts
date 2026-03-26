// Public market data endpoint — no auth required

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const TANNER_MINT = "So11111111111111111111111111111111111111112";

let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public data endpoint — no auth required (fetches public market data only)

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return new Response(JSON.stringify(cache.data), { headers: jsonHeaders });
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

    return new Response(JSON.stringify(data), { headers: jsonHeaders });
  } catch (error) {
    console.error("tanner-token-stats error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
