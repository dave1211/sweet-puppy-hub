import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const RENT_PROGRAM = "SysvarRent111111111111111111111111111111111";
const TOKEN_METADATA_PROGRAM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

type Tier = "free" | "pro" | "elite";
const TIER_SCORE: Record<Tier, number> = { free: 0, pro: 1, elite: 2 };
const REQUIRED_TIER: Tier = "pro";

async function requireAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
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

    const { action, ...params } = await req.json();

    if (action === "estimate") {
      // Return estimated costs for token creation
      return new Response(
        JSON.stringify({
          mintAccountRent: 0.00203928,
          metadataRent: 0.01113600,
          ataRent: 0.00203928,
          totalEstimate: 0.016,
          description: "Estimated SOL needed to create token mint, metadata, and initial ATA",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-token") {
      const { userPublicKey, name, symbol, decimals = 9, supply, uri } = params;

      if (!userPublicKey || !name || !symbol || !supply) {
        return new Response(
          JSON.stringify({ error: "userPublicKey, name, symbol, and supply are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get recent blockhash
      const blockhashRes = await fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "finalized" }],
        }),
      });
      const blockhashData = await blockhashRes.json();
      const recentBlockhash = blockhashData.result.value.blockhash;
      const lastValidBlockHeight = blockhashData.result.value.lastValidBlockHeight;

      // Return the parameters needed for client-side transaction construction
      // The client will build the transaction using these parameters
      return new Response(
        JSON.stringify({
          recentBlockhash,
          lastValidBlockHeight,
          tokenConfig: {
            name,
            symbol,
            decimals,
            supply,
            uri: uri || "",
          },
          programs: {
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
            systemProgram: SYSTEM_PROGRAM,
            rentProgram: RENT_PROGRAM,
            metadataProgram: TOKEN_METADATA_PROGRAM,
          },
          instructions: "Client should construct CreateMint, CreateMetadata, CreateATA, and MintTo instructions using these parameters. The mint keypair should be generated client-side.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "upload-metadata") {
      // For metadata, we'll return a data URI approach since we don't have IPFS access
      const { name, symbol, description, image, website, twitter, telegram } = params;

      const metadata = {
        name: name || "Unknown Token",
        symbol: symbol || "???",
        description: description || "",
        image: image || "",
        external_url: website || "",
        attributes: [],
        properties: {
          links: {
            ...(website ? { website } : {}),
            ...(twitter ? { twitter } : {}),
            ...(telegram ? { telegram } : {}),
          },
        },
      };

      // Return the metadata JSON - client can use it as a data URI or upload to IPFS/Arweave
      const metadataJson = JSON.stringify(metadata);
      const base64 = btoa(metadataJson);
      const dataUri = `data:application/json;base64,${base64}`;

      return new Response(
        JSON.stringify({
          metadata,
          uri: dataUri,
          rawJson: metadataJson,
          note: "For production, upload this JSON to IPFS or Arweave for permanent storage",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "estimate", "create-token", or "upload-metadata".' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Token launch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
