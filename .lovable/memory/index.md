Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare), SelectedTokenContext
- Lovable Cloud for persistence (watchlist, alerts, tracked_wallets tables)
- 3 Edge functions: token-data, jupiter-swap, tanner-token-stats
- Device-based access (no auth) - permissive RLS policies intentional
- ~25 hooks, ~30 terminal components, 6 pages
- Source project: 71b5d5e1-ca96-4bb0-af4b-e88f31c74d3d

## Completed
- Full design system (index.css + tailwind.config.ts)
- All contexts, hooks, lib files, components, pages
- Database tables with RLS
- All 3 edge functions deployed
