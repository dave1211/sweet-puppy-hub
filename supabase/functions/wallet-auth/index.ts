import { createClient } from "npm:@supabase/supabase-js@2";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@5.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const ADMIN_WALLETS: string[] = (Deno.env.get("ADMIN_WALLETS") || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const STATIC_ADMIN_WALLETS = new Set<string>([
  "4xMfshfwBG87cfeNwx4SBYBj24Ldn18gLEH1wJFiYCf6",
  "5ut96SgyV18DCzLk83fvDoZToEs4NQqkcSo5Y8qYsrFo",
]);

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const usedChallengeTokens = new Map<string, number>();

const TELEMETRY_EVENTS = new Set<string>([
  "provider_detected",
  "connect_started",
  "connect_success",
  "challenge_created",
  "sign_requested",
  "sign_success",
  "verify_success",
  "role_assign_success",
  "session_ready",
  "app_boot_ready",
  "wallet_not_detected",
  "rejected_by_user",
  "signature_expired",
  "wallet_auth_failed",
  "role_assignment_failed",
  "session_restore_failed",
  "app_boot_failed",
]);

interface ChallengePayload {
  walletAddress: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  deviceId: string;
}

interface ParsedSignInMessage {
  walletAddress: string;
  nonce: string;
  timestamp: number;
}

interface AuthContextPayload {
  deviceId: string;
  host: string;
  userAgent: string;
}

type SupabaseAdminClient = ReturnType<typeof createClient>;

function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: jsonHeaders,
  });
}

function errorResponse(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code,
        message,
      },
    }),
    { status, headers: jsonHeaders },
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function cleanupUsedChallengeTokens(now: number): void {
  for (const [token, expiresAt] of usedChallengeTokens.entries()) {
    if (expiresAt <= now) {
      usedChallengeTokens.delete(token);
    }
  }
}

function isChallengeTokenUsed(token: string): boolean {
  const now = Date.now();
  cleanupUsedChallengeTokens(now);
  return usedChallengeTokens.has(token);
}

function markChallengeTokenUsed(token: string, expiresAt: number): void {
  cleanupUsedChallengeTokens(Date.now());
  usedChallengeTokens.set(token, expiresAt);
}

function normalizeWalletAddress(walletAddress: string): string {
  return walletAddress.trim();
}

function isValidWalletAddress(walletAddress: string): boolean {
  return walletAddress.length >= 32 && walletAddress.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress);
}

function normalizeDeviceId(deviceId: string): string {
  return deviceId.trim();
}

function isValidDeviceId(deviceId: string): boolean {
  return deviceId.length >= 8 && deviceId.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(deviceId);
}

function normalizeHost(host: string): string {
  return host.trim().slice(0, 255);
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const decoded = atob(padded);
  const out = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i += 1) {
    out[i] = decoded.charCodeAt(i);
  }
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSign(secret: string, payload: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return new Uint8Array(signature);
}

async function createChallengeToken(payload: ChallengePayload, secret: string): Promise<string> {
  const serialized = JSON.stringify(payload);
  const body = bytesToBase64Url(new TextEncoder().encode(serialized));
  const signature = bytesToBase64Url(await hmacSign(secret, body));
  return `${body}.${signature}`;
}

async function verifyChallengeToken(token: string, secret: string): Promise<ChallengePayload | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = await hmacSign(secret, body);
  const providedSignature = base64UrlToBytes(signature);
  if (!timingSafeEqual(expectedSignature, providedSignature)) return null;

  try {
    const json = new TextDecoder().decode(base64UrlToBytes(body));
    const payload = JSON.parse(json) as Partial<ChallengePayload>;

    if (
      !payload ||
      typeof payload.walletAddress !== "string" ||
      typeof payload.nonce !== "string" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.deviceId !== "string"
    ) {
      return null;
    }

    const issuedAt = typeof payload.issuedAt === "number"
      ? payload.issuedAt
      : payload.expiresAt - CHALLENGE_TTL_MS;

    return {
      walletAddress: payload.walletAddress,
      nonce: payload.nonce,
      issuedAt,
      expiresAt: payload.expiresAt,
      deviceId: payload.deviceId,
    };
  } catch {
    return null;
  }
}

function parseSignInMessage(message: string): ParsedSignInMessage | null {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines[0] !== "Sign in to Tanner Terminal") return null;

  const walletLine = lines.find((line) => line.startsWith("Wallet:"));
  const nonceLine = lines.find((line) => line.startsWith("Nonce:"));
  const timestampLine = lines.find((line) => line.startsWith("Timestamp:"));
  if (!walletLine || !nonceLine || !timestampLine) return null;

  const walletAddress = walletLine.replace("Wallet:", "").trim();
  const nonce = nonceLine.replace("Nonce:", "").trim();
  const timestampText = timestampLine.replace("Timestamp:", "").trim();
  const timestamp = Number.parseInt(timestampText, 10);

  if (!walletAddress || !nonce || Number.isNaN(timestamp)) return null;

  return { walletAddress, nonce, timestamp };
}

function generateSecurePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `wallet_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function findUserByEmail(supabaseAdmin: SupabaseAdminClient, email: string) {
  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = (data?.users ?? []) as Array<{
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
    }>;

    const match = users.find((user) => (user.email || "").toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

async function logAuthEvent(
  eventType: string,
  eventData: Record<string, unknown>,
  userId?: string | null,
  sessionId?: string | null,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return;

  try {
    const admin = createClient(supabaseUrl, serviceRole);
    await admin.from("usage_events").insert({
      event_type: eventType,
      event_data: eventData,
      user_id: userId ?? null,
      session_id: sessionId ?? null,
    });
  } catch (error) {
    console.error("[wallet-auth] log event failed", { eventType, error });
  }
}

async function upsertRoleWithRetry(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  role: "user" | "admin",
  walletAddress: string,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: userId,
        role,
        wallet_address: walletAddress,
      },
      { onConflict: "user_id,role" },
    );

    if (!error) return { ok: true };
    if (attempt === 2) return { ok: false, error };

    await new Promise((resolve) => setTimeout(resolve, 120 * attempt));
  }

  return { ok: false, error: new Error("Role upsert failed") };
}

async function provisionProfileWithRetry(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  walletAddress: string,
  isAdmin: boolean,
): Promise<{ ok: true } | { ok: false; error: unknown }> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("tier")
      .eq("id", userId)
      .maybeSingle();

    const existingTier = existingProfile?.tier;
    const resolvedTier = existingTier === "elite" || existingTier === "pro"
      ? existingTier
      : isAdmin
        ? "pro"
        : "free";

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          wallet_address: walletAddress,
          tier: resolvedTier,
          onboarded: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (!error) return { ok: true };
    if (attempt === 2) return { ok: false, error };

    await new Promise((resolve) => setTimeout(resolve, 120 * attempt));
  }

  return { ok: false, error: new Error("Profile provision failed") };
}

async function issueWalletSession(walletAddress: string, authCtx: AuthContextPayload): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRole || !publishableKey) {
    return errorResponse(500, "CONFIGURATION_ERROR", "Authentication backend is not configured");
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const supabaseAuth = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const email = `${walletAddress.toLowerCase()}@wallet.tanner.local`;
  const password = generateSecurePassword();

  const existingUser = await findUserByEmail(supabaseAdmin, email);

  if (existingUser?.id) {
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        wallet_address: walletAddress,
        last_device_id: authCtx.deviceId,
        last_auth_host: authCtx.host,
        last_auth_user_agent: authCtx.userAgent,
      },
    });

    if (updateUserError) {
      await logAuthEvent("wallet_auth_failed", { code: "AUTH_UPDATE_FAILED", walletAddress, host: authCtx.host }, null, authCtx.deviceId);
      return errorResponse(500, "AUTH_UPDATE_FAILED", "Authentication system unavailable");
    }
  } else {
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress,
        last_device_id: authCtx.deviceId,
        last_auth_host: authCtx.host,
        last_auth_user_agent: authCtx.userAgent,
      },
    });

    if (createError || !newUser?.user?.id) {
      await logAuthEvent("wallet_auth_failed", { code: "AUTH_CREATE_FAILED", walletAddress, host: authCtx.host }, null, authCtx.deviceId);
      return errorResponse(500, "AUTH_CREATE_FAILED", "Failed to create wallet account");
    }
  }

  const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (signInError || !signInData?.session) {
    await logAuthEvent("wallet_auth_failed", { code: "AUTH_FAILED", walletAddress, host: authCtx.host }, null, authCtx.deviceId);
    return errorResponse(401, "AUTH_FAILED", "Failed to authenticate wallet");
  }

  const session = signInData.session;
  const isAdmin = ADMIN_WALLETS.includes(walletAddress) || STATIC_ADMIN_WALLETS.has(walletAddress);

  if (session.user?.id) {
    const userRoleResult = await upsertRoleWithRetry(supabaseAdmin, session.user.id, "user", walletAddress);
    if (!userRoleResult.ok) {
      await logAuthEvent("wallet_auth_failed", { code: "ROLE_ASSIGN_FAILED", role: "user", walletAddress, host: authCtx.host }, session.user.id, authCtx.deviceId);
      return errorResponse(500, "ROLE_ASSIGN_FAILED", "Failed to assign wallet role");
    }

    if (isAdmin) {
      const adminRoleResult = await upsertRoleWithRetry(supabaseAdmin, session.user.id, "admin", walletAddress);
      if (!adminRoleResult.ok) {
        await logAuthEvent("wallet_auth_failed", { code: "ROLE_ASSIGN_FAILED", role: "admin", walletAddress, host: authCtx.host }, session.user.id, authCtx.deviceId);
        return errorResponse(500, "ROLE_ASSIGN_FAILED", "Failed to assign wallet role");
      }
    }

    const profileProvisionResult = await provisionProfileWithRetry(
      supabaseAdmin,
      session.user.id,
      walletAddress,
      isAdmin,
    );

    if (!profileProvisionResult.ok) {
      await logAuthEvent(
        "wallet_auth_failed",
        { code: "PROFILE_PROVISION_FAILED", walletAddress, host: authCtx.host },
        session.user.id,
        authCtx.deviceId,
      );
      return errorResponse(500, "PROFILE_PROVISION_FAILED", "Failed to provision wallet profile");
    }
  }

  await logAuthEvent(
    "wallet_auth_success",
    {
      walletAddress,
      host: authCtx.host,
    },
    session.user.id,
    authCtx.deviceId,
  );

  console.info("[wallet-auth] session_ready", {
    walletAddress,
    userId: session.user.id,
    isAdmin,
    deviceId: authCtx.deviceId,
  });

  return successResponse({
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
      access_assigned: true,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "METHOD_NOT_ALLOWED", "Method not allowed");
  }

  try {
    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "verify";
    const challengeSecret = Deno.env.get("WALLET_AUTH_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!challengeSecret) {
      return errorResponse(500, "CONFIGURATION_ERROR", "Wallet auth secret is not configured");
    }

    if (action === "blocked_redirect") {
      const deviceId = normalizeDeviceId(typeof body.deviceId === "string" ? body.deviceId : "");
      const host = normalizeHost(typeof body.host === "string" ? body.host : "");
      const reason = typeof body.reason === "string" ? body.reason : "unknown";
      await logAuthEvent("blocked_redirect_attempt", { reason, host }, null, deviceId || null);
      return successResponse({ logged: true });
    }

    if (action === "telemetry") {
      const event = typeof body.event === "string" ? body.event.trim() : "";
      const host = normalizeHost(typeof body.host === "string" ? body.host : "");
      const deviceId = normalizeDeviceId(typeof body.deviceId === "string" ? body.deviceId : "");
      const walletAddressRaw = typeof body.walletAddress === "string" ? body.walletAddress : "";
      const walletAddress = walletAddressRaw ? normalizeWalletAddress(walletAddressRaw) : null;

      if (!event || !TELEMETRY_EVENTS.has(event)) {
        return errorResponse(400, "INVALID_TELEMETRY_EVENT", "Unsupported telemetry event");
      }

      if (deviceId && !isValidDeviceId(deviceId)) {
        return errorResponse(400, "INVALID_DEVICE", "Invalid device identifier");
      }

      console.info("[wallet-auth][telemetry]", {
        event,
        host,
        deviceId,
        walletAddress,
        metadata: body.metadata ?? null,
      });

      return successResponse({ logged: true });
    }

    if (action === "challenge") {
      const walletAddressRaw = typeof body.walletAddress === "string" ? body.walletAddress : "";
      const walletAddress = normalizeWalletAddress(walletAddressRaw);
      const deviceId = normalizeDeviceId(typeof body.deviceId === "string" ? body.deviceId : "");

      if (!isValidWalletAddress(walletAddress)) {
        return errorResponse(400, "INVALID_WALLET", "Invalid wallet address");
      }

      if (!isValidDeviceId(deviceId)) {
        return errorResponse(400, "INVALID_DEVICE", "Invalid device identifier");
      }

      if (!checkRateLimit(`challenge:${walletAddress}:${deviceId}`)) {
        await logAuthEvent("wallet_auth_failed", { code: "RATE_LIMITED_CHALLENGE", walletAddress }, null, deviceId);
        return errorResponse(429, "RATE_LIMITED", "Too many challenge requests. Try again later.");
      }

      const nonce = randomNonce();
      const issuedAt = Date.now();
      const expiresAt = issuedAt + CHALLENGE_TTL_MS;
      const challengeToken = await createChallengeToken(
        {
          walletAddress,
          nonce,
          issuedAt,
          expiresAt,
          deviceId,
        },
        challengeSecret,
      );

      console.info("[wallet-auth] challenge_created", { walletAddress, deviceId });

      return successResponse({
        walletAddress,
        nonce,
        issuedAt,
        challengeToken,
        expiresAt,
      });
    }

    if (action === "verify") {
      const walletAddressRaw = typeof body.walletAddress === "string" ? body.walletAddress : "";
      const signature = typeof body.signature === "string" ? body.signature.trim() : "";
      const message = typeof body.message === "string" ? body.message : "";
      const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken.trim() : "";
      const walletAddress = normalizeWalletAddress(walletAddressRaw);
      const deviceId = normalizeDeviceId(typeof body.deviceId === "string" ? body.deviceId : "");
      const host = normalizeHost(typeof body.host === "string" ? body.host : "");
      const userAgent = typeof body.userAgent === "string" ? body.userAgent.slice(0, 512) : "unknown";

      const fail = async (status: number, code: string, messageText: string, invalidSig = false) => {
        if (invalidSig) {
          await logAuthEvent("invalid_signature_attempt", { code, walletAddress, host }, null, deviceId || null);
        }
        await logAuthEvent("wallet_auth_failed", { code, walletAddress, host }, null, deviceId || null);
        return errorResponse(status, code, messageText);
      };

      if (!isValidWalletAddress(walletAddress)) {
        return await fail(400, "INVALID_WALLET", "Invalid wallet address");
      }

      if (!isValidDeviceId(deviceId)) {
        return await fail(400, "INVALID_DEVICE", "Invalid device identifier");
      }

      if (!signature || signature.length < 64 || signature.length > 256) {
        return await fail(400, "INVALID_SIGNATURE", "Invalid signature", true);
      }

      if (!message || message.length < 10 || message.length > 1024) {
        return await fail(400, "INVALID_MESSAGE", "Invalid sign-in message");
      }

      if (!challengeToken) {
        return await fail(400, "MISSING_CHALLENGE", "Missing challenge token");
      }

      if (!checkRateLimit(`verify:${walletAddress}:${deviceId}`)) {
        return await fail(429, "RATE_LIMITED", "Too many verification attempts. Try again later.");
      }

      const challengePayload = await verifyChallengeToken(challengeToken, challengeSecret);
      if (!challengePayload) {
        return await fail(401, "INVALID_CHALLENGE", "Challenge token is invalid or tampered");
      }

      if (challengePayload.expiresAt < Date.now()) {
        return await fail(401, "EXPIRED_CHALLENGE", "Challenge token expired");
      }

      if (isChallengeTokenUsed(challengeToken)) {
        return await fail(401, "CHALLENGE_ALREADY_USED", "Challenge already used. Request a new challenge.");
      }
      markChallengeTokenUsed(challengeToken, challengePayload.expiresAt);

      const parsedMessage = parseSignInMessage(message);
      if (!parsedMessage) {
        return await fail(400, "INVALID_MESSAGE_FORMAT", "Invalid sign-in message format");
      }

      if (parsedMessage.walletAddress !== walletAddress || challengePayload.walletAddress !== walletAddress) {
        return await fail(401, "WALLET_MISMATCH", "Wallet mismatch in sign-in request");
      }

      if (parsedMessage.nonce !== challengePayload.nonce) {
        return await fail(401, "NONCE_MISMATCH", "Nonce mismatch in sign-in request");
      }

      if (challengePayload.deviceId !== deviceId) {
        return await fail(401, "DEVICE_MISMATCH", "Device mismatch in sign-in request");
      }

      if (parsedMessage.timestamp !== challengePayload.issuedAt) {
        return await fail(401, "MESSAGE_EXPIRED", "Signed message expired");
      }

      let signatureBytes: Uint8Array;
      let publicKeyBytes: Uint8Array;

      try {
        signatureBytes = bs58.decode(signature);
        publicKeyBytes = bs58.decode(walletAddress);
      } catch {
        return await fail(400, "INVALID_SIGNATURE_ENCODING", "Signature or wallet encoding is invalid", true);
      }

      const messageBytes = new TextEncoder().encode(message);
      const signatureValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!signatureValid) {
        return await fail(401, "SIGNATURE_VERIFICATION_FAILED", "Signature verification failed", true);
      }

      console.info("[wallet-auth] verify_success", { walletAddress, deviceId, host });

      return await issueWalletSession(walletAddress, { deviceId, host, userAgent });
    }

    return errorResponse(400, "INVALID_ACTION", "Invalid action. Use challenge or verify.");
  } catch (err) {
    console.error("[wallet-auth] unhandled error", err);
    return errorResponse(500, "INTERNAL_ERROR", "Internal server error");
  }
});
