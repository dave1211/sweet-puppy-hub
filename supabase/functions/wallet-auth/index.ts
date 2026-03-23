import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Admin wallet addresses that get auto-assigned admin role
const ADMIN_WALLETS: string[] = (Deno.env.get("ADMIN_WALLETS") || "").split(",").map(s => s.trim()).filter(Boolean);

// In-memory rate limiter: walletAddress -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function generateSecurePassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `wallet_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function findUserByEmail(supabaseAdmin: ReturnType<typeof createClient>, email: string) {
  const perPage = 200;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = (data?.users ?? []) as Array<{ id: string; email?: string; user_metadata?: Record<string, unknown> }>;
    const match = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { walletAddress, signature, message } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string" || walletAddress.length < 32 || walletAddress.length > 44 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
      return new Response(JSON.stringify({ error: "Invalid wallet address" }), { status: 400, headers: jsonHeaders });
    }

    if (!signature || typeof signature !== "string" || signature.length < 64 || signature.length > 256) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: jsonHeaders });
    }

    if (!message || typeof message !== "string" || message.length < 10 || message.length > 512) {
      return new Response(JSON.stringify({ error: "Invalid message" }), { status: 400, headers: jsonHeaders });
    }

    const normalizedWalletAddress = walletAddress.trim();

    // Rate limit by wallet address
    if (!checkRateLimit(normalizedWalletAddress)) {
      return new Response(JSON.stringify({ error: "Too many attempts. Try again later." }), { status: 429, headers: jsonHeaders });
    }

    // Verify the message contains a recent timestamp (within 5 minutes)
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    if (!timestampMatch) {
      return new Response(JSON.stringify({ error: "Invalid message format" }), { status: 400, headers: jsonHeaders });
    }
    const msgTimestamp = parseInt(timestampMatch[1], 10);
    const now = Date.now();
    if (Math.abs(now - msgTimestamp) > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Message expired" }), { status: 400, headers: jsonHeaders });
    }

    // Verify ed25519 signature
    const { default: nacl } = await import("npm:tweetnacl@1.0.3");
    const { default: bs58 } = await import("npm:bs58@5.0.0");

    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(normalizedWalletAddress);

    const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: jsonHeaders });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `${normalizedWalletAddress.toLowerCase()}@wallet.tanner.local`;

    // Generate a fresh ephemeral password on every successful auth — never persist it
    const password = generateSecurePassword();

    const existingUser = await findUserByEmail(supabaseAdmin, email);

    if (existingUser?.id) {
      // Update password to the fresh ephemeral one
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          wallet_address: normalizedWalletAddress,
        },
      });

      if (updateUserError) {
        console.error("Update user password error:", updateUserError);
        return new Response(JSON.stringify({ error: "Authentication system unavailable" }), { status: 500, headers: jsonHeaders });
      }
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { wallet_address: normalizedWalletAddress },
      });

      if (createError || !newUser?.user?.id) {
        console.error("Create user error:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), { status: 500, headers: jsonHeaders });
      }
    }

    // Sign in with the ephemeral password
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (signInError || !signInData?.session) {
      console.error("Sign in error:", signInError);
      return new Response(JSON.stringify({ error: "Failed to authenticate wallet" }), { status: 401, headers: jsonHeaders });
    }

    const session = signInData.session;

    // Check admin status
    const isAdmin = ADMIN_WALLETS.includes(normalizedWalletAddress);
    if (isAdmin && session?.user?.id) {
      await supabaseAdmin.from("user_roles").upsert({
        user_id: session.user.id,
        role: "admin",
        wallet_address: normalizedWalletAddress,
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
        wallet_address: normalizedWalletAddress,
        is_admin: isAdmin,
      },
    }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    console.error("wallet-auth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: jsonHeaders });
  }
});
