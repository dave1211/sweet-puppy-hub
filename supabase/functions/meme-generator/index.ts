import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function requireAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    // Generate with Lovable AI proxy
    await fetch(`${SUPABASE_URL}/functions/v1/meme-generator-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fullPrompt }),
    }).catch(() => null);

    const memeData = {
      id: crypto.randomUUID(),
      prompt: cleanPrompt,
      style,
      topText: cleanTop || null,
      bottomText: cleanBottom || null,
      fullPrompt,
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
