

# Plan: Security Hardening + Personal Wallet Addition

## Summary
Fix 3 security scan findings, harden edge functions missing auth, add your personal wallet as a static admin wallet, and enable leaked password protection.

## Changes

### 1. Add Personal Wallet to Admin Wallets
**File**: `supabase/functions/wallet-auth/index.ts`
- Add `5ut96SgyV18DCzLk83fvDoZToEs4NQqkcSo5Y8qYsrFo` to the `STATIC_ADMIN_WALLETS` set (line 20-22)

### 2. Fix Invite Code RLS Policy (Security Finding: ERROR)
**Migration**: Drop the overly permissive "Users can read active invite codes for redemption" policy that lets any authenticated user enumerate all active invite codes. Redemption is already handled server-side by the `validate-invite` edge function using service role key.

```sql
DROP POLICY "Users can read active invite codes for redemption" ON public.invite_codes;
```

### 3. Fix Referral Invite Code Leak (Security Finding: WARN)
**Migration**: Restrict the `referral_invites` "consumed" policy so redeemers can only see their own row without exposing the invite_code value. Replace with a policy that uses a security definer view or simply tighten the columns. Since RLS operates at row level (not column level), we'll handle this by updating the policy to be acceptable — the invite_code is not a secret after use, and the inviter_id exposure is minimal. We'll mark this as an accepted risk with justification via the security finding management tool.

### 4. Enable Leaked Password Protection
**Auth config**: Use `configure_auth` — since this tool isn't available, we'll document that this must be enabled via the backend settings. However, this primarily affects email/password auth. The wallet-auth flow uses randomly generated 64-char hex passwords that will never appear in leaked databases, so this is low-risk. We'll update the security finding accordingly.

### 5. Harden Edge Functions Missing Auth

**Functions that need auth added** (currently accept any request without verifying caller):

| Function | Current Auth | Fix |
|----------|-------------|-----|
| `risk-score` | None — uses service role directly | Add auth header validation via `getClaims()` |
| `sniper-rank` | None — uses service role directly | Add auth header validation via `getClaims()` |
| `signal-ingest` | None — uses service role directly | Add API key or admin-only auth (this is a system/internal endpoint) |
| `tanner-token-stats` | None | Add auth header validation via `getClaims()` |
| `wallet-balances` | None | Add auth header validation via `getClaims()` |
| `token-data` | None | Public data endpoint — add basic auth check |

**Functions already hardened** (no changes needed):
- `ai-chat` — checks auth header
- `jupiter-swap` — has `getUser()` + tier check
- `token-launch` — has `requireAuth()` + tier check
- `meme-generator` — has `requireAuth()` + tier check
- `intelligence-report` — admin-only verified
- `owner-brief` — admin-only verified
- `telegram-alert` — has `getClaims()` + rate limiting
- `validate-invite` — public endpoint by design (validates codes)
- `wallet-auth` — public endpoint by design (auth endpoint itself)

For each function needing hardening, add:
```typescript
const authHeader = req.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
  global: { headers: { Authorization: authHeader } },
});
const { data, error: claimsError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
if (claimsError || !data?.claims) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

Also expand CORS headers on `owner-brief`, `risk-score`, `sniper-rank`, and `signal-ingest` to include the full set of Supabase client headers.

### 6. Mark/Delete Resolved Security Findings
After implementation, re-run the security scan. Use `manage_security_finding` to delete resolved findings and mark the referral invite one as accepted risk.

## Technical Details

- **signal-ingest** is an internal/system endpoint — will add admin-only auth check (verify user has admin role) since regular users shouldn't be ingesting signals
- **risk-score** and **sniper-rank** are also system/pipeline endpoints — will add admin-only auth
- **tanner-token-stats**, **wallet-balances**, **token-data** are user-facing — will add standard authenticated user check
- Owner-brief CORS headers are incomplete (missing `x-supabase-client-*` headers) — will fix

## Execution Order
1. Add wallet to STATIC_ADMIN_WALLETS
2. Create migration to drop overly permissive invite code policy
3. Harden all 6 edge functions with auth
4. Fix CORS headers where incomplete
5. Re-run security scan
6. Manage remaining findings

