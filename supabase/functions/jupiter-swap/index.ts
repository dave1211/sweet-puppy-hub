import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JUPITER_API = "https://lite-api.jup.ag/swap/v1";
const SOL_MINT = "So11111111111111111111111111111111111111112";
type Tier = "free" | "pro" | "elite";
const TIER_SCORE: Record<Tier, number> = { free: 0, pro: 1, elite: 2 };
const REQUIRED_TIER: Tier = "pro";

async function requireAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

function normalizeTier(value: unknown): Tier {
  if (value === "elite") return "elite";
  if (value === "pro") return "pro";
  return "free";
}

async function resolveUserTier(userId: string): Promise<Tier> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return "free";

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription?.tier) return normalizeTier(subscription.tier);

  const { data: profile } = await admin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  return normalizeTier(profile?.tier);
}

function hasTier(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_SCORE[userTier] >= TIER_SCORE[requiredTier];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await requireAuth(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tier = await resolveUserTier(userId);
    if (!hasTier(tier, REQUIRED_TIER)) {
      return new Response(
        JSON.stringify({ error: `Upgrade required: ${REQUIRED_TIER.toUpperCase()} tier needed` }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, inputMint, outputMint, amount, slippageBps, userPublicKey } =
      await req.json();

    if (action === "quote") {
      if (!outputMint || !amount) {
        return new Response(
          JSON.stringify({ error: "outputMint and amount are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const params = new URLSearchParams({
        inputMint: inputMint || SOL_MINT,
        outputMint,
        amount: String(amount),
        slippageBps: String(slippageBps || 50),
      });
      const quoteRes = await fetch(`${JUPITER_API}/quote?${params}`);
      if (!quoteRes.ok) {
        const errText = await quoteRes.text();
        console.error(`Jupiter quote failed [${quoteRes.status}]: ${errText}`);
        throw new Error("Quote service temporarily unavailable");
      }
      const quoteData = await quoteRes.json();
      return new Response(JSON.stringify(quoteData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "swap") {
      if (!userPublicKey) {
        return new Response(
          JSON.stringify({ error: "userPublicKey is required for swap" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const params = new URLSearchParams({
        inputMint: inputMint || SOL_MINT,
        outputMint,
        amount: String(amount),
        slippageBps: String(slippageBps || 50),
      });
      const quoteRes = await fetch(`${JUPITER_API}/quote?${params}`);
      if (!quoteRes.ok) {
        const errText = await quoteRes.text();
        console.error(`Jupiter quote failed [${quoteRes.status}]: ${errText}`);
        throw new Error("Quote service temporarily unavailable");
      }
      const quoteData = await quoteRes.json();
      const swapRes = await fetch(`${JUPITER_API}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quoteData,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: "auto",
        }),
      });
      if (!swapRes.ok) {
        const errText = await swapRes.text();
        console.error(`Jupiter swap failed [${swapRes.status}]: ${errText}`);
        throw new Error("Swap service temporarily unavailable");
      }
      const swapData = await swapRes.json();
      return new Response(
        JSON.stringify({
          swapTransaction: swapData.swapTransaction,
          lastValidBlockHeight: swapData.lastValidBlockHeight,
          quote: quoteData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "quote" or "swap".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Jupiter proxy error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
