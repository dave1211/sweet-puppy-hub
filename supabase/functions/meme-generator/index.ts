import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Tier = "free" | "pro" | "elite";
const TIER_SCORE: Record<Tier, number> = { free: 0, pro: 1, elite: 2 };
const REQUIRED_TIER: Tier = "pro";

async function requireAuth(req: Request) {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = await resolveUserTier(userId);
    if (!hasTier(tier, REQUIRED_TIER)) {
      return new Response(JSON.stringify({ error: `Upgrade required: ${REQUIRED_TIER.toUpperCase()} tier needed` }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { prompt, style = "dank", topText, bottomText } = body;

    if (!prompt || typeof prompt !== "string" || prompt.length < 3) {
      return new Response(JSON.stringify({ error: "Prompt must be at least 3 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const cleanPrompt = prompt.slice(0, 200);
    const cleanTop = (topText ?? "").slice(0, 80);
    const cleanBottom = (bottomText ?? "").slice(0, 80);

    const styleGuides: Record<string, string> = {
      dank: "dank meme style, bold impact font text, funny and absurd, meme format, deep-fried edges",
      classic: "classic meme format, white impact font with black outline, clean and recognizable meme template",
      crypto: "crypto trading meme, charts, green/red candles, diamond hands, rocket emojis, terminal aesthetic, dark background",
      wojak: "wojak meme style, simple line art characters showing extreme emotions, crypto trader vibes",
      surreal: "surreal absurdist meme, dreamlike distorted imagery, vaporwave colors, intentionally bizarre",
    };

    const stylePrompt = styleGuides[style] ?? styleGuides.dank;

    let fullPrompt = `${stylePrompt}. ${cleanPrompt}`;
    if (cleanTop) fullPrompt += `. Top text overlay: "${cleanTop}"`;
    if (cleanBottom) fullPrompt += `. Bottom text overlay: "${cleanBottom}"`;
    fullPrompt += ". High quality, shareable, social media ready.";

    // Use Lovable AI for image generation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let imageUrl: string | null = null;

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [
              {
                role: "user",
                content: `Generate a meme image: ${fullPrompt}`,
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData?.choices?.[0]?.message?.content;
          // Check if AI returned an image URL or base64
          if (typeof content === "string" && (content.startsWith("http") || content.startsWith("data:image"))) {
            imageUrl = content;
          }
          // Check for image parts in multimodal response
          if (Array.isArray(content)) {
            const imgPart = content.find((p: { type: string; image_url?: { url: string } }) => p.type === "image_url");
            if (imgPart?.image_url?.url) {
              imageUrl = imgPart.image_url.url;
            }
          }
        }
      } catch (e) {
        console.error("AI image generation failed:", e);
      }
    }

    const memeData = {
      id: crypto.randomUUID(),
      prompt: cleanPrompt,
      style,
      topText: cleanTop || null,
      bottomText: cleanBottom || null,
      fullPrompt,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(memeData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Meme generator error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
