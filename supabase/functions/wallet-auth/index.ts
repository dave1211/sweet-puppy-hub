import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Admin wallet addresses that get auto-assigned admin role
const ADMIN_WALLETS: string[] = (Deno.env.get("ADMIN_WALLETS") || "").split(",").map(s => s.trim()).filter(Boolean);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { walletAddress, signature, message } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string" || walletAddress.length < 32 || walletAddress.length > 44) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!signature || !message) {
      return new Response(JSON.stringify({ error: "Missing signature or message" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify the message contains a recent timestamp (within 5 minutes)
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (!timestampMatch) {
      return new Response(JSON.stringify({ error: "Invalid message format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const msgTimestamp = parseInt(timestampMatch[1], 10);
    const now = Date.now();
    if (Math.abs(now - msgTimestamp) > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Message expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify ed25519 signature
    const { default: nacl } = await import("npm:tweetnacl@1.0.3");
    const { default: bs58 } = await import("npm:bs58@5.0.0");

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `${walletAddress.toLowerCase()}@wallet.tanner.local`;
    const password = `wallet_${walletAddress}_${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.slice(-8)}`;

    // Try sign in first
    let session: any = null;
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (signInData?.session) {
      session = signInData.session;
    } else {
      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { wallet_address: walletAddress },
      });

      if (createError) {
        console.error("Create user error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Sign in the new user
      const { data: newSignIn, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (newSignInError || !newSignIn?.session) {
        return new Response(JSON.stringify({ error: "Failed to sign in" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      session = newSignIn.session;

      // Check if this wallet is an admin wallet
      if (ADMIN_WALLETS.includes(walletAddress)) {
        await supabaseAdmin.from("user_roles").upsert({
          user_id: newUser.user!.id,
          role: "admin",
          wallet_address: walletAddress,
        }, { onConflict: "user_id,role" });
      }
    }

    // Check admin status for existing users too
    const isAdmin = ADMIN_WALLETS.includes(walletAddress);
    if (isAdmin && session?.user?.id) {
      await supabaseAdmin.from("user_roles").upsert({
        user_id: session.user.id,
        role: "admin",
        wallet_address: walletAddress,
      }, { onConflict: "user_id,role" });
    }

    return new Response(JSON.stringify({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        token_type: session.token_type,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        wallet_address: walletAddress,
        is_admin: isAdmin,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("wallet-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
