# Memory: index.md
Updated: now

Tanner Terminal — dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext, WalletContext, SelectedTokenContext + AuthContext
- Supabase for persistence (20+ tables with RLS)
- Edge functions: ai-chat, signal-ingest, sniper-rank, risk-score, owner-brief, wallet-auth, validate-invite, + more
- Feature flags + kill switches in DB, controlled via KillSwitchPanel in War Room
- Private alpha gating via invite_codes table + AlphaGate component
- anomaly_events table for security monitoring
- Audit logging via auditService.ts

## Security Model
- Private alpha mode: invite-code gated access
- Feature flags with kill switches (11 default flags seeded)
- Role-based access: guest/user/premium/vip/moderator/admin/owner
- RLS on all tables, admin-only tables use has_role() function
- Audit logs for all privileged actions
- No secrets in frontend, all scoring server-side
