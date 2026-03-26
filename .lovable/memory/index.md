# Memory: index.md
Updated: now

Tanner Terminal — hardened crypto terminal platform with dark terminal UI.

## Design System
- Dark terminal theme: navy bg (220 20% 4%), blue primary (217 91% 60%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture
- 4 contexts: AuthContext, TierContext, WalletContext, SelectedTokenContext
- TierProvider MUST be inside AuthProvider and WalletProvider in App.tsx
- Supabase for persistence (25+ tables with RLS)
- Edge functions: ai-chat, signal-ingest, sniper-rank, risk-score, owner-brief, wallet-auth, validate-invite, + more
- Feature flags + kill switches in DB, controlled via KillSwitchPanel
- Private alpha gating via invite_codes table + AlphaGate component
- Audit logging via auditService.ts
- WidgetErrorBoundary for dashboard panel isolation
- EnvErrorScreen for missing config (never white screen)
- Boot-time env validation in lib/envValidation.ts

## Security Model
- Wallet-only auth (no Google/Apple/email) — see mem://features/auth-lockdown.md
- Private alpha mode: invite-code gated access
- Feature flags with kill switches
- Role-based access: guest/user/premium/vip/moderator/admin/owner
- RLS on all tables, admin-only tables use has_role() function
- Audit logs for all privileged actions
- No secrets in frontend, all scoring server-side
- Tier enforcement server-side in jupiter-swap, meme-generator, token-launch edge functions
- Admin wallet: 4xMfshfwBG87cfeNwx4SBYBj24Ldn18gLEH1wJFiYCf6

## Crash Protection
- Global ErrorBoundary wraps entire app
- PageErrorBoundary in AppShell wraps <Outlet>
- WidgetErrorBoundary wraps each dashboard panel
- Lazy loading on all pages with Suspense fallback
- PushNotificationInit wrapped in try/catch
- QueryClient with retry:2, staleTime:30s defaults
