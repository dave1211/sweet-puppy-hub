import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ valid: false, message: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code || code.length < 4 || code.length > 32) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid invite code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const { data: invite, error } = await admin
      .from("invite_codes")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();

    if (error || !invite) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid or expired invite code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invite code has expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max uses
    if (invite.current_uses >= invite.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invite code has been fully used" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage
    await admin
      .from("invite_codes")
      .update({ current_uses: invite.current_uses + 1 })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({ valid: true, message: "Access granted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[validate-invite] error", err);
    return new Response(
      JSON.stringify({ valid: false, message: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
