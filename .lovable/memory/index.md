Tanner Terminal project - dark terminal trading UI with production backend

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare), SelectedTokenContext, AuthContext
- Supabase backend with Lovable Cloud
- Edge functions: signal-ingest, sniper-rank, risk-score, owner-brief, ai-chat, wallet-auth, token-data, etc.
- Frontend services: signalService.ts, ownerService.ts, riskService.ts

## Database Tables
- profiles (auto-created on signup, tier, wallet_address)
- tokens (address, symbol, chain, metadata)
- launches (token_id, status, fee_sol, featured)
- signal_events (source, category, score, confidence, realtime-enabled)
- risk_scores (token_address, score, verdict, factors, unique constraint)
- sniper_opportunities (token_address, sniper_score, action_label, urgency, realtime-enabled)
- notifications (user_id, category, title, read, realtime-enabled)
- subscriptions (user_id, tier, status)
- usage_events (event_type, event_data)
- audit_logs (actor_id, action, admin-only RLS)
- feature_flags (key, enabled, min_tier, public read)
- analytics_daily (date, metrics, admin-only RLS)
- user_roles, alerts, watchlist, tracked_wallets, rewards, points_log, burn_history, snipe_history, merch_products

## Edge Function Pipeline
1. signal-ingest: validate → score (weighted by category/confidence/severity) → store
2. sniper-rank: aggregate signals by token → compute weighted rank → upsert opportunities
3. risk-score: evaluate liquidity/concentration/deployer/wash trading → verdict
4. owner-brief: admin-only aggregated metrics + insights

## Security
- RLS on all tables, admin-only for audit_logs/analytics_daily
- Profile auto-created via trigger on auth.users insert
- has_role() security definer function for admin checks
- Service role key backend-only
