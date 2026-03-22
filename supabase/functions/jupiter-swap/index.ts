import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JUPITER_API = "https://lite-api.jup.ag/swap/v1";
const SOL_MINT = "So11111111111111111111111111111111111111112";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        throw new Error(`Jupiter quote failed [${quoteRes.status}]: ${errText}`);
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
        throw new Error(`Jupiter quote failed [${quoteRes.status}]: ${errText}`);
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
        throw new Error(`Jupiter swap failed [${swapRes.status}]: ${errText}`);
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
